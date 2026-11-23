// The questions on the Get In Touch form: enough to write a quote without a call.
export type Question = { id: string; label: string; options: string[]; multi?: boolean };

export const QUESTIONS: Question[] = [
  { id: "role", label: "Your role", options: ["Attorney", "Paralegal", "Office manager", "Other"] },
  { id: "seats", label: "No. of users", options: ["1", "2 to 5", "6 to 20", "21 to 50", "51 to 100", "100+"] },
  // Broad enough that every US immigration practice finds its work here.
  {
    id: "types", label: "Case types", multi: true, options: [
      "Family", "Employment visas", "Employment green cards", "Investor", "Students and exchange visitors",
      "Visitors and consular processing", "Asylum and refugees", "U, T, VAWA and SIJS", "DACA and TPS",
      "Naturalization and citizenship", "Waivers", "Removal defense", "Appeals and federal court", "Employer compliance", "Other",
    ],
  },
  { id: "volume", label: "New cases a month", options: ["Under 10", "10 to 50", "51 to 100", "101 to 200", "200+"] },
  { id: "mail", label: "Email provider", options: ["Google", "Microsoft", "Other"] },
  { id: "software", label: "Case software", options: ["Docketwise", "INSZoom", "eImmigration", "LollyLaw", "Clio", "Other", "None"] },
];
