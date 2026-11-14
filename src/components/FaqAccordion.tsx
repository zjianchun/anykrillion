import type { FaqItem } from "@/components/JsonLd";
import { ChevronDown } from "lucide-react";

export default function FaqAccordion({ faqs }: { faqs: FaqItem[] }) {
  return (
    <div className="space-y-3">
      {faqs.map((faq) => (
        <details
          key={faq.question}
          className="group rounded-xl border border-cyan-500/20 bg-[#06192d]/70 p-4 open:border-cyan-400/40 open:bg-[#08223d]/80"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-base font-bold text-white">
            <span>{faq.question}</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-cyan-300 transition group-open:rotate-180" />
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            {faq.answer}
          </p>
        </details>
      ))}
    </div>
  );
}
