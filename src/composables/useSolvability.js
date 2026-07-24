import { ref, computed } from 'vue';
import { checkSolvability } from '../solver.js';

// Vérifie l'unicité de la solution (mode édition uniquement), avec un debounce
// de 300 ms car l'analyse est coûteuse. Ne s'exécute que sur grille pleine.
export function useSolvability({ editMode, isFilled, gridRows, gridColumns, hints, colors }) {
    const solvability = ref(null);
    const loading = ref(false);
    // Timer de debounce (valeur non réactive).
    let debounce = null;

    const solvabilityLoading = computed(() => loading.value);

    function scheduleSolvabilityCheck() {
        if (!editMode.value || !isFilled.value) {
            solvability.value = null;
            loading.value = false;
            return;
        }

        loading.value = true;

        if (debounce) {
            clearTimeout(debounce);
        }

        debounce = setTimeout(() => {
            solvability.value = checkSolvability({
                rows: gridRows.value,
                columns: gridColumns.value,
                hints: hints.value,
                colorCount: colors.value.length,
            });
            loading.value = false;
        }, 300);
    }

    return {
        solvability,
        solvabilityLoading,
        scheduleSolvabilityCheck,
    };
}
