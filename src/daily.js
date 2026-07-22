/**
 * Daily Color Picross : calendrier date → payload(s) compact (?p=).
 * Tirage déterministe si plusieurs grilles ; fallback sur la date précédente.
 */

import calendar from './daily/calendar.json';
import { decodeCompactPuzzle } from './puzzleUrl.js';

/**
 * Normalise une entrée calendrier (payload seul ou URL complète avec ?p=).
 */
export function normalizeDailyPayload(entry) {
    if (typeof entry !== 'string' || !entry) {
        throw new Error('payload daily manquant');
    }
    if (entry.includes('?p=')) {
        return entry.split('?p=')[1];
    }
    return entry;
}

/**
 * Clé de jour locale YYYY-MM-DD.
 */
export function getTodayKey(now = new Date()) {
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Pathname /daily (slash final ignoré).
 */
export function isDailyPath(pathname = typeof location !== 'undefined' ? location.pathname : '/') {
    return pathname.replace(/\/+$/, '') === '/daily';
}

/**
 * Hash simple et stable pour un tirage déterministe.
 */
function hashString(value) {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
        hash = ((hash << 5) - hash) + value.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

/**
 * Trouve la clé calendrier à utiliser (exacte ou dernière date ≤ demandée).
 */
export function resolveCalendarDateKey(calendarMap, dateKey) {
    if (calendarMap[dateKey] && calendarMap[dateKey].length > 0) {
        return dateKey;
    }

    const previousKeys = Object.keys(calendarMap)
        .filter(key => key <= dateKey && Array.isArray(calendarMap[key]) && calendarMap[key].length > 0)
        .sort();

    return previousKeys.length > 0 ? previousKeys[previousKeys.length - 1] : null;
}

/**
 * Choisit le payload du jour (déterministe si plusieurs).
 * @returns {{ dateKey: string, resolvedDateKey: string, payload: string } | null}
 */
export function pickDailyPuzzle(calendarMap, dateKey) {
    const resolvedDateKey = resolveCalendarDateKey(calendarMap, dateKey);
    if (!resolvedDateKey) {
        return null;
    }

    const entries = calendarMap[resolvedDateKey];
    const index = hashString(dateKey) % entries.length;
    const payload = normalizeDailyPayload(entries[index]);

    return {
        dateKey,
        resolvedDateKey,
        payload,
    };
}

/**
 * Charge et décode le daily pour une date (calendrier embarqué par défaut).
 */
export function loadDailyForDate(dateKey = getTodayKey(), calendarMap = calendar) {
    const picked = pickDailyPuzzle(calendarMap, dateKey);
    if (!picked) {
        throw new Error('aucun daily disponible');
    }

    const puzzle = decodeCompactPuzzle(picked.payload);
    return {
        ...puzzle,
        dateKey: picked.dateKey,
        resolvedDateKey: picked.resolvedDateKey,
    };
}

export { calendar };
