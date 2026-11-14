from docs1 import doc

PARA = """Binding pockets are not fixed. Molecular dynamics simulations show that many pockets open, close
and change shape on time scales from nanoseconds to milliseconds, and that some binding sites exist
only in conformations that are rarely seen in crystal structures. Structure based drug design has
mostly ignored this motion because simulating it for every target is expensive: a single
microsecond scale simulation of a medium sized protein can take weeks of computing time."""

doc("30", "Paper 1: FoldSight (Journal of Structural Informatics, 2022), first author", "digital", f"""
<p class="small">Journal of Structural Informatics 18(3): 211 to 229 (2022). Peer reviewed. Published by the
Society for Structural Informatics.</p>
<h1>FoldSight: learning binding pocket flexibility from molecular dynamics</h1>
<p><b>Réka Halász</b><sup>1</sup>, Elena Marchetti<sup>1</sup><br><span class="small">1 Alpine Institute of Technology, Zurich</span></p>
<h2>Abstract</h2>
<p>We present FoldSight, a graph neural network trained on 14,000 molecular dynamics trajectories that
predicts the range of shapes a protein binding pocket can take, from a single static structure, in
under five minutes on one graphics card. On a held out set of 310 proteins FoldSight recovers 83
percent of cryptic pockets seen in long simulations, compared with 41 percent for the best previous
method. We release FoldSight as open source software.</p>
<h2>1. Introduction</h2><p>{PARA}</p><p>{PARA}</p>
<h2>2. Methods</h2>
<p>Training data were 14,000 trajectories from public databases and our own simulations, covering 2,900
proteins. Each frame was converted to a residue graph. The network predicts, for each residue lining a
pocket, a distribution over side chain and backbone displacements. Pocket shapes are sampled from these
distributions and clustered.</p><p>{PARA}</p>
<h2>3. Results</h2>
<p>FoldSight recovered 83 percent of cryptic pockets (95 percent confidence interval 79 to 87) against 41
percent for the previous best method. Median run time was 4.2 minutes per protein.</p><p>{PARA}</p>
<h2>Author contributions</h2>
<p>R.H. conceived the method, wrote the software, ran all experiments and wrote the paper. E.M. supervised
the work and edited the paper.</p>
""")

doc("31", "Paper 2: kinome study (Cell Systems Biology, 2024), fourth of six authors", "digital", f"""
<p class="small">Cell Systems Biology 9(6): 744 to 761 (2024). Peer reviewed. Impact factor (2025): 14.2.</p>
<h1>Flexible pocket docking finds hidden binding sites across the human kinome</h1>
<p>Tobias Brandauer<sup>1</sup>, Kenji Ito<sup>2</sup>, Adaeze Nwosu<sup>1</sup>, <b>Réka Halász</b><sup>3</sup>,
Jonas Weller<sup>1</sup>, Elena Marchetti<sup>1</sup><br><span class="small">1 Alpine Institute of Technology. 2 Kyoto
Institute of Life Sciences. 3 Corvane Therapeutics.</span></p>
<h2>Abstract</h2>
<p>Using flexible pocket models for all 518 human kinases, we find 92 previously unreported binding sites,
of which 17 were confirmed by crystallography. Several are now the subject of drug discovery programmes.</p>
<h2>Introduction</h2><p>{PARA}</p>
<h2>Results</h2><p>{PARA}</p>
<h2>Author contributions</h2>
<p>T.B. and E.M. designed the study. T.B., K.I. and A.N. ran the docking screens. R.H. adapted FoldSight
for kinases and analysed the pocket motion results. J.W. performed crystallography. T.B. wrote the paper
with input from all authors.</p>
""")

doc("32", "Paper 3: benchmark (Journal of Structural Informatics, 2024), first author", "digital", """
<p class="small">Journal of Structural Informatics 20(1): 33 to 49 (2024). Peer reviewed.</p>
<h1>Benchmarking pocket flexibility predictors on 1,200 drug targets</h1>
<p><b>Réka Halász</b><sup>1</sup>, Miguel Delgado<sup>2</sup><br><span class="small">1 Corvane Therapeutics. 2 University of Valencia.</span></p>
<h2>Abstract</h2>
<p>We compare seven pocket flexibility predictors on 1,200 approved and clinical drug targets. FoldSight
and two newer methods built on it perform best. We release the benchmark so that future methods can be
compared fairly.</p>
<h2>Author contributions</h2>
<p>R.H. designed the benchmark and wrote the paper. M.D. ran three of the seven methods.</p>
""")
