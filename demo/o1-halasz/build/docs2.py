from docs1 import doc

CLAUSES = [
("1. Position", "The Company will employ the Employee as Principal Research Scientist, Structure Prediction, reporting to the Chief Scientific Officer. The Employee will lead the Structure Prediction group of six scientists and will be responsible for the FoldSight platform and its use in the Company's drug discovery programmes."),
("2. Term", "Employment under this Agreement begins on the later of 4 January 2027 or the date U.S. Citizenship and Immigration Services approves the Company's O-1 petition for the Employee, and continues for three years unless ended earlier under section 11."),
("3. Base salary", "The Company will pay the Employee a base salary of USD 205,000 per year, paid in equal instalments on the Company's normal payroll dates, less lawful deductions. Salary will be reviewed each year in March."),
("4. Bonus", "The Employee is eligible for an annual discretionary bonus with a target of 10 percent of base salary, based on Company and individual performance. Bonuses are not guaranteed."),
("5. Equity", "Subject to approval by the Board, the Company will grant the Employee options to buy 40,000 shares of common stock under the 2021 Equity Incentive Plan, vesting over four years with a one year cliff."),
("6. Benefits", "The Employee may take part in the Company's health, dental, vision and 401(k) plans on the same terms as other full time employees, and receives 25 days of paid time off each year."),
("7. Place of work", "The Employee will work at the Company's offices at 400 Binney Street, Cambridge, Massachusetts, and may travel to conferences, collaborators and partner sites as described in the attached itinerary."),
("8. Duties and conduct", "The Employee will devote full working time to the Company, follow the Company's policies, and not take on other paid work without written consent, except unpaid academic peer review and conference service."),
("9. Confidentiality and inventions", "The Employee will keep the Company's confidential information secret during and after employment. Inventions made in the course of employment belong to the Company. Open source contributions to FoldSight continue under the project's existing licence, as approved by the Company on 1 March 2023."),
("10. Immigration", "The Company will file and pay for an O-1 petition and any extension needed for the Employee to perform this role. The Employee will provide accurate documents promptly when asked."),
("11. Ending employment", "Either party may end employment with 60 days' written notice. If the Company ends employment without cause, it will pay three months' base salary and the reasonable cost of return transport to Hungary, as required for O-1 workers."),
("12. Whole agreement", "This Agreement replaces the Employee's offer letter of 9 January 2023 and the role description in it. It is governed by the laws of Massachusetts."),
]
body = "".join(f"<h3>{t}</h3><p>{c}</p>" for t, c in CLAUSES)
doc("06", "Employment agreement for the O-1 period (signed)", "digital", f"""
<h1>Employment Agreement</h1>
<p>Between <b>Corvane Therapeutics, Inc.</b>, a Delaware corporation with offices at 400 Binney Street,
Cambridge, MA 02142 (the "Company"), and <b>Réka Halász</b> (the "Employee"). Dated 30 October 2026.</p>
{body}
<p style="margin-top:28px">Signed for the Company: <i>Dr. Andrew Kessler</i>, Chief Scientific Officer, 30 October 2026<br>
Signed by the Employee: <i>Réka Halász</i>, 30 October 2026</p>
""")

doc("07", "Itinerary of events and activities", "digital", """
<h1>Itinerary: Réka Halász, O-1 period January 2027 to January 2030</h1>
<table class="t">
<tr><th>Dates</th><th>Activity</th><th>Location</th></tr>
<tr><td>Throughout</td><td>Lead the Structure Prediction group; FoldSight platform development</td><td>Corvane, 400 Binney Street, Cambridge, MA</td></tr>
<tr><td>Quarterly from Q1 2027</td><td>Joint programme reviews with Northgate Pharma</td><td>Northgate Pharma, Princeton, NJ</td></tr>
<tr><td>14 to 18 June 2027</td><td>Invited talk, ISCSB annual meeting</td><td>Montreal, Canada (travel abroad)</td></tr>
<tr><td>September 2027</td><td>FoldSight 3.0 public release</td><td>Cambridge, MA</td></tr>
<tr><td>Annually</td><td>European Society for Protein Informatics fellows' meeting</td><td>Varies (Europe)</td></tr>
</table>
<p>Signed: Dr. Andrew Kessler, Chief Scientific Officer, 30 October 2026</p>
""")

