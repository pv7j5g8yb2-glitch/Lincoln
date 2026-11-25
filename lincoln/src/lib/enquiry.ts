// The questions on the Get In Touch form: enough to write a quote without a call.
/** label: short, for the enquiry email. ask: the question as the form asks it, one per screen. */
export type Question = { id: string; label: string; ask: string; options: string[]; multi?: boolean };

export const QUESTIONS: Question[] = [
  { id: "role", label: "Your role", ask: "What is your role at the firm?", options: ["Attorney", "Paralegal", "Office manager", "Other"] },
  { id: "seats", label: "No. of users", ask: "How many people will use Lincoln?", options: ["1", "2 to 5", "6 to 20", "21 to 50", "51 to 100", "100+"] },
  // Broad enough that every US immigration practice finds its work here.
  {
    id: "types", label: "Case types", ask: "Which cases does the firm take?", multi: true, options: [
      "Family", "Employment visas", "Employment green cards", "Investor", "Students and exchange visitors",
      "Visitors and consular processing", "Asylum and refugees", "U, T, VAWA and SIJS", "DACA and TPS",
      "Naturalization and citizenship", "Waivers", "Removal defense", "Appeals and federal court", "Employer compliance", "Other",
    ],
  },
  { id: "volume", label: "New cases a month", ask: "How many new cases does the firm open a month?", options: ["Under 10", "10 to 50", "51 to 100", "101 to 200", "200+"] },
  { id: "mail", label: "Email provider", ask: "Which email does the firm use?", options: ["Google", "Microsoft", "Other"] },
  { id: "software", label: "Case software", ask: "Which case software does the firm use today?", options: ["Docketwise", "INSZoom", "eImmigration", "LollyLaw", "Clio", "Other", "None"] },
];

/** The order the form asks in: the easiest question first, the firm's work next, contact details last. */
export const FORM_ORDER = ["role", "types", "volume", "seats", "mail", "software"] as const;
