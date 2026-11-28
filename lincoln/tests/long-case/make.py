# A long, made up O-1A case file for comparing models. Every person, company, journal and number here is
# invented. Mistakes are planted on purpose; the answer key is in KEY.md next to this file.
import sys, os
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(os.path.abspath(__file__))
W, H = letter

def page(c, title, lines, header=None, small=False, box=False):
    y = H - 0.9 * inch
    if header:
        c.setFont("Helvetica", 8.5); c.drawString(0.8 * inch, H - 0.5 * inch, header)
    c.setFont("Helvetica-Bold", 13); c.drawString(0.8 * inch, y, title); y -= 0.35 * inch
    if box:
        c.rect(0.7 * inch, 1.2 * inch, W - 1.4 * inch, y - 1.0 * inch)
    size = 9.5 if small else 10.5
    c.setFont("Helvetica", size)
    for ln in lines:
        if ln.startswith("## "):
            y -= 4; c.setFont("Helvetica-Bold", size + 0.5); c.drawString(0.8 * inch, y, ln[3:]); c.setFont("Helvetica", size); y -= size * 1.6; continue
        words, cur = ln.split(" "), ""
        for w in words:
            t = (cur + " " + w).strip()
            if c.stringWidth(t, "Helvetica", size) > W - 1.7 * inch:
                c.drawString(0.85 * inch, y, cur); y -= size * 1.45; cur = w
            else:
                cur = t
        c.drawString(0.85 * inch, y, cur); y -= size * 1.45
        if not ln: y -= size * 0.4
        if y < 0.9 * inch:
            c.showPage(); y = H - 0.9 * inch; c.setFont("Helvetica", size)
    c.showPage()

def doc(name, pages):
    c = canvas.Canvas(os.path.join(OUT, name), pagesize=letter)
    for p in pages: page(c, *p[:2], **(p[2] if len(p) > 2 else {}))
    c.save()

