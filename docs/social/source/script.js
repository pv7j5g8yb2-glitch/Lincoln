const W=__W__,H=__H__,TALL=H>W;
const R=__RECTS__;
const $=(id)=>document.getElementById(id);
const cl=(x)=>Math.min(1,Math.max(0,x)), eo=(x)=>1-Math.pow(1-cl(x),3), e5=(x)=>1-Math.pow(1-cl(x),5), eio=(x)=>{const t=cl(x);return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2}, seg=(t,a,b)=>cl((t-a)/(b-a));
const back=(x)=>{const c1=1.70158,c3=c1+1,t=cl(x);return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2);};
const lerp=(a,b,k)=>a+(b-a)*k;
const set=(el,o)=>Object.assign(el.style,o);

// Layout per format: the window leaves the line above it room to breathe.
const L = TALL
  ? { capTop:190, capSize:56, capW:880, fw:920, fh:575, fy:440, mark:30, markY:H-90, zoom:.8, mail:{x:90,y:470,w:900}, work:{x:150,y:820,w:780}, om:{x:70,y:500,w:560}, op:{x:650,y:430,w:360}, logo:136, logoY:600, logoGap:24 }
  : { capTop:132, capSize:50, capW:1400, fw:1180, fh:738, fy:252, mark:24, markY:H-58, zoom:.84, mail:{x:330,y:470,w:740}, work:{x:1110,y:400,w:600}, om:{x:360,y:400,w:760}, op:{x:1150,y:265,w:400}, logo:120, logoY:470, logoGap:28 };
const FX=(W-L.fw)/2, FY=L.fy, K=L.fw/1440;
set($("frame"),{left:FX+"px",top:FY+"px",width:L.fw+"px",height:L.fh+"px"});
set($("cap"),{top:L.capTop+"px",fontSize:L.capSize+"px",maxWidth:L.capW+"px"});
set($("mark"),{top:L.markY+"px",fontSize:L.mark+"px"});
for(const[id,b] of [["mail",L.mail],["work",L.work],["omail",L.om]]) set($(id),{left:b.x/L.zoom+"px",top:b.y/L.zoom+"px",width:b.w/L.zoom+"px",zoom:L.zoom});
set($("opane"),{left:L.op.x+"px",top:L.op.y+"px",width:L.op.w+"px",height:(L.op.w*2)+"px"}); $("opimg").style.transform="scale("+(L.op.w/380)+")";
set($("logos"),{top:L.logoY+"px",gap:L.logoGap+"px",padding:TALL?"0 70px":"0"});
[...$("logos").children].forEach(x=>{x.style.width=x.style.height=L.logo+"px";x.firstChild.style.width=x.firstChild.style.height=(L.logo*0.46)+"px";});
const AW=TALL?860:900; set($("ask"),{width:AW+"px",marginLeft:(-AW/2)+"px",marginTop:"-60px"});
$("iword").innerHTML=[..."Lincoln"].map(c=>'<span class="w"><i>'+c+'</i></span>').join("");

const STEPS=["Read all 52 pages","Opened the case: Dr. Réka Halász, O-1A","Found 11 open issues","Mapped the evidence to 8 criteria","Drafted the reply to Réka","Drafted a request to the ISCSB"];
$("steps").innerHTML=STEPS.map(s=>'<div class="row"><div class="ic"><div class="spin"></div><div class="tick"><svg width="13" height="13" viewBox="0 0 12 12"><path d="M2.5 6.2l2.3 2.3 4.7-4.9" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></div></div><span>'+s+'</span></div>').join("");

