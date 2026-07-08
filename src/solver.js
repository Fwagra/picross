/**
 * Solveur de Color Picross
 *
 * Vérifie si un puzzle est résolvable de manière unique à partir de ses indices.
 *
 * Stratégie (approche « génération élaguée + ordonnancement ») :
 *   1. On maintient un domaine de couleurs possibles par cellule (masque de bits).
 *   2. On traite les lignes/colonnes de la MOINS chère à la plus chère
 *      (coût = coefficient multinomial estimé). Les lignes faciles fixent
 *      la plupart des cellules…
 *   3. …si bien que les lignes « lourdes » sont générées en élaguant avec les
 *      domaines déjà connus : on ne matérialise jamais les millions de
 *      dispositions du puzzle brut.
 *   4. Propagation mutuelle (arc-consistency) puis backtracking pour compter
 *      le nombre de solutions (plafonné à 2, il suffit de savoir si c'est unique).
 *
 * Indices par ligne/colonne : pour chaque couleur { number, contiguous }
 *   - number : nombre de cellules de cette couleur
 *   - contiguous : true si toutes les cellules de la couleur sont adjacentes
 */

const EMPTY = -1;

// Plafond de dispositions matérialisées par ligne lors de la génération.
// Au-delà, la ligne est reportée : on la régénère une fois les domaines
// resserrés par les autres lignes (voir la 1ʳᵉ passe).
const LINE_ARRANGEMENT_CAP = 2000000;

// Garde-fou temps réel : si l'analyse dépasse ce budget on renonce plutôt que
// de bloquer l'interface (cas pathologiques de très grandes grilles).
const TIME_BUDGET_MS = 5000;

/**
 * Compte le nombre de bits à 1 (taille d'un domaine de couleurs).
 */
function popcount(x) {
    let n = 0;
    while (x) {
        x &= x - 1;
        n++;
    }
    return n;
}

/**
 * Vrai si les positions (triées croissantes) forment un bloc contigu.
 */
function isContiguousCombo(combo) {
    for (let i = 1; i < combo.length; i++) {
        if (combo[i] - combo[i - 1] !== 1) return false;
    }
    return true;
}

/**
 * Coût estimé d'une ligne = coefficient multinomial (borne du nombre de
 * dispositions si toutes les couleurs étaient non contigües). Sert à
 * ordonner le traitement des lignes/colonnes du moins cher au plus cher.
 */
function estimateCost(hints) {
    let result = 1;
    let k = 0;
    for (const hint of hints) {
        for (let i = 1; i <= hint.number; i++) {
            k++;
            result = (result * k) / i;
        }
    }
    return result;
}

/**
 * Génère toutes les dispositions valides d'une ligne de longueur `length`,
 * compatibles avec `masks` (masks[pos] = masque de bits des couleurs
 * autorisées à cette position), en respectant les contraintes `hints`.
 *
 * Retourne un tableau de dispositions (chaque disposition = tableau d'indices
 * de couleurs), ou `null` si le nombre dépasse `cap` (ligne trop volumineuse
 * à matérialiser pour l'instant).
 */
function generateLineArrangements(length, hints, masks, cap) {
    const color_count = hints.length;

    let total_cells = 0;
    for (const hint of hints) total_cells += hint.number;
    if (total_cells !== length) return [];

    const arrangements = [];
    const line = new Array(length).fill(EMPTY);
    let overflow = false;

    function placeColors(color_index) {
        if (overflow) return;

        if (color_index === color_count) {
            if (arrangements.length >= cap) {
                overflow = true;
                return;
            }
            arrangements.push([...line]);
            return;
        }

        const hint = hints[color_index];
        const count = hint.number;
        const bit = 1 << color_index;

        if (count === 0) {
            placeColors(color_index + 1);
            return;
        }

        if (hint.contiguous && count > 1) {
            placeContiguous(color_index, count, bit);
        } else if (!hint.contiguous && count > 1) {
            placeNonContiguous(color_index, count, bit);
        } else {
            placeSingle(color_index, bit);
        }
    }

    function placeSingle(color_index, bit) {
        for (let pos = 0; pos < length; pos++) {
            if (line[pos] === EMPTY && (masks[pos] & bit)) {
                line[pos] = color_index;
                placeColors(color_index + 1);
                line[pos] = EMPTY;
                if (overflow) return;
            }
        }
    }

    function placeContiguous(color_index, count, bit) {
        for (let start = 0; start + count <= length; start++) {
            let valid = true;
            for (let i = 0; i < count; i++) {
                const pos = start + i;
                if (line[pos] !== EMPTY || !(masks[pos] & bit)) {
                    valid = false;
                    break;
                }
            }
            if (!valid) continue;

            for (let i = 0; i < count; i++) line[start + i] = color_index;
            placeColors(color_index + 1);
            for (let i = 0; i < count; i++) line[start + i] = EMPTY;
            if (overflow) return;
        }
    }

    function placeNonContiguous(color_index, count, bit) {
        const available = [];
        for (let pos = 0; pos < length; pos++) {
            if (line[pos] === EMPTY && (masks[pos] & bit)) available.push(pos);
        }
        if (available.length < count) return;

        const combo = new Array(count);

        function choose(start, idx) {
            if (overflow) return;
            if (idx === count) {
                if (isContiguousCombo(combo)) return;
                for (const pos of combo) line[pos] = color_index;
                placeColors(color_index + 1);
                for (const pos of combo) line[pos] = EMPTY;
                return;
            }
            for (let i = start; i <= available.length - (count - idx); i++) {
                combo[idx] = available[i];
                choose(i + 1, idx + 1);
                if (overflow) return;
            }
        }

        choose(0, 0);
    }

    placeColors(0);
    return overflow ? null : arrangements;
}

