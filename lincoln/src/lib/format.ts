const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function longDate(iso: string) {
  const d = new Date(iso.length === 10 ? iso + "T12:00:00Z" : iso);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
export function shortDate(iso: string) {
  const d = new Date(iso.length === 10 ? iso + "T12:00:00Z" : iso);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()].slice(0, 3)}`;
}
export function today() {
  const d = new Date();
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}
export function daysUntil(isoDate: string) {
  const a = new Date(isoDate + "T12:00:00Z").getTime();
  const b = new Date(new Date().toISOString().slice(0, 10) + "T12:00:00Z").getTime();
  return Math.round((a - b) / 86400000);
}
export function inDays(isoDate: string) {
  const n = daysUntil(isoDate);
  if (n === 0) return "today";
  if (n === 1) return "tomorrow";
  if (n === -1) return "yesterday";
  if (n < 0 && n > -14) return `${-n} days ago`;
  if (n < 0 && n > -70) return `${Math.round(-n / 7)} weeks ago`;
  if (n < 0 && n > -730) return `${Math.round(-n / 30)} months ago`;
  if (n < 0) return `${Math.round(-n / 365)} years ago`;
  if (n < 14) return `in ${n} days`;
  if (n < 70) return `in ${Math.round(n / 7)} weeks`;
  return `in ${Math.round(n / 30)} months`;
}
export function ago(iso: string) {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  if (d === 1) return "yesterday";
  if (d < 14) return `${d} days ago`;
  return shortDate(iso);
}
export function hours(min: number) {
  if (min < 60) return `${min} min`;
  const h = min / 60;
  return `${h >= 10 ? Math.round(h) : Math.round(h * 10) / 10} h`;
}
export function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}
