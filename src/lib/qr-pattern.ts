function hash32(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function inFinder(x: number, y: number, n: number) {
  const spots = [
    [0, 0],
    [n - 7, 0],
    [0, n - 7],
  ];
  return spots.some(([sx, sy]) => x >= sx && x < sx + 7 && y >= sy && y < sy + 7);
}

function finderCell(x: number, y: number, n: number) {
  const spots = [
    [0, 0],
    [n - 7, 0],
    [0, n - 7],
  ];
  for (const [sx, sy] of spots) {
    if (x < sx || x >= sx + 7 || y < sy || y >= sy + 7) continue;
    const dx = x - sx;
    const dy = y - sy;
    const onBorder = dx === 0 || dy === 0 || dx === 6 || dy === 6;
    const inCore = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4;
    return onBorder || inCore;
  }
  return false;
}

export function qrModules(value: string, n = 25) {
  let seed = hash32(value || "empty");
  const next = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed;
  };
  const grid: boolean[][] = [];
  for (let y = 0; y < n; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < n; x++) {
      if (inFinder(x, y, n)) {
        row.push(finderCell(x, y, n));
        continue;
      }
      const timing = (x === 6 || y === 6) && (x + y) % 2 === 0;
      row.push(timing || next() % 3 !== 0);
    }
    grid.push(row);
  }
  const hole = 7;
  const start = Math.floor((n - hole) / 2);
  for (let y = start; y < start + hole; y++) {
    for (let x = start; x < start + hole; x++) {
      grid[y][x] = false;
    }
  }
  return grid;
}
