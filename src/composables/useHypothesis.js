import { ref } from 'vue';

// Mode « hypothèse » : sauvegarde la grille avant d'essayer une piste, puis
// permet de l'annuler (retour au backup) ou de la valider (on garde la grille).
// Reçoit les refs `grid` et `history` de useGrid.
export function useHypothesis({ grid, history }) {
    const hypothesisMode = ref(false);
    const gridBackup = ref([]);

    function enableHypothesisMode() {
        hypothesisMode.value = true;
        gridBackup.value = JSON.parse(JSON.stringify(grid.value));
    }

    function disableHypothesisMode() {
        hypothesisMode.value = false;
        // Restaure la grille sauvegardée et vide l'historique.
        grid.value = JSON.parse(JSON.stringify(gridBackup.value));
        history.value = [];
    }

    function validateHypothesis() {
        hypothesisMode.value = false;
        gridBackup.value = [];
    }

    return {
        hypothesisMode,
        gridBackup,
        enableHypothesisMode,
        disableHypothesisMode,
        validateHypothesis,
    };
}
