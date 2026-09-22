// Bilan interactif 2026 — rendu des feuilles. Données juillet 2026 inline (maquette v8) ; à remplacer bloc par bloc par les vues Supabase.
/* ---------- data: July 2026 from bfa-humanbase ---------- */
const MONTHS=['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc'];
const LONG=['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const SERIES=[275647,451963,650640,786865,926908,962728,1065878];
const BASE=6; let month=BASE;
const G={cible:2651923,prioC:1130332,prioA:404015,req:658.5,fin:126.7,paid:72.5,commit:53.7,pledge:0.5,asof:'18 septembre 2026'};
const CL=[
 {k:'SECAL',n:'Sécurité alimentaire',c:1532390,a:715364,c4:923206,a4:385522,req:207.2,fin:23.3},
 {k:'WASH',n:'EHA',c:1518657,a:227909,c4:503178,a4:66609,req:92.6,fin:2.5},
 {k:'SANTE',n:'Santé',c:1349273,a:604422,c4:669482,a4:117597,req:54.0,fin:11.1},
 {k:'PRO',n:'Protection',c:1233594,a:275144,c4:345534,a4:33753,req:103.0,fin:18.1},
 {k:'EDU',n:'Éducation',c:807338,a:187967,c4:241941,a4:85415,req:38.6,fin:8.1},
 {k:'NUT',n:'Nutrition',c:583359,a:267782,c4:143792,a4:101942,req:40.5,fin:8.3},
 {k:'ABRIS',n:'Abris/AME',c:516502,a:65936,c4:309001,a4:9659,req:37.9,fin:4.5},
 {k:'GSAT',n:'GSAT',c:438140,a:140737,c4:280215,a4:1610,req:7.5,fin:0.4},
 {k:'REF',n:'Réfugiés',c:41979,a:13720,c4:28233,a4:9544,req:47.2,fin:12.0},
];
// FTS 2026 as of 18 Sept: clusters without reach data + reconciliation lines
const FIN_EXTRA=[{k:'LOG',n:'Logistique',req:23.6,fin:9.9},{k:'COORD',n:'Coordination',req:6.4,fin:3.2},{n:'Multi-clusters',req:0,fin:9.0,rec:true},{n:'Non rapporté',req:0,fin:15.7,rec:true}];
const DONORS=[['ECHO (Commission européenne)',41.1],['Allemagne',12.9],['Belgique',6.9],['Danemark',6.5],['Canada',6.4],['Suède',5.4],['États-Unis',5.3],['Suisse',5.3],['Italie',4.8],['Norvège',4.3]];
const DEST=[['ONG internationales',57.1],['Agences des Nations Unies',45.8],['Fonds communs (RHPF)',14.2],['ONG affiliées internationales',6.4],['ONG nationales / OSC',2.9]];
const STATUS=[['Contributions versées',72.5],['Engagements',53.7],['Promesses',0.5]];
// FTS 2026 (as of 18 Sept), single-cluster incoming flows, USD M — top donors (d) and recipient organisations (r)
const FTS={
 PLAN:{d:[['ECHO (Commission européenne)',41.1],['Allemagne',12.9],['Belgique',6.9],['Danemark',6.5],['Canada',6.4],['Suède',5.4],['États-Unis',5.3],['Suisse',5.3],['Italie',4.8],['Norvège',4.3]],
       r:[['PAM',20.27],['Fonds humanitaire régional (FH)',14.23],['HCR',11.94],['ACF',8.0],['UNICEF',6.94],['INTERSOS',6.25],['ONG internationales (confid.)',4.6],['ALIMA',4.4],['PUI',4.2],['NRC',3.7]]},
 SECAL:{d:[['ECHO',12.04],['Danemark',3.06],['Allemagne',2.94],['Canada',1.09],['Arabie saoudite',0.84],['Autriche',0.78]],r:[['PAM',10.92],['ACF',3.7],['Oxfam Intermón',1.66],['Welthungerhilfe',1.39],['PUI',1.19],['Caritas Autriche',0.78]]},
 WASH:{d:[['ECHO',1.98],['Italie',0.32],['SIDA (Suède)',0.08],['Fondation Staehelin',0.08],['Qatar Charity',0.04]],r:[['Solidarités Int.',0.7],['PUI',0.59],['Oxfam Intermón',0.39],['Progettomondo',0.32],['ACF',0.32],['ONGI (confid.)',0.08]]},
 SANTE:{d:[['ECHO',6.34],['Stichting Vluchteling',2.32],['Corée du Sud',0.66],['Allemagne',0.54],['SIDA (Suède)',0.51],['Fondation Staehelin',0.31]],r:[['ALIMA',3.14],['INTERSOS',2.32],['PUI',1.7],['OMS',1.54],['ONGI (confid.)',0.82],['UNFPA',0.66]]},
 PRO:{d:[['États-Unis',4.44],['Italie',3.22],['ECHO',1.94],['Allemagne',1.12],['Suisse',1.11],['Danemark',1.03]],r:[['HCR',4.71],['INTERSOS',3.94],['ONGI (confid.)',2.25],['Save the Children',1.07],['UNFPA',0.94],['DRC',0.79]]},
 EDU:{d:[['ECHO',3.8],['Japon',2.27],['UNICEF Espagne',0.66],['Chaîne du Bonheur',0.51],['Italie',0.39],['Allemagne',0.19]],r:[['GPE',2.27],['UNICEF',2.22],['Save the Children',1.1],['NRC',0.81],['Enfants du Monde',0.51],['Educo',0.47]]},
 NUT:{d:[['ECHO',3.26],['Suisse',2.06],['Canada',1.31],['AICS (Italie)',0.56],['États-Unis',0.5],['UNICEF Allemagne',0.35]],r:[['UNICEF',3.32],['ONG nationales (confid.)',1.59],['ALIMA',1.17],['ACF',0.58],['Progettomondo',0.56],['PUI',0.35]]},
 ABRIS:{d:[['ECHO',1.62],['AICS (Italie)',0.88],['Arabie saoudite',0.79],['SIDA (Suède)',0.75],['Suisse',0.43]],r:[['HCR',1.76],['COOPI',0.88],['NRC',0.75],['ACF',0.66],['ONGI (confid.)',0.24],['Solidarités Int.',0.19]]},
 GSAT:{d:[['Tearfund',0.03]],r:[['ODE',0.03]]},
 REF:{d:[['Canada',3.3],['Allemagne',3.09],['Belgique',2.1],['ECHO',1.07],['Japon',1.0],['Italie',0.28]],r:[['HCR',4.73],['CARE Canada',2.0],['Oxfam Belgique',0.93],['Oxfam Canada',0.86],['CARITAS',0.65],['ONGI (confid.)',0.62]]},
 LOG:{d:[['ECHO',8.05],['Suisse',1.41],['Luxembourg',0.48]],r:[['PAM',9.33],['ACF',0.62]]},
 COORD:{d:[['OCHA',1.5],['ECHO',0.56],['Suède',0.55],['Allemagne',0.35],['Canada',0.14]],r:[['OCHA',2.75],['UNICEF',0.44]]},
};
// key indicators per cluster: [label, cible, réalisé] — national, Bilan T2 (30 juin 2026)
const IND={
 SECAL:[['Personnes bénéficiant d\'une aide alimentaire régulière (en nature)',1500000,585000],['Ménages bénéficiant d\'un réapprovisionnement en animaux',15000,293],['Ménages bénéficiant d\'un soutien en maraîchage',18000,1000]],
 WASH:[['Personnes ayant un accès durable à au moins 15 l/j/p d\'eau aux normes de qualité',1500000,168000],['Personnes ayant un accès sécurisé et adéquat à des latrines fonctionnelles',900000,43000],['Personnes ayant bénéficié d\'activités de promotion à l\'hygiène',1100000,71000]],
 SANTE:[['Bénéficiaires de consultations curatives en ambulatoire',394000,310000],['Accouchements assistés par un personnel qualifié',81000,46000],['Enfants pris en charge par des agents communautaires (PCIME-c)',111000,6000]],
 PRO:[['Enfants, adolescents et parents bénéficiant de services SMSPS dans les espaces amis',682000,180000],['Personnes vulnérables ayant reçu une assistance individuelle de protection',420000,10000],['Femmes et filles ayant bénéficié d\'activités de bien-être dans les espaces sûrs',366000,8000],['Personnes formées sur les droits LTB',155000,2000]],
 EDU:[['Enfants en âge scolaire ayant accès à l\'éducation formelle et non formelle',807000,186000],['Enfants ayant reçu des fournitures scolaires',365000,62000],['Enfants suivis par un enseignant formé à l\'appui psychosocial',90000,96000]],
 NUT:[['Enfants 6-59 mois souffrant de MAS avec complications admis pour traitement',55000,16000],['Enfants 6-59 mois souffrant de MAS admis en ambulatoire',91000,30000],['Femmes enceintes et allaitantes souffrant de MAM admises pour traitement',39000,18000]],
 ABRIS:[['Ménages ayant bénéficié d\'une distribution de kits AME',52000,11000],['Ménages ayant reçu une solution d\'abri d\'urgence (6 mois – 1 an)',52000,800],['Ménages ayant bénéficié de travaux d\'abris transitionnels (1 an et plus)',103000,4000]],
 GSAT:[['SAT et ZAD couverts par un suivi multisectoriel régulier',150,150],['Personnes déplacées vivant dans les SAT/ZAD bénéficiant de la gestion des sites',205000,135000],['Sites avec mécanismes fonctionnels de plaintes et retour d\'information',150,3]],
 // REF: pas encore d'indicateurs en base → « non disponible »
};
let finSel='PLAN';
// reached, disaggregated — national, Bilan T2 (30 juin 2026); null = non disponible
const DIS={
 SECAL:{pg:[294000,69000,252000],age:[311000,253000,42000]},
 WASH:{pg:[203000,4000,null],age:[121000,86000,0]},
 SANTE:{pg:[293000,6000,230000],age:null},
 PRO:{pg:[188000,1000,86000],age:[200000,69000,5000]},
 EDU:{pg:[89000,528,96000],age:[186000,0,0]},
 NUT:{pg:null,age:null},
 ABRIS:{pg:[43000,673,2000],age:[25000,18000,2000]},
 GSAT:{pg:[135000,null,null],age:[74000,54000,7000]},
 REF:{pg:null,age:null},
};
function disagg(el,c){
  const d=DIS[c.k]||{};const mk=(vals,labels,cls)=>{if(!vals||vals.every(v=>v===null))return{bar:`<span class="st nd">non disponible</span>`,lg:''};
    const v=vals.map(x=>x||0),t=v.reduce((a,b)=>a+b,0)||1;
    return{bar:`<span class="st">${v.map((x,i)=>{const p=x/t*100;return p?`<i class="${cls}${i+1}" style="flex:${p}">${p>=12?Math.round(p)+'%':''}</i>`:''}).join('')}</span>`,
           lg:`<div class="lg">${labels.map((l,i)=>`<span><i class="${cls}${i+1}" style="background:${{k1:'#0074B7',k2:'#64BDEA',k3:'#C5DFEF',a1:'#338C46',a2:'#72BF44',a3:'#CEE3A0'}[cls+(i+1)]}"></i>${l} <b>${vals[i]===null?'ND':fk(vals[i])}</b></span>`).join('')}</div>`}};
  const pg=mk(d.pg,['PDI','Retournés','Non-déplacés'],'k'),ag=mk(d.age,['Enfants (0-17)','Adultes (18-64)','Pers. âgées (65+)'],'a');
  el.innerHTML=`<div class="t">Personnes atteintes — désagrégation <small>national, au 30 juin</small></div>
  <div class="r"><span class="l">Statut</span>${pg.bar}</div>${pg.lg}
  <div class="r"><span class="l">Âge</span>${ag.bar}</div>${ag.lg}`;
}
const SEV={SECAL:[1,40,59],WASH:[0,76,24],SANTE:[4,77,19],PRO:[10,78,12],EDU:[13,67,20],NUT:[0,74,26],ABRIS:[11,69,21],GSAT:[0,99,1],REF:[0,70,30],INT:[6,55,40]};
const PV=[
 ['Bankui','Balé',2,0,10724],['Bankui','Banwa',3,61600,25754],['Bankui','Mouhoun',3,51583,16646],
 ['Djôrô','Bougouriba',2,0,1797],['Djôrô','Ioba',2,0,1],['Djôrô','Noumbiel',2,0,0],['Djôrô','Poni',3,53172,2939],
 ['Goulmou','Gourma',3,122357,36435],['Goulmou','Kompienga',4,79272,19518],
 ['Guiriko','Houet',2,4412,6773],['Guiriko','Kénédougou',3,31346,373],['Guiriko','Tuy',3,43871,5074],
 ['Kadiogo','Kadiogo',2,4850,2799],
 ['Koulsé','Bam',3,109126,62720],['Koulsé','Namentenga',3,135207,63263],['Koulsé','Sandbondtenga',3,271322,90270],
 ['Liptako','Oudalan',4,86768,35457],['Liptako','Séno',4,177723,64880],['Liptako','Yagha',4,79751,19456],
 ['Nakambé','Boulgou',3,22573,19969],['Nakambé','Koulpélogo',3,42572,29950],['Nakambé','Kouritenga',3,40920,22603],
 ['Nando','Boulkiemdé',2,1,8245],['Nando','Sanguié',2,0,4228],['Nando','Sissili',2,0,2794],['Nando','Ziro',2,0,2423],
 ['Nazinon','Bazèga',2,0,404],['Nazinon','Nahouri',2,0,0],['Nazinon','Zoundwéogo',2,0,0],
 ['Oubri','Bassitenga',2,7,0],['Oubri','Ganzourgou',2,0,50],['Oubri','Kourwéogo',2,0,0],
 ['Sirba','Gnagna',3,102340,51589],['Sirba','Komandjari',4,49137,35560],
 ['Soum','Djelgodji',4,258818,52143],['Soum','Karo-Peli',4,61403,24555],
 ['Sourou','Koosin',3,61132,34195],['Sourou','Nayala',3,41151,11863],['Sourou','Sourou',3,62983,28008],
 ['Tannouyan','Comoé',3,28992,4207],['Tannouyan','Léraba',2,54,1719],
 ['Tapoa','Dyamongou',4,93599,11562],['Tapoa','Gobnangou',4,172050,11173],
 ['Yaadga','Loroum',4,100044,129711],['Yaadga','Passoré',2,768,14845],['Yaadga','Yatenga',3,163069,78029],['Yaadga','Zondoma',3,37953,21174],
].map(p=>({r:p[0],n:p[1],sev:p[2],c:p[3],a:p[4],c4:p[2]===4?p[3]:0,a4:p[2]===4?p[4]:0,nt:p[3]<100}));
const RG=[...new Set(PV.map(p=>p.r))].map(n=>{const ps=PV.filter(p=>p.r===n);const s=k=>ps.reduce((t,p)=>t+p[k],0);return{n,c:s('c'),a:s('a'),c4:s('c4'),a4:s('a4')}});
let cluster='SECAL', region='Liptako';

/* ---------- helpers ---------- */
const f=v=>v>=1e6?(v/1e6).toFixed(1).replace('.',',')+'M':v>=1000?Math.round(v/1000)+'K':String(Math.round(v));
const fk=v=>v>=1e6?(v/1e6).toFixed(1).replace('.',',')+'M':v>=1000?(v/1000).toFixed(1).replace('.',',')+'K':String(Math.round(v));
const fm=v=>v.toFixed(1).replace('.',',')+'M';
const pct=(a,c)=>c?Math.round(a/c*1000)/10:null;
const fp=(a,c)=>{const p=pct(a,c);return p===null?(a?'>100 %':'—'):(p>100?'>100 %':p.toFixed(1).replace('.',',')+' %')};
const fac=()=>SERIES[month]/SERIES[BASE];
const prev=()=>month?SERIES[month]-SERIES[month-1]:SERIES[0];
const sev=p=>p===null||p===0?'s0':p<=20?'s1':p<=40?'s2':p<=60?'s3':'s4';
const seeded=s=>{let x=Math.sin(s*9301+49297)*233280;return x-Math.floor(x)};
const cl=()=>CL.find(c=>c.k===cluster), rg=()=>RG.find(r=>r.n===region);
const finName=k=>k==='PLAN'?'Plan 2026':(CL.find(c=>c.k===k)||FIN_EXTRA.find(x=>x.k===k)||{n:k}).n;
const totC=RG.reduce((s,r)=>s+r.c,0);
const clusterInRegion=(c,r)=>{const sh=r.c?r.c/totC:0.002;const j=.6+seeded(c.k.length*7+r.n.length)*.8;const cc=c.c*sh,a=c.a*sh*j*(r.a/(r.c||1))/(G.prioA/G.prioC+0.2)*fac();
  return{c:Math.round(cc),a:Math.round(Math.min(a,cc*1.4)),c4:Math.round(cc*(r.c?r.c4/r.c:0)),a4:Math.round(Math.min(a,cc*1.4)*(r.a?r.a4/r.a:0))}};
const norm=t=>t.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace('koosin','kossin').replace('kouritenga','kourittenga').replace('tannouyan','tannounyan');
const geoR=n=>GEO.R.find(r=>norm(r.n)===norm(n)), geoP=n=>GEO.P.find(p=>norm(p.n)===norm(n));
function bbox(d){const xs=[],ys=[];d.replace(/(-?[\d.]+),(-?[\d.]+)/g,(m,x,y)=>{xs.push(+x);ys.push(+y)});return[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)]}

