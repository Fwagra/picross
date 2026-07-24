import { ref, computed } from 'vue';
import { getHints as buildLineHints, getHintsForColor } from '../hints.js';

// Gère les indices (par ligne/colonne et par couleur) et les erreurs de saisie.
// Reçoit les refs de la grille/couleurs et le mode d'édition, plus getColumnCells.
export function useHints({ grid, gridRows, gridColumns, colors, editMode, getColumnCells }) {
    const hints = ref({ rows: [], columns: [] });
    const errors = ref({ rows: [], columns: [] });

    // `!== true` : les cases non encore évaluées restent `undefined` (tableau sparse)
    // et ne doivent pas bloquer la détection de victoire.
    const noErrors = computed(() =>
        errors.value.rows.every(error => error !== true)
        && errors.value.columns.every(error => error !== true)
    );

    function getHints(cells) {
        return buildLineHints(cells, colors.value.length);
    }

    // Met à jour les indices des lignes/colonnes fournies.
    // En édition : recalcule les indices « corrects ». En jeu : vérifie la saisie.
    function updateHints(rowsToUpdate, columnsToUpdate) {
        if (editMode.value) {
            if (rowsToUpdate.length !== 0) {
                for (const rowIndex of rowsToUpdate) {
                    hints.value.rows[rowIndex] = getHints(grid.value[rowIndex]);
                }
            }
            if (columnsToUpdate.length !== 0) {
                for (const columnIndex of columnsToUpdate) {
                    hints.value.columns[columnIndex] = getHints(getColumnCells(columnIndex));
                }
            }
        } else {
            checkHints({ rows: rowsToUpdate, columns: columnsToUpdate });
        }
    }

    // Recalcule tous les indices (édition) et retire ceux des lignes/colonnes supprimées.
    function refreshHints() {
        if (editMode.value) {
            for (let rowIndex = 0; rowIndex < gridRows.value; rowIndex++) {
                hints.value.rows[rowIndex] = getHints(grid.value[rowIndex]);
            }
            for (let columnIndex = 0; columnIndex < gridColumns.value; columnIndex++) {
                hints.value.columns[columnIndex] = getHints(getColumnCells(columnIndex));
            }

            hints.value.rows = hints.value.rows.slice(0, gridRows.value);
            hints.value.columns = hints.value.columns.slice(0, gridColumns.value);
        }
    }

    // Compare la saisie du joueur aux indices : masque les indices satisfaits,
    // marque les erreurs (trop de cases ou contiguïté non respectée).
    function checkHints(rowsAndColumns) {
        for (const type in rowsAndColumns) {
            const arrayToCheck = rowsAndColumns[type];

            if (arrayToCheck.length !== 0) {
                for (const arrayIndex of arrayToCheck) {
                    errors.value[type][arrayIndex] = false;

                    for (const color in hints.value[type][arrayIndex]) {
                        const actualGridElement = type === 'rows' ? grid.value[arrayIndex] : getColumnCells(arrayIndex);
                        const actualColors = getHintsForColor(Number(color), actualGridElement);

                        if (
                            actualColors.number === hints.value[type][arrayIndex][color].number &&
                            actualColors.contiguous === hints.value[type][arrayIndex][color].contiguous
                        ) {
                            hints.value[type][arrayIndex][color].correct = true;
                        } else {
                            hints.value[type][arrayIndex][color].correct = false;
                        }

                        if (actualColors.number > hints.value[type][arrayIndex][color].number) {
                            errors.value[type][arrayIndex] = true;
                        } else if (actualColors.number === hints.value[type][arrayIndex][color].number && hints.value[type][arrayIndex][color].contiguous !== actualColors.contiguous) {
                            errors.value[type][arrayIndex] = true;
                        }
                    }
                }
            }
        }
    }

    return {
        hints,
        errors,
        noErrors,
        getHints,
        updateHints,
        refreshHints,
        checkHints,
    };
}