// Lines: words rise out of their masks one after another; *starred* words are the gold italic ones.
const CAPS=[[3.5,6.8,"A client sends you *52* pages."],[7,10.8,"Lincoln reads *every* one before you open the email."],[11,16.6,"Your morning starts with the work *already done.*"],[16.8,22.9,"Lincoln drafts. *You decide.*"],[23,25.5,"One click. *Sent.*"],[25.7,31.3,"Lincoln spots what could *sink* your case."],[31.5,35.9,"Every page, read and *filed* for you."],[36.1,40.3,"Your evidence, mapped to *every* criterion."],[40.5,48.3,"Every fact in your letter, *traced* to its page."],[59,65,"Lincoln lives inside your *Outlook.*"],[65.2,69.7,"Works where you *already* work."]];
let capNow=-1;
function words(text){return text.split(" ").map(w=>{const em=/^\*.*\*?$/.test(w)||/\*$/.test(w);return '<span class="w'+(/\*/.test(w)?" em":"")+'"><i>'+w.replace(/\*/g,"")+" </i></span>";}).join("");}
// The starred run can span several words: mark every word between the stars.
function wordsRun(text){let on=false;return text.split(" ").map(w=>{const s=w.startsWith("*"),e=w.endsWith("*")||w.endsWith("*.");if(s)on=true;const em=on;if(e||w.match(/\*[.,]?$/))on=false;return '<span class="w'+(em?" em":"")+'"><i>'+w.replace(/\*/g,"")+" </i></span>";}).join("");}
function caption(t){
  const i=CAPS.findIndex(([a,b])=>t>=a&&t<b),c=$("cap");
  if(i!==capNow){capNow=i;c.innerHTML=i<0?"":wordsRun(CAPS[i][2]);}
  if(i<0)return;const[a,b]=CAPS[i];
  [...c.children].forEach((s,k)=>{const n=e5(seg(t,a+k*0.06,a+k*0.06+0.7)),o=eio(seg(t,b-0.42+k*0.02,b));const inner=s.firstChild;
    let sc=1;if(s.classList.contains("em")){const p=seg(t,a+k*0.06+0.35,a+k*0.06+0.95);sc=1+0.08*Math.sin(p*Math.PI);}
    set(inner,{transform:"translateY("+((1-n)*105+o*-105)+"%) scale("+sc+")"});
    // The count: 52 counts up as it rises.
    if(inner.textContent.trim()==="52"){inner.textContent=Math.round(52*eo(seg(t,a+k*0.06,a+k*0.06+1.1)))+" ";}
  });
}

// The camera inside the window: [time, centre x, centre y, zoom] in page pixels.
const CAM=[[10.6,720,450,1],[12.4,820,360,1.22],[13.8,820,360,1.22],[14.4,842,352,1.3],[15.2,842,352,1.3],
 [15.6,990,330,1.5],[19.6,990,560,1.5],[21,900,760,1.62],[22.7,900,760,1.62],[23.6,720,450,1],
 [25.4,720,450,1],[26.3,600,420,1.18],[27.6,650,460,1.55],[31.5,650,460,1.55],[32.4,830,560,1.32],[36,830,560,1.32],[36.6,850,560,1.32],
 [40.4,850,560,1.32],[41.2,760,470,1.12],[42.6,760,470,1.12],[43.2,900,470,1.32],[47.9,880,520,1.4]];
function camAt(t){let i=0;while(i<CAM.length-1&&CAM[i+1][0]<=t)i++;const a=CAM[i],b=CAM[Math.min(i+1,CAM.length-1)];const k=b[0]>a[0]?eio(seg(t,a[0],b[0])):0;let c=[lerp(a[1],b[1],k),lerp(a[2],b[2],k),lerp(a[3],b[3],k)];if(t<a[0])c=[a[1],a[2],a[3]];
  const s=K*c[2],hw=L.fw/2/s,hh=L.fh/2/s;c[0]=Math.min(1440-hw,Math.max(hw,c[0]));c[1]=Math.min(900-hh,Math.max(hh,c[1]));return {cx:c[0],cy:c[1],s};}