# 1. Identity and status (6 pages)
doc("1_identity_and_status.pdf", [
    ("PASSPORT / PASSEPORT  REPUBLIC OF TUNISIA", [
        "Type: P    Country code: TUN    Passport No.: T0849213", "",
        "Surname: HADDOU", "Given names: AMIRA", "Nationality: TUNISIAN", "Date of birth: 17 APR 1990",
        "Sex: F", "Place of birth: SFAX", "Date of issue: 03 MAR 2017", "Date of expiry: 02 MAR 2027",
        "Authority: MINISTRY OF INTERIOR", "",
        "P<TUNHADDOU<<AMIRA<<<<<<<<<<<<<<<<<<<<<<<<<<<", "T0849213<1TUN9004175F2703022<<<<<<<<<<<<<<04"], {"box": True}),
    ("Most Recent I-94  U.S. Customs and Border Protection", [
        "Admission (I-94) Record Number: 349812775A3", "Most Recent Date of Entry: 2024/01/09",
        "Class of Admission: H1B", "Admit Until Date: 09/30/2026", "",
        "Details provided on the I-94 information form:", "Last/Surname: HADDOU", "First (Given) Name: AMIRA",
        "Birth Date: 1990 July 04", "Passport Number: T0849213", "Country of Issuance: Tunisia", "",
        "Effective April 30, 2013, DHS began automating the admission process."], {"box": True}),
    ("Certificate of Eligibility for Exchange Visitor (J-1) Status  Form DS-2019", [
        "Surname: HADDOU   First: AMIRA   Date of birth: 04/17/1990", "Program sponsor: Lakeshore Institute of Technology, Exchange Visitor Program P-3-55120",
        "Category: Research Scholar", "Form covers period: from 02/01/2014 to 01/31/2016",
        "Funding: U.S. Government Agency, National Science Exchange Fund, $48,000", "",
        "Preliminary endorsement of consular or immigration officer:",
        "Exchange visitor is subject to the two-year residence requirement based on: Government financing; Exchange Visitor Skills List.",
        "Officer: M. Tran   Date: 01/09/2014   Post: Tunis"], {"box": True}),
    ("Form I-797A, Notice of Action  APPROVAL NOTICE", [
        "Receipt Number: EAC2390112345   Case Type: I-129, Petition for a Nonimmigrant Worker",
        "Petitioner: NORDLICHT LABS INC   Beneficiary: HADDOU, AMIRA", "Class: H1B   Valid from 10/01/2023 to 09/30/2026",
        "Notice Date: 08/22/2023", "",
        "The above petition and change of status have been approved. The beneficiary is granted the new class of admission shown above.",
        "", "I-94 Number: 349812775A3   Name: AMIRA HADDOU   Valid 10/01/2023 to 09/30/2026"], {"box": True}),
    ("Prior U.S. visa  (copy of foil)", [
        "UNITED STATES OF AMERICA  VISA", "Issuing post: TUNIS   Control number: 20230931440001",
        "Surname: HADDOU   Given name: AMIRA   Passport: T0849213", "Visa type/class: R  H1B   Entries: M",
        "Issue date: 12NOV2023   Expiration date: 30SEP2026   Annotation: PET NORDLICHT LABS INC"], {"box": True}),
    ("PASSPORT  KINGDOM OF SPAIN", [
        "Type: P   Code: ESP   Passport No.: PAF771204", "", "Surname: REYES GARRIDO", "Given names: TOMAS", "Nationality: SPANISH",
        "Date of birth: 22 SEP 1987", "Place of birth: VALENCIA", "Date of issue: 14 JUN 2020", "Date of expiry: 13 JUN 2030"], {"box": True}),
    ("PASSPORT / PASSEPORT  REPUBLIC OF TUNISIA  (second copy, sent again by the client)", [
        "Passport No.: T0849213   Surname: HADDOU   Given names: AMIRA", "Date of birth: 17 APR 1990   Date of expiry: 02 MAR 2027"], {"box": True}),
    ("Client questionnaire  (completed by the beneficiary)", [
        "Full legal name: Amira Haddou     Other names used: none", "Date of birth: 04/17/1990     Country of birth: Tunisia",
        "Current immigration status: H-1B     Status expires: 09/30/2026", "Have you ever violated the terms of your status or worked without authorization? No",
        "Have you ever been subject to the two year home residence requirement? I do not think so",
        "Prior US visits: J-1 2014 to 2016 (Chicago); H-1B since 2023 (consular processing in Tunis, November 2023)",
        "Address abroad: 12 Rue Habib Bourguiba, Sfax 3000, Tunisia", "Marital status: single     Children: none",
        "Have you ever been arrested or cited? No", "Signature: A. Haddou   Date: 10/27/2026"]),
    ("Client note to the firm (typed by the client)", [
        "Hello, a few things for my file:", "",
        "- My H-1B with Nordlicht ends 30 September. HR told me the O-1 would be filed before then but it has not been yet. I am still in Boston working remotely for now.",
        "- I did the J-1 in Chicago from 2014 to 2016. I never needed a waiver for anything, the H-1B was approved without problems.",
        "- My home address: 41 Linden Street, Apt 3B, Cambridge, MA 02139. Phone (617) 555-0142. Email amira.haddou@examplemail.com",
        "- I was born in Sfax, Tunisia. Not married, no children.", "", "Amira"]),
])

