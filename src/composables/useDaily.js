import { ref, computed } from 'vue';
import { getAvailableDailyDateKeys, getTodayKey, loadDailyForDate } from '../daily.js';

// Gère le mode « daily » : chargement de la grille du jour et navigation entre
// les grilles disponibles (flèches). Reçoit des callbacks d'orchestration.
export function useDaily({ applyPuzzle, resetPlayState, emitDailyState }) {
    const dailyMode = ref(false);
    const dailyDateKey = ref(null);
    const dailyDateKeys = ref([]);

    // Position de la date courante dans la liste des daily jouables.
    const dailyIndex = computed(() => dailyDateKeys.value.indexOf(dailyDateKey.value));
    // Existe-t-il une grille daily plus ancienne (flèche gauche) ?
    const canGoPreviousDaily = computed(() => dailyMode.value && dailyIndex.value > 0);
    // Existe-t-il une grille daily plus récente (flèche droite) ?
    const canGoNextDaily = computed(() =>
        dailyMode.value && dailyIndex.value !== -1 && dailyIndex.value < dailyDateKeys.value.length - 1
    );

    // Charge (sans réinitialiser la partie) la grille daily d'une date donnée.
    // La date affichée est la date réelle de la grille (resolvedDateKey).
    function loadDailyForKey(dateKey) {
        try {
            const puzzle = loadDailyForDate(dateKey);
            applyPuzzle(puzzle);
            dailyDateKey.value = puzzle.resolvedDateKey;
            return true;
        } catch (e) {
            console.error('Impossible de charger le daily', e);
            return false;
        }
    }

    // Charge le daily du jour depuis le calendrier embarqué. Active le mode daily
    // si le chargement réussit. Retourne true en cas de succès.
    function loadDailyPuzzle() {
        dailyDateKeys.value = getAvailableDailyDateKeys();
        if (loadDailyForKey(getTodayKey())) {
            dailyMode.value = true;
            return true;
        }
        return false;
    }

    // Navigue vers une autre date daily : recharge la grille et remet la partie à zéro.
    function navigateDaily(dateKey) {
        if (!loadDailyForKey(dateKey)) {
            return;
        }
        resetPlayState();
        emitDailyState();
    }

    // Flèche gauche : grille daily précédente (plus ancienne).
    function goToPreviousDaily() {
        if (canGoPreviousDaily.value) {
            navigateDaily(dailyDateKeys.value[dailyIndex.value - 1]);
        }
    }

    // Flèche droite : grille daily suivante (plus récente).
    function goToNextDaily() {
        if (canGoNextDaily.value) {
            navigateDaily(dailyDateKeys.value[dailyIndex.value + 1]);
        }
    }

    // Quitte le mode daily (retour édition ou lien invalide).
    function exitDaily() {
        dailyMode.value = false;
        dailyDateKey.value = null;
    }

    return {
        dailyMode,
        dailyDateKey,
        dailyDateKeys,
        canGoPreviousDaily,
        canGoNextDaily,
        loadDailyPuzzle,
        goToPreviousDaily,
        goToNextDaily,
        exitDaily,
    };
}
