// What search engines and AI tools are told about Lincoln. One place, so the site, the structured data, robots.txt,
// the sitemap and llms.txt always say the same true things. American English.

export const SITE = "https://uselincoln.com";
export const MAIN_HOST = "uselincoln.com";

export const NAME = "Lincoln";
/** The names people search for. Lincoln is always "Lincoln" on the site; these only help search engines match. */
export const ALSO = ["Lincoln AI", "Lincoln Legal AI"];
export const LINE = "Lincoln is the platform built to meet the standards of the United States' leading immigration firms.";
export const SUMMARY = "Lincoln is legal AI for US immigration law firms. It reads the firm's email and client files, opens and works each case, fills the forms, drafts petitions, support letters and RFE responses cited to the evidence and the law, collects documents from clients, keeps every deadline, and works inside Word and Google Docs. Nothing is filed or sent without an attorney's approval.";

/** Official profiles. Only ones that exist; add LinkedIn, Crunchbase and the rest as each one is created. */
export const PROFILES = ["https://instagram.com/lincoln.app"];

/** Public pages Google may list. Terms and Privacy join once the company's legal name and address are filled in. */
export const PUBLIC_PAGES = [{ path: "/", priority: 1 }, { path: "/start", priority: 0.6 }];

export const hostOf = (h: Headers) => (h.get("x-forwarded-host") ?? h.get("host") ?? "").split(",")[0].split(":")[0].trim().toLowerCase();
