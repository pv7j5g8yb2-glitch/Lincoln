# Renders the case documents to PDFs (digital or image-only "scans"), merges them into one client
# bundle, and writes the salary survey spreadsheet. Usage: python3 render.py <out_dir>
import sys, os, json, random, subprocess, io
sys.path.insert(0, os.path.dirname(__file__))
import docs1, docs2, docs3, docs4, docs5, docs6  # noqa: F401  (registers documents)
from docs1 import DOCS
from PIL import Image, ImageFilter, ImageOps
from pypdf import PdfWriter, PdfReader
import openpyxl

out = sys.argv[1]
os.makedirs(f"{out}/pdf", exist_ok=True)
CSS = """<style>body{font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.45;color:#111;margin:48px 56px}
h1{font-size:20px}h2{font-size:16px}h3{font-size:14px;margin-bottom:2px}.small{font-size:11px;color:#444}
.lh{font-size:11px;letter-spacing:1px;border-bottom:1px solid #999;padding-bottom:6px;color:#333}
.t{border-collapse:collapse;width:100%}.t td,.t th{border:1px solid #999;padding:5px 8px;text-align:left;vertical-align:top}
.mail .h{background:#f2f2f2;padding:8px;font-size:12px}.quote{border-left:3px solid #bbb;padding-left:12px;color:#333}
.passport{border:2px solid #333;border-radius:10px;padding:24px;width:620px}.mrz{font-family:monospace;font-size:14px;letter-spacing:1px}
</style>"""
jobs = []
for d in DOCS:
    html = f"<html><head><meta charset='utf-8'>{CSS}</head><body>{d['html']}</body></html>"
    p = f"{out}/html-{d['id']}.html"
    open(p, "w").write(html)
    jobs.append({"id": d["id"], "kind": d["kind"], "html": os.path.abspath(p),
                 "pdf": os.path.abspath(f"{out}/pdf/{d['id']}.pdf"), "png": os.path.abspath(f"{out}/scan-{d['id']}.png")})
json.dump(jobs, open(f"{out}/jobs.json", "w"))
js = """const {chromium}=require('playwright');const jobs=require(process.argv[2]);
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:816,height:1056},deviceScaleFactor:1.6});
for(const j of jobs){await p.goto('file://'+j.html);
 if(j.kind==='scan'){await p.screenshot({path:j.png,fullPage:true});}
 else{await p.pdf({path:j.pdf,format:'Letter',printBackground:true});}}
await b.close();})();"""
open(f"{out}/render.cjs", "w").write(js)
subprocess.run(["node", f"{out}/render.cjs", os.path.abspath(f"{out}/jobs.json")], check=True,
               cwd="/tmp/claude-0/-home-user-Hopkins/0152879b-b278-54ab-94e1-69742b31172b/scratchpad/run")
random.seed(7)
for j in jobs:
    if j["kind"] != "scan":
        continue
    im = Image.open(j["png"]).convert("L")
    im = im.rotate(random.uniform(-1.2, 1.2), expand=True, fillcolor=245)
    im = im.filter(ImageFilter.GaussianBlur(0.6))
    noise = Image.effect_noise(im.size, 18).convert("L")
    im = Image.blend(im, noise, 0.06)
    im = ImageOps.autocontrast(im, cutoff=1)
    im.convert("RGB").save(j["pdf"], "PDF", resolution=150)
w = PdfWriter()
index = []
page = 1
for d, j in zip(DOCS, jobs):
    r = PdfReader(j["pdf"])
    index.append((d["id"], d["title"], page, len(r.pages), d["kind"]))
    for pg in r.pages:
        w.add_page(pg)
    page += len(r.pages)
w.write(f"{out}/Halasz_client_documents.pdf")
json.dump(index, open(f"{out}/index.json", "w"), indent=1)
# Salary survey spreadsheet
wb = openpyxl.Workbook(); ws = wb.active; ws.title = "Boston 2026"
ws.append(["BioComp Pay Survey 2026: base salary, Greater Boston, biotechnology and pharmaceutical companies"])
ws.append(["Source: BioComp Analytics annual survey of 412 companies, data as of 1 April 2026. Excerpt licensed to Corvane Therapeutics."])
ws.append([])
ws.append(["Job title", "Number of incumbents", "25th percentile (USD)", "50th percentile (USD)", "75th percentile (USD)", "90th percentile (USD)"])
rows = [("Research Scientist", 3110, 118000, 132000, 148000, 165000),
        ("Senior Research Scientist", 2240, 158000, 172000, 205000, 240000),
        ("Principal Research Scientist", 980, 196000, 215000, 238000, 265000),
        ("Associate Director, Computational Biology", 410, 222000, 245000, 268000, 295000),
        ("Director, Computational Biology", 260, 255000, 281000, 310000, 345000)]
for r in rows:
    ws.append(list(r))
ws.append([]); ws.append(["Notes: base salary only, excluding bonus and equity."])
for col, wdt in zip("ABCDEF", [44, 20, 20, 20, 20, 20]):
    ws.column_dimensions[col].width = wdt
wb.save(f"{out}/Salary_survey_BioComp_2026.xlsx")
print("pages", page - 1)
for i in index:
    print(i)
