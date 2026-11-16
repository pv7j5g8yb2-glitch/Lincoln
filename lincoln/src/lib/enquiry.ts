// The questions on the Get started form: enough to write a quote without a call.
export type Question = { id: string; label: string; options: string[]; multi?: boolean };

export const QUESTIONS: Question[] = [
  { id: "role", label: "Your role", options: ["Attorney", "Paralegal", "Office manager", "Other"] },
  { id: "seats", label: "People who would use Lincoln", options: ["1", "2 to 5", "6 to 20", "21 or more"] },
  { id: "types", label: "Case types", options: ["Family", "Employment", "Humanitarian", "Naturalization", "Removal defense", "Investor"], multi: true },
  { id: "volume", label: "New cases a month", options: ["Under 10", "10 to 50", "51 to 200", "Over 200"] },
  { id: "mail", label: "Firm email", options: ["Gmail", "Outlook", "Other"] },
  { id: "software", label: "Case software", options: ["Docketwise", "INSZoom", "eImmigration", "LollyLaw", "Clio", "Other", "None"] },
];
