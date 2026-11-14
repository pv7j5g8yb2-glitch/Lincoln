from docs1 import doc, DOCS
import random

random.seed(11)
SUR = ["Abe", "Bauer", "Costa", "Dubois", "Eriksen", "Fischer", "Garcia", "Hoffmann", "Ivanova", "Jensen",
       "Kowalski", "Lambert", "Moreau", "Nakamura", "Olsen", "Petrov", "Quinn", "Rossi", "Schmidt", "Tanaka",
       "Ueda", "Varga", "Wagner", "Xu", "Young", "Zhang", "Novak", "Silva", "Lee", "Park"]
JOUR = ["J Struct Inform", "Proteins Comput Methods", "Biophys J Comput", "J Chem Inf Model Res",
        "Cell Syst Biol", "Nucleic Acids Comput", "Bioinform Adv", "Mol Dyn Rev", "Drug Des Lett"]
TOP = ["cryptic pocket detection", "molecular dynamics sampling", "graph neural networks for proteins",
       "allosteric site prediction", "kinase inhibitor selectivity", "ensemble docking", "GPCR conformations",
       "protein language models", "free energy perturbation", "binding site druggability"]
def refs(n, start_year=2008, end_year=2024):
    out = []
    for i in range(1, n + 1):
        a = random.sample(SUR, 3)
        out.append(f"<li>{a[0]} {chr(65+i%26)}, {a[1]} {chr(66+i%25)}, {a[2]} {chr(67+i%24)}. Advances in {random.choice(TOP)}. "
                   f"<i>{random.choice(JOUR)}</i> {random.randint(3,40)}: {random.randint(10,900)}, {random.randint(start_year,end_year)}.</li>")
    return "<ol>" + "".join(out) + "</ol>"

LONG = """We trained the network in three stages. First, residue embeddings were pre trained on static structures
to predict local geometry. Second, the model was trained on trajectory frames to predict displacement
distributions for pocket lining residues. Third, it was fine tuned with a contrastive loss that rewards
sampling pocket shapes seen in long simulations but absent from crystal structures. Hyperparameters were
selected on a validation set of 240 proteins that shared less than 30 percent sequence identity with any
training protein. All results reported here are on a separate test set of 310 proteins."""
TABLE = "<table class='t'><tr><th>Method</th><th>Cryptic pockets recovered</th><th>Median run time</th></tr>" + \
        "".join(f"<tr><td>{m}</td><td>{r}</td><td>{t}</td></tr>" for m, r, t in
                [("FoldSight", "83%", "4.2 min"), ("PocketFlex", "41%", "38 min"), ("MDpocket short runs", "36%", "31 h"),
                 ("Static docking", "12%", "2 min")]) + "</table>"

# Expand the three papers with full text and reference lists (real papers are long).
for d in DOCS:
    if d["id"] == "30":
        d["html"] = d["html"].replace("<h2>3. Results</h2>", f"<p>{LONG}</p><p>{LONG}</p><h2>3. Results</h2>{TABLE}") + \
            f"<h2>4. Discussion</h2><p>{LONG}</p><p>{LONG}</p><h2>References</h2>{refs(68)}"
    if d["id"] == "31":
        d["html"] = d["html"].replace("<h2>Author contributions</h2>", f"<h2>Methods</h2><p>{LONG}</p><p>{LONG}</p><p>{LONG}</p><h2>Author contributions</h2>") + \
            f"<h2>References</h2>{refs(74)}"
    if d["id"] == "32":
        d["html"] = d["html"] + f"<h2>1. Introduction</h2><p>{LONG}</p><h2>2. Methods</h2><p>{LONG}</p><p>{LONG}</p>{TABLE}<h2>References</h2>{refs(52)}"

cit = "".join(f"<tr><td>{random.choice(SUR)} et al.</td><td>Applying FoldSight to {random.choice(TOP)}</td><td><i>{random.choice(JOUR)}</i></td><td>{random.randint(2022,2026)}</td></tr>" for _ in range(70))
doc("33", "List of articles citing the FoldSight paper (printout, first 70 of 612)", "digital", f"""
<h1>Cited by 612: "FoldSight: learning binding pocket flexibility from molecular dynamics"</h1>
<p class="small">Printed from a scholarly search engine, 1 November 2026. First 70 results.</p>
<table class="t"><tr><th>Authors</th><th>Title</th><th>Journal</th><th>Year</th></tr>{cit}</table>
""")

