/**
 * Calcul des indices Color Picross.
 * Pour chaque couleur : { number, contiguous }.
 */

/**
 * Indice d'une couleur sur une ligne/colonne (tableau de cellules).
 * @param {number} colorIndex
 * @param {Array<number|string>} cells
 */
export function getHintsForColor(colorIndex, cells) {
    const target = Number(colorIndex);
    const colorHints = {
        number: 0,
        contiguous: true,
    };

    let lastIndex = null;

    for (let cellIndex = 0; cellIndex < cells.length; cellIndex++) {
        const cell = cells[cellIndex];
        if (cell === '' || cell === null || cell === undefined) continue;
        if (Number(cell) !== target) continue;

        colorHints.number++;
        if (lastIndex !== null && cellIndex - lastIndex !== 1) {
            colorHints.contiguous = false;
        }
        lastIndex = cellIndex;
    }

    return colorHints;
}

/**
 * Indices de toutes les couleurs pour une ligne/colonne.
 */
export function getHints(cells, colorCount) {
    const cellHints = [];
    for (let color = 0; color < colorCount; color++) {
        cellHints.push(getHintsForColor(color, cells));
    }
    return cellHints;
}

/**
 * Recalcule tous les indices (lignes et colonnes) à partir d'une grille.
 */
export function computeHints(grid, colorCount) {
    const rows = grid.map(row => getHints(row, colorCount));
    const columns = [];
    const columnCount = grid.length > 0 ? grid[0].length : 0;

    for (let columnIndex = 0; columnIndex < columnCount; columnIndex++) {
        const columnCells = grid.map(row => row[columnIndex]);
        columns.push(getHints(columnCells, colorCount));
    }

    return { rows, columns };
}
