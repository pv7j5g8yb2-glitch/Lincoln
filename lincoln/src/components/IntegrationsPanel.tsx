import clsx from "clsx";
import { btn } from "./ui";
import { disconnect, requestIntegration, setChatSpace, setTeamsChannel } from "@/lib/actions";
import { kv } from "@/lib/queries";
import { PROVIDERS, canReadChat, canReadTeams, chatSpaces, connectionsOf, settingsOf, teamsChannels } from "@/lib/integrations";
import type { User, Firm } from "@/lib/session";
import WordConnect from "./WordConnect";
import { ConfirmButton } from "./Confirm";
import { wordConnected } from "@/lib/word";

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
  Clio: "clio.png", LawPay: "lawpay.png", QuickBooks: "quickbooks.svg", Zapier: "zapier.svg",
};

// Only services a firm can connect without Lincoln needing a partnership or the company's permission.
const PLANNED: [string, [string, string][]][] = [
  ["Documents", [["Dropbox", "Files"], ["Box", "Files"]]],
  ["Signatures and messaging", [["DocuSign", "Signatures"], ["Slack", "Notices"]]],
  ["Practice management", [["Clio", "Matters and documents"]]],
  ["Finance and other tools", [["LawPay", "Payments"], ["QuickBooks", "Accounts"], ["Zapier", "Other tools"]]],
];

export default async function IntegrationsPanel({ user, firm, connected, error, inbound, recheck }: { user: User; firm: Firm; connected?: string; error?: string; inbound?: string; recheck?: boolean }) {
  const conns = connectionsOf(firm.id, user.id);
  const ms = conns.find((c) => c.provider === "microsoft");
  let channels: { teamId: string; channelId: string; name: string }[] = [];
  if (ms) { try { channels = await teamsChannels(ms); } catch { channels = []; } }
  const gc = conns.find((c) => c.provider === "google" && canReadChat(c));
  let spaces: { space: string; name: string }[] = [];
  if (gc) { try { spaces = await chatSpaces(gc); } catch { spaces = []; } }
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
                    <form action={disconnect}><input type="hidden" name="provider" value={p.id} /><ConfirmButton className={btn.ghost}>Disconnect</ConfirmButton></form>
                  ) : p.configured() ? (
                    <a href={`/api/connect/${p.id}`} className={clsx(btn.primary, "press")}>Connect</a>
                  ) : (
                    <span className="text-[12px] text-faint">Not configured</span>
                  )}
                </div>
                <div className={clsx("mt-4 gap-2", p.services.length === 6 ? "grid w-fit grid-cols-3" : "flex flex-wrap")}>
                  {p.services.map((s) => (
                    <span key={s} className={clsx("flex items-center gap-1.5 rounded-full border px-2 py-1 text-[12px]", c ? "border-line text-ink" : "border-line text-muted")}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/logos/${LOGO_FILE[s]}`} alt="" width={14} height={14} className="h-[14px] w-[14px] object-contain" />{s}
                    </span>
                  ))}
                </div>
                {c && p.id === "microsoft" && channels.length > 0 && (
                  <form action={setTeamsChannel} className="mt-4 flex items-center gap-2">
                    <select name="channel" defaultValue={settingsOf(c).teams ? `${settingsOf(c).teams!.teamId}|${settingsOf(c).teams!.channelId}|${settingsOf(c).teams!.name}` : ""} className="h-8 min-w-0 flex-1 rounded-lg border border-line bg-card px-2 text-[12.5px] outline-none focus:border-ink">
                      <option value="">Teams off</option>
                      {channels.map((ch) => <option key={ch.channelId} value={`${ch.teamId}|${ch.channelId}|${ch.name}`}>{ch.name}</option>)}
                    </select>
                    <button className={btn.secondary}>Save</button>
                  </form>
                )}
                {c && p.id === "google" && (canReadChat(c) ? (
                  <form action={setChatSpace} className="mt-4 flex items-center gap-2">
                    <select name="space" defaultValue={settingsOf(c).gchat ? `${settingsOf(c).gchat!.space}|${settingsOf(c).gchat!.name}` : ""} className="h-8 min-w-0 flex-1 rounded-lg border border-line bg-card px-2 text-[12.5px] outline-none focus:border-ink">
                      <option value="">Google Chat off</option>
                      {spaces.map((x) => <option key={x.space} value={`${x.space}|${x.name}`}>{x.name}</option>)}
                    </select>
                    <button className={btn.secondary}>Save</button>
                  </form>
                ) : (
                  <a href="/api/connect/google?chat=1" className="mt-3 inline-block text-[12.5px] text-muted underline-offset-2 transition hover:text-ink hover:underline">Add Google Chat</a>
                ))}
                {c && p.id === "microsoft" && channels.length > 0 && settingsOf(c).teams && !canReadTeams(c) && (
                  <a href="/api/connect/microsoft?teams=1" className="mt-2 inline-block text-[12.5px] text-muted underline-offset-2 transition hover:text-ink hover:underline">Take requests from this channel</a>
                )}
              </div>
            );
          })}
          <div className="rounded-2xl border border-line bg-card p-5">
            <div className="mb-4 flex items-center gap-3"><Logo name="Word" size={26} /><span className="text-[14px] font-medium">Word add-in</span></div>
            <WordConnect connected={Boolean(wordConnected(user.id))} />
          </div>
          <div className="rounded-2xl border border-line bg-card p-5">
            <div className="mb-4 flex items-center gap-3"><Logo name="Outlook" size={26} /><span className="text-[14px] font-medium">Outlook add-in</span></div>
            <WordConnect app="outlook" connected={Boolean(wordConnected(user.id, "outlook"))} />
          </div>
        </div>
        {problem && <p className="mt-3 text-[13px] text-risk">{problem}</p>}
      </section>

      <section>
        <h2 className="mb-1 text-[13px] font-medium">Others</h2>
        <div className="grid border-t border-line sm:grid-cols-2 sm:gap-x-10">
          {PLANNED.flatMap(([, items]) => items).map(([name]) => (
            <div key={name} className="flex items-center gap-3 border-b border-line py-2">
              <Logo name={name} size={22} />
              <span className="flex-1 text-[13px]">{name}</span>
              {kv(firm.id, `wants:${name}`)
                ? <span className="px-3 text-[12px] text-faint">Requested</span>
                : <form action={requestIntegration}><input type="hidden" name="name" value={name} /><button className={btn.secondary}>Connect</button></form>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
