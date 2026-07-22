import { describe, expect, it } from 'vitest';
import {
  getTodayKey,
  isDailyPath,
  normalizeDailyPayload,
  pickDailyPuzzle,
  resolveCalendarDateKey,
  loadDailyForDate,
} from './daily.js';
import { encodeCompactPuzzle, decodeCompactPuzzle } from './puzzleUrl.js';

const samplePayload = encodeCompactPuzzle({
  grid: [
    [0, 1],
    [1, 0],
  ],
  gridColumns: 2,
  colors: ['#ff0000', '#00ff00'],
  origin: 'http://localhost',
}).split('?p=')[1];

const otherPayload = encodeCompactPuzzle({
  grid: [
    [1, 0],
    [0, 1],
  ],
  gridColumns: 2,
  colors: ['#0000ff', '#ffff00'],
  origin: 'http://localhost',
}).split('?p=')[1];

describe('getTodayKey', () => {
  it('formate la date locale en YYYY-MM-DD', () => {
    expect(getTodayKey(new Date(2026, 6, 22))).toBe('2026-07-22');
  });
});

describe('isDailyPath', () => {
  it('détecte /daily avec ou sans slash final', () => {
    expect(isDailyPath('/daily')).toBe(true);
    expect(isDailyPath('/daily/')).toBe(true);
    expect(isDailyPath('/')).toBe(false);
  });
});

describe('normalizeDailyPayload', () => {
  it('extrait le payload d’une URL complète', () => {
    expect(normalizeDailyPayload(`http://localhost?p=${samplePayload}`)).toBe(samplePayload);
  });

  it('laisse un payload brut inchangé', () => {
    expect(normalizeDailyPayload(samplePayload)).toBe(samplePayload);
  });
});

describe('pickDailyPuzzle', () => {
  const calendar = {
    '2026-07-20': [samplePayload],
    '2026-07-22': [samplePayload, otherPayload],
  };

  it('choisit la grille exacte du jour', () => {
    const picked = pickDailyPuzzle(calendar, '2026-07-20');
    expect(picked.resolvedDateKey).toBe('2026-07-20');
    expect(picked.payload).toBe(samplePayload);
  });

  it('retombe sur la dernière date précédente si le jour manque', () => {
    const picked = pickDailyPuzzle(calendar, '2026-07-21');
    expect(picked.resolvedDateKey).toBe('2026-07-20');
    expect(picked.payload).toBe(samplePayload);
  });

  it('tire au sort de façon déterministe quand il y a plusieurs grilles', () => {
    const first = pickDailyPuzzle(calendar, '2026-07-22');
    const second = pickDailyPuzzle(calendar, '2026-07-22');
    expect(first.payload).toBe(second.payload);
    expect([samplePayload, otherPayload]).toContain(first.payload);
  });

  it('retourne null si aucune date n’est disponible', () => {
    expect(pickDailyPuzzle({}, '2026-07-22')).toBeNull();
    expect(resolveCalendarDateKey({ '2026-07-23': [samplePayload] }, '2026-07-22')).toBeNull();
  });
});

describe('loadDailyForDate', () => {
  it('décode un daily valide', () => {
    const calendar = { '2026-07-22': [samplePayload] };
    const puzzle = loadDailyForDate('2026-07-22', calendar);
    expect(puzzle.gridRows).toBe(2);
    expect(puzzle.gridColumns).toBe(2);
    expect(puzzle.dateKey).toBe('2026-07-22');
  });
});

describe('decodeCompactPuzzle payload brut', () => {
  it('accepte un payload sans URL', () => {
    const decoded = decodeCompactPuzzle(samplePayload);
    expect(decoded.grid).toEqual([
      [0, 1],
      [1, 0],
    ]);
  });
});
