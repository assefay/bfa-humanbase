// Déplacements (GCORR) — rendu des feuilles. Données lues dans Supabase (vue v_deplacements), voir sql/.
// Toutes les agrégations sont faites ici (≈ 500 alertes) : période libre, comparaison N-1, région.
// Régions et communes : découpage 2025 (data/geo_bfa.js).
// Règles GCORR (vérifiées sur unocha.my.site.com/BFARR le 24/09/2026) :
//  - une alerte = un alerte_id distinct (une alerte peut avoir plusieurs communes d'accueil = plusieurs lignes) ;
//  - les personnes sont rattachées à la RÉGION DU CHOC (commune d'origine), pas à la région d'accueil.

/* ---------- accès Supabase (clé publique, lecture seule) ---------- */
const SB_URL='https://vshnatreclfntadwcyhy.supabase.co';
const SB_KEY='sb_publishable_aNoGyj5YIlLWE9N8d0O07g_gn73kTc1';
async function sb(path){
  const r=await fetch(`${SB_URL}/rest/v1/${path}`,{headers:{apikey:SB_KEY,Authorization:'Bearer '+SB_KEY}});
  if(!r.ok) throw new Error(`${path.split('?')[0]} → HTTP ${r.status}`);
  return r.json();
}
async function sbAll(path){
  const out=[];for(let off=0;;off+=1000){const p=await sb(`${path}${path.includes('?')?'&':'?'}limit=1000&offset=${off}`);out.push(...p);if(p.length<1000)return out}
}

