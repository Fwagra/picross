// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';
import Grid from './Grid.vue';
import Cell from './Cell.vue';
import { withGlobal } from '../test-helpers/mountOptions.js';

// Grille 2x2 vide + indices bien formés pour que Hints/ColorHint se montent.
function mountGrid({ updateGrid = vi.fn(), currentColor = 0, victory = false } = {}) {
  const gridData = ref([
    ['', ''],
    ['', ''],
  ]);
  const wrapper = mount(Grid, {
    props: {
      gridRows: 2,
      gridColumns: 2,
      colors: ['#ff0000', '#00ff00'],
      hints: { rows: [[], []], columns: [[], []] },
      errors: { rows: [], columns: [] },
      victory,
    },
    ...withGlobal({
      provide: {
        grid: gridData,
        updateGrid,
        currentColor: ref(currentColor),
        colors: ref(['#ff0000', '#00ff00']),
      },
    }),
  });
  return { wrapper, updateGrid };
}

describe('Grid', () => {
  it('rend une cellule par case (gridRows x gridColumns)', () => {
    const { wrapper } = mountGrid();
    expect(wrapper.findAllComponents(Cell)).toHaveLength(4);
  });

  it('propage l’état « pressé » aux cellules quand une cellule émet press', async () => {
    const { wrapper } = mountGrid();
    const cells = wrapper.findAllComponents(Cell);
    expect(cells[0].props('pressed')).toBe(false);

    cells[0].vm.$emit('press');
    await wrapper.vm.$nextTick();

    expect(wrapper.findAllComponents(Cell)[0].props('pressed')).toBe(true);
  });

  it('relâche l’état « pressé » quand une cellule émet release', async () => {
    const { wrapper } = mountGrid();
    const cells = wrapper.findAllComponents(Cell);

    cells[0].vm.$emit('press');
    await wrapper.vm.$nextTick();
    expect(wrapper.findAllComponents(Cell)[0].props('pressed')).toBe(true);

    cells[0].vm.$emit('release');
    await wrapper.vm.$nextTick();
    expect(wrapper.findAllComponents(Cell)[0].props('pressed')).toBe(false);
  });

  it('relâche le tracé quand la souris quitte la grille', async () => {
    const { wrapper } = mountGrid();
    const cells = wrapper.findAllComponents(Cell);
    cells[0].vm.$emit('press');
    await wrapper.vm.$nextTick();

    await wrapper.find('.grid').trigger('mouseleave');
    expect(wrapper.findAllComponents(Cell)[0].props('pressed')).toBe(false);
  });

  it('affiche le bloqueur uniquement en cas de victoire', async () => {
    const { wrapper } = mountGrid({ victory: false });
    expect(wrapper.find('.blocker').exists()).toBe(false);

    const { wrapper: won } = mountGrid({ victory: true });
    expect(won.find('.blocker').exists()).toBe(true);
  });
});