/* ---------- components ---------- */
function kpis(el,items){el.innerHTML=items.map(i=>`<div class="kpi ${i.cls}"><div class="v">${i.v}</div><div class="l">${i.l}</div>${i.d?`<div class="d">${i.d}</div>`:''}</div>`).join('')}
function bar(cls,v,max,txt,w4){const w=max?Math.min(1,v/max):0;
  if(cls==='a'&&w4!==undefined){const ww4=max?Math.min(1,w4/max):0;return`<span class="bc a" style="--w4:${ww4};--w3:${Math.max(0,w-ww4)}"><i class="b4" style="--w:${ww4}"></i><i class="b3"></i><span class="bv">${txt}</span></span>`}
  return`<span class="bc ${cls}" style="--w:${w}"><i class="b"></i><span class="bv">${txt}</span></span>`}
function table(el,rows,{head='Cluster',click,sel,total}={}){
  const mx=k=>Math.max(...rows.map(r=>r[k]||0));
  const M={c:mx('c'),a:mx('a'),c4:mx('c4'),a4:mx('a4')};
  const cell=r=>`${bar('c',r.c,M.c,r.nt?'n.c.':f(r.c))}${bar('a',r.a,M.a,fk(r.a),r.a4)}<span class="pct">${fp(r.a,r.c)}</span><span></span>${bar('pc',r.c4,M.c4,r.c4?f(r.c4):'—')}${bar('pa',r.a4,M.a4,r.c4?fk(r.a4):'—')}<span class="pct">${r.c4?fp(r.a4,r.c4):''}</span>`;
  const name=r=>`${click?`<button type="button" class="n" data-k="${r.k}">`:'<span class="n">'}${r.sev?`<span class="badge s${r.sev}">${r.sev}</span>`:''}${r.n}${click?'</button>':'</span>'}`;
  el.style.setProperty('--cols','128px 1fr 1fr 44px 12px 0.9fr 0.9fr 44px');
  el.innerHTML=`<div class="tr grp"><span></span><span class="gc" style="grid-column:span 3">Personnes ciblées</span><span></span><span class="gp" style="grid-column:span 3">Personnes priorisées · sévérité 4</span></div>
  <div class="tr hd"><span>${head}</span><span>Cible</span><span>Atteints</span><span class="pct">%</span><span></span><span>Cible</span><span>Atteints</span><span class="pct">%</span></div>
  ${total?`<div class="tr tot"><span class="n">${total.n}</span>${cell(total)}</div>`:''}
  ${rows.map(r=>`<div class="tr ${r.k===sel?'sel':''}">${name(r)}${cell(r)}</div>`).join('')}`;
  if(click)el.querySelectorAll('button.n').forEach(b=>b.addEventListener('click',()=>click(b.dataset.k)));
}
function ftable(el,rows,total,click,sel){
  const mq=Math.max(...rows.map(r=>r.req)),mf=Math.max(...rows.map(r=>r.fin));
  const cell=r=>`${bar('rq',r.req,mq,r.req?fm(r.req):'—')}${bar('fn',r.fin,mf,fm(r.fin))}<span class="pct">${r.req?fp(r.fin,r.req):''}</span>`;
  const name=r=>r.k?`<button type="button" class="n" data-k="${r.k}">${r.n}</button>`:`<span class="n" style="${r.rec?'color:var(--ink3);font-weight:400':''}">${r.n}</span>`;
  el.style.setProperty('--cols','150px 1fr 1fr 48px');
  el.innerHTML=`<div class="tr hd"><span>Cluster</span><span>Requis</span><span>Reçus</span><span class="pct">% couvert</span></div>
  <div class="tr tot ${sel==='PLAN'?'sel':''}"><button type="button" class="n" data-k="PLAN">${total.n}</button>${cell(total)}</div>
  ${rows.map(r=>`<div class="tr ${r.k===sel?'sel':''}">${name(r)}${cell(r)}</div>`).join('')}`;
  el.querySelectorAll('button.n').forEach(b=>b.addEventListener('click',()=>click(b.dataset.k)));
}
// indicator table: rows [{cl, lab, c, a, c4, a4}] ; prio=false hides the priorised group
function indtable(el,rows,{prio=true,cols}={}){
  el.style.setProperty('--icols',cols||(prio?'110px 1fr 60px 60px 48px 14px 60px 60px 48px':'1fr 64px 64px 52px'));
  const head=prio?`<div class="tr grp"><span></span><span></span><span class="gc" style="grid-column:span 3">Personnes ciblées</span><span></span><span class="gp" style="grid-column:span 3">Priorisées · sévérité 4</span></div>
  <div class="tr hd"><span>Cluster</span><span>Indicateur</span><span class="v">Cible</span><span class="v">Atteint</span><span class="pct">%</span><span></span><span class="v">Cible</span><span class="v">Atteint</span><span class="pct">%</span></div>`
  :`<div class="tr hd"><span>Indicateur</span><span class="v">Cible</span><span class="v">Réalisé</span><span class="pct">%</span></div>`;
  if(!rows.length){el.innerHTML=`<div class="na">Indicateurs non disponibles pour cette sélection — les données ne sont pas encore chargées dans la base.</div>`;return}
  el.innerHTML=head+rows.map(r=>`<div class="tr">${prio?`<span class="cl">${r.cl}</span>`:''}<span class="lab">${r.lab}</span><span class="v vc">${fk(r.c)}</span><span class="v va">${fk(r.a)}</span><span class="pct"><b>${fp(r.a,r.c)}</b></span>${prio?`<span></span><span class="v vp">${r.c4?fk(r.c4):'—'}</span><span class="v vq">${r.c4?fk(r.a4):'—'}</span><span class="pct">${r.c4?fp(r.a4,r.c4):''}</span>`:''}</div>`).join('');
}
function hbars(el,items,max){el.innerHTML=items.map(([n,v])=>`<div class="r"><span class="n" title="${n}">${n}</span><span class="t"><i style="width:${v/max*100}%"></i></span><span class="v">${fm(v)}</span></div>`).join('')}
function sevcmp(el,{c4,a4,c3,a3}){
  const p4=pct(a4,c4),p3=pct(a3,c3);
  el.innerHTML=`<div class="r"><span class="n"><span class="badge s4">4</span>Sévérité 4 · priorisées</span><span class="track"><i style="width:${Math.min(100,p4||0)}%"></i></span><span class="v"><b>${fk(a4)}</b> / ${f(c4)} · <b>${fp(a4,c4)}</b></span></div>
  <div class="r lo"><span class="n"><span class="badge s3">≤3</span>Sévérité 3 et moins</span><span class="track"><i style="width:${Math.min(100,p3||0)}%"></i></span><span class="v"><b>${fk(a3)}</b> / ${f(c3)} · <b>${fp(a3,c3)}</b></span></div>
  <div class="gap">${p4!==null&&p3!==null?(p4<p3?`Les zones de sévérité 4 sont couvertes <b>${(p3-p4).toFixed(1).replace('.',',')} pts</b> de moins que les zones de sévérité ≤ 3.`:`Les zones de sévérité 4 sont couvertes <b>${(p4-p3).toFixed(1).replace('.',',')} pts</b> de plus que les zones de sévérité ≤ 3.`):p4!==null?'Toute la cible de cette sélection est en zone de sévérité 4.':'Pas de cible priorisée dans cette sélection.'}</div>`;
}
function sevstack(el){
  const items=[...CL.map(c=>({n:c.n,s:SEV[c.k]})),{n:'Intersectoriel',s:SEV.INT,int:true}];
  el.innerHTML=items.map(x=>`<div class="${x.int?'int':''}"><div class="bar">${[4,3,2].map((lv,i)=>{const v=x.s[2-i];return v?`<i class="s${lv}" style="flex:${v}">${v>=9?v+'%':''}</i>`:''}).join('')}</div><span class="lb">${x.n}</span></div>`).join('');
}
function drawMap(el,items,{view,height=300,onClick,selected,outline=true,big=false}={}){
  const vb=view||[0,0,GEO.W,GEO.H];
  el.innerHTML=`<svg class="map ${big?'big':''}" style="height:${height}px" viewBox="${vb.join(' ')}" preserveAspectRatio="xMidYMid meet" role="img">
   ${items.map(i=>`<path class="${i.cls} ${i.key===selected?'sel':''}" d="${i.geo.d}" data-k="${i.key}"><title>${i.title||i.label}</title></path>`).join('')}
   ${outline?`<path class="adm0" d="${GEO.R.map(r=>r.d).join('')}"/>`:''}
   ${items.map(i=>i.label?`<text class="${i.dark?'dk':''}" x="${i.geo.c[0]}" y="${i.geo.c[1]-1}">${i.label}</text><text class="v ${i.dark?'dk':''}" x="${i.geo.c[0]}" y="${i.geo.c[1]+(big?11:9)}">${i.value}</text>`:'').join('')}
  </svg>`;
  if(onClick)el.querySelectorAll('path[data-k]').forEach(p=>p.addEventListener('click',()=>onClick(p.dataset.k)));
}
function regionMap(el,valFn,onClick,height,big){
  drawMap(el,RG.map(r=>{const {a,c}=valFn(r);const p=pct(a,c);const cls=sev(p===null&&a?101:p);return{geo:geoR(r.n),cls,key:r.n,label:r.n,value:fp(a,c),dark:cls==='s3'||cls==='s4',title:`${r.n} — ${fk(a)} atteints / ${f(c)} ciblées`}}),{onClick,height,big});
}
function timeline(el,total){el.innerHTML=MONTHS.map((m,i)=>{const has=i<SERIES.length;const v=has?SERIES[i]/SERIES[SERIES.length-1]*total:0;const h=has?Math.max(4,Math.round(v/total*40)):0;
  return `<div class="${i===month?'cur':''} ${has?'':'none'}"><span>${has?f(v):''}</span><i style="height:${h}px"></i><span>${m}</span></div>`}).join('')}

