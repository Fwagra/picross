/**
 * Solveur de Color Picross
 *
 * Vérifie si un puzzle est résolvable de manière unique à partir de ses indices.
 * Utilise la propagation de contraintes (arc-consistency) ligne par ligne,
 * puis un backtracking limité pour compter le nombre de solutions.
 *
 * Indices par ligne/colonne : pour chaque couleur { number, contiguous }
 *   - number : nombre de cellules de cette couleur
 *   - contiguous : true si toutes les cellules sont adjacentes
 */

const EMPTY = -1;

/**
 * Génère toutes les dispositions valides d'une ligne de longueur `length`
 * étant donné les contraintes `hints` (un tableau par couleur).
 * Chaque disposition est un tableau d'indices de couleurs (0, 1, 2…).
 */
function generateLineArrangements(length, hints) {
    const color_count = hints.length;
    const total_cells = hints.reduce((sum, h) => sum + h.number, 0);

    if (total_cells !== length) {
        return [];
    }

    const arrangements = [];
    const line = new Array(length);

    function placeColors(color_index, positions) {
        if (color_index === color_count) {
            arrangements.push([...line]);
            return;
        }

        const hint = hints[color_index];
        const count = hint.number;

        if (count === 0) {
            placeColors(color_index + 1, positions);
            return;
        }

        const available = [];
        for (let i = 0; i < length; i++) {
            if (positions[i] === EMPTY) {
                available.push(i);
            }
        }

        if (available.length < count) return;

        if (hint.contiguous && count > 1) {
            placeContiguous(color_index, count, available, positions);
        } else if (!hint.contiguous && count > 1) {
            placeNonContiguous(color_index, count, available, positions);
        } else {
            placeSingle(color_index, count, available, positions);
        }
    }

    function placeSingle(color_index, count, available, positions) {
        for (const pos of available) {
            line[pos] = color_index;
            const new_positions = [...positions];
            new_positions[pos] = color_index;
            placeColors(color_index + 1, new_positions);
        }
    }

    function placeContiguous(color_index, count, available, positions) {
        for (let start = 0; start <= length - count; start++) {
            let valid = true;
            for (let i = 0; i < count; i++) {
                if (positions[start + i] !== EMPTY) {
                    valid = false;
                    break;
                }
            }
            if (!valid) continue;

            for (let i = 0; i < count; i++) {
                line[start + i] = color_index;
            }
            const new_positions = [...positions];
            for (let i = 0; i < count; i++) {
                new_positions[start + i] = color_index;
            }
            placeColors(color_index + 1, new_positions);
        }
    }

    function placeNonContiguous(color_index, count, available, positions) {
        const combos = [];
        generateCombinations(available, count, 0, [], combos);

        for (const combo of combos) {
            if (isContiguous(combo)) continue;

            for (const pos of combo) {
                line[pos] = color_index;
            }
            const new_positions = [...positions];
            for (const pos of combo) {
                new_positions[pos] = color_index;
            }
            placeColors(color_index + 1, new_positions);
        }
    }

    const initial_positions = new Array(length).fill(EMPTY);
    placeColors(0, initial_positions);

    return arrangements;
}

function generateCombinations(arr, k, start, current, results) {
    if (current.length === k) {
        results.push([...current]);
        return;
    }
    for (let i = start; i <= arr.length - (k - current.length); i++) {
        current.push(arr[i]);
        generateCombinations(arr, k, i + 1, current, results);
        current.pop();
    }
}

function isContiguous(positions) {
    if (positions.length <= 1) return true;
    const sorted = [...positions].sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i++) {
        if (sorted[i] - sorted[i - 1] !== 1) return false;
    }
    return true;
}

/**
 * Propagation de contraintes :
 * Pour chaque cellule, détermine les couleurs possibles en intersectant
 * les arrangements valides de sa ligne et de sa colonne.
 * Élimine les arrangements incompatibles et itère jusqu'à stabilité.
 */
function constraintPropagation(rows, cols, row_hints, col_hints, color_count) {
    let row_arrangements = [];
    let col_arrangements = [];

    for (let r = 0; r < rows; r++) {
        const arrs = generateLineArrangements(cols, row_hints[r]);
        if (arrs.length === 0) return { solved: false, solutions: 0 };
        row_arrangements.push(arrs);
    }

    for (let c = 0; c < cols; c++) {
        const arrs = generateLineArrangements(rows, col_hints[c]);
        if (arrs.length === 0) return { solved: false, solutions: 0 };
        col_arrangements.push(arrs);
    }

    let changed = true;
    while (changed) {
        changed = false;

        for (let r = 0; r < rows; r++) {
            if (row_arrangements[r].length <= 1) continue;

            const before = row_arrangements[r].length;
            row_arrangements[r] = row_arrangements[r].filter(arr => {
                for (let c = 0; c < cols; c++) {
                    const val = arr[c];
                    const possible = col_arrangements[c].some(ca => ca[r] === val);
                    if (!possible) return false;
                }
                return true;
            });

            if (row_arrangements[r].length === 0) return { solved: false, solutions: 0 };
            if (row_arrangements[r].length < before) changed = true;
        }

        for (let c = 0; c < cols; c++) {
            if (col_arrangements[c].length <= 1) continue;

            const before = col_arrangements[c].length;
            col_arrangements[c] = col_arrangements[c].filter(arr => {
                for (let r = 0; r < rows; r++) {
                    const val = arr[r];
                    const possible = row_arrangements[r].some(ra => ra[c] === val);
                    if (!possible) return false;
                }
                return true;
            });

            if (col_arrangements[c].length === 0) return { solved: false, solutions: 0 };
            if (col_arrangements[c].length < before) changed = true;
        }
    }

    const all_determined = row_arrangements.every(arrs => arrs.length === 1);
    if (all_determined) {
        return { solved: true, solutions: 1 };
    }

    return {
        solved: false,
        solutions: null,
        row_arrangements,
        col_arrangements
    };
}