# 2. CV, degrees and citation record (8 pages)
doc("2_cv_degrees_citations.pdf", [
    ("Dr. Amira Hadou  Curriculum Vitae", [
        "Cambridge, MA   amira.haddou@examplemail.com", "",
        "## Positions",
        "Senior Research Scientist, Nordlicht Labs Inc., Boston, MA  2019 to present",
        "Research Scholar (J-1), Lakeshore Institute of Technology, Chicago, IL  2014 to 2016",
        "Postdoctoral Researcher, Institut de Vision Numerique, Tunis  2016 to 2019",
        "## Education",
        "PhD, Computational Imaging, Universite du Littoral Sud, 2016", "MSc, Electrical Engineering, Sfax Polytechnic School, 2012",
        "## Summary",
        "Leading researcher in low light computational imaging. 24 peer reviewed publications cited over 2,000 times. Inventor on 2 U.S. patents. Recipient of the ISCI Young Investigator Award and a national innovation award.",
    ], {"header": "CV page 1 of 3"}),
    ("Curriculum Vitae  (continued)", [
        "## Selected publications",
        "1. Haddou A., Reyes T. Photon limited denoising with learned priors. Journal of Computational Imaging, 2021.",
        "2. Haddou A. et al. Event camera fusion for night navigation. Proceedings of ICVI, 2022.",
        "3. Haddou A., Lindqvist M. Sparse sensing for medical endoscopy. Journal of Computational Imaging, 2023.",
        "4. Haddou A. Quanta burst photography at scale. Optical Systems Letters, 2024.",
        "## Patents",
        "US 11,904,218  Method for low light image reconstruction (2024), assigned to Nordlicht Labs Inc.",
        "US 12,055,731  Event driven exposure control (2025), assigned to Nordlicht Labs Inc.",
        "## Peer review and judging",
        "Reviewer, Journal of Computational Imaging (2021 to present), 31 manuscripts",
        "Judge, Massachusetts Regional High School Science Fair, 2023",
        "## Memberships", "Senior Member, International Society for Computational Imaging (ISCI)",
    ], {"header": "CV page 2 of 3"}),
    ("Curriculum Vitae  (continued)", [
        "## Invited talks", "Keynote, ICVI Workshop on Night Vision, 2024", "Invited speaker, Nordic Imaging Summit, 2023",
        "## Media", "Profiled in Boston Tech Review (2024) and Muenchner Technikzeitung (2023).",
        "## Languages", "Arabic, French, English, German (working knowledge)",
    ], {"header": "CV page 3 of 3"}),
    ("Diplome de Doctorat  (original in French)", [
        "UNIVERSITE DU LITTORAL SUD", "Le President de l'Universite certifie que", "Madame Amira HADDOU, nee le 17 avril 1990 a Sfax,",
        "a obtenu le grade de DOCTEUR en Imagerie Computationnelle", "avec la mention Tres Honorable, le 14 juin 2016."], {"box": True}),
    ("Certified English translation of the doctoral diploma", [
        "UNIVERSITY OF THE SOUTHERN COAST", "The President of the University certifies that", "Ms. Amira HADDOU, born 17 April 1990 in Sfax,",
        "obtained the degree of DOCTOR in Computational Imaging", "with the distinction Very Honorable, on 14 June 2016.", "",
        "I certify that I am competent to translate from French into English and that this translation is complete and accurate.",
        "Translator: Claire Benali   Date: 03/02/2024"]),
    ("Master's diploma  (original, Arabic)", [
        "[Arabic text: Sfax Polytechnic School, Master of Engineering diploma, Amira Haddou, 2012]",
        "No translation attached."], {"box": True}),
    ("Citation profile (printed from scholar index, 10/28/2026)", [
        "Amira Haddou  Nordlicht Labs  computational imaging", "", "                All      Since 2021",
        "Citations      1,214    988", "h-index        14       12", "i10-index      19       15", "",
        "Most cited: Photon limited denoising with learned priors (2021)  412 citations",
        "Event camera fusion for night navigation (2022)  233 citations"]),
    ("Publication list as maintained by Nordlicht Labs HR", [
        "Total peer reviewed publications: 21", "Total citations reported to HR (Q3 2026): 1,198", "Source: internal research tracker"]),
])

# 3. Evidence: awards, press, judging, membership, contributions (20 pages)
ev = []
ev.append(("International Society for Computational Imaging  Young Investigator Award", [
    "The ISCI Board of Directors presents the 2023 Young Investigator Award to", "Dr. Amira Haddou", "Nordlicht Labs Inc., Boston",
    "for contributions to photon limited imaging.", "", "Presented at the ISCI Annual Congress, Lisbon, 18 October 2023."], {"box": True}))
ev.append(("About the ISCI Young Investigator Award", [
    "The Young Investigator Award is ISCI's highest honor for researchers within ten years of their doctorate.",
    "In 2023 the committee reviewed 412 nominations from 38 countries and selected three recipients.",
    "Selection committee: seven senior members chosen by the Board. Criteria: originality, impact, independence.",
    "ISCI has 9,800 members worldwide."]))
ev.append(("Nordlicht Labs  Employee Innovation Award 2022", [
    "Presented to Amira Haddou, Imaging Group", "In recognition of the quarterly innovation challenge, Q2 2022.",
    "This internal award is open to all Nordlicht employees. Prize: $500 and a team dinner."], {"box": True}))