/* ---------- renderers ---------- */
function renderGlobal(){
  const A=SERIES[month],k=fac();
  document.getElementById('g-narr').innerHTML=`Au mois de <b>${LONG[month].toLowerCase()} 2026</b>, les partenaires humanitaires ont atteint cumulativement <b>${A.toLocaleString('fr-FR')} personnes</b>, soit ${fp(A,G.cible)} de la cible intersectorielle (+${f(prev())} sur le mois), dont ${f(G.prioA*k)} personnes vivant dans des zones de sévérité 4, soit ${fp(G.prioA*k,G.prioC)} de la cible priorisée. <span style="color:var(--ink3)">— paragraphe généré à partir des données, modifiable par mois.</span>`;
  kpis(document.getElementById('g-kpis'),[
    {cls:'c',v:f(G.cible),l:'Personnes ciblées'},{cls:'a',v:f(A),l:'Atteintes',d:`<b>+${f(prev())}</b> ce mois`},{cls:'a',v:fp(A,G.cible),l:'% atteint'},
    {cls:'p',v:f(G.prioC),l:'Priorisées (sév. 4)'},{cls:'p2',v:f(G.prioA*k),l:'Atteintes'},{cls:'p2',v:fp(G.prioA*k,G.prioC),l:'% atteint'}]);
  sevcmp(document.getElementById('g-sev'),{c4:G.prioC,a4:G.prioA*k,c3:G.cible-G.prioC,a3:A-G.prioA*k});
  table(document.getElementById('g-table'),CL.map(c=>({...c,a:c.a*k,a4:c.a4*k})),{click:kk=>{cluster=kk;setLens('cluster')},
    total:{n:'Intersectoriel',c:G.cible,a:A,c4:G.prioC,a4:G.prioA*k}});
  timeline(document.getElementById('g-tl'),SERIES[SERIES.length-1]);
  // sheet 2
  regionMap(document.getElementById('g-map'),r=>({a:r.a*k,c:r.c}),n=>{region=n;setLens('region')},400,true);
  const rrows=RG.map(r=>({...r,k:r.n,a:r.a*k,a4:r.a4*k})).sort((a,b)=>b.c-a.c||b.a-a.a);
  table(document.getElementById('g-rtable'),rrows,{head:'Région',click:n=>{region=n;setLens('region')},total:{n:'Burkina Faso',c:G.cible,a:A,c4:G.prioC,a4:G.prioA*k}});
  sevstack(document.getElementById('g-stk'));
}
function renderFin(){
  kpis(document.getElementById('f-kpis'),[
    {cls:'r',v:fm(G.req),l:'Fonds requis (USD)'},{cls:'f',v:fm(G.fin),l:'Fonds reçus'},{cls:'f',v:fp(G.fin,G.req),l:'% couvert'}]);
  document.getElementById('f-info').innerHTML=`<b>Plan de réponse humanitaire 2026 — FTS au ${G.asof}.</b> Le total du plan = somme des flux entrants uniquement ; les retransferts internes (ex. fonds communs → ONG) ne sont pas comptés pour éviter les doubles comptes. Les flux multi-clusters et non rapportés sont inclus dans le total mais ne sont pas ventilés par cluster. Le financement n'est pas mensualisé : cette feuille ne suit pas le sélecteur de mois.`;
  const rows=[...CL.map(c=>({k:c.k,n:c.n,req:c.req,fin:c.fin})),...FIN_EXTRA].sort((a,b)=>(b.req-a.req)||(b.fin-a.fin));
  ftable(document.getElementById('f-table'),rows,{n:'Plan 2026 — tous clusters',req:G.req,fin:G.fin},k=>{finSel=k;renderFin()},finSel);
  const F=FTS[finSel]||{d:[],r:[]};
  ['f-sel-1','f-sel-2'].forEach(id=>document.getElementById(id).textContent=finName(finSel));
  hbars(document.getElementById('f-donors'),F.d,F.d[0]?F.d[0][1]:1);
  hbars(document.getElementById('f-recip'),F.r,F.r[0]?F.r[0][1]:1);
  document.getElementById('f-note').innerHTML=finSel==='PLAN'?'<span>Ensemble des flux entrants du plan, tous clusters confondus.</span>':`<span>Flux affectés à ce seul cluster ; les flux multi-clusters (${fm(9.0)}) et non rapportés (${fm(15.7)}) ne sont pas ventilés et n'apparaissent pas ici.</span>`;
}
function renderCluster(){
  const c=cl(),k=fac();
  ['c-name-1'].forEach(id=>document.getElementById(id).textContent=c.n);
  kpis(document.getElementById('c-kpis'),[
    {cls:'c',v:f(c.c),l:'Ciblées'},{cls:'a',v:fk(c.a*k),l:'Atteintes'},{cls:'a',v:fp(c.a*k,c.c),l:'% atteint'},
    {cls:'p',v:f(c.c4),l:'Priorisées (sév. 4)'},{cls:'p2',v:fk(c.a4*k),l:'Atteintes'},{cls:'p2',v:fp(c.a4*k,c.c4),l:'% atteint'},
    {cls:'r',v:fm(c.req),l:'Requis (USD)'},{cls:'f',v:fm(c.fin),l:'Reçus (FTS)'},{cls:'f',v:fp(c.fin,c.req),l:'% couvert'}]);
  disagg(document.getElementById('c-dis'),c);
  regionMap(document.getElementById('c-map'),r=>clusterInRegion(c,r),n=>{region=n;setLens('region')},232);
  const list=RG.map(r=>({...clusterInRegion(c,r),n:r.n,k:r.n})).filter(r=>r.c>1000||r.a>500).sort((a,b)=>b.c-a.c).slice(0,12);
  table(document.getElementById('c-table'),list,{head:'Région (12 premières)',click:n=>{region=n;setLens('region')}});
  sevcmp(document.getElementById('c-sev'),{c4:c.c4,a4:c.a4*k,c3:c.c-c.c4,a3:(c.a-c.a4)*k});
  const F=FTS[c.k]||{d:[],r:[]};
  hbars(document.getElementById('c-donors'),F.d.slice(0,5),F.d[0]?F.d[0][1]:1);
  hbars(document.getElementById('c-recip'),F.r.slice(0,5),F.r[0]?F.r[0][1]:1);
  indtable(document.getElementById('c-ind'),(IND[c.k]||[]).map(i=>({lab:i[0],c:i[1],a:i[2]})),{prio:false});
  timeline(document.getElementById('c-tl'),c.a);
}
function renderRegion(){
  const r=rg(),k=fac();
  ['r-name-1','r-name-2','r-name-3'].forEach(id=>document.getElementById(id).textContent=r.n);
  document.getElementById('r-loc').innerHTML=`<svg class="locator" viewBox="0 0 ${GEO.W} ${GEO.H}">${GEO.R.map(x=>`<path class="${norm(x.n)===norm(r.n)?'sel':''}" d="${x.d}"/>`).join('')}</svg>`;
  const pv=PV.filter(p=>p.r===r.n).map(p=>({...p,k:p.n,a:p.a*k,a4:p.a4*k})).sort((a,b)=>b.c-a.c||b.a-a.a);
  kpis(document.getElementById('r-kpis'),[
    {cls:'c',v:f(r.c),l:'Ciblées'},{cls:'a',v:fk(r.a*k),l:'Atteintes'},{cls:'a',v:fp(r.a*k,r.c),l:'% atteint'},
    {cls:'p',v:r.c4?f(r.c4):'—',l:'Priorisées (sév. 4)'},{cls:'p2',v:r.c4?fk(r.a4*k):'—',l:'Atteintes'},{cls:'p2',v:r.c4?fp(r.a4*k,r.c4):'—',l:'% atteint'},
    {cls:'r',v:'—',l:'Partenaires actifs'},{cls:'f',v:'—',l:'ONG nationales'},{cls:'f',v:'—',l:'Communes couvertes'}]);
  table(document.getElementById('r-prov'),pv,{head:'Province'});
  sevcmp(document.getElementById('r-sev'),{c4:r.c4,a4:r.a4*k,c3:r.c-r.c4,a3:(r.a-r.a4)*k});
  {const gr=geoR(r.n);const [x0,y0,x1,y1]=bbox(gr.d);const pad=12;
   drawMap(document.getElementById('r-map'),pv.map(p=>{const g=geoP(p.n);return g?{geo:g,cls:'v'+p.sev,key:p.n,label:p.n,value:p.nt?fk(p.a):fp(p.a,p.c),dark:p.sev>=3,title:`${p.n} — sévérité ${p.sev} — ${fk(p.a)} atteints`}:null}).filter(Boolean),
     {view:[x0-pad,y0-pad,x1-x0+2*pad,y1-y0+2*pad],height:185,outline:false});}
  const list=CL.map(c=>({...clusterInRegion(c,r),n:c.n,k:c.k})).sort((a,b)=>b.c-a.c);
  table(document.getElementById('r-table'),list,{head:'Cluster',click:kk=>{cluster=kk;setLens('cluster')}});
  timeline(document.getElementById('r-tl'),r.a||1);
  // sheet 2: indicators by cluster for this region (mock = national indicator × the region's share of that cluster)
  const irows=[];CL.forEach(c=>{const x=clusterInRegion(c,r);const shC=c.c?x.c/c.c:0, shA=c.a?x.a/c.a:0;
    (IND[c.k]||[]).forEach((i,j)=>{const ic=i[1]*shC,ia=i[2]*shA*(0.7+seeded(j*31+c.k.length+r.n.length)*0.6);const p4=x.c?x.c4/x.c:0;
      irows.push({cl:j===0?c.n:'',lab:i[0],c:ic,a:ia,c4:ic*p4,a4:ia*(x.a?x.a4/x.a:0)})})});
  indtable(document.getElementById('r-ind'),irows);
}

