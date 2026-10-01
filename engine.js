(function(root){
'use strict';
const D=root.LipidData||(typeof require!=='undefined'?require('./data.js'):null);
const O=root.LipidOrgan||(typeof require!=='undefined'?require('./organ.js'):null);
const levels=[{name:'零項風險因子',target:160},{name:'低風險',target:130},{name:'中風險',target:115},{name:'高風險',target:100},{name:'非常高風險',target:70},{name:'極高風險',target:55}];
// Ranges carry their bounds, never an invented representative measurement.
const ranges={
 age:[['under18','未滿 18 歲',0,18],['18to44','18–44 歲',18,45],['45to54','45–54 歲',45,55],['55plus','55 歲以上',55,121]],
 egfr:[['60plus','≥60 mL/min/1.73m²',60,201],['30to59','30 至未滿 60 mL/min/1.73m²',30,60],['15to29','15 至未滿 30 mL/min/1.73m²',15,30],['below15','＜15 mL/min/1.73m²',1,15]],
 tg:[['below150','＜150 mg/dL',1,150],['150to399','150–399 mg/dL',150,400],['400to499','400–499 mg/dL',400,500],['500to999','500–999 mg/dL',500,1000],['1000plus','≥1,000 mg/dL',1000,10001]],
 lifestyleMonths:[['below3','未滿 3 個月',0,3],['3to5','3 個月至未滿 6 個月',3,6],['6plus','6 個月以上',6,121]],
 waist:[['below80','＜80 cm',30,80],['80to89','80 至未滿 90 cm',80,90],['90plus','≥90 cm',90,251]],
 sbp:[['below130','＜130 mmHg',40,130],['130plus','≥130 mmHg',130,301]],
 dbp:[['below85','＜85 mmHg',20,85],['85plus','≥85 mmHg',85,201]],
 glucose:[['below100','＜100 mg/dL',1,100],['100plus','≥100 mg/dL',100,1501]]
};
const rangeMap=new Map(Object.entries(ranges).flatMap(([key,items])=>items.map(([id,label,min,max])=>[`range:${key}:${id}`,{key,label,min,max}])));
function rangeOptions(key){return ranges[key].map(([id,label])=>[`range:${key}:${id}`,label]);}
function toRange(key,value){if(!value||rangeMap.has(value))return value;const n=Number(value);const item=ranges[key]?.find(([, ,min,max])=>n>=min&&n<max);return item?`range:${key}:${item[0]}`:value;}
function displayValue(value){return rangeMap.get(value)?.label||String(value||'未填');}
// Shared by classification and the progressive questionnaire: each term is AND,
// different terms are OR. Unknown answers are never written as negative answers.
const diseaseRules=[
 ...['recentMI','multipleMI','multivessel','pad','carotid'].map(k=>({rank:5,keys:['cad',k],label:'CAD 合併極高風險條件'})),
 {rank:5,keys:['acs','dm'],label:'ACS 合併糖尿病'},
 {rank:5,keys:['pad','carotid'],label:'PAD 合併頸動脈狹窄'},
 ...['cad','acs','pad','stroke','revasc','stenosis'].map(k=>({rank:4,keys:[k],label:D.riskFields.find(f=>f[0]===k)[1]})),
 ...['dm','cac','prior190'].map(k=>({rank:3,keys:[k],label:D.riskFields.find(f=>f[0]===k)[1]}))
];
const triNames=[...D.riskFields,...D.advancedFields,...D.rfFields,...D.safetyFields].map(x=>x[0]).concat(['bpMeds','glucoseMeds','tgMeds','adherence','maxTolerated','gemfibrozil','primaryHyper','addEze','metabolicPeriod']);
function blank(){const s={age:'',sex:'',ldl:'',baseline:'',hdl:'',tg:'',tc:'',egfr:'',clcr:'',crcl:'',fenoCrcl:'',hepatic:'',enzymes:'',labDate:'',waist:'',sbp:'',dbp:'',glucose:'',mode:'',drug:'',dose:'',since:'',lifestyleMonths:'',tolerance:'',};triNames.forEach(k=>s[k]='unknown');return s;}
function number(v){return v===''||v===null||v===undefined||rangeMap.has(v)?null:Number(v);}
function todayString(now=new Date()){return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;}
function day(v){if(!/^\d{4}-\d{2}-\d{2}$/.test(v||''))return null;const d=new Date(`${v}T12:00:00`);return !Number.isNaN(+d)&&todayString(d)===v?d:null;}
function diffDays(from,to){return Math.floor((Date.UTC(to.getFullYear(),to.getMonth(),to.getDate())-Date.UTC(from.getFullYear(),from.getMonth(),from.getDate()))/86400000);}
function plusMonths(date,n){const d=new Date(date);const wanted=d.getDate();d.setDate(1);d.setMonth(d.getMonth()+n);d.setDate(Math.min(wanted,new Date(d.getFullYear(),d.getMonth()+1,0).getDate()));return d;}
function bool(v){return v==='yes'?true:v==='no'?false:null;}
function threshold(v,t){const r=rangeMap.get(v);if(r)return r.min>=t?true:r.max<=t?false:null;const n=number(v);return n===null?null:n>=t;}
function either(a,b){return a===true||b===true?true:a===false&&b===false?false:null;}
function metabolic(s){
 const sex=s.sex,hdl=number(s.hdl);
 const lowHDL=!sex||hdl===null?null:hdl<(sex==='male'?40:50);
 const vals=[!sex?null:threshold(s.waist,sex==='male'?90:80),either(either(threshold(s.sbp,130),threshold(s.dbp,85)),bool(s.bpMeds)),either(threshold(s.glucose,100),bool(s.glucoseMeds)),either(threshold(s.tg,150),bool(s.tgMeds)),lowHDL];
 const yes=vals.filter(v=>v===true).length,unknown=vals.filter(v=>v===null).length;
 const raw=yes>=3?true:yes+unknown<3?false:null;
 return {values:vals,yes,unknown,value:s.metabolicPeriod==='yes'?raw:null,lowHDL};
}
function classify(s,optimistic=false){
 const yes=k=>s[k]==='yes'||(optimistic&&s[k]==='unknown');
 const m=metabolic(s),ageRF=!s.sex?null:threshold(s.age,s.sex==='male'?45:55);
 const rf=[ageRF,bool(s.hypertension),bool(s.family),bool(s.smoking),m.lowHDL,m.value];
 const count=rf.filter(x=>x===true||(optimistic&&x===null)).length;
 let rank=count>=2?2:count===1?1:0;let reasons=rank===2?[`心血管風險因子 ${count} 項`]:rank===1?['心血管風險因子 1 項']:['未辨識到已確認風險因子'];
 const set=(r,label)=>{if(r>rank){rank=r;reasons=[label];}else if(r===rank)reasons.push(label);};
 if(yes('ckd')&&(optimistic?s.dialysis!=='yes':s.dialysis==='no'))set(3,'符合條件的透析前 CKD');
 if(number(s.ldl)>=190||number(s.baseline)>=190||yes('prior190'))set(3,'目前或已確認治療前 LDL-C ≥190 mg/dL');
 diseaseRules.forEach(rule=>{if(rule.keys.every(yes))set(rule.rank,rule.label);});
 reasons=[...new Set(reasons)];
 return {rank,reasons,count,rf,metabolic:m};
}
function nextRisk(s){
 const low=classify(s),high=classify(s,true);
 if(low.rank===high.rank)return {done:true,rank:low.rank,keys:[],lower:false};
 const possible=diseaseRules.filter(r=>r.rank>low.rank&&r.keys.every(k=>s[k]!=='no'));
 const top=Math.max(0,...possible.map(r=>r.rank));
 if(top>=4){
  const rules=possible.filter(r=>r.rank===top);
  // Complete a known disease combination first, before asking unrelated history.
  const started=rules.filter(r=>r.keys.some(k=>s[k]==='yes'));
  const keys=[...new Set((started.length?started:rules).map(r=>r.keys.find(k=>s[k]!=='yes')).filter(Boolean))];
  return {done:false,rank:top,keys,lower:false};
 }
 if(high.rank>=3&&low.rank<3){
  const keys=possible.filter(r=>r.rank===3).flatMap(r=>r.keys.filter(k=>s[k]==='unknown'));
  if(s.ckd!=='no'&&s.dialysis!=='yes')keys.push(s.ckd==='yes'?'dialysis':'ckd');
  return {done:false,rank:3,keys:[...new Set(keys)],lower:false};
 }
 return {done:false,rank:2,keys:D.rfFields.filter(([k])=>s[k]==='unknown').map(([k])=>k),lower:true};
}
function intensity(drug,dose){if(!drug?.statin)return null;const n=number(dose);if(n===null)return null;
 const ranges={atorvastatin:[10,40,80],rosuvastatin:[5,20,40],pitavastatin:[2,Infinity,4],pravastatin:[40,Infinity,80]};
 const [moderate,high,max]=ranges[drug.statin]||[];if(!max||n<=0||n>max)return 'invalid';return n>=high?'high':n>=moderate?'moderate':'low';}
function setLiverScreen(s,value){
 return {...s,liverScreen:value,liver:value==='no'?'no':'unknown',hepatic:value==='no'?'normal':'',enzymes:value==='no'?'normal':''};
}
function requiredFields(s,drugs=D.drugs){
 const keys=['age','sex','ldl','labDate','mode','tg','tolerance','gemfibrozil','egfr','hepatic','enzymes',...D.safetyFields.map(([k])=>k)];
 if(s.liverScreen!==undefined){keys.push('liverScreen');if(s.liverScreen!=='yes')for(const k of ['liver','hepatic','enzymes']){const i=keys.indexOf(k);if(i>=0)keys.splice(i,1);}}
 if(s.dialysis!=='no'){const i=keys.indexOf('egfr');if(i>=0)keys.splice(i,1);}
 const current=drugs.find(d=>d.id===s.drug),risk=classify(s),q=nextRisk(s);
 if(s.mode==='treated'){keys.push('drug','since','adherence');if(current?.statin)keys.push('dose');if(!current?.ezetimibe)keys.push('addEze');}
 if(s.mode==='treated'&&current?.statin==='rosuvastatin'&&s.dialysis==='no')keys.push('clcr');
 if(s.mode==='treated'&&current?.id==='pravafen'&&s.dialysis==='no')keys.push('crcl');
 if(s.mode==='treated'&&current?.id==='fenolip160'&&s.dialysis==='no')keys.push('fenoCrcl');
 if(['none','lifestyle'].includes(s.mode)&&risk.rank<=2)keys.push('lifestyleMonths');
 if(!q.done){keys.push(...q.keys);if(q.lower){if(risk.rf[4]===null)keys.push('hdl');if(risk.rf[5]===null){keys.push('metabolicPeriod');const groups=[['waist'],['sbp','dbp','bpMeds'],['glucose','glucoseMeds'],['tg','tgMeds'],['hdl']];risk.metabolic.values.forEach((v,i)=>{if(v===null)keys.push(...groups[i]);});}}}
 return [...new Set(keys)];
}
function missingFields(s,drugs=D.drugs){return requiredFields(s,drugs).filter(k=>s[k]===''||s[k]===null||s[k]===undefined||s[k]==='unknown');}
function evaluate(s,drugs=D.drugs,now=new Date()){
 if(s.dialysis==='yes')s={...s,egfr:''};
 const errors=[],missing=[],warnings=[],stops=[];
 if(s.liverScreen!==undefined){
  if(!['yes','no','unknown'].includes(s.liverScreen))errors.push('liverScreen');
  if(!['yes','no'].includes(s.liverScreen))missing.push('肝病／肝功能異常尚未確認');
  if(s.liverScreen==='no'&&(s.liver!=='no'||s.hepatic!=='normal'||s.enzymes!=='normal'))errors.push('liverScreen');
 }
 const organEnums={fenoCrcl:['below30','30to60','above60'],clcr:['below30','30plus'],crcl:['below60','60plus'],hepatic:['normal','A','B','C','ungraded'],enzymes:['normal','to3','above3','persistent3']};
 Object.entries(organEnums).forEach(([k,values])=>{if(s[k]&&!values.includes(s[k]))errors.push(k);});
 const bounds={age:[0,120],ldl:[1,1500],baseline:[1,1500],hdl:[1,250],tg:[1,10000],tc:[1,2000],egfr:[1,200],waist:[30,250],sbp:[40,300],dbp:[20,200],glucose:[1,1500],dose:[.1,1000],lifestyleMonths:[0,120]};
 Object.entries(bounds).forEach(([k,[min,max]])=>{const r=rangeMap.get(s[k]);if(r){if(r.key!==k)errors.push(k);return;}const n=number(s[k]);if(n!==null&&(!Number.isFinite(n)||n<min||n>max))errors.push(k);});
 ['labDate',...(s.mode==='treated'?['since']:[])].forEach(k=>{if(s[k]&&(!day(s[k])||diffDays(day(s[k]),now)<0))errors.push(k);});
 if(number(s.tc)!==null&&number(s.hdl)!==null&&number(s.tc)<number(s.hdl))errors.push('tc');
 if(number(s.sbp)!==null&&number(s.dbp)!==null&&number(s.sbp)<=number(s.dbp))errors.push('sbp');
 const low=classify(s),high=classify(s,true),ldl=number(s.ldl),lab=day(s.labDate);
 const ageDays=lab?diffDays(lab,now):null;
 if(!s.age)missing.push('年齡');if(!s.sex)missing.push('性別');if(ldl===null)missing.push('目前 LDL-C');if(!lab)missing.push('血脂檢驗日期');
 if(low.rank<high.rank){missing.push('尚有會影響風險分層的未知條件');}
 if(!s.mode)missing.push('目前治療狀況');
 if(threshold(s.tg,500)===null)missing.push('TG（排除需獨立評估的顯著升高）');
 const current=s.mode==='treated'?drugs.find(d=>d.id===s.drug):null;
 const currentIntensity=intensity(current,s.dose);
 if(s.mode==='treated'){
  if(!s.drug)missing.push('目前使用藥品');
  if(s.drug==='other')stops.push('其他或多重用藥組合需個別評估');
  if(current?.statin&&!s.dose)missing.push('目前每日 statin 劑量');
  if(currentIntensity==='invalid')errors.push('dose');
  if(!s.since)missing.push('目前治療開始日期');
  if(s.adherence==='unknown')missing.push('服藥遵從性');
  if(s.addEze==='unknown'&&!current?.ezetimibe)missing.push('是否另用 ezetimibe');
 }
 if(!s.tolerance||s.tolerance==='unknown')missing.push('Statin 耐受情況');
 if(s.gemfibrozil==='unknown')missing.push('Gemfibrozil 併用情況');
 const renal=threshold(s.egfr,60);
 if(s.dialysis==='no'&&renal===null)missing.push('近期 eGFR（用於選藥前檢核）');
 if(renal===false)warnings.push(`eGFR ${displayValue(toRange('egfr',s.egfr))}：已逐品項檢查肝腎限制；不是所有藥物的禁忌或共同減量門檻。`);
 D.safetyFields.forEach(([k,label])=>{if(k==='liver'&&s.liverScreen!==undefined&&s.liverScreen!=='yes')return;if(s[k]==='yes'&&k!=='liver')stops.push(k==='dialysis'?'目前接受透析：先確認起始／續用治療適應症，不自動新增降血脂藥；肝腎品項檢核仍可查看。':label);else if(!['yes','no'].includes(s[k]))missing.push(label+'尚未確認');});
 if(s.liverScreen===undefined||s.liverScreen==='yes'){if(!s.hepatic)missing.push('肝功能不全程度');if(!s.enzymes)missing.push('AST／ALT 範圍');}
 if(current?.statin==='rosuvastatin'&&s.dialysis==='no'&&!s.clcr)missing.push('目前 rosuvastatin 劑量所需的 CLcr');
 if(current?.id==='pravafen'&&s.dialysis==='no'&&!s.crcl)missing.push('目前 Pravafen 所需的 CrCl');
 if(current?.id==='fenolip160'&&s.dialysis==='no'&&!s.fenoCrcl)missing.push('目前 Fenolip-U 所需的肌酸酐清除率');
 if(threshold(s.age,18)===false)stops.push('未滿 18 歲不適用本版成人流程');
 if(threshold(s.tg,500)===true)stops.push('TG ≥500 mg/dL：需另行評估高三酸甘油脂及胰臟炎風險');
 if(threshold(s.tg,1000)===true)warnings.push('TG ≥1,000 mg/dL，應優先安排臨床評估；若有急性症狀需即時處置。');
 if(threshold(s.tg,400)===true)warnings.push('TG 偏高時須核對 LDL-C 檢測方法與可靠性。');
 if(ageDays>365)stops.push('血脂檢驗超過 1 年，請先更新檢驗');
 else if(ageDays>183)warnings.push('血脂檢驗超過 6 個月，建議重新檢測後確認治療。');
 if(s.ckd==='yes'&&s.dialysis==='yes')warnings.push('CKD 透析前條件與目前透析狀態矛盾，已排除該分層依據。');
 if(s.gemfibrozil==='yes')stops.push('Gemfibrozil 與 statin 併用會增加肌病／橫紋肌溶解及急性腎損傷風險：應避免／不建議併用。Rosuvastatin 若不得已併用，起始 5 mg、最高 10 mg／日，仍需個別評估。本原型暫停自動列藥，請檢視目前用藥及各品項交互作用。');
 if(s.tolerance==='none'&&current?.statin)warnings.push('完全不耐受與目前含 statin 處方不一致，請先確認目前治療。');
 if(s.mode==='treated'&&current&&['tg','other','othercombo'].includes(current.group))stops.push('目前為 TG 用藥或其他複方，需檢視所有成分與原適應症');
 if(s.mode==='treated'&&current?.statin&&!current.ezetimibe&&s.addEze==='no'&&s.primaryHyper!=='yes')warnings.push(s.primaryHyper==='no'?'未符合 ezetimibe 複方的規定適應症，不列含 ezetimibe 複方。':'請確認「符合 ezetimibe 複方的規定適應症」；未確認前不列含 ezetimibe 複方。');
 const risk={...low,...levels[low.rank],upperRank:high.rank,upperName:levels[high.rank].name,provisional:low.rank!==high.rank};
 const achieved=ldl===null||risk.provisional?null:ldl<risk.target;
 const since=day(s.since),days=since?diffDays(since,now):null;
 const responseDays=since&&lab?diffDays(since,lab):null;
 const months3=since&&lab?diffDays(plusMonths(since,3),lab)>0:false;
 if(s.mode==='treated'&&since&&lab&&lab<since)stops.push('血脂檢驗早於目前方案開始日，不能據此判定本療程反應');
 let action='complete',title='補齊資料後，查看治療方向',description='先輸入血脂與病史；不清楚的條件會保留為待確認。',followup='依完整評估及實際療程決定。';
 if(ldl!==null){
 if(achieved){action='maintain';title=s.mode==='treated'?'目前已達此分層目標，評估維持治療':'目前低於此分層目標';description=s.mode==='treated'?'達標不等於停止治療。持續評估耐受性與遵從性；續用給付需查核原始適應症及用藥紀錄。':'持續生活型態與風險因子管理；是否有其他治療適應症仍須依完整病史確認。';followup=risk.rank>=3?'穩定達標後依院內流程每 6 個月追蹤。':'穩定後依風險與院內流程約每 6–12 個月追蹤。';}
 else if(s.mode==='none'||s.mode==='lifestyle'){
  if(risk.rank<=2&&threshold(s.lifestyleMonths,3)!==true){action='lifestyle';title='先落實生活型態與風險因子管理';description='依本版院內流程，低／中風險及零項因子者先評估 3–6 個月生活型態介入。尚未完成時不列初始藥品。';followup='3–6 個月後複查血脂；特殊適應症另作個別判斷。';}
  else {action='initiate';title=risk.rank>=3?'評估起始中至高強度 statin':'評估起始中強度 statin';description='依基線 LDL-C、臨床狀況及耐受性選擇強度。高風險以上可評估合併治療，但給付需逐品項確認。';followup='起始治療後 6–8 週評估血脂與服藥情況。';}
 } else if(s.mode==='treated'){
  if(s.adherence==='no'){action='adherence';title='先釐清服藥中斷或漏服';description='確認服藥方式、可近性與不良反應後再判斷療效，不能直接當成治療失敗。';}
  else if(responseDays!==null&&responseDays<42){action='observe';title='本次檢驗時療程尚短，需追蹤後再評估';description='本次抽血距目前方案起始未滿 6 週，不因今天已經過更久就把舊數值當成治療失敗。高風險個案仍由臨床判斷是否提前調整。';followup='安排治療起始後 6–8 週複查。';}
  else {action='intensify';title='尚未達標，評估調整強度或合併治療';description='確認遵從性、可耐受劑量與次發原因，再評估高強度 statin、含 ezetimibe 方案或進階治療。';followup='更動治療後 1–3 個月追蹤；實際依藥品與病況調整。';}
 }
 }
 if(s.tolerance==='none'&&achieved===false&&action!=='lifestyle'){action='nonstatin';title='Statin 完全不耐受，需個別評估 non-statin';description='不列含 statin 的複方。先核對不耐受紀錄與可選替代方案；原型僅列進一步討論品項。';}
 if(s.liver==='yes'&&achieved===false&&!['lifestyle','observe','adherence'].includes(action)){action='nonstatin';title='活動性肝病：排除含 statin 製劑，逐項評估替代治療';description='非 statin 也需檢查肝病程度與使用資料，不能直接視為適用。';}
 const organChecks=drugs.map(d=>({...d,organ:O.check(d,s,{initial:s.mode!=='treated',dose:d.id===current?.id&&d.statin?number(s.dose):d.dose})}));
 const currentOrgan=organChecks.find(d=>d.id===current?.id)?.organ||null;
 const renalDoseLimited=currentOrgan?.eligible&&((current?.statin==='rosuvastatin'&&s.clcr==='below30'&&number(s.dose)>=10)||(current?.statin==='pitavastatin'&&['30to59','15to29'].includes(O.egfrBand(s.egfr))&&number(s.dose)>=2));
 if(renalDoseLimited&&action==='intensify'){description='目前 statin 已達此腎功能分組的仿單上限，不直接提高劑量。核對 ezetimibe 的可用規格，再評估進階降 LDL-C 治療與個別適應症。';}
 if(currentOrgan&&!currentOrgan.eligible){
  warnings.push(`目前 ${current.brand}：${currentOrgan.label}。${currentOrgan.notes.join('；')}`);
  if(achieved===true){action='review';title='血脂已達標，但目前處方的肝腎限制需先處理';description='不直接建議維持此處方；請依下方目前用藥檢核確認劑量與是否適用。';}
 }
 if(risk.provisional){action='complete';title='風險分層尚待確認，暫不判定達標';description='未知條件可能提高風險等級與改變治療目標。先補足疾病史及風險因子。';}
 if(stops.length){action='review';title='此情況需個別臨床評估';description='已暫停具體藥品選項。先處理下列條件，再確認適合的治療與劑量。';}
 if(errors.length){action='invalid';title='請修正輸入資料';description='數值、日期或欄位組合不合理，暫停產生治療建議。';}
 if(['none','lifestyle'].includes(s.mode)&&risk.rank<=2&&!s.lifestyleMonths)missing.push('生活型態介入時間');
 const canRecommend=!errors.length&&!stops.length&&!missing.length;
 let candidates=[];
 if(canRecommend&&['initiate','intensify','nonstatin'].includes(action)){
 candidates=drugs.filter(d=>d.availability==='active').filter(d=>{
  if(action==='nonstatin')return d.group==='advanced';
  if(d.group==='statin'){
   if(s.tolerance==='partial')return false;
   if(action==='intensify'&&(currentIntensity==='high'||s.maxTolerated==='yes'))return false;
   return d.id!==current?.id&&(action!=='intensify'?risk.rank>=3||d.intensity==='moderate':d.intensity==='high');
  }
  if(d.group==='combo'){
   if(action==='initiate')return false;
   if(d.payment==='combo8w'&&!(responseDays>42))return false;
   if(d.payment==='combo3m'&&!months3)return false;
   if(s.primaryHyper!=='yes')return false;
   if(!current?.statin)return false;
   if(current?.ezetimibe||s.addEze==='yes')return false;
   return true;
  }
  return d.group==='advanced'&&action==='intensify'&&(currentIntensity==='high'||s.maxTolerated==='yes'||s.tolerance==='partial'||renalDoseLimited);
 }).sort((a,b)=>{const score=d=>(d.group==='statin'?0:d.group==='combo'?2:4)+(d.payment==='legacy'?1:0);return score(a)-score(b);});
 }
 const result={risk,ldl,achieved,errors:[...new Set(errors)],missing,warnings,stops,action,title,description,followup,candidates,current,currentOrgan,organChecks,currentIntensity,days,responseDays,months3,canRecommend,ageDays,baselineReduction:number(s.baseline)&&ldl!==null?(1-ldl/number(s.baseline))*100:null,nonHDL:number(s.tc)!==null&&number(s.hdl)!==null?number(s.tc)-number(s.hdl):null};
 result.excludedCandidates=candidates.map(d=>organChecks.find(x=>x.id===d.id)).filter(d=>!d.organ.eligible);
 result.candidates=result.candidates.map(d=>({...d,organ:organChecks.find(x=>x.id===d.id).organ,coverage:coverage(d,s,result)})).filter(d=>d.organ.eligible);return result;
}
function coverage(d,s,r){
 if(d.payment==='self')return '院內自費｜不以一般 statin 療程認定健保資格。';
 if(d.payment==='review')return '需個別給付審查｜PCSK9 專屬條件尚未建置，不能只憑用藥週數判定。';
 if(d.payment==='legacy')return '原給付規定｜表二檢核尚未建置，不套用表一門檻。';
 if(d.payment==='table1')return '新制表一候選｜需求單歸類；院內碼／健保碼及完整起始或續用條件仍待核對。';
 if(d.payment.startsWith('combo')){
  if(s.gemfibrozil==='yes')return '不符合併用條件｜不得與 gemfibrozil 併用。';
  if(s.primaryHyper!=='yes')return '資料不足｜須確認原發性高膽固醇血症或 HoFH 等規定適應症。';
  if(r.current?.ezetimibe||s.addEze==='yes')return '療程不可直接採計｜目前不是 statin 單方療程，需檢視既往治療。';
  if(!r.current?.statin||r.responseDays===null)return '資料不足｜須確認 statin 單方治療與追蹤檢驗紀錄。';
  if(d.payment==='combo3m')return r.months3?`療程符合：開始日 ${s.since} 至抽血日 ${s.labDate}，已超過 3 個曆月。`:'療程未符合：開始日至抽血日須超過 3 個曆月，不列入建議。';
  return r.responseDays>42?`療程符合：開始日 ${s.since} 至抽血日 ${s.labDate}，共 ${r.responseDays} 天，已超過 6 週。`:'療程未符合：開始日至抽血日須超過 6 週（42 天），不列入建議。';
 }
 return '獨立適應症／給付條件待核對。';
}
function cases(now=new Date()){
 const date=todayString(now),ago=n=>{const d=new Date(now);d.setDate(d.getDate()-n);return todayString(d);};
 function base(){const s=blank();triNames.forEach(k=>s[k]='no');return {...s,age:'60',sex:'male',ldl:'120',hdl:'50',tg:'120',tc:'200',egfr:'85',clcr:'30plus',hepatic:'normal',enzymes:'normal',labDate:ago(3),waist:'82',sbp:'120',dbp:'75',glucose:'90',mode:'none',tolerance:'full',metabolicPeriod:'yes',lifestyleMonths:'0'};}
 return [
  {id:'acs-dm',name:'案例 A｜ACS＋DM，尚未達標',state:{...base(),acs:'yes',cad:'yes',dm:'yes',ldl:'92',baseline:'180',mode:'treated',drug:'crestor10',dose:'10',since:ago(70),adherence:'yes',primaryHyper:'yes'}},
  {id:'maintain',name:'案例 B｜極高風險，治療後達標',state:{...base(),acs:'yes',cad:'yes',dm:'yes',ldl:'48',baseline:'175',mode:'treated',drug:'rozinin20',dose:'20',since:ago(180),adherence:'yes',primaryHyper:'yes'}},
  {id:'low',name:'案例 C｜低風險，生活型態介入',state:{...base(),ldl:'145',mode:'lifestyle',lifestyleMonths:'1'}},
  {id:'none',name:'案例 D｜零項因子，確認初始門檻',state:{...base(),age:'35',ldl:'170',mode:'lifestyle',lifestyleMonths:'4',primaryHyper:'yes'}},
  {id:'missing',name:'案例 E｜資料不完整',state:{...blank(),age:'52',sex:'female',ldl:'155',labDate:date}},
  {id:'dialysis',name:'案例 F｜透析，需個別評估',state:{...base(),dm:'yes',dialysis:'yes',egfr:'8',ldl:'160'}},
  {id:'intolerant',name:'案例 G｜Statin 完全不耐受',state:{...base(),cad:'yes',acs:'yes',dm:'yes',ldl:'150',tolerance:'none',primaryHyper:'yes'}}
 ];
}
const api={blank,setLiverScreen,evaluate,coverage,classify,nextRisk,metabolic,intensity,levels,cases,todayString,diffDays,plusMonths,ranges,rangeOptions,toRange,displayValue,requiredFields,missingFields};root.LipidEngine=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
