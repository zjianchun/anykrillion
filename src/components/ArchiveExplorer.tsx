"use client";

import { useMemo, useState } from "react";
import { Calendar, Eye, Filter, Play } from "lucide-react";
import KrillionGameEngine from "@/components/KrillionGameEngine";
import { DAILY_BOARDS, getDailyPromptCorpus } from "@/lib/datasets";
import type { DailyBoard, PackId, TriviaPrompt } from "@/types/game";
import { PACK_METAS } from "@/types/game";

interface ArchiveExplorerProps {
  dailyBoards?: DailyBoard[];
  prompts?: TriviaPrompt[];
}

export default function ArchiveExplorer({
  dailyBoards: dailyBoardsProp,
  prompts: promptsProp,
}: ArchiveExplorerProps) {
  const dailyBoards = dailyBoardsProp ?? DAILY_BOARDS;
  const prompts = useMemo(() => promptsProp ?? getDailyPromptCorpus(), [promptsProp]);
  const [selectedDate, setSelectedDate] = useState<string>(
    dailyBoards[0]?.date ?? "2026-11-14",
  );
  const [packFilter, setPackFilter] = useState<PackId | "all">("all");
  const [showKey, setShowKey] = useState<boolean>(false);

  const promptById = useMemo(
    () => new Map<string, TriviaPrompt>(prompts.map((p) => [p.id, p])),
    [prompts],
  );

  const selectedBoard = useMemo(
    () => dailyBoards.find((b) => b.date === selectedDate) ?? dailyBoards[0],
    [dailyBoards, selectedDate],
  );

  const selectedBoardPrompts = useMemo(() => {
    if (!selectedBoard) return [];
    return selectedBoard.promptIds
      .map((id) => promptById.get(id))
      .filter((item): item is TriviaPrompt => Boolean(item));
  }, [promptById, selectedBoard]);

  const filteredBoards = useMemo(() => {
    if (packFilter === "all") return dailyBoards;
    return dailyBoards.filter((board) =>
      board.promptIds.some((id) => promptById.get(id)?.pack === packFilter),
    );
  }, [dailyBoards, packFilter, promptById]);

  const boardPacksMap = useMemo(() => {
    const map = new Map<string, PackId[]>();
    for (const board of dailyBoards) {
      const packs = board.promptIds
        .map((id) => promptById.get(id)?.pack)
        .filter((p): p is PackId => Boolean(p));
      map.set(board.date, Array.from(new Set(packs)));
    }
    return map;
  }, [dailyBoards, promptById]);

  return (
    <div className="space-y-8">
      {selectedBoard && (
        <section aria-labelledby="replay-heading" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2
                id="replay-heading"
                className="text-lg font-extrabold tracking-tight text-white sm:text-xl"
              >
                Replay Past Days &amp; Compare Rarity Scores
              </h2>
              <p className="mt-0.5 text-xs text-slate-300 sm:text-sm">
                Active board:{" "}
                <strong className="text-cyan-300">
                  Dive #{selectedBoard.dayNumber} ({selectedBoard.date})
                </strong>{" "}
                — {selectedBoard.themeLabel}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowKey((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-3.5 py-2 text-xs font-bold text-emerald-200 hover:bg-emerald-500/20"
            >
              <Eye className="h-4 w-4" />
              {showKey ? "Hide Board Answer Key" : "Reveal Board Top Rarity Answers"}
            </button>
          </div>

          <KrillionGameEngine
            key={selectedBoard.date}
            prompts={prompts}
            dailyBoards={dailyBoards}
            defaultMode="daily"
            defaultPack="general"
            initialDailyDate={selectedBoard.date}
            allowModeSwitch={true}
            allowPackFilter={false}
          />

          {showKey && (
            <div className="rounded-2xl border border-emerald-500/25 bg-[#041425] p-5 sm:p-6">
              <h3 className="text-base font-extrabold text-emerald-300">
                Dive #{selectedBoard.dayNumber} ({selectedBoard.date}) — Verified Answer Key
              </h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {selectedBoardPrompts.map((prompt, idx) => {
                  const sortedDesc = [...prompt.answers].sort((a, b) => b.rarity - a.rarity);
                  const best = sortedDesc.slice(0, 3);
                  const common = [...prompt.answers]
                    .sort((a, b) => a.rarity - b.rarity)
                    .slice(0, 2);
                  return (
                    <div
                      key={prompt.id}
                      className="rounded-xl border border-cyan-500/20 bg-[#06192d]/70 p-4"
                    >
                      <p className="font-mono text-xs text-cyan-300">
                        Round {idx + 1}/7 • {prompt.categoryLabel}
                      </p>
                      <p className="mt-1 text-sm font-bold text-white">{prompt.question}</p>
                      <div className="mt-2.5 flex flex-wrap gap-1.5 text-xs">
                        {best.map((b) => (
                          <span
                            key={b.name}
                            className="rounded bg-emerald-500/15 px-2 py-0.5 font-semibold text-emerald-200"
                          >
                            {b.name} ({b.rarity})
                          </span>
                        ))}
                        {common.map((c) => (
                          <span
                            key={c.name}
                            className="rounded bg-rose-500/15 px-2 py-0.5 text-rose-200"
                          >
                            Plankton: {c.name} ({c.rarity})
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}

      <section aria-labelledby="archive-filter-heading">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-500/20 bg-[#05182b]/80 p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-cyan-300" />
            <h2
              id="archive-filter-heading"
              className="text-base font-extrabold text-white sm:text-lg"
            >
              Archive Filtering by Topic Pack
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPackFilter("all")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                packFilter === "all"
                  ? "bg-cyan-400 text-[#03111f]"
                  : "border border-cyan-500/25 bg-[#03111f] text-slate-300 hover:border-cyan-400/50"
              }`}
            >
              All 30 Boards
            </button>
            {PACK_METAS.map((meta) => (
              <button
                key={meta.id}
                type="button"
                onClick={() => setPackFilter(meta.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  packFilter === meta.id
                    ? "bg-cyan-400 text-[#03111f]"
                    : "border border-cyan-500/25 bg-[#03111f] text-slate-300 hover:border-cyan-400/50"
                }`}
              >
                {meta.shortName}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="calendar-heading">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-cyan-300" />
            <h2
              id="calendar-heading"
              className="text-xl font-extrabold tracking-tight text-white sm:text-2xl"
            >
              Past Daily Krillion Boards Calendar
            </h2>
          </div>
          <span className="font-mono text-xs text-slate-400">
            Showing {filteredBoards.length} of {dailyBoards.length} archived boards
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {filteredBoards.map((board) => {
            const active = board.date === selectedBoard?.date;
            const packs = boardPacksMap.get(board.date) ?? [];
            return (
              <button
                key={board.date}
                id={`board-${board.dayNumber}`}
                type="button"
                onClick={() => {
                  setSelectedDate(board.date);
                  setShowKey(false);
                }}
                className={`flex flex-col justify-between rounded-xl border p-3.5 text-left transition ${
                  active
                    ? "border-cyan-300 bg-cyan-500/15 shadow-lg shadow-cyan-500/10"
                    : "border-cyan-500/20 bg-[#06192d]/75 hover:border-cyan-400/50 hover:bg-[#08223d]"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-cyan-300">Dive #{board.dayNumber}</span>
                    <span className="text-slate-400">{board.date}</span>
                  </div>
                  <p className="mt-1.5 text-sm font-bold text-white line-clamp-2">
                    {board.themeLabel}
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] font-semibold">
                  <span className="text-slate-400">{packs.length} topic packs</span>
                  <span className="inline-flex items-center gap-1 text-cyan-300">
                    <Play className="h-3 w-3" />
                    {active ? "Playing" : "Replay"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