const toFrame=(cam,x,y)=>[L.fw/2+(x-cam.cx)*cam.s,L.fh/2+(y-cam.cy)*cam.s];
const SH=[["s_home",10.6,14.75],["s_review",14.75,22.85],["s_sent",22.85,26.35],["s_overview",26.35,31.95],["s_documents",31.95,36.55],["s_evidence",36.55,40.95],["s_drafts",40.95,42.7],["s_letter",42.7,45.35],["s_hover",45.35,48.4]];
const mid=(r)=>[r[0]+r[2]/2,r[1]+r[3]/2];
const CLICKS=[[14.6,...mid(R.home_row),R.home_row],[22.7,R.review_btn[0]+R.review_btn[2]*0.42,R.review_btn[1]+R.review_btn[3]/2,R.review_btn],[26.2,R.side_case[0]+70,R.side_case[1]+R.side_case[3]/2,R.side_case],[31.8,...mid(R.tab_docs),R.tab_docs],[36.4,...mid(R.tab_ev),R.tab_ev],[40.8,...mid(R.tab_drafts),R.tab_drafts]];
// The cursor waits, then moves quickly and surely to the button it presses.
const fact=[R.fact[0]+R.fact[2]*0.4,R.fact[1]+R.fact[3]/2];
const PATH=[[13.6,1180,640],[14.15,...mid(R.home_row)],[15.2,980,700],[22.0,980,880],[22.45,CLICKS[1][1],CLICKS[1][2]],[23.6,520,600],[25.65,560,560],[26.0,CLICKS[2][1],CLICKS[2][2]],[27.0,300,560],[31.1,420,520],[31.55,...mid(R.tab_docs)],[33,700,620],[35.7,700,560],[36.15,...mid(R.tab_ev)],[37.4,760,640],[40.1,760,560],[40.55,...mid(R.tab_drafts)],[41.6,900,620],[44.3,900,560],[44.85,...fact],[48.4,...fact]];
function cursorAt(t){let i=0;while(i<PATH.length-1&&PATH[i+1][0]<=t)i++;const a=PATH[i],b=PATH[Math.min(i+1,PATH.length-1)];if(t<=a[0])return [a[1],a[2]];const k=e5(seg(t,a[0],b[0]));const arc=Math.sin(k*Math.PI)*Math.min(40,Math.hypot(b[1]-a[1],b[2]-a[2])*0.08);return [lerp(a[1],b[1],k),lerp(a[2],b[2],k)-arc];}

// Everything else Lincoln does, in a quick run.
const MONT=[[48.8,"Forms, *filled.*"],[49.9,"Documents, *translated.*"],[51,"RFE responses, *drafted.*"],[52.1,"Filing packets, *assembled.*"],[53.2,"Deadlines, on *your* calendar."],[54.3,"Requests from Teams, *handled.*"]];
const ASK="Which cases have a deadline this month?";
const O=10.4; // Outlook, the tools and the close come after the run