/**
 * Vrai si la disposition `arr` est compatible avec les domaines courants
 * le long de la ligne (`is_row` = ligne ou colonne d'indice `index`).
 */
function fitsDomains(arr, domains, is_row, index) {
    for (let i = 0; i < arr.length; i++) {
        const domain = is_row ? domains[index][i] : domains[i][index];
        if (!(domain & (1 << arr[i]))) return false;
    }
    return true;
}

/**
 * Propagation mutuelle (arc-consistency) : filtre les listes de dispositions
 * de chaque ligne/colonne par rapport aux domaines, puis resserre les domaines
 * à partir des dispositions survivantes. Itère jusqu'à stabilité.
 *
 * Retourne false si une contradiction apparaît (liste vide).
 */
function propagate(rows, cols, domains, row_arrangements, col_arrangements) {
    let changed = true;
    while (changed) {
        changed = false;

        for (let r = 0; r < rows; r++) {
            const before = row_arrangements[r].length;
            row_arrangements[r] = row_arrangements[r].filter(arr => fitsDomains(arr, domains, true, r));
            if (row_arrangements[r].length === 0) return false;

            const seen = new Array(cols).fill(0);
            for (const arr of row_arrangements[r]) {
                for (let c = 0; c < cols; c++) seen[c] |= (1 << arr[c]);
            }
            for (let c = 0; c < cols; c++) {
                const nd = domains[r][c] & seen[c];
                if (nd !== domains[r][c]) {
                    domains[r][c] = nd;
                    changed = true;
                }
            }
            if (row_arrangements[r].length !== before) changed = true;
        }

        for (let c = 0; c < cols; c++) {
            const before = col_arrangements[c].length;
            col_arrangements[c] = col_arrangements[c].filter(arr => fitsDomains(arr, domains, false, c));
            if (col_arrangements[c].length === 0) return false;

            const seen = new Array(rows).fill(0);
            for (const arr of col_arrangements[c]) {
                for (let r = 0; r < rows; r++) seen[r] |= (1 << arr[r]);
            }
            for (let r = 0; r < rows; r++) {
                const nd = domains[r][c] & seen[r];
                if (nd !== domains[r][c]) {
                    domains[r][c] = nd;
                    changed = true;
                }
            }
            if (col_arrangements[c].length !== before) changed = true;
        }
    }
    return true;
}

/**
 * Vrai si toutes les cellules ont un domaine réduit à une seule couleur.
 */
function allDetermined(rows, cols, domains) {
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const d = domains[r][c];
            if (d & (d - 1)) return false;
        }
    }
    return true;
}

/**
 * Compte le nombre de solutions (au plus `max_solutions`) par backtracking :
 * on choisit la cellule non déterminée la plus contrainte, on essaie chaque
 * couleur possible, on propage, puis on récurse.
 */