slides = [("Corvane Therapeutics", "Drugs fail because we model proteins as statues. We model them as they move."),
          ("The problem", "Around 90 percent of drug candidates that enter clinical trials fail. Many binding sites only exist when the protein moves."),
          ("Our platform", "FoldSight, developed by our structure prediction lead, predicts pocket motion in minutes. Open source core, proprietary pipeline on top."),
          ("Traction", "Two preclinical oncology programmes. Research collaboration with Northgate Pharma (2025). Over 100 team members."),
          ("Team", "CEO Laura Mendez (ex Northgate). CSO Andrew Kessler. Head of Research: Réka Halász."),
          ("Financing", "Raised USD 93M to date. Series B USD 60M led by Harborline Bio Ventures, May 2025.")]
doc("34", "Corvane investor presentation (September 2026, 6 slides)", "digital",
    "".join(f"<div style='page-break-after:always;border:2px solid #222;height:820px;padding:40px'><h1 style='font-size:34px'>{t}</h1><p style='font-size:22px'>{c}</p><p class='small'>Confidential. Corvane Therapeutics. September 2026.</p></div>" for t, c in slides))

doc("35", "Form W-2 for 2025 (copy)", "scan", """
<p><b>Form W-2 Wage and Tax Statement 2025</b> &nbsp; <span class="small">Copy B, to be filed with employee's federal tax return</span></p>
<table class="t">
<tr><td>a Employee's social security number</td><td>XXX-XX-4417</td></tr>
<tr><td>b Employer identification number</td><td>84-2219034</td></tr>
<tr><td>c Employer's name and address</td><td>Corvane Therapeutics, Inc., 400 Binney Street, Cambridge, MA 02142</td></tr>
<tr><td>e Employee's name</td><td>Reka Halasz</td></tr>
<tr><td>1 Wages, tips, other compensation</td><td>191,212.40</td></tr>
<tr><td>2 Federal income tax withheld</td><td>36,840.11</td></tr>
<tr><td>12a Code D (401(k) deferral)</td><td>23,500.00</td></tr>
</table>
<p class="small">Box 1 includes base salary and the 2024 annual bonus paid in March 2025.</p>
""")

doc("36", "Pay statement, October 2026", "digital", """
<h1>Corvane Therapeutics: Earnings Statement</h1>
<p>Employee: Reka Halasz &nbsp; Pay period: 1 to 31 October 2026 &nbsp; Pay date: 31 October 2026</p>
<table class="t"><tr><th>Earnings</th><th>Rate</th><th>Current</th><th>Year to date</th></tr>
<tr><td>Regular salary</td><td>185,000.00 / year</td><td>15,416.67</td><td>154,166.70</td></tr>
<tr><td>Bonus</td><td></td><td>0.00</td><td>17,250.00</td></tr></table>
""")

doc("37", "Second copy of the Delaney letter (phone scan sent by the client)", "scan", DOCS[[d["id"] for d in DOCS].index("25")]["html"])

# Full ESPI bylaws: append the remaining articles so the key Article 7 sits inside a longer document.
extra = "".join(f"<h3>Article {n}. {t}</h3><p>{n}.1 {txt}</p><p>{n}.2 The Council may make standing orders under this Article.</p>"
                for n, t, txt in [(10, "Council", "The Society is governed by a Council of twelve members elected by the Members for three years."),
                                   (11, "General Assembly", "A General Assembly of Members is held at least once in each calendar year."),
                                   (12, "Finance", "The financial year runs from 1 January to 31 December. Accounts are audited each year."),
                                   (13, "Prizes", "The Society may award prizes for outstanding work by early career researchers."),
                                   (14, "Ethics", "Members and Fellows must follow the Society's code of research conduct."),
                                   (15, "Amendments", "These Bylaws may be amended by a two thirds majority of the General Assembly.")])
for d in DOCS:
    if d["id"] == "17":
        d["html"] = d["html"] + extra
