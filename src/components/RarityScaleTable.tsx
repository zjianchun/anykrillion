export default function RarityScaleTable({
  reverse = false,
}: {
  reverse?: boolean;
}) {
  const tiers = [
    {
      name: "One in a Krillion",
      stdScore: "85–100 pts",
      revScore: "85–100 pts (Top Plankton Pick)",
      stdDesc: "Deepest obscure valid picks in the bottom 15% of Wikipedia pageviews.",
      revDesc: "The #1 most obvious, universally named answer on the internet.",
      color: reverse
        ? "border-amber-400/40 bg-amber-500/10 text-amber-200"
        : "border-emerald-400/40 bg-emerald-500/10 text-emerald-200",
    },
    {
      name: "Deep Sea",
      stdScore: "70–84 pts",
      revScore: "70–84 pts",
      stdDesc: "Forgotten veterans, micro-states, or low-profile secondary stars.",
      revDesc: "Second-tier household answers that most players think of immediately.",
      color: "border-cyan-400/40 bg-cyan-500/10 text-cyan-200",
    },
    {
      name: "Rare",
      stdScore: "55–69 pts",
      revScore: "55–69 pts",
      stdDesc: "Solid deep-cut trivia picks that dodge mainstream surface guesses.",
      revDesc: "Well-known answers that remain mainstream in casual conversation.",
      color: "border-sky-400/40 bg-sky-500/10 text-sky-200",
    },
    {
      name: "Uncommon",
      stdScore: "35–54 pts",
      revScore: "35–54 pts",
      stdDesc: "Mid-table entries—safe for keeping a streak alive under 25s pressure.",
      revDesc: "Moderately recognizable picks, risky in high-score reverse runs.",
      color: "border-blue-400/40 bg-blue-500/10 text-blue-200",
    },
    {
      name: "Common",
      stdScore: "20–34 pts",
      revScore: "20–34 pts",
      stdDesc: "Standard textbook choices shared by a large percentage of players.",
      revDesc: "Obscure enough to lose major altitude in Noillirk mode.",
      color: "border-slate-500/40 bg-slate-700/30 text-slate-200",
    },
    {
      name: "Plankton",
      stdScore: "10–19 pts",
      revScore: "10–19 pts (Deep Cut Penalty)",
      stdDesc: "Surface-level crowd magnets—high recognition, minimum points.",
      revDesc: "Overthinking trap! Too obscure to match popular consensus.",
      color: "border-rose-400/40 bg-rose-500/10 text-rose-200",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {tiers.map((t) => (
        <div
          key={t.name}
          className={`rounded-xl border p-4 ${t.color}`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-white">{t.name}</span>
            <span className="font-mono text-xs font-bold">
              {reverse ? t.revScore : t.stdScore}
            </span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-300">
            {reverse ? t.revDesc : t.stdDesc}
          </p>
        </div>
      ))}
    </div>
  );
}
