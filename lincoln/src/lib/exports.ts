import type { ExportItem } from "@/components/ExportMenu";
import { connectionsOf } from "./integrations";

/** Export options for a thing, given which accounts the user has connected. */
export function exportItems(firmId: string, userId: string, what: "draft" | "cases" | "case" | "deck", id = ""): ExportItem[] {
  const has = new Set(connectionsOf(firmId, userId).map((c) => c.provider));
  const base = `/api/export?what=${what}${id ? `&id=${encodeURIComponent(id)}` : ""}`;
  const names = { draft: ["Word", "Google Docs", "docx"], cases: ["Excel", "Google Sheets", "xlsx"], case: ["Excel", "Google Sheets", "xlsx"], deck: ["PowerPoint", "Google Slides", "pptx"] }[what];
  const items: ExportItem[] = [];
  if (has.has("microsoft")) items.push({ label: `Open in ${names[0]}`, href: `${base}&to=microsoft`, hint: "Saved to OneDrive" });
  if (has.has("google")) items.push({ label: `Open in ${names[1]}`, href: `${base}&to=google`, hint: "Saved to Google Drive" });
  items.push({ label: `Download .${names[2]}`, href: `${base}&to=download` });
  return items;
}