ev.append(("Boston Tech Review  'Seeing in the dark'", [
    "March 4, 2024", "",
    "When Amina Haddou joined Nordlicht Labs, night time imaging was still a niche. Her team's denoising method now runs in more than two million consumer devices, according to the company.",
    "Haddou, who trained in Tunisia and Chicago, says the key was treating every photon as data.",
    "The method was licensed to two camera makers in 2024.",
    "Boston Tech Review is a regional technology magazine with a monthly circulation of about 45,000."]))
ev.append(("Boston Tech Review  (continued)", [
    "Industry analysts credit the approach with cutting low light noise by roughly half.",
    "Haddou is now leading work on event cameras for autonomous navigation.", "", "Author: Kevin Marsh, staff writer"]))
ev.append(("Muenchner Technikzeitung  (original, German)", [
    "Nachtsicht aus Boston: Die Forscherin Amira Haddou und ihr Team bei Nordlicht Labs entwickeln Verfahren,",
    "mit denen Kameras bei extrem wenig Licht scharfe Bilder liefern. Die Methode wird bereits in Millionen Geraeten eingesetzt.",
    "Ausgabe 11/2023, Seite 34."], {"box": True}))
ev.append(("Journal of Computational Imaging  Reviewer confirmation", [
    "Dear Dr. Haddou,", "Thank you for your service as a reviewer. Our records show you completed 31 reviews between 2021 and 2026.",
    "The Journal receives about 1,900 submissions a year and invites reviewers based on demonstrated expertise.",
    "Editor in Chief, Journal of Computational Imaging"]))
ev.append(("Massachusetts Regional High School Science Fair  Judge appreciation", [
    "Thank you for serving as a volunteer judge in the Physical Sciences category, March 2023.",
    "Volunteer judges are recruited from local universities and companies."]))
ev.append(("ISCI Senior Member certificate", [
    "Amira Haddou is elevated to Senior Member of the International Society for Computational Imaging, 2022.",
    "Senior membership requires ten years of professional practice and three references from Senior Members. About 18 percent of members hold this grade."]))
ev.append(("United States Patent  US 11,904,218 B2  (first page)", [
    "Title: Method for low light image reconstruction", "Inventors: Amira Haddou, Boston MA; Tomas Reyes, Somerville MA",
    "Assignee: Nordlicht Labs Inc.", "Filed: Mar. 2, 2022   Date of patent: Feb. 27, 2024",
    "Abstract: A method reconstructs images from photon limited sensor data using a learned prior..."]))
ev.append(("Licensing confirmation  Corvane Optics", [
    "Corvane Optics confirms it licensed Nordlicht Labs' low light reconstruction technology (US 11,904,218) in May 2024 for use in its consumer camera modules.",
    "Units shipped with the technology through Q2 2026: approximately 1.1 million.", "VP Engineering, Corvane Optics"]))
for i, t in enumerate(["Photon limited denoising with learned priors", "Event camera fusion for night navigation", "Sparse sensing for medical endoscopy", "Quanta burst photography at scale"]):
    ev.append((f"Article first page: {t}", [f"{t}", "Amira Haddou, Nordlicht Labs Inc.", "Abstract. We present a method... (first page of the published article)", f"Published {2021 + i}."]))
ev.append(("Keynote invitation  ICVI Workshop on Night Vision 2024", [
    "Dear Dr. Haddou, the program committee invites you to give the opening keynote at the ICVI Workshop on Night Vision, June 2024, Vienna.",
    "Workshop attendance last year: 260 researchers."]))
ev.append(("Expert opinion on the industry impact (from a market research firm)", [
    "Nordlicht's low light pipeline is used in an estimated 2.1 million devices (company figures, unaudited).",
    "Prepared for Nordlicht Labs marketing, 2025."]))
doc("3_evidence.pdf", ev)