doc("08", "HR employment verification letter", "digital", """
<p class="lh">CORVANE THERAPEUTICS, INC. &nbsp;|&nbsp; People Team &nbsp;|&nbsp; 400 Binney Street, Cambridge, MA 02142</p>
<p>26 October 2026</p>
<p>To whom it may concern,</p>
<p>This letter confirms that Dr. Reka Halasz has been employed full time by Corvane Therapeutics, Inc.
since 6 February 2023. Her current job title is <b>Senior Research Scientist</b>. She leads the
Structure Prediction group, which has five scientists. Her current base salary is USD 185,000 per year.</p>
<p>Corvane has employed her in H-1B status throughout her employment.</p>
<p>Yours faithfully,<br>Maria Chen, Head of People</p>
""")

doc("09", "Advisory opinion letter (as provided by the client)", "digital", """
<p>Dr. Paul Brenner<br>Member, Scientific Advisory Board, Corvane Therapeutics, Inc.<br>12 October 2026</p>
<p>To USCIS,</p>
<p>I write as a member of Corvane's Scientific Advisory Board, where I have advised the company since
2022 and hold a small number of Corvane shares. I have known Dr Halász since she joined Corvane.
I fully support the petition. She is an outstanding scientist and her work is essential to the
company. I have no objection to the grant of O-1 status.</p>
<p>Dr. Paul Brenner</p>
""")

doc("10", "Corvane company profile and funding announcement", "digital", """
<h1>Corvane Therapeutics: company profile (from the company's investor pack, September 2026)</h1>
<p>Founded 2020. Cambridge, Massachusetts. 85 employees as of 1 September 2026. Uses machine learning on
protein motion to find new drug binding sites. Pipeline: two oncology programmes in preclinical
development.</p>
<p>Funding: Seed USD 9M (2020); Series A USD 24M (2022); Series B USD 60M (May 2025, led by Harborline
Bio Ventures).</p>
<p>Partnerships: multi year research collaboration with Northgate Pharma (signed 2025).</p>
<hr>
<h2>Biotech Ledger, 3 February 2026: "Ten AI drug discovery startups to watch"</h2>
<p>... 7. Corvane Therapeutics (Cambridge, MA). Corvane's bet is that drugs fail because we model
proteins as statues. Its open source FoldSight tool, built by its structure prediction lead Réka
Halász, is used widely in academia, and the company has signed a research deal with Northgate.</p>
<p class="small">About Biotech Ledger: a daily online publication covering the biotechnology industry,
founded 2016, 210,000 newsletter subscribers (publisher's figure).</p>
""")

doc("11", "Corvane press release", "digital", """
<p class="lh">CORVANE THERAPEUTICS NEWS</p>
<h1>Corvane names Réka Halász Principal Research Scientist</h1>
<p>Cambridge, MA, 29 October 2026. Corvane Therapeutics, a company of over 100 people, today announced
that Dr. Réka Halász will become Principal Research Scientist from January 2027. "Réka is one of
the brightest minds in computational biology," said CEO Laura Mendez. "Her work is the foundation of
everything we do."</p>
<p>Media contact: press@corvane.example</p>
""")

doc("12", "Spark Award certificate", "digital", """
<div style="text-align:center;margin-top:80px">
<h1>CORVANE SPARK AWARD 2024</h1>
<p>Presented to Réka Halász</p>
<p>For the most helpful code review culture in the company.</p>
<p>Chosen by colleague vote. Signed, Laura Mendez, CEO</p>
</div>
""")
