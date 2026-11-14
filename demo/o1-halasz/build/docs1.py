# Case 2 documents, part 1. Everything is invented.
# kind: "digital" renders as a normal PDF; "scan" renders as an image-only PDF (no text layer).
DOCS = []
def doc(id, title, kind, html):
    DOCS.append({"id": id, "title": title, "kind": kind, "html": html})

doc("01", "Email thread from the client, with forwarded drafts", "digital", """
<div class="mail">
<p class="h">From: Reka Halasz &lt;reka.h@corvane-tx.example&gt;<br>To: intake@[law firm]<br>Date: Mon, 2 Nov 2026 09:14<br>Subject: O-1 documents (everything I have)</p>
<p>Hi,</p>
<p>As discussed, here is everything I could find for the O-1. Sorry it is a bit of a mess. A few notes:</p>
<p>1. My current title is Head of Research at Corvane (I run the structure prediction work). HR's letter
uses my old title, I think they have not updated it.</p>
<p>2. The Hungarian award certificate and the newspaper article from home are attached as they are.
I do not have translations yet. My mum can translate them if that helps?</p>
<p>3. Prof. Ferrante sent me a draft of her letter first (forwarded below) and then the signed one.
Both are attached, use whichever is better.</p>
<p>4. I was also named in BioScene Leaders' 40 Under 40 this year, which should help. The invoice for
the honoree package is attached in case you need proof of it.</p>
<p>5. My passport is attached. I know it is getting close to the end, I will renew it next year.</p>
<p>6. Dr Brenner on our Scientific Advisory Board kindly wrote the "advisory opinion" letter you mentioned.</p>
<p>FoldSight now has over 5,000 GitHub stars and my papers have over 1,500 citations, so hopefully
that is enough!</p>
<p>Thanks so much,<br>Reka</p>
<hr>
<p class="h">---------- Forwarded message ----------<br>From: Prof. Lucia Ferrante<br>Date: Fri, 2 Oct 2026 17:40<br>Subject: Draft letter for your petition, please check facts</p>
<p>Dear Reka, here is a first draft. Please check the facts before I sign. Lucia</p>
<div class="quote"><p><b>DRAFT, NOT SIGNED</b></p>
<p>To USCIS: I am a professor of computational biology at Atlantic University. Dr Halasz's FoldSight
method is used by 12 pharmaceutical companies and has become the standard tool for modelling
binding pocket flexibility. It has been cited more than 2,000 times. I consider her one of the top
five structural informaticians of her generation in the world.</p></div>
<hr>
<p class="h">---------- Forwarded message ----------<br>From: IJARS Editorial Office &lt;editor@ijars-journal.example&gt;<br>Date: 3 Mar 2025<br>Subject: Invitation to review for the International Journal of Advanced Research Science</p>
<div class="quote"><p>Dear Researcher, the International Journal of Advanced Research Science (IJARS) publishes original
research in all fields of science, engineering, medicine, management and the arts. We welcome
reviewers from every discipline. Accepted authors pay an article processing charge of USD 890.
Reviewers receive a certificate of reviewing. Please reply within 24 hours.</p></div>
<p>(Reka: I did 2 reviews for them in 2025, certificate attached.)</p>
<hr>
<p class="h">---------- Forwarded message ----------<br>From: accounts@biosceneleaders.example<br>Date: 18 Jun 2026<br>Subject: Invoice BSL-2026-0412: 40 Under 40 Featured Honoree Package</p>
<div class="quote"><table class="t"><tr><td>Featured Honoree Package (profile, photo shoot, digital badge, 2 gala tickets)</td><td>USD 1,450.00</td></tr>
<tr><td>Status</td><td>PAID by card, 18 Jun 2026</td></tr></table>
<p>Thank you for confirming your place on this year's 40 Under 40 in Biotech list.</p></div>
</div>
""")