/**
 * Backtracking avec propagation pour compter les solutions (max 2).
 * S'arrête dès qu'on trouve 2 solutions (pas besoin d'en trouver plus).
 */
function countSolutions(rows, cols, row_arrangements, col_arrangements, max_solutions) {
    let best_row = -1;
    let min_count = Infinity;

    for (let r = 0; r < rows; r++) {
        const count = row_arrangements[r].length;
        if (count > 1 && count < min_count) {
            min_count = count;
            best_row = r;
        }
    }

    if (best_row === -1) {
        return 1;
    }

    let total = 0;

    for (const arr of row_arrangements[best_row]) {
        const new_row_arrs = row_arrangements.map(a => [...a]);
        const new_col_arrs = col_arrangements.map(a => [...a]);

        new_row_arrs[best_row] = [arr];

        const result = propagateAndCount(
            rows, cols, new_row_arrs, new_col_arrs, max_solutions - total
        );

        total += result;
        if (total >= max_solutions) return total;
    }

    return total;
}

function propagateAndCount(rows, cols, row_arrangements, col_arrangements, max_solutions) {
    let changed = true;
    while (changed) {
        changed = false;

        for (let r = 0; r < rows; r++) {
            if (row_arrangements[r].length <= 1) continue;
            const before = row_arrangements[r].length;
            row_arrangements[r] = row_arrangements[r].filter(arr => {
                for (let c = 0; c < cols; c++) {
                    if (!col_arrangements[c].some(ca => ca[r] === arr[c])) return false;
                }
                return true;
            });
            if (row_arrangements[r].length === 0) return 0;
            if (row_arrangements[r].length < before) changed = true;
        }

        for (let c = 0; c < cols; c++) {
            if (col_arrangements[c].length <= 1) continue;
            const before = col_arrangements[c].length;
            col_arrangements[c] = col_arrangements[c].filter(arr => {
                for (let r = 0; r < rows; r++) {
                    if (!row_arrangements[r].some(ra => ra[c] === arr[r])) return false;
                }
                return true;
            });
            if (col_arrangements[c].length === 0) return 0;
            if (col_arrangements[c].length < before) changed = true;
        }
    }

    const all_determined = row_arrangements.every(a => a.length === 1);
    if (all_determined) return 1;

    return countSolutions(rows, cols, row_arrangements, col_arrangements, max_solutions);
}

/**
 * Convertit les indices du format de l'application vers le format du solveur.
 * L'app stocke les indices par couleur comme un tableau indexé par couleur.
 */
function convertHints(app_hints) {
    return app_hints.map(line_hints => {
        return line_hints.map(h => ({
            number: h.number,
            contiguous: h.contiguous
        }));
    });
}

/**
 * Vérifie si le puzzle défini par la grille est résolvable de manière unique.
 *
 * @param {Object} params
 * @param {number} params.rows - Nombre de lignes
 * @param {number} params.columns - Nombre de colonnes
 * @param {Array} params.hints - { rows: [...], columns: [...] }
 * @param {number} params.colorCount - Nombre de couleurs
 * @returns {{ solvable: boolean, unique: boolean, solutions: number }}
 */
export function checkSolvability({ rows, columns, hints, colorCount }) {
    const row_hints = convertHints(hints.rows);
    const col_hints = convertHints(hints.columns);

    for (const rh of row_hints) {
        const total = rh.reduce((s, h) => s + h.number, 0);
        if (total !== columns) {
            return { solvable: false, unique: false, solutions: 0, reason: 'invalid_hints' };
        }
    }
    for (const ch of col_hints) {
        const total = ch.reduce((s, h) => s + h.number, 0);
        if (total !== rows) {
            return { solvable: false, unique: false, solutions: 0, reason: 'invalid_hints' };
        }
    }

    const result = constraintPropagation(rows, columns, row_hints, col_hints, colorCount);

    if (result.solutions === 0) {
        return { solvable: false, unique: false, solutions: 0, reason: 'no_solution' };
    }

    if (result.solutions === 1) {
        return { solvable: true, unique: true, solutions: 1, reason: 'unique' };
    }

    const solution_count = countSolutions(
        rows, columns,
        result.row_arrangements,
        result.col_arrangements,
        2
    );

    if (solution_count === 0) {
        return { solvable: false, unique: false, solutions: 0, reason: 'no_solution' };
    }

    if (solution_count === 1) {
        return { solvable: true, unique: true, solutions: 1, reason: 'unique' };
    }

    return { solvable: true, unique: false, solutions: solution_count, reason: 'multiple' };
}
