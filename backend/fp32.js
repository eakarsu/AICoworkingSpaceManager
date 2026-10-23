'use strict';
function csvCell(v){ if(v===null||v===undefined) return ''; const s=typeof v==='object'?JSON.stringify(v):String(v); return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s; }
function toCsv(rows, cols){ const c=cols||(rows[0]?Object.keys(rows[0]):[]); return [c.join(','), ...rows.map(r=>c.map(k=>csvCell(r[k])).join(','))].join('\n'); }
function providerConfigured(env){ env=env||process.env; const r=env.OPENROUTER_API_KEY, o=env.OPENAI_API_KEY; return Boolean((r&&r!=='your_openrouter_key_here'&&r!=='your-openrouter-key-here')||(o&&o!=='your_openai_key_here')); }

function occupancyOutlook(rows){ rows=rows||[]; const byStatus={},byType={}; rows.forEach(r=>{ byStatus[r.status||'unknown']=(byStatus[r.status||'unknown']||0)+1; byType[r.type||'unknown']=(byType[r.type||'unknown']||0)+1; }); const total=rows.length; const occ=byStatus['occupied']||0;
 return {feature:'occupancy-outlook',aiGenerated:false,source:'deterministic-fallback',sections:[{label:'Desks reviewed',value:total},{label:'By status',value:byStatus},{label:'By type',value:byType},{label:'Occupied count',value:occ},{label:'Available count',value:byStatus['available']||0},{label:'Occupancy rate',value:total?Math.round(occ/total*1000)/10:0},{label:'Has desks',value:total>0},{label:'Notes',value:''}]}; }
function deskDemand(rows){ rows=rows||[]; const byZone={}; rows.forEach(r=>{ const k=r.zone||'unknown'; byZone[k]=(byZone[k]||0)+1; }); const top=Object.entries(byZone).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([zone,count])=>({zone,count}));
 return {feature:'desk-demand',aiGenerated:false,source:'deterministic-fallback',sections:[{label:'Desks reviewed',value:rows.length},{label:'Zones',value:Object.keys(byZone).length},{label:'Top zones',value:top},{label:'Largest zone count',value:top.length?top[0].count:0},{label:'Empty zones',value:[]}]}; }
function spaceFit(rows){ rows=rows||[]; const maint=rows.filter(r=>String(r.status||'').toLowerCase()==='maintenance');
 return {feature:'space-fit',aiGenerated:false,source:'deterministic-fallback',sections:[{label:'Desks reviewed',value:rows.length},{label:'In maintenance',value:maint.length},{label:'Maintenance detail',value:maint.slice(0,50).map(r=>({name:r.name||'',type:r.type||'',floor:r.floor??0,zone:r.zone||''}))},{label:'Maintenance share',value:rows.length?Math.round(maint.length/rows.length*1000)/10:0}]}; }

module.exports={toCsv,providerConfigured,occupancyOutlook,deskDemand,spaceFit};