/* ---------- state ---------- */
let lens='global';
function setLens(l){lens=l;document.querySelectorAll('.lens button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.lens===l));render()}
function render(){
  document.querySelectorAll('.paper').forEach(p=>p.classList.toggle('on',p.dataset.lens===lens));
  document.getElementById('pick-cluster').hidden=lens!=='cluster';document.getElementById('pick-region').hidden=lens!=='region';
  document.getElementById('months').hidden=lens==='fin';
  document.getElementById('sel-cluster').value=cluster;document.getElementById('sel-region').value=region;
  document.querySelectorAll('#months button').forEach((b,i)=>b.setAttribute('aria-pressed',i===month));
  const sub={global:'',fin:'',cluster:' — '+cl().n,region:' — '+region}[lens];
  document.querySelectorAll('.paper').forEach(p=>{p.querySelector('.lensname').textContent=p.dataset.title+(p.dataset.lens===lens?sub:'');p.querySelector('.period').textContent=(p.dataset.lens==='fin'?'FTS, '+G.asof:LONG[month]+' 2026')});
  ({global:renderGlobal,fin:renderFin,cluster:renderCluster,region:renderRegion})[lens]();
  fit();
}
// head & foot on every paper
document.querySelectorAll('.paper').forEach(p=>{
  p.insertAdjacentHTML('afterbegin',`<div class="head"><div><h1>BURKINA FASO</h1><div class="sub">Réponse humanitaire</div></div><div class="right"><div class="lensname"></div><div class="period"></div></div></div>`);
  p.insertAdjacentHTML('beforeend',`<div class="foot"><span>Les désignations et les limites administratives utilisées n'impliquent pas une reconnaissance officielle par l'Organisation des Nations Unies.</span><span><b>Date de création :</b> ${new Date().toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})} &nbsp; <b>Sources :</b> Clusters, FTS, HPC 2026 &nbsp; <b>Feedback :</b> ocha-burkinafaso@un.org</span></div>`);
});
document.getElementById('months').innerHTML=MONTHS.map((m,i)=>`<button type="button" id="m-${i}" ${i>=SERIES.length?'disabled':''} aria-pressed="${i===month}">${m}</button>`).join('');
document.querySelectorAll('#months button').forEach((b,i)=>b.addEventListener('click',()=>{month=i;render()}));
document.querySelectorAll('.lens button').forEach(b=>b.addEventListener('click',()=>setLens(b.dataset.lens)));
document.getElementById('sel-cluster').innerHTML=CL.map(c=>`<option value="${c.k}">${c.n}</option>`).join('');
document.getElementById('sel-region').innerHTML=RG.map(r=>`<option value="${r.n}">${r.n}</option>`).join('');
document.getElementById('sel-cluster').addEventListener('change',e=>{cluster=e.target.value;render()});
document.getElementById('sel-region').addEventListener('change',e=>{region=e.target.value;render()});
document.getElementById('btn-print').addEventListener('click',()=>window.print());
document.getElementById('btn-print-all').addEventListener('click',()=>{renderGlobal();renderFin();renderCluster();renderRegion();document.body.classList.add('all');setTimeout(()=>{window.print();document.body.classList.remove('all')},50)});

function fit(){const st=document.getElementById('stage'),sh=document.getElementById('sheets');const w=st.clientWidth-32;const s=Math.min(1,w/1123);sh.style.transform=`scale(${s})`;const n=document.querySelectorAll('.paper.on').length;st.style.height=((794*n+18*(n-1))*s+44)+'px'}
addEventListener('resize',fit);render();
