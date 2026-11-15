# Short made up cases, one per form family, for checking Lincoln across case types cheaply. Every person,
# company and number is invented. Each case has planted problems; the key is in KEY.md next to this file.
import sys, os, json
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(os.path.abspath(__file__))
W, H = letter

def page(c, title, lines):
    y = H - 0.9 * inch
    c.setFont("Helvetica-Bold", 13); c.drawString(0.8 * inch, y, title); y -= 0.35 * inch
    c.setFont("Helvetica", 10.5)
    for ln in lines:
        words, cur = ln.split(" "), ""
        for w in words:
            t = (cur + " " + w).strip()
            if c.stringWidth(t, "Helvetica", 10.5) > W - 1.7 * inch:
                c.drawString(0.85 * inch, y, cur); y -= 15; cur = w
            else: cur = t
        c.drawString(0.85 * inch, y, cur); y -= 15
        if not ln: y -= 4
    c.showPage()

CASES = {}
def case(slug, email, pages):
    CASES[slug] = email
    d = os.path.join(OUT, slug); os.makedirs(d, exist_ok=True)
    c = canvas.Canvas(os.path.join(d, "file.pdf"), pagesize=letter)
    for p in pages: page(c, *p)
    c.save()

case("01-marriage-aos", "From: Daniel Reyes <dreyes.home@mail.example>\n\nHi, my wife Sofia and I want to apply for her green card. I'm a US citizen. She came on a tourist visa and stayed. We filed the I-130 already, receipt attached in the questionnaire. Please prepare her adjustment of status with work permit and travel permit. Thanks, Daniel", [
 ("Client intake questionnaire: Adjustment of status", [
  "Applicant: Sofia Elena Marquez Reyes. Date of birth: 1994-08-21. Born in Bogota, Colombia. Citizenship: Colombia.",
  "Passport: AY448102, issued 2019-05-02, expires 2029-05-01. A-Number: none. SSN: none.",
  "Last entry: 2022-06-14 at Miami, Florida, as a B-2 visitor. I-94 number 593021448A1, admitted until 2022-12-13. She did not leave.",
  "Worked without authorization as a nanny from 2023-02 to now.",
  "Address: 4410 Pine Ridge Drive, Orlando, FL 32808. Phone (407) 555-0143. Email sofia.mreyes@mail.example.",
  "Married Daniel James Reyes (US citizen, born 1990-01-11 in Tampa, FL) on 2024-03-09 in Orlando, Florida.",
  "I-130 filed by Daniel for Sofia: receipt IOE0918273645, received 2024-11-02.",
  "Prior marriages: none for either spouse.",
  "Criminal history: none. Immigration violations: overstay only.",
  "Household: Daniel, Sofia and Daniel's son Lucas (age 9). Household size 3.",
  "Daniel's 2024 income: $31,200 as a delivery driver (Form W-2 attached in file). No other income. No joint sponsor named yet.",
  "Wants: EAD and advance parole with the I-485.",
 ]),
 ("Marriage certificate, Orange County, Florida", [
  "This certifies that DANIEL JAMES REYES and SOFIA ELENA MARQUEZ were joined in marriage on March 19, 2024, at Orlando, Florida.",
  "License number 2024-MR-00881. Recorded 2024-03-25. Clerk of Court, Orange County.",
 ])])

case("02-spouse-i130", "From: Priya Natarajan <priya.n@mail.example>\n\nHello, I'm a green card holder and want to sponsor my husband Arjun, who lives in Chennai. Details are in the form I filled. Please file the I-130. Priya", [
 ("Client intake questionnaire: Family petition (I-130)", [
  "Petitioner: Priya Natarajan. Lawful permanent resident since 2019-07-30. A-Number A214556801. Born 1988-02-14 in Madurai, India.",
  "Petitioner address: 92 Hollis Street, Apt 3B, Edison, NJ 08817. Phone (732) 555-0178.",
  "Beneficiary: Arjun Raghavan. Born 1986-11-03 in Chennai, India. Citizen of India. Lives at 14 Lake View Road, T. Nagar, Chennai 600017. Never in the US.",
  "Relationship: husband. Married 2023-12-04 in Chennai.",
  "Petitioner's prior marriage: Karthik Iyer, married 2010-06-20. Divorce final 2024-02-15 (decree attached on next page).",
  "Beneficiary prior marriages: none.",
  "Petitioner employment: Senior analyst, Medlane Health, since 2020.",
 ]),
 ("Final judgment of divorce, Superior Court of New Jersey, Middlesex County", [
  "In the matter of Priya Natarajan and Karthik Iyer, docket FM-12-004471-23.",
  "It is ordered that the marriage between the parties is dissolved. Judgment entered February 15, 2024.",
 ])])

