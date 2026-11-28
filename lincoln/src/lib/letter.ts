import { HALASZ_LETTER, type Section } from "./halasz";

export type LetterContent = { sections: Section[]; facts: number; calls: number; notes: number; claimed: string[] };

/** Builds the support letter from the attorney's answers: a criterion is argued only if they said yes. */
export function buildHalaszLetter(answers: Record<string, string>): LetterContent {
  const sections = HALASZ_LETTER.filter((s) => !s.needs || answers[s.needs] === "yes");
  const claimed = sections.filter((s) => s.needs).map((s) => s.heading);
  let facts = 0, calls = 0, notes = 0;
  for (const s of sections) for (const p of s.paras) for (const g of p) {
    if (g.k === "fact") facts++;
    else if (g.k === "call") calls++;
    else if (g.k === "note") notes++;
  }
  return { sections, facts, calls, notes, claimed };
}
