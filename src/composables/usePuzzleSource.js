import { ref } from 'vue';
import { decodeCompactPuzzle, decodeLegacyPuzzle, encodeCompactPuzzle } from '../puzzleUrl.js';
import { isDailyPath } from '../daily.js';

// Fait le pont entre l'URL et l'état du puzzle : détection du mode
// (édition | jeu ?p=/?g= | daily), chargement, retour à l'édition et partage.
export function usePuzzleSource({
    editMode,
    colors,
    seedInitialColors,
    applyPuzzle,
    daily,
    emitDailyState,
    resetVictory,
    showModal,
    grid,
    gridColumns,
}) {
    const shareLink = ref('');

    // Retire ?p= / ?g= pour qu'un refresh ne relance pas le mode jeu.
    function clearPuzzleQuery() {
        const url = new URL(window.location.href);
        url.searchParams.delete('p');
        url.searchParams.delete('g');
        const search = url.searchParams.toString();
        const path = isDailyPath(url.pathname) ? '/' : url.pathname;
        window.history.replaceState({}, '', path + (search ? `?${search}` : '') + url.hash);
    }

    // Décode le format compact (?p=). Retourne true si le chargement a réussi.
    function loadCompactPuzzle() {
        try {
            applyPuzzle(decodeCompactPuzzle(document.location.href));
            return true;
        } catch (e) {
            console.error('Impossible de charger le picross compact', e);
            return false;
        }
    }

    // Décode l'ancien format (?g=). Retourne true si le chargement a réussi.
    function loadLegacyPuzzle() {
        try {
            applyPuzzle(decodeLegacyPuzzle(document.location.href));
            return true;
        } catch (e) {
            console.error('Impossible de charger le picross legacy', e);
            return false;
        }
    }

    // Retour à l'édition (lien invalide ou daily indisponible) avec message.
    function fallbackToEditMode(message = 'Ce lien de picross est invalide ou corrompu. Tu peux créer une nouvelle grille.') {
        editMode.value = true;
        daily.exitDaily();
        clearPuzzleQuery();
        emitDailyState();
        if (colors.value.length === 0) {
            seedInitialColors();
        }
        showModal('Oups !', message);
    }

    // Détermine le mode au démarrage à partir de l'URL.
    function checkMode() {
        const params = new URLSearchParams(document.location.search);

        // Nouveau format compact : ?p=
        if (params.has('p')) {
            if (loadCompactPuzzle()) {
                editMode.value = false;
            } else {
                fallbackToEditMode();
            }
        // Ancien format historique : ?g=  (conservé pour la rétro-compatibilité)
        } else if (params.has('g')) {
            if (loadLegacyPuzzle()) {
                editMode.value = false;
            } else {
                fallbackToEditMode();
            }
        } else if (isDailyPath()) {
            if (daily.loadDailyPuzzle()) {
                editMode.value = false;
            } else {
                fallbackToEditMode('Aucun daily n\'est disponible pour aujourd\'hui. Tu peux créer une nouvelle grille.');
            }
        } else {
            editMode.value = true;
            seedInitialColors();
        }
    }

    // Repasse en édition depuis une grille jouée (bouton « Éditer la grille »).
    function switchMode() {
        editMode.value = true;
        daily.exitDaily();
        resetVictory();
        clearPuzzleQuery();
        emitDailyState();
    }

    function getShareLink() {
        return encodeCompactPuzzle({
            grid: grid.value,
            gridColumns: gridColumns.value,
            colors: colors.value,
            origin: window.location.origin,
        });
    }

    function updateShareLink() {
        shareLink.value = getShareLink();
    }

    return {
        shareLink,
        checkMode,
        switchMode,
        clearPuzzleQuery,
        fallbackToEditMode,
        getShareLink,
        updateShareLink,
    };
}
