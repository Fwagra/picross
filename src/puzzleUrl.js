/**
 * Encodage / décodage des liens de partage Color Picross.
 * - compact (?p=) : { g, w, c }
 * - legacy (?g=) : payload JSONCrush historique
 */

import JSONCrush from 'jsoncrush';
import { computeHints } from './hints.js';

/**
 * Décode le format compact (?p=).
 * @returns {{ grid: number[][], colors: string[], gridRows: number, gridColumns: number, hints: object }}
 */
export function decodeCompactPuzzle(href) {
    const encodedData = href.split('?p=')[1];
    if (!encodedData) throw new Error('payload manquant');

    const data = JSON.parse(JSONCrush.uncrush(decodeURIComponent(encodedData)));
    if (!data.w || !data.g || !Array.isArray(data.c)) throw new Error('payload invalide');

    const width = data.w;
    const cells = data.g.split('').map(character => parseInt(character, 36));
    const grid = [];
    for (let i = 0; i < cells.length; i += width) {
        grid.push(cells.slice(i, i + width));
    }

    const colors = data.c.map(color => '#' + color);
    return {
        grid,
        colors,
        gridRows: grid.length,
        gridColumns: width,
        hints: computeHints(grid, colors.length),
    };
}

/**
 * Décode l'ancien format (?g=).
 */
export function decodeLegacyPuzzle(href) {
    const dataURL = href.split('?g=')[1];
    if (!dataURL) throw new Error('payload manquant');

    // Certaines plateformes remplacent # par %23
    const data = JSON.parse(JSONCrush.uncrush(decodeURI(dataURL)).replace(/%23/g, '#'));
    if (!data.grid || !data.colors || !data.hints) throw new Error('payload invalide');

    return {
        grid: data.grid,
        colors: data.colors,
        gridRows: data.rows,
        gridColumns: data.columns,
        hints: data.hints,
    };
}

/**
 * Encode la grille courante au format compact (?p=).
 */
export function encodeCompactPuzzle({ grid, gridColumns, colors, origin }) {
    const data = {
        g: grid.map(row => row.map(value => Number(value).toString(36)).join('')).join(''),
        w: gridColumns,
        c: colors.map(color => color.replace('#', '')),
    };
    const encodedData = encodeURIComponent(JSONCrush.crush(JSON.stringify(data)));
    return `${origin}?p=${encodedData}`;
}
