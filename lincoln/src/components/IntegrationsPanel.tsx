import clsx from "clsx";
import { btn } from "./ui";
import { disconnect, setTeamsChannel } from "@/lib/actions";
import { PROVIDERS, checkHealth, connectionsOf, settingsOf, teamsChannels } from "@/lib/integrations";
import { CircleAlert } from "lucide-react";
import type { User, Firm } from "@/lib/session";

/** Brand logos live in /public/logos. Shown at a fixed size inside a soft tile. */
export function Logo({ name, size = 28 }: { name: string; size?: number }) {
  const file = LOGO_FILE[name];
  return (
    <span className="flex shrink-0 items-center justify-center rounded-[9px] border border-line bg-card" style={{ width: size + 8, height: size + 8 }}>
      {file
        ? // eslint-disable-next-line @next/next/no-img-element
          <img src={`/logos/${file}`} alt="" width={Math.round(size * 0.8)} height={Math.round(size * 0.8)} className="object-contain" style={{ width: Math.round(size * 0.8), height: Math.round(size * 0.8) }} />
        : <span className="text-[12px] font-medium text-muted">{name[0]}</span>}
    </span>
  );
}

const LOGO_FILE: Record<string, string> = {
  Google: "google.svg", Gmail: "gmail.svg", Drive: "drive.svg", Docs: "docs.svg", Sheets: "sheets.svg", Slides: "slides.svg", Calendar: "calendar.svg",
  Microsoft: "microsoft.svg", Outlook: "outlook.svg", Word: "word.svg", Excel: "excel.svg", PowerPoint: "powerpoint.svg", OneDrive: "onedrive.svg", SharePoint: "sharepoint.svg", Teams: "teams.svg",
  "Word add-in": "word.svg", Dropbox: "dropbox.svg", Box: "box.svg", DocuSign: "docusign.svg", Slack: "slack.svg",
  Docketwise: "docketwise.png", LollyLaw: "lollylaw.png", INSZoom: "inszoom.png", eImmigration: "eimmigration.png", Clio: "clio.png", "Spreadsheet import": "excel.svg",
  "USCIS case status": "uscis.png", LawPay: "lawpay.png", QuickBooks: "quickbooks.svg", iManage: "imanage.png", NetDocuments: "netdocuments.png", Zapier: "zapier.svg",
};

const PLANNED: [string, [string, string][]][] = [
  ["Documents", [["Word add-in", "Lincoln inside Word"], ["Dropbox", "Files"], ["Box", "Files"], ["iManage", "Document management"], ["NetDocuments", "Document management"]]],
  ["Signatures and messaging", [["DocuSign", "Signatures"], ["Slack", "Notices"]]],
  ["Migration", [["Docketwise", "Cases and documents"], ["LollyLaw", "Cases and documents"], ["INSZoom", "Cases and documents"], ["eImmigration", "Cases and documents"], ["Clio", "Matters and documents"], ["Spreadsheet import", "Anything else"]]],
  ["Government and finance", [["USCIS case status", "Receipt status, through the official USCIS API"], ["LawPay", "Payments"], ["QuickBooks", "Accounts"], ["Zapier", "Other tools"]]],
];

export default async function IntegrationsPanel({ user, firm, connected, error, inbound, recheck }: { user: User; firm: Firm; connected?: string; error?: string; inbound?: string; recheck?: boolean }) {
  const conns = connectionsOf(firm.id, user.id);
  const health = Object.fromEntries(await Promise.all(conns.map(async (c) => [c.provider, await checkHealth(c, recheck || Boolean(connected))] as const)));
  const ms = conns.find((c) => c.provider === "microsoft");
  let channels: { teamId: string; channelId: string; name: string }[] = [];
  if (ms) { try { channels = await teamsChannels(ms); } catch { channels = []; } }
  const problem = error ? ({ google: "Google is not configured on this server.", microsoft: "Microsoft is not configured on this server.", state: "The sign in expired. Try again.", connect: "The sign in was not completed.", sample: "Not available in the sample workspace." } as Record<string, string>)[error] : null;

  return (
    <div>
      <section className="mb-10">
        <div className="grid gap-3 md:grid-cols-2">
          {PROVIDERS.map((p) => {
            const c = conns.find((x) => x.provider === p.id);
            return (
              <div key={p.id} className="rounded-2xl border border-line bg-card p-5">
                <div className="flex items-center gap-3">
                  <Logo name={p.name} size={26} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-medium">{p.name}</span>
                    {c && <span className="block truncate text-[12px] text-faint">{c.email}</span>}
                  </span>
                  {c ? (
                    <form action={disconnect}><input type="hidden" name="provider" value={p.id} /><button className={btn.ghost}>Disconnect</button></form>
                  ) : p.configured() ? (
                    <a href={`/api/connect/${p.id}`} className={clsx(btn.primary, "press")}>Connect</a>
                  ) : (
                    <span className="text-[12px] text-faint">Not configured</span>
                  )}
                </div>
                {c && health[p.id]?.some((h) => !h.ok) && (
                  <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line pt-3 text-[12.5px]">
                    <CircleAlert size={14} className="shrink-0 text-risk" />
                    <span className="min-w-0 flex-1 text-muted">{health[p.id].filter((h) => !h.ok).map((h) => h.service).join(", ")}</span>
                    <a href={`/api/connect/${p.id}`} className="font-medium text-ink underline underline-offset-4">Reconnect</a>
                  </div>
                )}
                {!c && <div className="mt-4 flex flex-wrap gap-2">
                  {p.services.map((s) => (
                    <span key={s} className={clsx("flex items-center gap-1.5 rounded-full border px-2 py-1 text-[12px]", c ? "border-line text-ink" : "border-line text-muted")}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/logos/${LOGO_FILE[s]}`} alt="" width={14} height={14} className="h-[14px] w-[14px] object-contain" />{s}
                    </span>
                  ))}
                </div>}
                {c?.last_error && <p className="mt-3 text-[12px] text-risk">{c.last_error}</p>}
                {c && p.id === "microsoft" && (
                  <form action={setTeamsChannel} className="mt-4 flex items-center gap-2">
                    <select name="channel" defaultValue={settingsOf(c).teams ? `${settingsOf(c).teams!.teamId}|${settingsOf(c).teams!.channelId}|${settingsOf(c).teams!.name}` : ""} className="h-8 min-w-0 flex-1 rounded-lg border border-line bg-card px-2 text-[12.5px] outline-none focus:border-ink">
                      <option value="">Teams off</option>
                      {channels.map((ch) => <option key={ch.channelId} value={`${ch.teamId}|${ch.channelId}|${ch.name}`}>{ch.name}</option>)}
                    </select>
                    <button className={btn.secondary}>Save</button>
                  </form>
                )}
              </div>
            );
          })}
        </div>
        {problem && <p className="mt-3 text-[13px] text-risk">{problem}</p>}
      </section>

      <section>
        <h2 className="mb-1 text-[13px] font-medium">Planned</h2>
        <div className="grid border-t border-line sm:grid-cols-2 sm:gap-x-10">
          {PLANNED.flatMap(([, items]) => items).map(([name]) => (
            <div key={name} className="flex items-center gap-3 border-b border-line py-2.5">
              <Logo name={name} size={22} />
              <span className="text-[13px]">{name}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