# 4. Employer documents (11 pages)
doc("4_employer.pdf", [
    ("Nordlicht Labs Inc.  Letter in support of O-1A petition (HR draft)", [
        "To U.S. Citizenship and Immigration Services:", "",
        "Nordlicht Labs Inc. (FEIN 84-2219987), a Delaware corporation headquartered at 200 Seaport Boulevard, Suite 900, Boston, MA 02210, petitions for Dr. Amira Haddou as a Senior Research Scientist under the O-1A classification.",
        "Dr. Haddou has been employed with Nordlicht since March 2021, currently at an annual salary of $156,000.",
        "She received a national innovation award and the ISCI Young Investigator Award.",
        "We request O-1A status from December 1, 2026 to November 30, 2029 and ask that her stay be extended in the United States.",
        "Sincerely, Jana Okafor, Head of People"], {"header": "Draft prepared by HR, not reviewed by counsel"}),
    ("Offer of continued employment  O-1A role", [
        "Date: October 20, 2026", "Position: Principal Research Scientist, Imaging", "Annual base salary: $165,000",
        "Proposed period: December 1, 2026 to November 30, 2029", "Work site: 200 Seaport Boulevard, Boston, MA 02210 and remote within Massachusetts",
        "Hours: full time, 40 hours a week"]),
    ("IRS notice  Employer Identification Number", [
        "We assigned you employer identification number 84-2219978.", "Name: NORDLICHT LABS INC", "Address: 200 SEAPORT BLVD STE 900, BOSTON MA 02210"]),
    ("Company profile", [
        "Nordlicht Labs Inc.  Founded 2015  Employees: 312  Gross annual income (2025): $84.6 million  Net annual income (2025): $6.2 million",
        "NAICS code 541715  Research and development in the physical, engineering, and life sciences"]),
    ("Organization chart  Imaging Group", ["VP Research: Lars Engberg", "  Principal Research Scientist (open, intended for A. Haddou)", "    Research Scientist x 4", "    Research Engineer x 3"]),
    ("Description of duties  Principal Research Scientist", [
        "Leads the low light and event camera research program; supervises seven researchers; owns the patent pipeline; represents the company at scientific conferences."]),
    ("Pay statement  09/30/2026", ["Employee: Amira Haddou   Pay period: 09/16/2026 to 09/30/2026", "Gross pay: $6,500.00   Annualized: $156,000"]),
    ("Pay statement  10/31/2026", ["Employee: Amira Haddou   Pay period: 10/16/2026 to 10/31/2026", "Gross pay: $6,500.00   Annualized: $156,000", "Note: paid as remote employee"]),
    ("Form W-2 Wage and Tax Statement 2025", [
        "Employer: NORDLICHT LABS INC  EIN 84-2219978", "Employee: AMIRA HADDOU", "Box 1 Wages, tips, other compensation: 148,200.00",
        "Box 2 Federal income tax withheld: 27,410.00", "Box 16 State wages (MA): 148,200.00"], {"box": True}),
    ("Labor Condition Application  ETA-9035  (certified, for the 2023 H-1B)", [
        "Case number: I-200-23187-554210   Status: Certified   Period: 10/01/2023 to 09/30/2026",
        "Employer: Nordlicht Labs Inc   FEIN 84-2219978", "Job title: Senior Research Scientist   SOC 19-2012", "Wage offered: $142,000 per year   Prevailing wage: $131,560 (Level III)",
        "Worksite: 200 Seaport Boulevard, Boston, MA 02210"]),
    ("Employment verification", ["This confirms that Amira Haddou has been employed by Nordlicht Labs Inc. since March 15, 2021 as a Research Scientist and since July 1, 2023 as Senior Research Scientist.", "HR Operations"]),
    ("Email from HR to the firm (printed)", [
        "From: Jana Okafor <people@nordlicht-labs.example>", "Subject: Amira O-1",
        "Hi, sorry for the delay on this, we only got approval to sponsor last week. Can you please file the O-1 for Amira as a change of status? She needs to keep working. We would like premium processing. Thanks, Jana"]),
    ("Prior agreement  advisory opinion", ["Placeholder page: Nordlicht HR checklist. Item 'peer group consultation letter': NOT REQUESTED."]),
])

