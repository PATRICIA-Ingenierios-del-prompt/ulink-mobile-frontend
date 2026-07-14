export const P_COLORS = ["#7c6cff", "#f25fb0", "#2bd4bd", "#f4b13e"] as const;

export const PLAYER_NAMES = ["Tú", "Felipe", "Sofía", "Andrés"] as const;

// 68-cell clockwise track (19×19 cross perimeter)
export const TRACK: [number, number][] = [
  [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 6], [8, 7],
  [7, 8], [6, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
  [0, 9],
  [0, 10], [1, 10], [2, 10], [3, 10], [4, 10], [5, 10], [6, 10], [7, 10],
  [8, 11], [8, 12], [8, 13], [8, 14], [8, 15], [8, 16], [8, 17], [8, 18],
  [9, 18],
  [10, 18], [10, 17], [10, 16], [10, 15], [10, 14], [10, 13], [10, 12], [10, 11],
  [11, 10], [12, 10], [13, 10], [14, 10], [15, 10], [16, 10], [17, 10], [18, 10],
  [18, 9],
  [18, 8], [17, 8], [16, 8], [15, 8], [14, 8], [13, 8], [12, 8], [11, 8],
  [10, 7], [10, 6], [10, 5], [10, 4], [10, 3], [10, 2], [10, 1], [10, 0],
  [9, 0],
];

// Start indices in TRACK for each player (AMARILLO=0, AZUL=1, VERDE=2, ROJO=3)
export const START_POS = [14, 31, 65, 52] as const;

// Home ladder threshold (relative positions >= 63 enter the ladder)
export const LADDER_THRESHOLD = 63;

// Safe cells (star squares)
export const SAFES = new Set([
  "5,8", "3,10", "8,13", "10,15",
  "13,10", "15,8", "10,5", "8,3",
]);

// Start cell colors
export const STARTS: Record<string, string> = {
  "1,8": "#7c6cff",
  "8,17": "#f25fb0",
  "17,8": "#f4b13e",
  "10,1": "#2bd4bd",
};

// Home arm arrow directions
export const ARROW_DIR: Record<string, "down" | "up" | "right" | "left"> = {
  "7,9": "down",
  "11,9": "up",
  "9,7": "right",
  "9,11": "left",
};

// Home arm colors
export const HOME_COLOR: Record<string, string> = {
  top: "#7c6cff",
  bottom: "#f4b13e",
  left: "#2bd4bd",
  right: "#f25fb0",
};

// Dice face dot positions (percentage-based in 100×100 viewBox)
export const DOTS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[25, 25], [75, 75]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
  6: [[25, 25], [75, 25], [25, 50], [75, 50], [25, 75], [75, 75]],
};

// ── Helpers ──────────────────────────────────────────────────────────────────

export function inArm(r: number, c: number): "top" | "bottom" | "left" | "right" | null {
  if (c >= 8 && c <= 10 && r <= 7) return "top";
  if (c >= 8 && c <= 10 && r >= 11) return "bottom";
  if (r >= 8 && r <= 10 && c <= 7) return "left";
  if (r >= 8 && r <= 10 && c >= 11) return "right";
  return null;
}

export function hexA(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${a})`;
}

export function getBoardPos(player: number, trackPos: number): [number, number] | null {
  if (trackPos < 0 || trackPos > 67) return null;
  return TRACK[(START_POS[player] + trackPos) % 68];
}