doc("02", "Curriculum vitae (current version, October 2026)", "digital", """
<h1>Réka Halász, PhD</h1>
<p>Cambridge, Massachusetts. Citizen of Hungary. Born 9 June 1991, Debrecen, Hungary.</p>
<h2>Positions</h2>
<p><b>Corvane Therapeutics, Inc.</b>, Cambridge, MA. Senior Research Scientist, then lead of the Structure
Prediction group, February 2023 to present.</p>
<p><b>Alpine Institute of Technology</b>, Zurich. Postdoctoral researcher, Laboratory of Prof. Elena
Marchetti, October 2019 to January 2023.</p>
<h2>Education</h2>
<p>PhD in Computational Biology, Pannonia University of Sciences, Budapest, 2019. Thesis: "Learning the
motion of protein binding pockets".<br>MSc in Biophysics, Pannonia University of Sciences, 2015.</p>
<h2>Selected honours</h2>
<ul><li>Protein Innovators Prize, International Society for Computational Structural Biology, 2025</li>
<li>Fellow, European Society for Protein Informatics, elected 2025</li>
<li>Fiatal Kutatói Díj (Young Researcher Award), Magyar Tudományos Társaság, 2020</li>
<li>40 Under 40 in Biotech, BioScene Leaders, 2026</li>
<li>Spark Award, Corvane Therapeutics, 2024</li></ul>
<h2>Software</h2>
<p>FoldSight (open source, 2022 to present), a tool that predicts how drug binding pockets in proteins
change shape. More than 5,000 GitHub stars.</p>
<h2>Publications (9)</h2>
<ol>
<li><b>Halász R</b>, Marchetti E. FoldSight: learning binding pocket flexibility from molecular dynamics.
<i>Journal of Structural Informatics</i> 18(3): 211 to 229, 2022.</li>
<li>Brandauer T, Ito K, Nwosu A, <b>Halász R</b>, Weller J, Marchetti E. Flexible pocket docking finds
hidden binding sites across the human kinome. <i>Cell Systems Biology</i> 9(6): 744 to 761, 2024.</li>
<li><b>Halász R</b>, Delgado M. Benchmarking pocket flexibility predictors on 1,200 drug targets.
<i>Journal of Structural Informatics</i> 20(1): 33 to 49, 2024.</li>
<li><b>Halász R</b>. Why drug discovery needs moving pictures, not snapshots (opinion).
<i>The Scientist Weekly</i>, 12 May 2025.</li>
<li>Five further papers, 2016 to 2021, listed in full in the 2024 CV.</li>
</ol>
<p>Citations: over 1,500 (Google Scholar).</p>
<h2>Peer review</h2>
<p>Reviewer, <i>Journal of Structural Informatics</i> (2024 to present).<br>
Reviewer, <i>International Journal of Advanced Research Science</i> (2025).</p>
<h2>Memberships</h2>
<p>Fellow, European Society for Protein Informatics (2025).<br>
Member, North American Protein Society (since 2019).</p>
""")

doc("03", "Curriculum vitae (older version, March 2024)", "digital", """
<h1>Reka Halasz-Toth, PhD</h1>
<p>Senior Research Scientist, Corvane Therapeutics, Cambridge, MA (since February 2023).</p>
<h2>Publications (7)</h2>
<ol>
<li>Halasz-Toth R, Marchetti E. FoldSight: learning binding pocket flexibility from molecular dynamics.
J Struct Inform 2022.</li>
<li>Halasz-Toth R, Marchetti E, Varkonyi P. Pocket motion in GPCRs. Biophys Methods 2021.</li>
<li>Halasz-Toth R, Szabo L. Coarse grained pocket models. Hung J Biophys 2020.</li>
<li>Halasz-Toth R. Thesis summary. Pannonia Sci Rep 2019.</li>
<li>Halasz-Toth R, Kiss A. Conformational sampling benchmarks. Comput Biol Lett 2018.</li>
<li>Kiss A, Halasz-Toth R. Water networks in binding sites. Hung J Biophys 2017.</li>
<li>Halasz-Toth R. MSc project report. Pannonia Sci Rep 2016.</li>
</ol>
<p>Citations: 640 (Google Scholar, March 2024). FoldSight: 2,100 GitHub stars.</p>
""")

doc("04", "Passport identity page (scan)", "scan", """
<div class="passport">
<p class="small">MAGYARORSZÁG / HUNGARY &nbsp;&nbsp; ÚTLEVÉL / PASSPORT</p>
<table class="t">
<tr><td>Type / Típus</td><td>P</td><td>Code / Kód</td><td>HUN</td></tr>
<tr><td>Passport No. / Útlevélszám</td><td colspan="3">BK4471902</td></tr>
<tr><td>Surname / Családi név</td><td colspan="3">HALÁSZ</td></tr>
<tr><td>Given names / Utónév</td><td colspan="3">RÉKA</td></tr>
<tr><td>Nationality</td><td colspan="3">HUNGARIAN / MAGYAR</td></tr>
<tr><td>Date of birth</td><td>09 JUN 1991</td><td>Sex</td><td>F</td></tr>
<tr><td>Place of birth</td><td colspan="3">DEBRECEN</td></tr>
<tr><td>Date of issue</td><td>03 MAR 2017</td><td>Date of expiry</td><td><b>02 MAR 2027</b></td></tr>
</table>
<p class="mrz">P&lt;HUNHALASZ&lt;&lt;REKA&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;<br>BK44719021HUN9106092F2703022&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;04</p>
</div>
""")

doc("05", "Most recent I-94 record (printout)", "digital", """
<h1>Most Recent I-94</h1>
<p class="small">U.S. Customs and Border Protection. Printed 28 Oct 2026.</p>
<table class="t">
<tr><td>Admission (I-94) Record Number</td><td>482911073A3</td></tr>
<tr><td>Most Recent Date of Entry</td><td>2024 January 19</td></tr>
<tr><td>Class of Admission</td><td>H1B</td></tr>
<tr><td>Admit Until Date</td><td><b>01/15/2027</b></td></tr>
<tr><td>Last/Surname</td><td>HALASZ</td></tr>
<tr><td>First (Given) Name</td><td>REKA</td></tr>
<tr><td>Birth Date</td><td>06/09/1991</td></tr>
<tr><td>Passport Number</td><td>BK4471902</td></tr>
<tr><td>Country of Issuance</td><td>Hungary</td></tr>
</table>
""")