# 5. Expert letters (8 pages)
doc("5_expert_letters.pdf", [
    ("Letter from Prof. Daniel Weiss", [
        "Lakeshore Institute of Technology, Department of Electrical Engineering", "Associate Professor of Electrical Engineering", "", "January 15, 2027", "",
        "I write in strong support of Dr. Amira Haddou. I supervised her J-1 research from 2014 to 2016 and have followed her work since.",
        "Her 2021 denoising paper is the most cited paper in our subfield that year and changed how industry handles low light capture.",
        "", "Daniel Weiss, Chair, Department of Electrical Engineering"]),
    ("Letter from Weiss  (page 2)", [
        "Her later work at Nordlicht turned that research into products. The low light method described in US 11,904,218 is, to my knowledge, licensed by at least one camera maker.",
        "She has reviewed for the Journal of Computational Imaging for five years, a role the journal gives only to recognized experts.",
        "She is, without question, among the top researchers in computational imaging worldwide. I recommend her without reservation.",
        "Daniel Weiss"]),
    ("Letter from Dr. Hanne Lindqvist", [
        "Karolinska Medical Imaging Center (independent)", "September 2, 2026", "",
        "I have never worked with Dr. Haddou. I know her through her published work, which our group adopted in 2023 for endoscopic imaging.",
        "Her sparse sensing method reduced the light dose needed by about a third in our trials.",
        "We cited her 2023 paper in two of our own publications and in a grant application to the national research council, which was funded.",
        "Before her work, endoscopic imaging in low light required either higher illumination, which heats tissue, or long exposures, which blur. Her method avoids both.",
        "I regard this as an original contribution of major significance to medical imaging.", "Hanne Lindqvist, MD PhD"]),
    ("Letter from Lindqvist  (page 2: credentials)", [
        "Dr. Lindqvist leads the Medical Imaging Center's optics unit, has published 61 papers and serves on two national technology review panels.",
        "Contact: h.lindqvist@kmic.example"]),
    ("Letter from Tomas Reyes", [
        "Nordlicht Labs Inc.", "October 1, 2026", "I co-invented US 11,904,218 with Amira. Her design was the core of the patent.", "Tomas Reyes, Staff Engineer"]),
    ("Letter from Prof. Ingrid Solberg", [
        "Nordic Institute of Optics", "August 12, 2026",
        "As editor of the Journal of Computational Imaging I rely on Dr. Haddou for our most technical submissions.",
        "Reviewers are invited only after the editorial board has assessed their published work. She has completed 31 reviews since 2021, more than most senior reviewers.",
        "Her own 2021 paper in our journal is the most downloaded article in the journal's history (14,800 downloads).", "Ingrid Solberg, Editor in Chief"]),
    ("Letter from Corvane Optics", ["May 30, 2026", "Corvane adopted Dr. Haddou's method; it is in about 1.1 million of our camera modules.", "Mei Chen, VP Engineering"]),
    ("Unsigned letter template", ["[Name], [Title]", "I am pleased to support Dr. Haddou...", "(template from HR, not signed)"]),
    ("Letter from Dr. Samir Ben Youssef", [
        "Institut de Vision Numerique, Tunis", "July 7, 2026", "I supervised Dr. Haddou's postdoctoral work from 2016 to 2019 in Tunis.", "Samir Ben Youssef, Director"]),
])
# Real identity documents arrive as scans: no text layer, slightly crooked, grainy.
def scanify(name, angle=0.8):
    import subprocess, tempfile, random
    from PIL import Image, ImageFilter
    src = os.path.join(OUT, name)
    tmp = tempfile.mkdtemp()
    subprocess.run(["pdftoppm", "-r", "110", "-png", src, os.path.join(tmp, "p")], check=True)
    pages = sorted(f for f in os.listdir(tmp) if f.endswith(".png"))
    c = canvas.Canvas(src, pagesize=letter)
    random.seed(7)
    for i, f in enumerate(pages):
        img = Image.open(os.path.join(tmp, f)).convert("L")
        img = img.rotate(angle * (1 if i % 2 else -1), expand=False, fillcolor=255).filter(ImageFilter.GaussianBlur(0.6))
        px = img.load()
        for _ in range(img.size[0] * img.size[1] // 60):
            x, y = random.randrange(img.size[0]), random.randrange(img.size[1]); px[x, y] = max(0, px[x, y] - 90)
        out = os.path.join(tmp, f"s{i}.jpg"); img.save(out, quality=72)
        c.drawImage(out, 0, 0, width=W, height=H); c.showPage()
    c.save()

scanify("1_identity_and_status.pdf")
print("written to", OUT)