case("03-naturalization", "From: Marek Novak <marek.novak@mail.example>\n\nHi, I'd like to apply for citizenship. My info is in the sheet. Marek", [
 ("Client intake questionnaire: Naturalization (N-400)", [
  "Applicant: Marek Tomas Novak. Born 1979-05-30 in Brno, Czech Republic. Citizen of the Czech Republic.",
  "Permanent resident since 2022-01-20 (green card category IR1, married to US citizen Hannah Novak since 2018-09-01, still living together).",
  "A-Number A208334157. Address: 210 Elm Avenue, Columbus, OH 43215, since 2021. Phone (614) 555-0127.",
  "Trips outside the US since getting the green card: 2023-06-01 to 2024-01-10 (Czech Republic, caring for his mother).",
  "Arrests: 2021-11-14 arrested in Columbus for driving under the influence; pleaded guilty, fine and license suspension.",
  "Employment: Software engineer, Brightway Logistics, Columbus, since 2021.",
  "Wants to file now.",
 ])])

case("04-eb2-niw", "From: Dr. Lena Okoro <lena.okoro@univ.example>\n\nDear counsel, I would like to self-petition for an EB-2 national interest waiver with premium processing. My CV and details are attached. Best, Lena", [
 ("Client intake questionnaire: EB-2 National Interest Waiver", [
  "Petitioner and beneficiary: Dr. Lena Adaeze Okoro. Born 1991-09-17 in Enugu, Nigeria. Citizen of Nigeria. Passport A10552873, expires 2030-02-11.",
  "Current status: F-1 OPT, EAD valid to 2026-12-31. I-94 D/S. Address: 77 Commonwealth Ave, Apt 12, Boston, MA 02116.",
  "Education: PhD in Environmental Engineering, Northeastern University, conferred 2024-05-10. BSc, University of Nigeria, 2013.",
  "Proposed endeavor: low-cost sensors that detect lead in municipal drinking water; pilot with two Massachusetts towns.",
  "Evidence: 6 peer reviewed articles, 85 citations, one EPA small business grant letter of support.",
  "Current employer: PureTrace Sensors Inc. (research scientist), but she is self-petitioning.",
  "Wants premium processing and expects a decision in 15 business days.",
 ]),
 ("Diploma, Northeastern University", [
  "Northeastern University confers upon LENA ADAEZE OKORO the degree of Doctor of Philosophy in Environmental Engineering.",
  "Given at Boston, Massachusetts, on the tenth day of May, 2023.",
 ])])

case("05-asylum", "From: Caseworker, Harbor Legal Aid intake\n\nNew asylum client, Yusuf Demir. Intake notes attached. He wants to file as soon as possible.", [
 ("Asylum intake notes", [
  "Applicant: Yusuf Kaan Demir. Born 1993-03-02 in Diyarbakir, Turkey. Citizen of Turkey. Kurdish.",
  "Entered the US 2024-04-18 at JFK Airport, New York, on a B-1/B-2 visa. Admitted until 2024-10-17. No status since.",
  "Address: 18 Ocean Parkway, Apt 4C, Brooklyn, NY 11218. Phone (718) 555-0119.",
  "Before the US he lived in Germany from 2021-02 to 2024-04 with a German residence permit valid until 2026 (he was a recognized refugee there).",
  "Fear: detained twice by Turkish police in 2020 for pro-Kurdish journalism; beaten; passport later renewed without problems.",
  "Family: single, no children. Parents in Diyarbakir.",
  "Has not filed any asylum application in the US. Today is the intake date.",
 ])])