function render(t){
  caption(t);
  // Intro: the letters rise one by one
  const io=eio(seg(t,2.8,3.3));
  [...$("iword").children].forEach((s,k)=>{const n=e5(seg(t,0.35+k*0.07,1.25+k*0.07));set(s.firstChild,{transform:"translateY("+((1-n)*110-io*110)+"%)"});});
  set($("mark"),{opacity:seg(t,3.6,4.4)*(1-seg(t,69.4,70))});
  // Chapter 1
  const mi=e5(seg(t,3.8,4.8)),mo=eio(seg(t,10.2,10.9)),wi=e5(seg(t,7,7.9));
  set($("mail"),{opacity:mi*(1-mo),transform:"translate("+((1-wi)*(TALL?0:200))+"px,"+((1-mi)*50-mo*40)+"px)"});
  set($("pdf"),{boxShadow:"0 0 0 "+(eo(seg(t,5.2,5.8))*3)+"px rgba(181,145,82,"+(0.55*eo(seg(t,5.2,5.8)))+")"});
  set($("work"),{opacity:wi*(1-mo),transform:"translateY("+((1-wi)*40-mo*40)+"px)"});
  [...$("steps").children].forEach((r,k)=>{const a=7.6+k*0.4,on=seg(t,a,a+0.3),done=seg(t,a+0.32,a+0.45);r.style.opacity=on;r.style.transform="translateY("+((1-eo(on))*8)+"px)";r.querySelector(".spin").style.opacity=1-done;r.querySelector(".spin").style.transform="rotate("+(t*540)+"deg)";const tk=r.querySelector(".tick");tk.style.opacity=done;tk.style.transform="scale("+(0.6+0.4*back(done))+")";});
  $("wstate").textContent=t>10?"Done":"Working";
  // The window
  const fi=e5(seg(t,10.5,11.3)),fo=eio(seg(t,48,48.6));
  set($("frame"),{opacity:fi*(1-fo),transform:"translateY("+((1-fi)*60-fo*30)+"px) scale("+(0.975+fi*0.025-fo*0.02)+")"});
  const cam=camAt(t);
  for(const[id,a,b] of SH){const el=$(id);const o=seg(t,a-0.05,a+0.18)*(1-seg(t,b-0.05,b+0.18));let dy=0;if(id==="s_letter")dy=(1-eio(seg(t,42.7,43.3)))*120;el.style.opacity=(id==="s_home"?seg(t,10.5,10.6)*(1-seg(t,b-0.05,b+0.18)):o);el.style.transform="translate("+(L.fw/2-cam.cx*cam.s)+"px,"+(L.fh/2-cam.cy*cam.s+dy*cam.s)+"px) scale("+cam.s+")";}
  const hv=e5(seg(t,28,28.6))*(1-seg(t,31.2,31.6));const r=R.ov_issue,[hx,hy]=toFrame(cam,r[0]-8,r[1]-8),[hx2,hy2]=toFrame(cam,r[0]+r[2]+8,r[1]+r[3]+4);
  set($("hl"),{left:hx+"px",top:hy+"px",width:(hx2-hx)+"px",height:(hy2-hy)+"px",opacity:hv});
  const vis=seg(t,13.4,13.6)*(1-seg(t,48,48.3));
  const[px,py]=cursorAt(t);const[fx,fy]=toFrame(cam,px,py);
  let press=0,ring=0,rp=null,pr=null;for(const c of CLICKS){const d=t-c[0];if(d>=0&&d<0.16)press=Math.sin(d/0.16*Math.PI);if(d>=0&&d<0.5){ring=d/0.5;rp=c;}if(d>=0&&d<0.2)pr=c;}
  set($("cursor"),{left:(FX+fx-4)+"px",top:(FY+fy-3)+"px",opacity:vis,transform:"scale("+(1-0.14*press)+")"});
  if(rp){const[rx,ry]=toFrame(cam,rp[1],rp[2]);set($("ring"),{left:(FX+rx)+"px",top:(FY+ry)+"px",opacity:(1-ring)*0.5*vis,transform:"scale("+(0.3+ring*0.9)+")"});}else $("ring").style.opacity=0;
  if(pr){const q=pr[3],[a1,b1]=toFrame(cam,q[0],q[1]),[a2,b2]=toFrame(cam,q[0]+q[2],q[1]+q[3]);set($("press"),{left:a1+"px",top:b1+"px",width:(a2-a1)+"px",height:(b2-b1)+"px",opacity:Math.sin(cl((t-pr[0])/0.2)*Math.PI)});}else $("press").style.opacity=0;
  // The run: one line at a time, big, in the middle of the black
  const m=MONT.findIndex(([a],k)=>t>=a&&t<(MONT[k+1]?MONT[k+1][0]:55.4));
  const ml=$("mline");
  if(m>=0){if(ml.dataset.k!==String(m)){ml.dataset.k=String(m);ml.innerHTML=wordsRun(MONT[m][1]);}
    const a=MONT[m][0],b=MONT[m+1]?MONT[m+1][0]:55.4;
    [...ml.children].forEach((s,k)=>{const n=e5(seg(t,a+k*0.05,a+k*0.05+0.5)),o=eio(seg(t,b-0.28,b));set(s.firstChild,{transform:"translateY("+((1-n)*105-o*105)+"%)"});});
  } else { ml.innerHTML=""; ml.dataset.k=""; }
  // Ask Lincoln anything: the question is typed, then sent
  const ai=e5(seg(t,55.5,56.2)),ao=eio(seg(t,58.4,58.9));
  set($("ask"),{opacity:ai*(1-ao),transform:"translateY("+((1-ai)*40-ao*20)+"px) scale("+(0.97+ai*0.03)+")"});
  const typed=Math.round(ASK.length*seg(t,56.3,57.7));
  $("asktext").innerHTML=typed===0?'<span style="color:#a09d95">Ask Lincoln anything</span>':ASK.slice(0,typed)+(t<57.8&&Math.floor(t*3)%2===0?'<span style="color:#161614">|</span>':"");
  set($("asksend"),{opacity:0.25+0.75*seg(t,57.6,57.8),transform:"scale("+(1-0.12*Math.sin(cl((t-58)/0.16)*Math.PI)*(t>=58&&t<58.16?1:0))+")"});
  // Outlook, with the reply approved in the pane
  const oi=e5(seg(t,48.6+O,49.4+O)),oo=eio(seg(t,54.2+O,54.8+O));
  set($("omail"),{opacity:oi*(1-oo),transform:"translateY("+((1-oi)*40-oo*30)+"px)"});
  const pi=e5(seg(t,49.1+O,49.9+O));
  set($("opane"),{opacity:pi*(1-oo),transform:"translateX("+((1-pi)*60)+"px)"});
  const sc=L.op.w/380,ox=L.op.x+62*sc,oy=L.op.y+493*sc;
  const oc=e5(seg(t,51.8+O,52.35+O));const ovis=seg(t,51.3+O,51.5+O)*(1-seg(t,53.8+O,54.1+O));
  const pressO=(t>=52.5+O&&t<52.66+O)?Math.sin((t-52.5-O)/0.16*Math.PI):0;
  if(t>48.5+O&&t<54.9+O){set($("cursor"),{left:(lerp(ox+200*sc,ox,oc)-4)+"px",top:(lerp(oy+180*sc,oy,oc)-3-Math.sin(oc*Math.PI)*20)+"px",opacity:ovis,transform:"scale("+(1-0.14*pressO)+")"});
    if(t>=52.5+O&&t<53+O){const k=(t-52.5-O)/0.5;set($("ring"),{left:ox+"px",top:oy+"px",opacity:(1-k)*0.5,transform:"scale("+(0.3+k*0.9)+")"});}}
  set($("otoast"),{opacity:e5(seg(t,52.7+O,53.1+O))*(1-seg(t,54+O,54.3+O)),transform:"translateX(-50%) translateY("+((1-e5(seg(t,52.7+O,53.1+O)))*-24)+"px)"});
  // The tools
  [...$("logos").children].forEach((x,k)=>{const i=back(seg(t,55.4+O+k*0.06,56+O+k*0.06)),o=eio(seg(t,59+O,59.5+O));x.style.opacity=cl(seg(t,55.4+O+k*0.06,55.7+O+k*0.06))*(1-o);x.style.transform="translateY("+((1-i)*40)+"px) scale("+(0.9+i*0.1)+")";});
  // The close
  const ui=e5(seg(t,60+O,61.2+O)),ul=e5(seg(t,61+O,62+O)),uu=eo(seg(t,61.8+O,62.6+O));
  set($("outro"),{opacity:ui});
  set($("outro").firstElementChild,{filter:"blur("+((1-ui)*10)+"px)",transform:"scale("+(0.97+ui*0.03)+")"});
  set($("oline"),{opacity:ul,transform:"translateY("+((1-ul)*14)+"px)"});set($("ourl"),{opacity:uu});
}
window.render=render;render(0);
