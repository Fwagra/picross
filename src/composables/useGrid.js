import { ref, computed } from 'vue';

// Gère la grille jouable, ses dimensions, la solution attendue et l'historique.
// `currentColor` (ref) est fourni par useColors : c'est la couleur peinte.
export function useGrid({ currentColor }) {
    const grid = ref([]);
    // Grille solution (mode jeu) pour la détection de victoire.
    const correctGrid = ref([]);
    const gridColumns = ref(5);
    const gridRows = ref(5);
    // Pile d'actions pour l'annulation (undo).
    const history = ref([]);

    // Vrai quand aucune case n'est vide.
    const isFilled = computed(() => grid.value.every(row => row.every(cell => cell !== '')));

    // (Re)génère le tableau de la grille aux dimensions courantes.
    function generateGrid() {
        for (let i = 0; i < gridRows.value; i++) {
            grid.value[i] = [];
            for (let j = 0; j < gridColumns.value; j++) {
                grid.value[i][j] = '';
            }
        }
    }

    // Peint une case avec la couleur active et empile l'action.
    function updateGrid(rowIndex, columnIndex) {
        const oldValue = grid.value[rowIndex][columnIndex];
        grid.value[rowIndex][columnIndex] = currentColor.value;

        // Une action = une entrée (même format que le remplissage groupé).
        history.value.push({
            cells: [{ rowIndex, columnIndex, oldValue }],
        });
    }

    // Annule la dernière action (désactivé après la victoire).
    function moveBackFromHistory(victory) {
        if (history.value.length > 0 && victory === false) {
            const lastMove = history.value.pop();
            for (const cell of lastMove.cells) {
                grid.value[cell.rowIndex][cell.columnIndex] = cell.oldValue;
            }
        }
    }

    // Retourne les lignes et colonnes qui diffèrent entre l'ancienne et la nouvelle grille.
    function getGridDifferences(newGrid, oldGrid) {
        const rowsToUpdate = [];
        const columnsToUpdate = [];
        for (let rowIndex = 0; rowIndex < newGrid.length; rowIndex++) {
            for (let colIndex = 0; colIndex < newGrid[rowIndex].length; colIndex++) {
                if (oldGrid.length === 0 || oldGrid[rowIndex] === undefined || newGrid[rowIndex][colIndex] !== oldGrid[rowIndex][colIndex]) {
                    if (!rowsToUpdate.includes(rowIndex)) {
                        rowsToUpdate.push(rowIndex);
                    }
                    if (!columnsToUpdate.includes(colIndex)) {
                        columnsToUpdate.push(colIndex);
                    }
                }
            }
        }
        return { rowsToUpdate, columnsToUpdate };
    }

    // Retourne les cellules de la colonne demandée.
    function getColumnCells(columnIndex) {
        return grid.value.map(row => row[columnIndex]);
    }

    // Remplit toutes les cases vides avec la couleur active (un seul undo).
    function fillColor() {
        const cells = [];
        for (let rowIndex = 0; rowIndex < grid.value.length; rowIndex++) {
            for (let colIndex = 0; colIndex < grid.value[rowIndex].length; colIndex++) {
                if (grid.value[rowIndex][colIndex] === '') {
                    cells.push({ rowIndex, columnIndex: colIndex, oldValue: '' });
                    grid.value[rowIndex][colIndex] = currentColor.value;
                }
            }
        }
        if (cells.length > 0) {
            history.value.push({ cells });
        }
    }

    // Efface de la grille toutes les cases portant la couleur retirée.
    function removeColorFromGrid(color) {
        const target = Number(color);
        for (let rowIndex = 0; rowIndex < grid.value.length; rowIndex++) {
            for (let colIndex = 0; colIndex < grid.value[rowIndex].length; colIndex++) {
                if (Number(grid.value[rowIndex][colIndex]) === target && grid.value[rowIndex][colIndex] !== '') {
                    grid.value[rowIndex][colIndex] = '';
                }
            }
        }
    }

    function updateRows(newRowsString) {
        const newRowsNumber = Number(newRowsString);
        if (newRowsNumber >= 3 && newRowsNumber <= 15) {
            gridRows.value = newRowsNumber;
        }
    }

    function updateCols(newColsString) {
        const newColsNumber = Number(newColsString);
        if (newColsNumber >= 3 && newColsNumber <= 15) {
            gridColumns.value = newColsNumber;
        }
    }

    // Ajoute/retire des lignes pour coller au nouveau nombre de lignes.
    function resizeGridRows(difference) {
        if (difference > 0) {
            for (let i = 0; i < difference; i++) {
                grid.value.push([...Array(gridColumns.value).fill('')]);
            }
        } else if (difference < 0) {
            for (let i = 0; i < Math.abs(difference); i++) {
                grid.value.pop();
            }
        }
    }

    // Étend/tronque chaque ligne pour coller au nouveau nombre de colonnes.
    function resizeGridColumns(difference) {
        if (difference > 0) {
            for (let i = 0; i < grid.value.length; i++) {
                grid.value[i] = [...grid.value[i], ...Array(difference).fill('')];
            }
        } else if (difference < 0) {
            for (let i = 0; i < grid.value.length; i++) {
                grid.value[i].splice(difference);
            }
        }
    }

    return {
        grid,
        correctGrid,
        gridColumns,
        gridRows,
        history,
        isFilled,
        generateGrid,
        updateGrid,
        moveBackFromHistory,
        getGridDifferences,
        getColumnCells,
        fillColor,
        removeColorFromGrid,
        updateRows,
        updateCols,
        resizeGridRows,
        resizeGridColumns,
    };
}