case("06-remove-conditions", "From: Grace Kim <grace.kim@mail.example>\n\nHi! My conditional green card is ending soon and I need to remove conditions. We separated last month though. What do I do? Grace", [
 ("Client intake questionnaire: Removal of conditions", [
  "Applicant: Grace Yuna Kim. Born 1995-12-08 in Seoul, South Korea. Citizen of South Korea.",
  "Conditional resident since 2024-10-05. Card expires 2026-10-05. A-Number A219004633.",
  "Spouse: Michael Thompson, US citizen, married 2023-07-15. Separated 2026-10-01; divorce not filed yet.",
  "Address: 3301 Cedar Lane, Apt 210, Austin, TX 78705. Phone (512) 555-0166.",
  "Evidence of good faith marriage: joint lease 2023 to 2026, joint bank account, joint tax returns 2023 and 2024.",
  "Children: none.",
  "Wants to file jointly with Michael because he said he would sign.",
 ])])

case("07-daca", "From: Luis Hernandez <luis.h@mail.example>\n\nHello, I need to renew my DACA. My card expired a while ago, I lost my job and couldn't pay. Info attached. Luis", [
 ("Client intake questionnaire: DACA renewal", [
  "Applicant: Luis Alberto Hernandez Cruz. Born 1999-07-04 in Puebla, Mexico. Citizen of Mexico.",
  "Entered the US in 2006 at age 7 without inspection. Continuous residence since.",
  "A-Number A207733118. Last DACA approved 2021-03-10, valid until 2023-03-09. Has not renewed since.",
  "Address: 512 W 18th Street, Chicago, IL 60616, since 2016. Phone (312) 555-0131.",
  "Education: graduated Benito Juarez Community Academy, Chicago, 2017.",
  "Arrests: 2024-08-20 arrested for misdemeanor retail theft (value $180); case dismissed 2024-10-02.",
  "Wants a work permit with the renewal.",
 ])])

case("08-fiance", "From: Ethan Brooks <ethan.brooks@mail.example>\n\nHi, I want to bring my fiancee from the Philippines on a K-1. Details attached. Ethan", [
 ("Client intake questionnaire: Fiance(e) petition (I-129F)", [
  "Petitioner: Ethan Ross Brooks. US citizen by birth, born 1987-04-22 in Spokane, WA. Address: 1120 N Division St, Spokane, WA 99202. Phone (509) 555-0152.",
  "Beneficiary: Maria Clara Santos. Born 1996-01-30 in Cebu City, Philippines. Citizen of the Philippines. Lives at 45 Mango Avenue, Cebu City 6000.",
  "How they met: online in 2021. Met in person once, in Cebu, 2022-12-20 to 2023-01-05. Video calls since. Not met in person since.",
  "Intend to marry within 90 days of her arrival.",
  "Petitioner's prior marriages: none. Prior K-1 petitions: filed one in 2019 for a different person (withdrawn 2020).",
  "Petitioner criminal history: none.",
 ])])

case("09-green-card-renewal", "From: Ahmed Saleh <ahmed.saleh@mail.example>\n\nHello, my green card expires next month. Please renew it for me. Ahmed", [
 ("Client intake questionnaire: Green card renewal", [
  "Applicant: Ahmed Yousef Saleh. Born 1990-10-12 in Amman, Jordan. Citizen of Jordan.",
  "Green card: category CR1, resident since 2024-12-01, card expires 2026-12-01. A-Number A221345902.",
  "Married to US citizen Rana Saleh since 2023-05-20; living together.",
  "Address: 77 Maple Street, Dearborn, MI 48126. Phone (313) 555-0108.",
  "Card not lost or damaged. Wants a new 10 year card.",
 ])])

case("10-b2-extension", "From: Chen Wei <chen.wei@mail.example>\n\nHi, I'm visiting my daughter in Seattle and want to stay three more months for my grandson's birth. Please file my extension. Chen", [
 ("Client intake questionnaire: Extension of stay (I-539)", [
  "Applicant: Chen Wei. Born 1961-02-19 in Hangzhou, China. Citizen of China. Passport EK0284451, expires 2031-04-09.",
  "Entered 2026-05-02 at Seattle as a B-2 visitor. I-94 number 712004558A2, admitted until 2026-11-01.",
  "Staying with daughter Lin Wei (US citizen) at 2290 Eastlake Ave E, Seattle, WA 98102. Phone (206) 555-0193.",
  "Wants to stay until 2027-02-01. Funds: $40,000 savings, return ticket booked.",
  "Has not worked or studied in the US.",
  "Intake date: 2026-11-15.",
 ])])

