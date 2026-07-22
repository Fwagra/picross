import { describe, expect, it } from 'vitest';
import { checkSolvability } from './solver.js';

function hintsFromGrid(grid, colorCount) {
  const rows = grid.length;
  const columns = grid[0].length;
  const rowHints = grid.map(row => {
    return Array.from({ length: colorCount }, (_, color) => {
      const positions = [];
      row.forEach((cell, i) => {
        if (cell === color) positions.push(i);
      });
      return {
        number: positions.length,
        contiguous: positions.length <= 1 || positions.every((p, i) => i === 0 || p === positions[i - 1] + 1),
      };
    });
  });
  const colHints = Array.from({ length: columns }, (_, c) => {
    return Array.from({ length: colorCount }, (_, color) => {
      const positions = [];
      for (let r = 0; r < rows; r++) {
        if (grid[r][c] === color) positions.push(r);
      }
      return {
        number: positions.length,
        contiguous: positions.length <= 1 || positions.every((p, i) => i === 0 || p === positions[i - 1] + 1),
      };
    });
  });
  return { rows: rowHints, columns: colHints };
}

describe('checkSolvability', () => {
  it('signale des indices incohérents', () => {
    const result = checkSolvability({
      rows: 2,
      columns: 2,
      colorCount: 2,
      hints: {
        rows: [
          [{ number: 1, contiguous: true }, { number: 0, contiguous: true }],
          [{ number: 1, contiguous: true }, { number: 1, contiguous: true }],
        ],
        columns: [
          [{ number: 1, contiguous: true }, { number: 1, contiguous: true }],
          [{ number: 1, contiguous: true }, { number: 1, contiguous: true }],
        ],
      },
    });
    expect(result.reason).toBe('invalid_hints');
  });

  it('détecte une solution unique simple', () => {
    // Un seul « 1 » en bas à droite : le motif est forcé par les indices
    const grid = [
      [0, 0],
      [0, 1],
    ];
    const hints = hintsFromGrid(grid, 2);
    const result = checkSolvability({
      rows: 2,
      columns: 2,
      colorCount: 2,
      hints,
    });
    expect(result.reason).toBe('unique');
    expect(result.unique).toBe(true);
  });

  it('détecte plusieurs solutions quand c’est le cas', () => {
    // 2x2 mono-couleur impossible... better: two colors with counts that allow swaps
    // Ligne: 1 de chaque couleur non contigu impossible on 2 cells with 1 each always contiguous
    // Use 3x1? Actually 2 columns: each row has 1 color0 and 1 color1 - two solutions (swap columns)
    const hints = {
      rows: [
        [{ number: 1, contiguous: true }, { number: 1, contiguous: true }],
        [{ number: 1, contiguous: true }, { number: 1, contiguous: true }],
      ],
      columns: [
        [{ number: 1, contiguous: true }, { number: 1, contiguous: true }],
        [{ number: 1, contiguous: true }, { number: 1, contiguous: true }],
      ],
    };
    const result = checkSolvability({
      rows: 2,
      columns: 2,
      colorCount: 2,
      hints,
    });
    expect(result.reason).toBe('multiple');
    expect(result.unique).toBe(false);
  });
});