/* ---------- référentiels ---------- */
const MONTHS=['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc'];
const LONG=['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
// article devant le nom de région (« région du Sourou », « région de la Tapoa »)
const ART={BF47:"du ",BF60:"de la ",BF58:"de la ",BF55:"de l'"};
const regionTitle=p=>{const r=GEO.R.find(x=>x.p===p);return r?`région ${ART[p]||'du '}${r.n}`:''};
const RNAME=p=>(GEO.R.find(x=>x.p===p)||{}).n||p;
const CBY={};GEO.C.forEach(c=>CBY[c.p]=c);
const MAPW=741, MAPH_NAT=598, MAPH_REG=606;

/* ---------- état ---------- */
const today=new Date();
const iso=d=>d.toISOString().slice(0,10);
let S={du:`${today.getFullYear()}-01-01`,au:iso(today),cmp:true,lens:'national',region:null,preset:'annee'};
let ROWS=[], ASOF=null;

/* ---------- helpers ---------- */
const f=v=>Math.round(v).toLocaleString('fr-FR');
const fk=v=>v>=1e6?(v/1e6).toFixed(1).replace('.',',')+'M':v>=10000?Math.round(v/1000)+'K':v>=1000?(v/1000).toFixed(1).replace('.',',')+'K':String(Math.round(v));
const sum=(rows,k)=>rows.reduce((s,r)=>s+(+r[k]||0),0);
const shiftY=(d,n)=>{const [y,m,dd]=d.split('-').map(Number);const x=new Date(Date.UTC(y+n,m-1,dd));if(x.getUTCMonth()!==m-1)x.setUTCDate(0);return iso(x)};
const dateFr=(d,withYear=true)=>{const [y,m,dd]=d.split('-').map(Number);return `${dd===1?'1er':dd} ${LONG[m-1]}${withYear?' '+y:''}`};
const periodShort=(du,au)=>{const d=x=>x.split('-').reverse().join('/');return du.slice(0,4)===au.slice(0,4)?`${d(du).slice(0,5)} – ${d(au)}`:`${d(du)} – ${d(au)}`};
const periodLabel=(du,au)=>{const sameY=du.slice(0,4)===au.slice(0,4);return `${dateFr(du,!sameY)} – ${dateFr(au)}`};
const inRange=(r,du,au)=>r.choc_date>=du&&r.choc_date<=au;
const regOf=r=>r.org_adm1_pcode||r.arr_adm1_pcode; // région du choc ; à défaut (4 alertes 2024 sans origine), région d'accueil
const nAlertes=rows=>new Set(rows.map(r=>r.alerte_id||r.id)).size;
const rowsIn=(du,au,reg)=>ROWS.filter(r=>inRange(r,du,au)&&(!reg||regOf(r)===reg));
const prevRange=()=>[shiftY(S.du,-1),shiftY(S.au,-1)];
// liste des (année, mois) couverts par la période (24 max)
function monthsList(du,au){const out=[];let [y,m]=du.split('-').map(Number);const [y2,m2]=au.split('-').map(Number);
  while((y<y2||(y===y2&&m<=m2))&&out.length<24){out.push({y,m});m++;if(m>12){m=1;y++}}return out}
const byKey=(rows,key,val='personnes')=>{const o={};rows.forEach(r=>{const k=key(r);if(k==null)return;o[k]=(o[k]||0)+(+r[val]||0)});return o};
const cls=v=>v<=0?'c0':v<=5000?'c1':v<=10000?'c2':'c3';
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ---------- composants ---------- */
const ICON_IDP=`<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="4" r="2.6" fill="currentColor"/><path d="M8 8.5h4l2 5-1.5 1-1.8-3-.7 4 3 3.2V22h-2.2v-3l-2.6-2.4L7 22H4.8l2.4-7 .5-4.2-2 2.2L4 12l3-3.5z" fill="currentColor"/><path d="M15.5 6.5h5m0 0-2-2m2 2-2 2" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>`;
const ICON_PIN=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" fill="currentColor"/></svg>`;
function kbox(el,items){el.innerHTML=items.map(i=>`<div class="kpi ${i.cls||''}" style="color:${i.color||'var(--cur)'}">${i.icon||ICON_IDP}<div class="v">${i.v}</div><div class="l">${i.l}</div></div>`).join('')}
function kmini(el,items){el.innerHTML=items.map(i=>`<div><div class="v">${i.v}${i.d!==undefined?`<small class="d ${i.d>0?'up':i.d<0?'dn':''}">${i.d>0?'+':''}${f(i.d)}</small>`:''}</div><div class="l">${i.l}</div></div>`).join('')}
// barres appariées : rows = [{l, v, p}] ; p = valeur période précédente (undefined si pas de comparaison)
// barres appariées : une ligne par mois / région ; les deux valeurs sont alignées en colonnes à droite
// (courante | précédente) pour que la hauteur ne dépende que du nombre de lignes. En-tête = légende.
function pbars(el,rows,cmp,hdr){
  const max=Math.max(1,...rows.flatMap(r=>[r.v,cmp?r.p||0:0]));
  el.classList.toggle('one',!cmp);
  if(!rows.length){el.innerHTML=`<div class="na">Aucun déplacement enregistré sur la période</div>`;return}
  const H=hdr||{};
  el.innerHTML=`<div class="r hd"><span></span><span></span><span class="n c"><i></i>${H.c||''}</span>${cmp?`<span class="n p"><i></i>${H.p||''}</span>`:''}</div>`+
   rows.map(r=>`<div class="r"><span class="l" title="${esc(r.l)}">${esc(r.l)}</span><span class="bars">
    <span class="b" style="--w:${(r.v/max).toFixed(3)}"><i></i></span>${cmp?`<span class="b p" style="--w:${((r.p||0)/max).toFixed(3)}"><i></i></span>`:''}</span>
    <span class="n c">${r.v?fk(r.v):'–'}</span>${cmp?`<span class="n p">${r.p?fk(r.p):'–'}</span>`:''}</div>`).join('');
}
function hbars(el,items){const max=Math.max(1,...items.map(i=>i.v));
  el.innerHTML=items.length?items.map(i=>`<div class="r"><span class="n" title="${esc(i.l)}">${esc(i.l)}</span><span class="b" style="--w:${(i.v/max).toFixed(3)}"><i></i><span>${fk(i.v)}</span></span></div>`).join(''):`<div class="na">Aucune commune d'accueil</div>`}
const colHdr=()=>{const [pdu,pau]=prevRange();const y1=S.du.slice(0,4),y2=S.au.slice(0,4);return y1===y2?{c:y1,p:String(+y1-1)}:{c:'Période',p:'N-1'}};
const keyCmp=(du,au,cmp)=>`<span><i style="background:var(--cur)"></i>${periodLabel(du,au)}</span>${cmp?`<span><i style="background:var(--prev)"></i>${periodLabel(...prevRange())}</span>`:''}`;
const LEG=`<span><i style="background:var(--none)"></i>Aucun</span><span><i style="background:var(--b1)"></i>1 – 5 000</span><span><i style="background:var(--b2)"></i>5 001 – 10 000</span><span><i style="background:var(--b3)"></i>10 001 et plus</span>`;
const ARROW=(id,k)=>`<defs><marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="var(--flow)"/></marker></defs>`;
const flowSvg=`<svg viewBox="0 0 22 12"><defs><marker id="mk-key" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#ED1847"/></marker></defs><path d="M2,6 H16" stroke="#ED1847" stroke-width="1.6" marker-end="url(#mk-key)" fill="none"/></svg>`;
const loopSvg=`<svg viewBox="0 0 22 12"><path d="M8,9 A4.5,4.5 0 1 1 13.5,5" stroke="#ED1847" stroke-width="1.6" fill="none" marker-end="url(#mk-key)"/></svg>`;

/* ---------- cartes ---------- */
// Carte nationale : communes d'accueil en bleus, régions sans déplacement grisées, contours des régions.
function mapNational(el,byCommune,offRegions,height){
  const vb=[0,0,GEO.W,GEO.H], scale=Math.min(MAPW/vb[2],height/vb[3]), fl=10/scale, fc=7/scale;
  const paths=GEO.C.map(c=>{const v=byCommune[c.p]||0;const off=offRegions.has(c.r)&&!v;
    return `<path class="${off?'off':cls(v)} hit" d="${c.d}" data-k="${c.p}"><title>${c.n} — ${v?f(v)+' PDI':'aucun'}</title></path>`}).join('');
  const labels=GEO.C.filter(c=>byCommune[c.p]>0).map(c=>{const v=byCommune[c.p];return `<text class="c ${v>10000?'dk':''}" x="${c.c[0]}" y="${c.c[1]+fc*0.35}" font-size="${fc.toFixed(2)}">${c.n}</text>`}).join('');
  const rlabels=GEO.R.map(r=>`<text x="${r.c[0]}" y="${r.c[1]-fl*0.6}" font-size="${fl.toFixed(2)}" ${offRegions.has(r.p)?'fill="#8C96A0"':''}>${r.n}</text>`).join('');
  el.innerHTML=`<svg class="map" style="height:${height}px;--k:1" viewBox="${vb.join(' ')}" preserveAspectRatio="xMidYMid meet" role="img">${paths}
    ${GEO.R.map(r=>`<path class="r" d="${r.d}"/>`).join('')}<path class="a0" d="${GEO.A0}"/>${rlabels}${labels}</svg>`;
  el.querySelectorAll('path.hit').forEach(p=>p.addEventListener('click',()=>{const c=CBY[p.dataset.k];if(c){S.region=c.r;setLens('region')}}));
}
// Carte régionale : communes de la région en bleus, voisines en gris clair, flèches origine → accueil.
function mapRegion(el,reg,byCommune,flows,height){
  const R=GEO.R.find(r=>r.p===reg);if(!R){el.innerHTML='';return}
  let [x0,y0,x1,y1]=bbox(R.d);
  // élargit la fenêtre aux communes d'origine hors région (flèches entrantes), sans dépasser 40 % de la taille de la région
  const lim=Math.max(x1-x0,y1-y0)*0.4;
  flows.forEach(fl=>[CBY[fl.org],CBY[fl.arr]].forEach(a=>{if(!a||a.r===reg)return;const [x,y]=a.c;
    x0=Math.max(x0-lim,Math.min(x0,x-4));x1=Math.min(x1+lim,Math.max(x1,x+4));y0=Math.max(y0-lim,Math.min(y0,y-4));y1=Math.min(y1+lim,Math.max(y1,y+4))}));
  const pad=Math.max(x1-x0,y1-y0)*0.06;
  let vb=[x0-pad,y0-pad,x1-x0+2*pad,y1-y0+2*pad];
  // ajuste la fenêtre au ratio du cadre pour que la région remplisse l'espace
  const ratio=MAPW/height;if(vb[2]/vb[3]<ratio){const w=vb[3]*ratio;vb[0]-=(w-vb[2])/2;vb[2]=w}else{const h=vb[2]/ratio;vb[1]-=(h-vb[3])/2;vb[3]=h}
  const scale=MAPW/vb[2], k=1/scale, fl=10*k, fc=7.5*k, fp=8.5*k;
  const inside=c=>c.r===reg, host=c=>byCommune[c.p]>0;
  const vis=c=>{const [a,b,c2,d]=bbox(c.d);return c2>=vb[0]&&a<=vb[0]+vb[2]&&d>=vb[1]&&b<=vb[1]+vb[3]};
  const paths=GEO.C.filter(vis).map(c=>{const v=byCommune[c.p]||0;
    return `<path class="${inside(c)||v?cls(v):'out'} ${inside(c)||v?'hit':''}" d="${c.d}" data-k="${c.p}"><title>${c.n} — ${v?f(v)+' PDI':'aucun'}</title></path>`}).join('');
  const prov=GEO.P.filter(p=>p.r===reg);
  const provPaths=prov.map(p=>`<path class="pv" d="${p.d}"/>`).join('');
  const provLabels=prov.map(p=>`<text x="${p.c[0]}" y="${p.c[1]}" font-size="${fp.toFixed(2)}">${p.n}</text>`).join('');
  const labels=GEO.C.filter(c=>inside(c)||host(c)).map(c=>{const v=byCommune[c.p]||0;
    return `<text class="c ${v>10000?'dk':v?'':'mute'}" x="${c.c[0]}" y="${c.c[1]+fc*0.35}" font-size="${fc.toFixed(2)}">${c.n}</text>`}).join('');
  const nb=GEO.R.filter(r=>r.p!==reg&&vis(r)).map(r=>`<text class="nb" x="${r.c[0]}" y="${r.c[1]}" font-size="${fl.toFixed(2)}">${r.n}</text>`).join('');
  const mid=`mk-${reg}-${Math.random().toString(36).slice(2,6)}`;
  const sw=1.7*k;
  const arrows=flows.map(fl=>{const a=CBY[fl.org],b=CBY[fl.arr];if(!b)return'';
    if(!a||fl.org===fl.arr){const r=6*k,[cx,cy]=b.c;return `<path class="loop" stroke-width="${sw}" d="M${cx-r},${cy+r*0.4} A${r},${r} 0 1 1 ${cx+r*0.8},${cy-r*0.55}" marker-end="url(#${mid})"><title>${b.n} : déplacement interne à la commune (${f(fl.v)})</title></path>`}
    return `<path class="flow" stroke-width="${sw}" d="M${a.c[0]},${a.c[1]} L${b.c[0]},${b.c[1]}" marker-end="url(#${mid})"><title>${a.n} → ${b.n} (${f(fl.v)})</title></path>`}).join('');
  const shocks=[...new Set(flows.map(x=>x.org).filter(Boolean))].map(p=>{const c=CBY[p];return c?`<circle class="shock" cx="${c.c[0]}" cy="${c.c[1]}" r="${2.4*k}" stroke-width="${0.8*k}"><title>Commune de choc : ${c.n}</title></circle>`:''}).join('');
  el.innerHTML=`<svg class="map" style="height:${height}px;--k:${k.toFixed(3)}" viewBox="${vb.map(v=>v.toFixed(1)).join(' ')}" preserveAspectRatio="xMidYMid meet" role="img">${ARROW(mid)}
    ${paths}${provPaths}${GEO.R.map(r=>`<path class="r ${r.p===reg?'sel':''}" d="${r.d}"/>`).join('')}${nb}${provLabels}${labels}${arrows}${shocks}</svg>
    <svg class="locator" viewBox="0 0 ${GEO.W} ${GEO.H}">${GEO.R.map(r=>`<path class="${r.p===reg?'sel':''}" d="${r.d}"/>`).join('')}</svg>`;
}
function bbox(d){let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;d.replace(/(-?[\d.]+),(-?[\d.]+)/g,(m,x,y)=>{x=+x;y=+y;if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y});return[x0,y0,x1,y1]}

/* ---------- feuille nationale ---------- */
function renderNational(){
  const cur=rowsIn(S.du,S.au), [pdu,pau]=prevRange(), prev=S.cmp?rowsIn(pdu,pau):[];
  const P=sum(cur,'personnes'), PP=sum(prev,'personnes');
  kbox(document.getElementById('n-kpis'),[
    {v:f(P),l:`Personnes déplacées<br><b>${periodShort(S.du,S.au)}</b>`},
    ...(S.cmp?[{v:f(PP),l:`Même période ${colHdr().p==='N-1'?'N-1':colHdr().p}<br><b>${periodShort(pdu,pau)}</b>`,cls:'prev',color:'var(--prev)'}]:[])]);
  const communes=new Set(cur.filter(r=>r.arr_pcode).map(r=>r.arr_pcode)), regions=new Set(cur.map(regOf).filter(Boolean));
  kmini(document.getElementById('n-mini'),[
    {v:f(sum(cur,'menages')),l:'Ménages',d:S.cmp?sum(cur,'menages')-sum(prev,'menages'):undefined},
    {v:f(nAlertes(cur)),l:'Alertes',d:S.cmp?nAlertes(cur)-nAlertes(prev):undefined},
    {v:f(communes.size),l:"Communes d'accueil"},{v:f(regions.size),l:'Régions'}]);
  // mensuel
  const ml=monthsList(S.du,S.au), oneYear=ml.every(x=>x.y===ml[0].y);
  const cm=byKey(cur,r=>`${r.annee}-${r.mois}`), pm=byKey(prev,r=>`${r.annee+1}-${r.mois}`);
  pbars(document.getElementById('n-months'),ml.map(x=>({l:MONTHS[x.m-1]+(oneYear?'':' '+String(x.y).slice(2)),v:cm[`${x.y}-${x.m}`]||0,p:pm[`${x.y}-${x.m}`]||0})),S.cmp,colHdr());
  // régional
  const cr=byKey(cur,regOf), pr=byKey(prev,regOf);
  const regs=[...new Set([...Object.keys(cr),...Object.keys(pr)])].map(p=>({l:RNAME(p),v:cr[p]||0,p:pr[p]||0})).sort((a,b)=>b.v-a.v||b.p-a.p);
  pbars(document.getElementById('n-regions'),regs,S.cmp,colHdr());
  // carte
  const bc=byKey(cur,r=>r.arr_pcode);
  const off=new Set(GEO.R.map(r=>r.p).filter(p=>!cr[p]));
  mapNational(document.getElementById('n-map'),bc,off,MAPH_NAT);
  document.getElementById('n-map-note').textContent='cliquer une commune → sa région';
  document.getElementById('n-legend').innerHTML=LEG+`<span><i style="background:var(--off)"></i>Régions sans déplacement enregistré</span>`;
}

/* ---------- feuille région (el = article.paper) ---------- */
function renderRegion(el,reg){
  const q=k=>el.querySelector(`[data-r="${k}"]`);
  const cur=rowsIn(S.du,S.au,reg), [pdu,pau]=prevRange(), prev=S.cmp?rowsIn(pdu,pau,reg):[];
  const org=new Set(cur.map(r=>r.org_pcode).filter(Boolean)), arr=new Set(cur.map(r=>r.arr_pcode).filter(Boolean));
  kbox(q('kpis'),[
    {v:f(sum(cur,'personnes')),l:`Personnes déplacées<br><b>${periodShort(S.du,S.au)}</b>`},
    ...(S.cmp?[{v:f(sum(prev,'personnes')),l:`Même période ${colHdr().p}<br><b>${periodShort(pdu,pau)}</b>`,cls:'prev',color:'var(--prev)'}]:[])]);
  kmini(q('mini'),[
    {v:f(sum(cur,'menages')),l:'Ménages',d:S.cmp?sum(cur,'menages')-sum(prev,'menages'):undefined},
    {v:f(nAlertes(cur)),l:'Alertes',d:S.cmp?nAlertes(cur)-nAlertes(prev):undefined},
    {v:f(org.size),l:"Communes d'origine"},{v:f(arr.size),l:"Communes d'accueil"}]);
  const ml=monthsList(S.du,S.au), oneYear=ml.every(x=>x.y===ml[0].y);
  const cm=byKey(cur,r=>`${r.annee}-${r.mois}`), pm=byKey(prev,r=>`${r.annee+1}-${r.mois}`);
  pbars(q('months'),ml.map(x=>({l:MONTHS[x.m-1]+(oneYear?'':' '+String(x.y).slice(2)),v:cm[`${x.y}-${x.m}`]||0,p:pm[`${x.y}-${x.m}`]||0})),S.cmp,colHdr());
  const bc=byKey(cur,r=>r.arr_pcode);
  hbars(q('top'),Object.entries(bc).map(([p,v])=>({l:(CBY[p]||{}).n||p,v})).sort((a,b)=>b.v-a.v).slice(0,5));
  // flux origine → accueil (agrégés par couple)
  const fm={};cur.forEach(r=>{if(!r.arr_pcode)return;const k=(r.org_pcode||'?')+'>'+r.arr_pcode;fm[k]=fm[k]||{org:r.org_pcode,arr:r.arr_pcode,v:0};fm[k].v+=+r.personnes||0});
  mapRegion(q('map'),reg,bc,Object.values(fm),MAPH_REG);
  q('note').textContent=`${f(org.size)} commune${org.size>1?'s':''} de choc · ${f(Object.keys(fm).length)} flux`;
  q('legend').innerHTML=LEG+`<span>${loopSvg}Déplacement interne à la commune</span><span>${flowSvg}Entre communes</span><span><svg viewBox="0 0 22 12"><circle cx="11" cy="6" r="3.5" fill="#ED1847" stroke="#fff"/></svg>Commune de choc</span>`;
}

/* ---------- feuille alertes ---------- */
function renderAlertes(){
  const cur=rowsIn(S.du,S.au).sort((a,b)=>b.choc_date<a.choc_date?-1:1);
  kmini(document.getElementById('a-mini'),[{v:f(nAlertes(cur)),l:'Alertes'},{v:f(sum(cur,'personnes')),l:'Personnes déplacées'},{v:f(sum(cur,'menages')),l:'Ménages'},{v:f(new Set(cur.map(r=>r.arr_pcode).filter(Boolean)).size),l:"Communes d'accueil"}]);
  const sevCls=s=>/élev|haut|high|forte/i.test(s||'')?'h':/faib|low/i.test(s||'')?'l':'';
  document.getElementById('a-table').innerHTML=cur.length?`<table><thead><tr><th>Date du choc</th><th>Type de choc</th><th>Sévérité</th><th>Origine</th><th>Accueil</th><th class="n">Ménages</th><th class="n">Personnes</th><th class="n">H · F · G · F</th><th>Besoins prioritaires</th></tr></thead><tbody>
    ${cur.map(r=>`<tr class="${r.arr_non_resolue?'nr':''}"><td class="d">${r.choc_date.split('-').reverse().join('/')}</td><td>${esc(r.type_choc)}</td><td>${r.severite?`<span class="sev ${sevCls(r.severite)}">${esc(r.severite)}</span>`:''}</td>
      <td>${esc(r.org_commune||'—')}<br><small>${r.org_adm1_pcode?RNAME(r.org_adm1_pcode):''}</small></td><td><b>${esc(r.arr_commune)}</b><br><small>${esc(RNAME(r.arr_adm1_pcode))}${r.villages_arrivee?' · '+esc(r.villages_arrivee):''}</small></td>
      <td class="n">${f(r.menages||0)}</td><td class="n"><b>${f(r.personnes||0)}</b></td><td class="n">${[r.hommes,r.femmes,r.garcons,r.filles].map(v=>v==null?'–':f(v)).join(' · ')}</td><td class="desc">${esc(r.besoins_prioritaires||'')}</td></tr>`).join('')}</tbody></table>`
    :`<div class="na">Aucune alerte sur la période</div>`;
}

/* ---------- chrome / état ---------- */
function setLens(l){S.lens=l;document.querySelectorAll('.lens button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.lens===l));render()}
function applyPreset(p){S.preset=p;const y=today.getFullYear(),m=today.getMonth();
  if(p==='annee'){S.du=`${y}-01-01`;S.au=iso(today)}
  else if(p==='mois'){S.du=iso(new Date(Date.UTC(y,m,1)));S.au=iso(today)}
  render()}
function heads(){
  const asof=ASOF?` (données au ${dateFr(ASOF)})`:'';
  document.querySelectorAll('.paper').forEach(p=>{
    const reg=p.dataset.region||S.region;
    const h=p.querySelector('.head h1');
    h.innerHTML=p.dataset.lens==='region'?`BURKINA FASO<small> : ${regionTitle(reg)}</small>`:'BURKINA FASO';
    p.querySelector('.lensname').textContent=p.dataset.title;
    p.querySelector('.period').textContent=periodLabel(S.du,S.au)+(S.cmp&&p.dataset.lens!=='alertes'?` · comparé à ${periodLabel(...prevRange())}`:'');
    p.querySelector('.foot .src').innerHTML=`<b>Date de création :</b> ${new Date().toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})} &nbsp; <b>Source :</b> GCORR${asof} &nbsp; <b>Feedback :</b> ocha-bfa@un.org &nbsp; www.unocha.org/burkina-faso`;
  });
}
function render(){
  document.querySelectorAll('#sheets .paper').forEach(p=>p.classList.toggle('on',p.dataset.lens===S.lens));
  document.getElementById('pick-region').hidden=S.lens!=='region';
  document.querySelectorAll('#presets button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.preset===S.preset));
  document.getElementById('d-du').value=S.du;document.getElementById('d-au').value=S.au;document.getElementById('chk-cmp').checked=S.cmp;
  // régions : celles avec déplacement sur la période d'abord, avec leur effectif
  const cr=byKey(rowsIn(S.du,S.au),regOf);
  const opts=[...GEO.R].sort((a,b)=>(cr[b.p]||0)-(cr[a.p]||0)||a.n.localeCompare(b.n));
  if(!S.region||!GEO.R.find(r=>r.p===S.region))S.region=opts[0].p;
  document.getElementById('sel-region').innerHTML=opts.map(r=>`<option value="${r.p}">${r.n}${cr[r.p]?` (${f(cr[r.p])})`:''}</option>`).join('');
  document.getElementById('sel-region').value=S.region;
  heads();
  if(S.lens==='national')renderNational();
  else if(S.lens==='region')renderRegion(document.getElementById('paper-region'),S.region);
  else renderAlertes();
  location.hash=`du=${S.du}&au=${S.au}&cmp=${S.cmp?1:0}&vue=${S.lens}&region=${S.region}`;
  fit();
}
function presetOf(du,au){const y=today.getFullYear(),m=today.getMonth();if(au!==iso(today))return 'perso';
  if(du===`${y}-01-01`)return 'annee';if(du===iso(new Date(Date.UTC(y,m,1))))return 'mois';return 'perso'}
function readHash(){const h=new URLSearchParams(location.hash.slice(1));
  if(h.get('du')&&h.get('au')){S.du=h.get('du');S.au=h.get('au');S.preset=presetOf(S.du,S.au)}
  if(h.has('cmp'))S.cmp=h.get('cmp')==='1';if(h.get('vue'))S.lens=h.get('vue');if(h.get('region'))S.region=h.get('region');
  document.querySelectorAll('.lens button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.lens===S.lens));}

/* ---------- squelette des feuilles ---------- */
function dressPaper(p){
  p.insertAdjacentHTML('afterbegin',`<div class="head"><div><h1>BURKINA FASO</h1><div class="sub">Les nouveaux déplacements</div></div><div class="right"><div class="lensname"></div><div class="period"></div></div></div>`);
  p.insertAdjacentHTML('beforeend',`<div class="foot"><span>Les désignations et les limites administratives utilisées n'impliquent pas une reconnaissance officielle par l'Organisation des Nations Unies. Découpage administratif 2025 (17 régions).</span><span class="src"></span></div>`);
}
document.querySelectorAll('.paper').forEach(dressPaper);
document.querySelectorAll('.lens button').forEach(b=>b.addEventListener('click',()=>setLens(b.dataset.lens)));
document.querySelectorAll('#presets button').forEach(b=>b.addEventListener('click',()=>applyPreset(b.dataset.preset)));
document.getElementById('d-du').addEventListener('change',e=>{if(e.target.value){S.du=e.target.value;if(S.au<S.du)S.au=S.du;S.preset=presetOf(S.du,S.au);render()}});
document.getElementById('d-au').addEventListener('change',e=>{if(e.target.value){S.au=e.target.value;if(S.du>S.au)S.du=S.au;S.preset=presetOf(S.du,S.au);render()}});
document.getElementById('chk-cmp').addEventListener('change',e=>{S.cmp=e.target.checked;render()});
document.getElementById('sel-region').addEventListener('change',e=>{S.region=e.target.value;render()});
window.addEventListener('beforeprint',()=>{const ps=[...document.querySelectorAll('.paper')];ps.forEach(p=>p.classList.remove('last'));
  const vis=ps.filter(p=>getComputedStyle(p).display!=='none'||document.body.classList.contains('all'));if(vis.length)vis[vis.length-1].classList.add('last')});
document.getElementById('btn-print').addEventListener('click',()=>window.print());
// Tout imprimer : national + une feuille par région ayant enregistré des déplacements sur la période (ordre décroissant) + alertes
document.getElementById('btn-print-all').addEventListener('click',()=>{
  const cr=byKey(rowsIn(S.du,S.au),regOf);
  const regs=Object.keys(cr).sort((a,b)=>cr[b]-cr[a]);
  const host=document.getElementById('all-regions');host.innerHTML='';host.hidden=false;
  const tpl=document.getElementById('paper-region');
  const sheets=document.getElementById('sheets');
  const clones=regs.map(p=>{const c=tpl.cloneNode(true);c.id='';c.dataset.region=p;c.classList.add('on','clone');sheets.insertBefore(c,document.querySelector('.paper[data-lens="alertes"]'));return c});
  tpl.classList.add('skip');
  renderNational();clones.forEach(c=>renderRegion(c,c.dataset.region));renderAlertes();heads();
  document.body.classList.add('all');
  setTimeout(()=>window.print(),80);
});
// après impression : retirer les feuilles régionales clonées et revenir à la vue courante
window.addEventListener('afterprint',()=>{if(!document.body.classList.contains('all'))return;document.body.classList.remove('all');document.querySelectorAll('.paper.clone').forEach(c=>c.remove());document.getElementById('paper-region').classList.remove('skip');document.getElementById('all-regions').hidden=true;render()});
// la colonne de gauche doit tenir dans la feuille : on réduit la hauteur des lignes des graphiques si besoin
function fitCols(){document.querySelectorAll('.paper .col').forEach(col=>{
  if(!col.offsetParent)return;col.style.setProperty('--rh','15px');
  for(let h=15;h>=9&&col.scrollHeight>col.clientHeight+1;h--)col.style.setProperty('--rh',h+'px')})}
function fit(){fitCols();const st=document.getElementById('stage'),sh=document.getElementById('sheets');const w=st.clientWidth-32;const s=Math.min(1,w/1123);sh.style.transform=`scale(${s})`;
  const on=[...document.querySelectorAll('.paper.on')];const h=on.reduce((a,p)=>a+p.offsetHeight,0)+18*(on.length-1);st.style.height=(h*s+44)+'px'}
addEventListener('resize',fit);

/* ---------- démarrage ---------- */
async function boot(){
  const st=document.getElementById('status');st.textContent='Chargement…';
  try{
    ROWS=await sbAll('v_deplacements?select=id,alerte_id,choc_date,annee,mois,type_choc,severite,description,besoins_prioritaires,arr_pcode,arr_commune,arr_province,arr_adm1_pcode,arr_region,villages_arrivee,org_pcode,org_commune,org_region,org_adm1_pcode,menages,personnes,hommes,femmes,garcons,filles,intra_regional,arr_non_resolue,org_non_resolue&order=choc_date');
    ASOF=ROWS.reduce((m,r)=>r.choc_date>m?r.choc_date:m,'');
    readHash();render();st.textContent='';
  }catch(e){st.textContent='Erreur de chargement : '+e.message;console.error(e)}
}
boot();
