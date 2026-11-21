import Link from "next/link";
import { Fragment, type ReactNode } from "react";

// Renders the Markdown of a chat reply as React elements: paragraphs, headings, bold, italics, inline code,
// numbered and bulleted lists (one level of nesting), tables, quotes, rules and code blocks. Raw HTML is
// never interpreted, so a reply cannot inject anything into the page. Case links open the case, and in a
// case's chat "(p. 12)" opens that page of the client file.

type Block =
  | { t: "h"; level: number; text: string }
  | { t: "p"; lines: string[] }
  | { t: "list"; ordered: boolean; start: number; items: { text: string; sub: { ordered: boolean; items: string[] } | null }[] }
  | { t: "table"; head: string[]; rows: string[][] }
  | { t: "quote"; lines: string[] }
  | { t: "code"; text: string }
  | { t: "hr" };

const BULLET = /^(\s*)([-*•+])\s+(.*)$/;
const NUMBER = /^(\s*)(\d+)[.)]\s+(.*)$/;
const cells = (l: string) => l.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());

function parse(src: string): Block[] {
  const lines = src.replace(/\r\n?/g, "\n").split("\n");
  const out: Block[] = [];
  for (let i = 0; i < lines.length; ) {
    const l = lines[i];
    if (!l.trim()) { i++; continue; }
    if (/^```/.test(l.trim())) {
      const body: string[] = [];
      for (i++; i < lines.length && !/^```/.test(lines[i].trim()); i++) body.push(lines[i]);
      i++;
      out.push({ t: "code", text: body.join("\n") });
      continue;
    }
    const h = /^(#{1,6})\s+(.*)$/.exec(l.trim());
    if (h) { out.push({ t: "h", level: h[1].length, text: h[2].replace(/#+$/, "").trim() }); i++; continue; }
    if (/^(\*\s*){3,}$|^(-\s*){3,}$|^(_\s*){3,}$/.test(l.trim())) { out.push({ t: "hr" }); i++; continue; }
    if (l.trim().startsWith("|") && i + 1 < lines.length && /^\s*\|?\s*:?-{2,}/.test(lines[i + 1])) {
      const head = cells(l);
      const rows: string[][] = [];
      for (i += 2; i < lines.length && lines[i].trim().startsWith("|"); i++) rows.push(cells(lines[i]));
      out.push({ t: "table", head, rows });
      continue;
    }
    if (/^\s*>/.test(l)) {
      const q: string[] = [];
      for (; i < lines.length && /^\s*>/.test(lines[i]); i++) q.push(lines[i].replace(/^\s*>\s?/, ""));
      out.push({ t: "quote", lines: q });
      continue;
    }
    const first = BULLET.exec(l) ?? NUMBER.exec(l);
    if (first) {
      const ordered = !BULLET.test(l);
      const base = first[1].length;
      const items: { text: string; sub: { ordered: boolean; items: string[] } | null }[] = [];
      for (; i < lines.length; i++) {
        const x = lines[i];
        if (!x.trim()) {
          // A blank line ends the list unless the list carries on after it.
          const next = lines[i + 1] ?? "";
          if (BULLET.test(next) || NUMBER.test(next)) continue;
          break;
        }
        const m = BULLET.exec(x) ?? NUMBER.exec(x);
        if (m && m[1].length > base && items.length) {
          const last = items[items.length - 1];
          last.sub ??= { ordered: !BULLET.test(x), items: [] };
          last.sub.items.push(m[3]);
        } else if (m) items.push({ text: m[3], sub: null });
        else if (items.length && /^\s+\S/.test(x)) items[items.length - 1].text += " " + x.trim();
        else break;
      }
      out.push({ t: "list", ordered, start: ordered ? Number(first[2]) : 1, items });
      continue;
    }
    const para: string[] = [];
    for (; i < lines.length && lines[i].trim() && !BULLET.test(lines[i]) && !NUMBER.test(lines[i]) && !/^#{1,6}\s/.test(lines[i].trim()) && !/^```/.test(lines[i].trim()) && !/^\s*>/.test(lines[i]) && !(lines[i].trim().startsWith("|") && /^\s*\|?\s*:?-{2,}/.test(lines[i + 1] ?? "")); i++) para.push(lines[i]);
    out.push({ t: "p", lines: para });
  }
  return out;
}

const INLINE = /(`[^`\n]+`|\*\*[^*\n]+?\*\*|__[^_\n]+?__|\*[^*\s][^*\n]*?\*|(?<![\w])_[^_\s][^_\n]*?_(?![\w])|\[[^\]\n]+\]\([^)\s]+\)|\/cases\/[\w?=&-]+|\(pp?\. ?\d+[^)]*\))/g;

function Inline({ text, caseId }: { text: string; caseId?: string }) {
  const parts = text.split(INLINE);
  return (
    <>
      {parts.map((p, i): ReactNode => {
        if (!(i % 2)) return <Fragment key={i}>{p}</Fragment>;
        if (p.startsWith("`")) return <code key={i} className="rounded-[5px] bg-panel px-[5px] py-[1px] font-mono text-[0.88em]">{p.slice(1, -1)}</code>;
        if (p.startsWith("**") || p.startsWith("__")) return <strong key={i} className="font-semibold"><Inline text={p.slice(2, -2)} caseId={caseId} /></strong>;
        if (p.startsWith("*") || p.startsWith("_")) return <em key={i}><Inline text={p.slice(1, -1)} caseId={caseId} /></em>;
        if (p.startsWith("[")) {
          const m = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(p)!;
          const href = m[2];
          if (href.startsWith("/")) return <Link key={i} href={href} className="underline decoration-edge underline-offset-4 hover:decoration-ink">{m[1]}</Link>;
          if (/^https?:\/\//.test(href)) return <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="underline decoration-edge underline-offset-4 hover:decoration-ink">{m[1]}</a>;
          return <Fragment key={i}>{m[1]}</Fragment>;
        }
        if (p.startsWith("/cases/")) return <Link key={i} href={p} className="underline decoration-edge underline-offset-4 hover:decoration-ink">Open the case</Link>;
        const page = /\d+/.exec(p)?.[0];
        return caseId && page
          ? <a key={i} href={`/api/pages/${caseId}/${page}`} target="_blank" className="whitespace-nowrap text-[0.88em] text-muted underline decoration-dotted underline-offset-4 hover:text-ink">{p}</a>
          : <Fragment key={i}>{p}</Fragment>;
      })}
    </>
  );
}

export default function Markdown({ text, caseId }: { text: string; caseId?: string }) {
  return (
    <div className="md">
      {parse(text).map((b, i) => {
        switch (b.t) {
          case "h":
            return b.level <= 2
              ? <h3 key={i} className="mb-2 mt-6 text-[1.18em] font-semibold leading-snug first:mt-0"><Inline text={b.text} caseId={caseId} /></h3>
              : <h4 key={i} className="mb-1.5 mt-5 text-[1.05em] font-semibold leading-snug first:mt-0"><Inline text={b.text} caseId={caseId} /></h4>;
          case "p":
            return <p key={i} className="mb-4 last:mb-0">{b.lines.map((l, k) => <Fragment key={k}>{k > 0 && <br />}<Inline text={l} caseId={caseId} /></Fragment>)}</p>;
          case "list": {
            const Tag = b.ordered ? "ol" : "ul";
            return (
              <Tag key={i} start={b.ordered ? b.start : undefined} className={`mb-4 flex flex-col gap-2 pl-6 last:mb-0 ${b.ordered ? "list-decimal marker:font-medium marker:text-ink" : "list-disc marker:text-muted"}`}>
                {b.items.map((it, k) => (
                  <li key={k} className="pl-1.5">
                    <Inline text={it.text} caseId={caseId} />
                    {it.sub && (
                      <ul className={`mt-2 flex flex-col gap-1.5 pl-5 ${it.sub.ordered ? "list-decimal" : "list-[circle] marker:text-muted"}`}>
                        {it.sub.items.map((s, j) => <li key={j} className="pl-1"><Inline text={s} caseId={caseId} /></li>)}
                      </ul>
                    )}
                  </li>
                ))}
              </Tag>
            );
          }
          case "table":
            return (
              <div key={i} className="mb-4 overflow-x-auto rounded-xl border border-line last:mb-0">
                <table className="w-full border-collapse text-[0.92em]">
                  <thead><tr className="bg-panel/60">{b.head.map((h, k) => <th key={k} className="whitespace-nowrap border-b border-line px-3.5 py-2.5 text-left font-semibold"><Inline text={h} caseId={caseId} /></th>)}</tr></thead>
                  <tbody>{b.rows.map((r, k) => <tr key={k} className="border-b border-line last:border-0">{b.head.map((_, j) => <td key={j} className="px-3.5 py-2.5 align-top"><Inline text={r[j] ?? ""} caseId={caseId} /></td>)}</tr>)}</tbody>
                </table>
              </div>
            );
          case "quote":
            return <blockquote key={i} className="mb-4 border-l-2 border-edge pl-4 text-muted last:mb-0">{b.lines.map((l, k) => <Fragment key={k}>{k > 0 && <br />}<Inline text={l} caseId={caseId} /></Fragment>)}</blockquote>;
          case "code":
            return <pre key={i} className="mb-4 overflow-x-auto rounded-xl bg-panel px-4 py-3 font-mono text-[0.86em] leading-relaxed last:mb-0">{b.text}</pre>;
          case "hr":
            return <hr key={i} className="my-5 border-line" />;
        }
      })}
    </div>
  );
}
