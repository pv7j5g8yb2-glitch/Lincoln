// Date rules worked out in code, not by the model: a wrong date is the error a firm never forgives.
// The model only reads the dates off the documents and tags what each one is; everything counted from
// them (days, limits, bars) is calculated here. Pure functions, so they can be tested without a model.

export type DateIn = { kind: string; date: string; source: string | null };
export type RuleIssue = { rule: string; severity: "high" | "medium"; title: string; detail: string; pages: number[] };

/** The kinds of date the reading tags. Anything else is "other" and no rule uses it. */
export const DATE_KINDS = ["passport_expires", "stay_ends", "period_ends", "h1b_first_start", "other"] as const;

const DAY = 86_400_000;
const at = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
const days = (from: string, to: string) => Math.round((at(to) - at(from)) / DAY);
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
/** 2027-03-02 reads as 2 March 2027. */
export const longDate = (iso: string) => `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;
const addYears = (iso: string, n: number) => `${Number(iso.slice(0, 4)) + n}${iso.slice(4)}`;
const addDays = (iso: string, n: number) => new Date(at(iso) + n * DAY).toISOString().slice(0, 10);
const pageOf = (source: string | null) => {
  const m = /\bp(?:age|p)?\.?\s*(\d+)/i.exec(source ?? "");
  return m ? [Number(m[1])] : [];
};
const valid = (d: DateIn) => /^\d{4}-\d{2}-\d{2}$/.test(d.date) && !Number.isNaN(at(d.date));

/** The newest date of a kind (a renewed passport replaces the old one) or the oldest, for a first start. */
function pick(dates: DateIn[], kind: string, which: "latest" | "earliest" = "latest") {
  const all = dates.filter((d) => d.kind === kind && valid(d)).sort((a, b) => a.date.localeCompare(b.date));
  return which === "latest" ? all[all.length - 1] : all[0];
}

export function dateRules(dates: DateIn[], today: string): RuleIssue[] {
  const out: RuleIssue[] = [];
  const passport = pick(dates, "passport_expires");
  const stay = pick(dates, "stay_ends");
  const end = pick(dates, "period_ends");
  const h1b = pick(dates, "h1b_first_start", "earliest");

  if (passport && passport.date < today) {
    out.push({ rule: "passport_expired", severity: "high", title: `Passport expired on ${longDate(passport.date)}`, detail: "A valid passport is needed for the filing and for any travel.", pages: pageOf(passport.source) });
  } else if (passport && end && end.date > passport.date) {
    out.push({ rule: "passport_before_period", severity: "medium", title: "Passport expires before the requested period ends", detail: `The passport expires on ${longDate(passport.date)}; the requested period ends on ${longDate(end.date)}. Admission may be limited to the passport's validity.`, pages: [...pageOf(passport.source), ...pageOf(end.source)] });
  }

  if (stay) {
    const n = days(stay.date, today);
    if (n > 0) {
      out.push({ rule: "stay_ended", severity: "high", title: `Authorised stay ended ${n} ${n === 1 ? "day" : "days"} ago`, detail: `The I-94 ended on ${longDate(stay.date)}. If no timely filing extended the stay, unlawful presence may have accrued since ${longDate(addDays(stay.date, 1))}: ${n} ${n === 1 ? "day" : "days"}. More than 180 days triggers the 3 year bar and a year or more the 10 year bar on departure (INA 212(a)(9)(B)).`, pages: pageOf(stay.source) });
    } else if (n >= -90) {
      const left = -n;
      out.push({ rule: "stay_ending", severity: left <= 30 ? "high" : "medium", title: left === 0 ? "Authorised stay ends today" : `Authorised stay ends in ${left} ${left === 1 ? "day" : "days"}`, detail: `The I-94 ends on ${longDate(stay.date)}. An extension or change of status is timely only if filed before then.`, pages: pageOf(stay.source) });
    }
  }

  if (h1b) {
    const limit = addYears(h1b.date, 6);
    if ((end && end.date > limit) || days(today, limit) <= 365) {
      out.push({ rule: "h1b_six_years", severity: "medium", title: `H-1B six year limit on ${longDate(limit)}`, detail: `Counted from the first H-1B start on ${longDate(h1b.date)}, before recapture of time spent outside the US. Time beyond six years needs recaptured days or an AC21 extension.`, pages: pageOf(h1b.source) });
    }
  }
  return out;
}
