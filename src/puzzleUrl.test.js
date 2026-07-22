import { describe, expect, it } from 'vitest';
import { encodeCompactPuzzle, decodeCompactPuzzle, decodeLegacyPuzzle } from './puzzleUrl.js';

describe('encodeCompactPuzzle / decodeCompactPuzzle', () => {
  it('fait un aller-retour sans perte', () => {
    const grid = [
      [0, 1],
      [1, 0],
    ];
    const colors = ['#ff0000', '#00ff00'];
    const url = encodeCompactPuzzle({
      grid,
      gridColumns: 2,
      colors,
      origin: 'http://localhost',
    });

    expect(url.startsWith('http://localhost?p=')).toBe(true);

    const decoded = decodeCompactPuzzle(url);
    expect(decoded.grid).toEqual(grid);
    expect(decoded.gridRows).toBe(2);
    expect(decoded.gridColumns).toBe(2);
    expect(decoded.colors).toEqual(colors);
    expect(decoded.hints.rows).toHaveLength(2);
    expect(decoded.hints.columns).toHaveLength(2);
  });

  it('rejette un payload compact invalide', () => {
    expect(() => decodeCompactPuzzle('http://localhost/?p=%%%')).toThrow();
  });
});

describe('decodeLegacyPuzzle', () => {
  it('rejette un payload legacy invalide', () => {
    expect(() => decodeLegacyPuzzle('http://localhost/?g=%%%')).toThrow();
  });
});
