// @vitest-environment happy-dom
//
// Filet de sécurité pour la migration Options API -> Composition API.
// Les tests s'appuient UNIQUEMENT sur le contrat public de Game.vue
// (props transmises aux composants enfants + événements reçus des enfants),
// jamais sur ses internes (data/methods). Ils doivent donc rester valides
// après le passage en <script setup>.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import Game from './Game.vue';
import Grid from './Grid.vue';
import Tools from './Tools.vue';
import { withGlobal } from '../test-helpers/mountOptions.js';
import { encodeCompactPuzzle } from '../puzzleUrl.js';

// happy-dom ne reflète pas history.replaceState('/...') dans location ;
// on fixe donc l'URL complète via location.href (absolu).
function setUrl(search = '') {
  window.location.href = 'http://localhost/' + search;
}

// Monte Game (enfants stubbés) et attend que les watchers de `mounted`
// (génération de grille, calcul des indices) soient vidés.
async function mountGame() {
  const wrapper = mount(Game, {
    ...withGlobal({ stubs: { Grid: true, Tools: true, Modal: true } }),
  });
  await flushPromises();
  return wrapper;
}

function grid(wrapper) {
  return wrapper.findComponent(Grid);
}
function tools(wrapper) {
  return wrapper.findComponent(Tools);
}

beforeEach(() => {
  setUrl();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Game — mode édition (par défaut)', () => {
  it('génère une grille 5x5 et 2 couleurs au démarrage', async () => {
    const wrapper = await mountGame();
    expect(grid(wrapper).props('gridRows')).toBe(5);
    expect(grid(wrapper).props('gridColumns')).toBe(5);
    expect(grid(wrapper).props('colors')).toHaveLength(2);
    // En édition, les indices sont calculés pour chaque ligne/colonne.
    expect(grid(wrapper).props('hints').rows).toHaveLength(5);
    expect(grid(wrapper).props('hints').columns).toHaveLength(5);
  });

  it('transmet editMode=true à Tools', async () => {
    const wrapper = await mountGame();
    expect(tools(wrapper).props('editMode')).toBe(true);
  });

  it('redimensionne la grille quand Tools émet updateRows/updateCols', async () => {
    const wrapper = await mountGame();
    // Une dimension à la fois (comme l'utilisateur) : évite l'ambiguïté d'ordre
    // de vidage des watchers quand deux changements sont groupés dans un tick.
    tools(wrapper).vm.$emit('updateRows', 8);
    await flushPromises();
    tools(wrapper).vm.$emit('updateCols', 6);
    await flushPromises();

    expect(grid(wrapper).props('gridRows')).toBe(8);
    expect(grid(wrapper).props('gridColumns')).toBe(6);
    expect(grid(wrapper).props('hints').rows).toHaveLength(8);
    expect(grid(wrapper).props('hints').columns).toHaveLength(6);
  });

  it('ignore les dimensions hors bornes (3–15)', async () => {
    const wrapper = await mountGame();
    tools(wrapper).vm.$emit('updateRows', 2);
    tools(wrapper).vm.$emit('updateCols', 42);
    await flushPromises();

    expect(grid(wrapper).props('gridRows')).toBe(5);
    expect(grid(wrapper).props('gridColumns')).toBe(5);
  });

  it('ajoute et retire une couleur via Tools', async () => {
    const wrapper = await mountGame();
    tools(wrapper).vm.$emit('addColor');
    await flushPromises();
    expect(grid(wrapper).props('colors')).toHaveLength(3);

    tools(wrapper).vm.$emit('removeColor');
    await flushPromises();
    expect(grid(wrapper).props('colors')).toHaveLength(2);
  });

  it('recalcule les indices quand une case est peinte (updateCell)', async () => {
    const wrapper = await mountGame();
    // currentColor vaut 0 par défaut : on peint la case (0,0).
    grid(wrapper).vm.$emit('updateCell', 0, 0);
    await flushPromises();

    const hint = grid(wrapper).props('hints').rows[0];
    // La ligne 0 contient désormais une case de couleur 0 -> indice number >= 1.
    expect(hint[0].number).toBe(1);
  });

  it('n’est pas « rempli » tant que des cases sont vides', async () => {
    const wrapper = await mountGame();
    expect(tools(wrapper).props('isFilled')).toBe(false);
  });

  it('devient « rempli » une fois toutes les cases peintes', async () => {
    const wrapper = await mountGame();
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        grid(wrapper).vm.$emit('updateCell', r, c);
      }
    }
    await flushPromises();
    expect(tools(wrapper).props('isFilled')).toBe(true);
  });

  it('produit un lien de partage compact (?p=) sur demande', async () => {
    const wrapper = await mountGame();
    grid(wrapper).vm.$emit('updateCell', 0, 0);
    tools(wrapper).vm.$emit('updateShareLink');
    await flushPromises();
    expect(tools(wrapper).props('shareLink')).toContain('?p=');
  });
});

describe('Game — mode jeu (?p=)', () => {
  // Puzzle monochrome 2x2 : toutes les cases de couleur 0.
  // Permet de tester la victoire en peignant avec la couleur courante (0) par défaut.
  const playUrl = encodeCompactPuzzle({
    grid: [
      [0, 0],
      [0, 0],
    ],
    gridColumns: 2,
    colors: ['#ff0000', '#00ff00'],
    origin: 'http://localhost',
  });
  const playSearch = '?p=' + playUrl.split('?p=')[1];

  beforeEach(() => {
    setUrl(playSearch);
  });

  it('charge le puzzle et passe en mode jeu (editMode=false)', async () => {
    const wrapper = await mountGame();
    expect(tools(wrapper).props('editMode')).toBe(false);
    expect(grid(wrapper).props('gridRows')).toBe(2);
    expect(grid(wrapper).props('gridColumns')).toBe(2);
    expect(grid(wrapper).props('colors')).toHaveLength(2);
  });

  it('émet la victoire lorsque la grille correspond à la solution', async () => {
    vi.useFakeTimers();
    const wrapper = mount(Game, {
      ...withGlobal({ stubs: { Grid: true, Tools: true, Modal: true } }),
    });
    await vi.runOnlyPendingTimersAsync();

    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 2; c++) {
        grid(wrapper).vm.$emit('updateCell', r, c);
      }
    }
    await vi.runOnlyPendingTimersAsync();

    // La victoire est transmise à Grid (prop victory) et Tools.
    expect(grid(wrapper).props('victory')).toBe(true);
    expect(tools(wrapper).props('victory')).toBe(true);
    vi.useRealTimers();
  });
});
