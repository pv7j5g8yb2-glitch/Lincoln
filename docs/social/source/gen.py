import json
SP="/tmp/claude-0/-home-user-Hopkins/0152879b-b278-54ab-94e1-69742b31172b/scratchpad/film3"
t=open(SP+"/film.tpl.html").read()
d=json.load(open(SP+"/seq.json")); o=json.load(open(SP+"/oseq.json")); w=json.load(open(SP+"/wseq.json")); LOGOS="/home/user/Hopkins/lincoln/public/logos"
att="".join(f'<span style="display:inline-flex;align-items:center;gap:8px;padding:7px 11px;border-radius:6px;border:1px solid #e1dfdd;font-size:12.5px"><span style="color:#b4432c;font-weight:700;font-size:10px">PDF</span>{n}</span>' for n in ["Green card.pdf","Passports.pdf","Tax returns.pdf"])
for name,(W,H) in {"16x9":(1920,1080),"4x5":(1080,1350)}.items():
    tall=H>W
    s=t.replace("__NM__","/home/user/Hopkins/lincoln/node_modules/@fontsource-variable").replace("__W__",str(W)).replace("__H__",str(H)).replace("__ATT__",att)
    s=s.replace("__SEQ__",json.dumps(d["seq"])).replace("__MARKS__",json.dumps(d["marks"])).replace("__OSEQ__",json.dumps(o)).replace("__WSEQ__",json.dumps(w))
    s=s.replace("__LOGOS__","".join(f'<div class="logo"><img src="file://{LOGOS}/{l}.svg"></div>' for l in ["outlook","word","teams","onedrive","sharepoint","gmail","drive","docs","calendar"]))
    s=s.replace("__INTRO__","150" if tall else "170").replace("__MONT__","80" if tall else "96")
    open(f"{SP}/film-{name}.html","w").write(s)
print("ok")
