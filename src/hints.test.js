import { describe, expect, it } from 'vitest';
import { getHintsForColor, getHints, computeHints } from './hints.js';

describe('getHintsForColor', () => {
  it('compte les cases d’une couleur', () => {
    expect(getHintsForColor(0, [0, 1, 0]).number).toBe(2);
  });

  it('détecte un bloc contigu', () => {
    expect(getHintsForColor(0, [0, 0, 1]).contiguous).toBe(true);
  });

  it('détecte un bloc non contigu', () => {
    expect(getHintsForColor(0, [0, 1, 0]).contiguous).toBe(false);
  });

  it('ignore les cases vides et ne confond pas avec la couleur 0', () => {
    expect(getHintsForColor(0, ['', 0, '']).number).toBe(1);
  });
});

describe('getHints / computeHints', () => {
  it('produit un indice par couleur', () => {
    const line = getHints([0, 1, 0], 2);
    expect(line).toHaveLength(2);
    expect(line[0]).toEqual({ number: 2, contiguous: false });
    expect(line[1]).toEqual({ number: 1, contiguous: true });
  });

  it('calcule lignes et colonnes', () => {
    const hints = computeHints(
      [
        [0, 1],
        [1, 0],
      ],
      2,
    );
    expect(hints.rows).toHaveLength(2);
    expect(hints.columns).toHaveLength(2);
    expect(hints.rows[0][0].number).toBe(1);
    expect(hints.columns[0][1].number).toBe(1);
  });
});