case("11-provisional-waiver", "From: Rosa Alvarez <rosa.alvarez@mail.example>\n\nHello, I want to apply for the provisional waiver so I can go to my visa interview in Mexico. My son is a US citizen and sponsored me. Info attached. Rosa", [
 ("Client intake questionnaire: Provisional unlawful presence waiver (I-601A)", [
  "Applicant: Rosa Maria Alvarez Gomez. Born 1975-09-09 in Oaxaca, Mexico. Citizen of Mexico. A-Number A098223411.",
  "Entered without inspection in 2004. Never left.",
  "Immigrant visa case: I-130 approved, filed by her US citizen son Diego Alvarez (age 24). NVC case MEX2025681234, immigrant visa fee paid.",
  "Spouse: Jose Alvarez, also undocumented. Parents: deceased.",
  "Prior immigration history: removal order from an immigration judge in 2009 (did not attend hearing).",
  "Address: 908 Orchard Road, Fresno, CA 93702. Phone (559) 555-0175.",
  "Criminal history: none.",
 ])])

case("12-appeal-motion", "From: Tariq Hussain <tariq.hussain@mail.example>\n\nHi, USCIS denied my application. Can you appeal it? Denial letter attached. Tariq", [
 ("Decision, U.S. Citizenship and Immigration Services", [
  "Date: August 12, 2026. Receipt number: MSC2590112233. Form I-765, Application for Employment Authorization.",
  "Applicant: Tariq Hussain. A-Number A215667890. Born 1992-06-25 in Lahore, Pakistan.",
  "Address: 455 Sunset Blvd, Apt 8, Los Angeles, CA 90028.",
  "Your Form I-765 is denied because you did not respond to the Request for Evidence issued May 2, 2026, and the record does not show eligibility under category (c)(8).",
  "You may file a motion to reopen or reconsider on Form I-290B within 30 days (33 days if this decision was mailed). There is no appeal to the AAO from this decision.",
 ]),
 ("Client note", [
  "Client says he never received the RFE because he moved on 2026-04-15 and filed an AR-11 change of address online that day (confirmation attached by client: AR-11 confirmation EAR-4471-2290).",
  "Today is the intake date: 2026-11-15.",
 ])])

case("13-recheck-i130", "From: Omar Haddad <omar.haddad@mail.example>\n\nHi, I'm a US citizen and want to petition for my wife Lena so she can get her green card here. Please file the I-130 for now. Her details and mine are in the form. Omar", [
 ("Client intake questionnaire: Spouse petition (I-130)", [
  "Petitioner: Omar Khalil Haddad. US citizen by birth, born 1989-04-02 in Dearborn, MI. Address: 1450 Oakwood Blvd, Dearborn, MI 48124. Phone (313) 555-0122.",
  "Beneficiary: Lena Marie Haddad (born Lena Marie Vogel). Born 1992-11-19 in Leipzig, Germany. Citizen of Germany. Passport C4FX29871, expires 2030-06-30.",
  "Married 2024-05-11 in Dearborn, Michigan. No prior marriages for either.",
  "Lena's last entry: 2023-02-08 at Detroit as a B-2 visitor, admitted until 2023-08-07. She stayed. She has worked as a bookkeeper since 2023-10 without authorization.",
  "Earlier stay: 2014-09 to 2016-06 as a J-1 exchange visitor (university research), funded by her home government. DS-2019 marked subject to the two-year home residency requirement. She has not returned to Germany for two years since, and no waiver was filed.",
  "Plan: she will adjust status here and travel to Germany on advance parole for her sister's wedding while the green card is pending.",
  "Household: Omar, Lena and Omar's daughter Nora (age 6). Household size 3.",
  "Omar's 2025 income: $31,200 as a warehouse supervisor. No other income or assets.",
 ])])

json.dump(CASES, open(os.path.join(OUT, "emails.json"), "w"), indent=1)
print("made", len(CASES))
