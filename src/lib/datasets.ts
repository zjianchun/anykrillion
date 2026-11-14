import rawPrompts from "@/data/prompts.json";
import rawDailyBoards from "@/data/daily_boards.json";
import type { DailyBoard, PackId, TriviaPrompt } from "@/types/game";

export const ALL_PROMPTS = rawPrompts as TriviaPrompt[];
export const DAILY_BOARDS = rawDailyBoards as DailyBoard[];

const PROMPT_BY_ID = new Map<string, TriviaPrompt>(
  ALL_PROMPTS.map((prompt) => [prompt.id, prompt])
);

export const TODAY_BOARD: DailyBoard = DAILY_BOARDS[0];

export function getPromptById(id: string): TriviaPrompt | undefined {
  return PROMPT_BY_ID.get(id);
}

export function getPromptsByPack(pack: PackId): TriviaPrompt[] {
  return ALL_PROMPTS.filter((prompt) => prompt.pack === pack);
}

export function getBoardPrompts(board: DailyBoard): TriviaPrompt[] {
  return board.promptIds
    .map((id) => PROMPT_BY_ID.get(id))
    .filter((item): item is TriviaPrompt => Boolean(item));
}

export function getDailyPromptCorpus(): TriviaPrompt[] {
  const seen = new Set<string>();
  const list: TriviaPrompt[] = [];
  for (const board of DAILY_BOARDS) {
    for (const id of board.promptIds) {
      if (seen.has(id)) continue;
      const p = PROMPT_BY_ID.get(id);
      if (p) {
        seen.add(id);
        list.push(p);
      }
    }
  }
  return list;
}

export function getCorpusStats() {
  const totalPrompts = ALL_PROMPTS.length;
  const totalAnswers = ALL_PROMPTS.reduce((acc, p) => acc + p.answers.length, 0);
  const byPack: Record<PackId, { prompts: number; answers: number }> = {
    general: { prompts: 0, answers: 0 },
    geography: { prompts: 0, answers: 0 },
    movies: { prompts: 0, answers: 0 },
    sports: { prompts: 0, answers: 0 },
    football: { prompts: 0, answers: 0 },
    nba: { prompts: 0, answers: 0 },
    pokemon: { prompts: 0, answers: 0 },
  };

  for (const p of ALL_PROMPTS) {
    byPack[p.pack].prompts += 1;
    byPack[p.pack].answers += p.answers.length;
  }

  return {
    totalPrompts,
    totalAnswers,
    totalDailyBoards: DAILY_BOARDS.length,
    byPack,
  };
}