function countSolutions(rows, cols, domains, row_arrangements, col_arrangements, max_solutions, deadline) {
    if (Date.now() > deadline) return -1; // signal de dépassement du budget temps
    if (allDetermined(rows, cols, domains)) return 1;

    let best_r = -1;
    let best_c = -1;
    let best_size = Infinity;
    for (let r = 0; r < rows && best_size > 2; r++) {
        for (let c = 0; c < cols; c++) {
            const size = popcount(domains[r][c]);
            if (size > 1 && size < best_size) {
                best_size = size;
                best_r = r;
                best_c = c;
                if (size === 2) break;
            }
        }
    }

    let total = 0;
    const base = domains[best_r][best_c];

    for (let k = 0; base >> k; k++) {
        if (!(base & (1 << k))) continue;

        const domains_copy = domains.map(row => [...row]);
        const row_copy = row_arrangements.map(a => [...a]);
        const col_copy = col_arrangements.map(a => [...a]);
        domains_copy[best_r][best_c] = (1 << k);

        if (propagate(rows, cols, domains_copy, row_copy, col_copy)) {
            const sub = countSolutions(rows, cols, domains_copy, row_copy, col_copy, max_solutions - total, deadline);
            if (sub === -1) return -1;
            total += sub;
            if (total >= max_solutions) return total;
        }
    }

    return total;
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
 * @returns {{ solvable: boolean, unique: boolean, solutions: number, reason: string }}
 */
export function checkSolvability({ rows, columns, hints, colorCount }) {
    const row_hints = convertHints(hints.rows);
    const col_hints = convertHints(hints.columns);

    // Vérification de cohérence : chaque ligne/colonne doit totaliser sa longueur
    for (const rh of row_hints) {
        let total = 0;
        for (const h of rh) total += h.number;
        if (total !== columns) {
            return { solvable: false, unique: false, solutions: 0, reason: 'invalid_hints' };
        }
    }
    for (const ch of col_hints) {
        let total = 0;
        for (const h of ch) total += h.number;
        if (total !== rows) {
            return { solvable: false, unique: false, solutions: 0, reason: 'invalid_hints' };
        }
    }

    const all_mask = (1 << colorCount) - 1;
    const domains = Array.from({ length: rows }, () => new Array(columns).fill(all_mask));

    const row_arrangements = new Array(rows).fill(null);
    const col_arrangements = new Array(columns).fill(null);

    // Ordonnancement : on traite lignes ET colonnes du coût croissant.
    const lines = [];
    for (let r = 0; r < rows; r++) lines.push({ is_row: true, index: r, cost: estimateCost(row_hints[r]) });
    for (let c = 0; c < columns; c++) lines.push({ is_row: false, index: c, cost: estimateCost(col_hints[c]) });
    lines.sort((a, b) => a.cost - b.cost);

    // 1ʳᵉ passe : génération dans l'ordre du coût, avec réessai des lignes
    // trop volumineuses une fois les domaines resserrés par les autres.
    let pending = lines.slice();
    let progress = true;
    while (pending.length > 0 && progress) {
        progress = false;
        const still_pending = [];

        for (const line of pending) {
            const length = line.is_row ? columns : rows;
            const line_hints = line.is_row ? row_hints[line.index] : col_hints[line.index];

            const masks = new Array(length);
            if (line.is_row) {
                for (let c = 0; c < length; c++) masks[c] = domains[line.index][c];
            } else {
                for (let r = 0; r < length; r++) masks[r] = domains[r][line.index];
            }

            const arrs = generateLineArrangements(length, line_hints, masks, LINE_ARRANGEMENT_CAP);
            if (arrs === null) {
                still_pending.push(line); // trop gros pour l'instant, on réessaiera
                continue;
            }
            if (arrs.length === 0) {
                return { solvable: false, unique: false, solutions: 0, reason: 'no_solution' };
            }

            if (line.is_row) row_arrangements[line.index] = arrs;
            else col_arrangements[line.index] = arrs;

            // Resserre les domaines à partir des dispositions de cette ligne
            const seen = new Array(length).fill(0);
            for (const arr of arrs) {
                for (let i = 0; i < length; i++) seen[i] |= (1 << arr[i]);
            }
            for (let i = 0; i < length; i++) {
                if (line.is_row) domains[line.index][i] &= seen[i];
                else domains[i][line.index] &= seen[i];
            }
            progress = true;
        }

        pending = still_pending;
    }

    // Des lignes restent ingénérables malgré l'élagage : trop complexe.
    if (pending.length > 0) {
        return { solvable: null, unique: false, solutions: null, reason: 'too_complex' };
    }

    if (!propagate(rows, columns, domains, row_arrangements, col_arrangements)) {
        return { solvable: false, unique: false, solutions: 0, reason: 'no_solution' };
    }

    const deadline = Date.now() + TIME_BUDGET_MS;
    const solution_count = countSolutions(rows, columns, domains, row_arrangements, col_arrangements, 2, deadline);

    if (solution_count === -1) {
        return { solvable: null, unique: false, solutions: null, reason: 'too_complex' };
    }
    if (solution_count === 0) {
        return { solvable: false, unique: false, solutions: 0, reason: 'no_solution' };
    }
    if (solution_count === 1) {
        return { solvable: true, unique: true, solutions: 1, reason: 'unique' };
    }
    return { solvable: true, unique: false, solutions: solution_count, reason: 'multiple' };
}
