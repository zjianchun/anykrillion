export type OrbColor = "orange" | "purple" | "green" | "blue";

export type DailyOrbsFormat =
  | "bijection"
  | "categorization"
  | "themed"
  | "open-ended"
  | "long-list"
  | "other";

export interface DailyOrbsCategoryGroup {
  name: string;
  count: number;
  items: string[];
}

export interface DailyOrbsHintRow {
  label: string;
  clueMask: string;
  answer: string;
}

export interface DailyOrbsPuzzleEntry {
  color: OrbColor;
  id: string;
  title: string;
  format: DailyOrbsFormat;
  context: string;
  topics: string[];
  prompt: string;
  starThresholds: [number, number, number];
  totalCount: number;
  columnA?: string;
  columnB?: string;
  categories?: DailyOrbsCategoryGroup[];
  hint1: string;
  hint2: string;
  starterAnchor: string;
  rows: DailyOrbsHintRow[];
}

export interface DailyOrbsBoard {
  date: string;
  nextRolloverUtc: string;
  fetchedAt: string;
  puzzles: DailyOrbsPuzzleEntry[];
}

export interface DailyOrbsDataset {
  updatedAt: string;
  today: DailyOrbsBoard;
  archive: DailyOrbsBoard[];
}
