(function(root){
'use strict';
// Public labels reviewed 2026-10-01. Product rules override ingredient fallback.
// This module checks organ-related restrictions, not all contraindications or interactions.
const sources={
 gemAtor:{title:'Atorvastatin：Gemfibrozil 交互作用',scope:'國外同成分交互作用補充',section:'DailyMed 美國仿單；7；查核 2026-10-01',url:'https://www.dailymed.nlm.nih.gov/dailymed/fda/fdaDrugXsl.cfm?setid=5b839619-1805-c227-91bf-182f5b966ba4&type=display'},
 gemRosu:{title:'Rosuvastatin：Gemfibrozil 交互作用',scope:'國外同成分交互作用補充',section:'DailyMed 美國仿單；交互作用、劑量調整；查核 2026-10-01',url:'https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=e4f6f29b-9d44-4389-9aa8-01000f94775e'},
 gemPita:{title:'Pitavastatin：Gemfibrozil 交互作用',scope:'國外同成分交互作用補充',section:'DailyMed 美國仿單；7；查核 2026-10-01',url:'https://dailymed.nlm.nih.gov/dailymed/fda/fdaDrugXsl.cfm?setid=a52401eb-a822-475b-a40d-7b8acde2ae1a'},
 gemGeneral:{title:'Gemfibrozil：Statin 併用風險',scope:'國外同成分交互作用補充',section:'DailyMed 美國仿單；警語、OATP1B1 交互作用；查核 2026-10-01',url:'https://www.dailymed.nlm.nih.gov/dailymed/getFile.cfm?setid=2fc2c8fe-6158-4e4d-9753-dc2be1b10f42&type=pdf'},
 livazebe410TW:{title:"Livazebe 4/10 mg 食藥署電子仿單",scope:'台灣產品仿單',section:"衛部藥輸字第028884號；3.3、4、6.6、6.7",url:'https://mcp.fda.gov.tw/im_detail_1/'+encodeURIComponent("衛部藥輸字第028884號")},
 zoliton1010TW:{title:"Zoliton 10/10 mg 食藥署電子仿單",scope:'台灣產品仿單',section:"衛部藥製字第062053號；4、5、6.6、6.7",url:'https://mcp.fda.gov.tw/im_detail_1/'+encodeURIComponent("衛部藥製字第062053號")},
 zoliton1020TW:{title:"Zoliton 10/20 mg 食藥署電子仿單",scope:'台灣產品仿單',section:"衛部藥製字第062052號；4、5、6.6、6.7",url:'https://mcp.fda.gov.tw/im_detail_1/'+encodeURIComponent("衛部藥製字第062052號")},
 atozet1020TW:{title:"Atozet 10/20 mg 食藥署電子仿單",scope:'台灣產品仿單',section:"衛部藥輸字第027283號；4、5、6.6、6.7",url:'https://mcp.fda.gov.tw/im_detail_1/'+encodeURIComponent("衛部藥輸字第027283號")},
 repatha140TW:{title:"Repatha 140 mg 食藥署電子仿單",scope:'台灣產品仿單',section:"衛部菌疫輸字第001033號；6.6、6.7、11",url:'https://mcp.fda.gov.tw/im_detail_1/'+encodeURIComponent("衛部菌疫輸字第001033號")},
 leqvio284TW:{title:"Leqvio 284 mg 食藥署電子仿單",scope:'台灣產品仿單',section:"衛部藥輸字第028761號；3、11",url:'https://mcp.fda.gov.tw/im_detail_1/'+encodeURIComponent("衛部藥輸字第028761號")},
 omacor1000TW:{title:"Omacor 1,000 mg 食藥署電子仿單",scope:'台灣產品仿單',section:"衛部藥製字第059019號；3、5、11",url:'https://mcp.fda.gov.tw/im_detail_1/'+encodeURIComponent("衛部藥製字第059019號")},
 aladdin10TW:{title:"Aladdin 10 mg 食藥署電子仿單",scope:'台灣產品仿單',section:"衛部藥製字第058969號；3.3.1、4、5、6.6、6.7",url:'https://mcp.fda.gov.tw/im_detail_1/'+encodeURIComponent("衛部藥製字第058969號")},
 rozinin20TW:{title:"Rozinin 20 mg 食藥署電子仿單",scope:'台灣產品仿單',section:"衛部藥製字第058813號；3.3.1、4、5、6.6、6.7",url:'https://mcp.fda.gov.tw/im_detail_1/'+encodeURIComponent("衛部藥製字第058813號")},
 zulitor4TW:{title:"Zulitor 4 mg 食藥署電子仿單",scope:'台灣產品仿單',section:"衛部藥製字第058639號；3.3.1、3.3.2、4、6.6、6.7",url:'https://mcp.fda.gov.tw/im_detail_1/'+encodeURIComponent("衛部藥製字第058639號")},
 tonvasca210TW:{title:"Tonvasca 2/10 mg 食藥署電子仿單",scope:'台灣產品仿單',section:"衛部藥製字第061165號；3.3、4、6.6、6.7",url:'https://mcp.fda.gov.tw/im_detail_1/'+encodeURIComponent("衛部藥製字第061165號")},
 pitarty4TW:{title:"Pitarty 4 mg 食藥署電子仿單",scope:'台灣產品仿單',section:"衛部藥製字第058633號；3.3.2、3.3.3、4、6.6、6.7",url:'https://mcp.fda.gov.tw/im_detail_1/'+encodeURIComponent("衛部藥製字第058633號")},
 pitarty2TW:{title:"Pitarty 2 mg 食藥署電子仿單",scope:'台灣產品仿單',section:"衛部藥製字第058648號；3.3.2、3.3.3、4、6.6、6.7",url:'https://mcp.fda.gov.tw/im_detail_1/'+encodeURIComponent("衛部藥製字第058648號")},
 livalo2TW:{title:"Livalo 2 mg 食藥署電子仿單",scope:'台灣產品仿單',section:"衛署藥輸字第025350號；3.3、4、6.6、6.7",url:'https://mcp.fda.gov.tw/im_detail_1/'+encodeURIComponent("衛署藥輸字第025350號")},
 fenolipTW:{title:'Fenolip-U 160 mg 食藥署電子仿單',scope:'台灣產品仿單',section:'衛署藥製字第047228號；3.1、3.3、4、5.1',url:'https://mcp.fda.gov.tw/im_detail_1/'+encodeURIComponent('衛署藥製字第047228號')},
 atotin20TW:{title:'Atotin 20 mg 食藥署電子仿單',scope:'台灣產品仿單',section:'衛部藥製字第058211號；3.3、4、5.1、6.7',url:'https://mcp.fda.gov.tw/im_detail_1/'+encodeURIComponent('衛部藥製字第058211號')},
 atotin10TW:{title:'Atotin 10 mg 食藥署電子仿單',scope:'台灣產品仿單',section:'衛署藥製字第057267號；3.3、4、5.1、6.7',url:'https://mcp.fda.gov.tw/im_detail_1/'+encodeURIComponent('衛署藥製字第057267號')},
 ator:{title:'Lipitor 台灣仿單',scope:'台灣同成分仿單',section:'3.3、4、5.1.3、11',url:'https://www.cth.org.tw/public/medi_news/24602f5fa984e6762f9b90cb790a17e5.pdf'},
 rosu:{title:'Crestor 台灣仿單',scope:'台灣同成分仿單',section:'3.3.1、4、6.7；2024-09-05',url:'https://818h.mnd.gov.tw/btWeb/doc_med/CRES.pdf'},
 eze:{title:'Ezetity 10 mg 食藥署電子仿單',scope:'台灣同成分仿單',section:'衛部藥製字第060610號；3、5、6',url:'https://mcp.fda.gov.tw/im_detail_1/'+encodeURIComponent('衛部藥製字第060610號')},
 cretrol:{title:'Cretrol 10/20 mg 食藥署電子仿單',scope:'台灣產品仿單',section:'衛部藥輸字第028182號；3、4、5、6.6、6.7',url:'https://mcp.fda.gov.tw/im_detail_1/'+encodeURIComponent('衛部藥輸字第028182號')},
 pravafen:{title:'Pravafen 台灣仿單',scope:'台灣產品仿單',section:'4.2–4.4；40/160 mg',url:'https://ksph.kcg.gov.tw/7/dfiles_pdf/Pravafen.pdf'},
 caduet:{title:'Caduet 台灣仿單',scope:'台灣產品仿單',section:'3.3、4、5',url:'https://ksph.kcg.gov.tw/7/dfiles_pdf/Caduet.pdf'},
 nilemdo:{title:'Nilemdo 台灣仿單',scope:'台灣產品仿單',section:'3.3、5.1、6.6、6.7；2025-10-01',url:'https://www.stjoho.org.tw/attach/ann/26237/Nilemdo%20%E5%AF%A7%E8%84%82%E5%BE%B7.pdf'},
 choles:{title:'Cholestyramine 美國仿單',scope:'國外同成分參考；院內規格未確認',section:'禁忌、注意事項',url:'https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=362ddd91-a63f-4ec6-841a-75785dd208c8'}
};
const productSources={"cretrol1020":"cretrol","atotin10":"atotin10TW","atotin20":"atotin20TW","fenolip160":"fenolipTW","livazebe410":"livazebe410TW","zoliton1010":"zoliton1010TW","zoliton1020":"zoliton1020TW","atozet1020":"atozet1020TW","repatha140":"repatha140TW","leqvio284":"leqvio284TW","omacor1000":"omacor1000TW","aladdin10":"aladdin10TW","rozinin20":"rozinin20TW","zulitor4":"zulitor4TW","tonvasca210":"tonvasca210TW","pitarty4":"pitarty4TW","pitarty2":"pitarty2TW","livalo2":"livalo2TW"};
const labels={ok:'肝腎條件可討論',monitor:'需監測',adjust:'需較低起始規格',avoid:'不建議此品項／規格',contra:'禁用／超過劑量上限',pending:'資料不足，暫無法判定',review:'需個別評估'};
const priority={ok:0,monitor:1,adjust:2,pending:3,review:4,avoid:5,contra:6};
function egfrBand(v){if(/^range:egfr:/.test(v||''))return v.split(':')[2];if(v===''||v===undefined)return null;const n=Number(v);return !Number.isFinite(n)?null:n<15?'below15':n<30?'15to29':n<60?'30to59':'60plus';}
function normalRenalScreen(s){return s.dialysis==='no'&&egfrBand(s.egfr)==='60plus'&&s.clcr!=='below30';}
function severeRenalScreen(s){return s.dialysis==='no'&&['15to29','below15'].includes(egfrBand(s.egfr))&&!['below30','30plus'].includes(s.clcr);}
function renalQuestion(d,s){
 if(s.dialysis!=='no')return '';
 const key=d.statin==='rosuvastatin'?'clcr':d.id==='pravafen'?'crcl':d.id==='fenolip160'?'fenoCrcl':'';
 if(!key)return '';
 if(key==='clcr'&&(normalRenalScreen(s)||severeRenalScreen(s)))return '';
 if(['contra','avoid','review'].includes(check(d,s).status))return '';
 return key;
}
function check(d,s,{initial=false,dose=d.dose}={}){
 let status='ok';const notes=[],refs=[];let doseText=d.statin?`${d.statin} ${dose} mg，每日一次（依治療需求確認）`:'';
 const add=(level,text)=>{if(priority[level]>priority[status])status=level;notes.push(text);};
 const cite=(key,product=false)=>{const source={...sources[key],key};if(product)source.scope='台灣產品仿單';if(!refs.some(x=>x.key===key))refs.push(source);};
 const dialysis=s.dialysis==='yes',band=dialysis?null:egfrBand(s.egfr),reduced=band&&band!=='60plus',severe=band==='15to29'||band==='below15';
 const hepatic=s.hepatic,enz=s.enzymes,active=s.liver==='yes',persistent=enz==='persistent3',high=enz==='above3'||persistent;
 if(!dialysis&&!band)add('pending','未透析者需近期 eGFR；未填不視為正常。');
 if(!['yes','no'].includes(s.dialysis))add('pending','需確認透析狀態。');
 if(dialysis)notes.push('需確認透析類型；血液透析的劑量與時程資料不能直接套用腹膜透析。');
 if(!['yes','no'].includes(s.liver))add('pending','需確認活動性肝病／不明原因轉胺酶持續升高。');
 if(!['normal','A','B','C','ungraded'].includes(hepatic))add('pending','需確認肝功能不全程度。');
 if(!['normal','to3','above3','persistent3'].includes(enz))add('pending','需確認 AST／ALT 相對正常上限的範圍。');
 if(d.statin){
  if(active)add('contra','活動性肝病或不明原因轉胺酶持續升高：含 statin 製劑禁用。');
  else if(high)add('review','AST／ALT ＞3 倍 ULN：先確認原因、持續性與肝損傷，不直接新增或提高 statin。');
  if(hepatic==='C'||hepatic==='ungraded')add('review','重度或未分級肝功能不全：不自動提供 statin 劑量。');
  else if(['A','B'].includes(hepatic))add('monitor','肝功能不全可能提高 statin 暴露量；核對劑量並監測肝損傷及肌肉症狀。');
  if(reduced||dialysis)add('monitor','腎功能不全會增加肌病／橫紋肌溶解風險；出現肌痛、無力或深色尿時評估 CK 與腎功能。');
  if(d.statin==='atorvastatin'){cite(d.id==='atotin10'?'atotin10TW':d.id==='atotin20'?'atotin20TW':'ator');notes.push('Atorvastatin 不需因腎功能不全調整劑量；仍須檢查交互作用。');}
  if(d.statin==='rosuvastatin'){
   cite('rosu',d.brand==='Crestor');
   notes.push(normalRenalScreen(s)&&!s.clcr?'eGFR ≥60：依腎功能篩檢先列可討論品項，省略額外 CLcr 選單；未計算或換算 CLcr。體型或肌肉量特殊、腎功能不穩定時，開立前仍須核對仿單指標。':'本仿單以 CLcr（mL/min/1.73m²）分級，不能直接以 eGFR 或未校正 CrCl 替代。');
   if(dialysis)add('review','血液透析不能套用「未透析且 CLcr ＜30」的劑量規則，需個別評估。');
   else if(!['below30','30plus'].includes(s.clcr)&&!normalRenalScreen(s)&&!severeRenalScreen(s))add('pending','需核對仿單使用的 CLcr 範圍，才能確認 rosuvastatin 劑量。');
   else if(s.clcr==='below30'||severeRenalScreen(s)){
    doseText=severeRenalScreen(s)?'eGFR ＜30：採保守篩選，起始規格評估 5 mg，每日一次；本版不推薦超過 10 mg／日。':'未透析且 CLcr ＜30：起始 5 mg，每日一次；上限 10 mg／日。';
    if(severeRenalScreen(s))notes.push('依 eGFR ＜30 保守限制品項，省略重複 CLcr 確認；未換算 CLcr，特殊體型或腎功能不穩定者仍需個別核對。');
    if(Number(dose)>10)add('contra',severeRenalScreen(s)?'依低 eGFR 保守篩選，此超過 10 mg／日規格不列入建議。':'Rosuvastatin 劑量超過嚴重腎功能不全的 10 mg／日上限。');
    else if(initial&&Number(dose)>5)add('adjust','起始需 5 mg；院內清單僅有 10／20 mg，未確認可分錠，不自動推薦半錠。');
    else add('monitor',severeRenalScreen(s)?'續用劑量未超過本版保守上限；仍需監測並核對實際腎功能與劑量。':'劑量在腎功能上限內；需監測肌肉不良反應。');
   } else notes.push(s.clcr==='30plus'?'CLcr ≥30：仿單不要求腎功能減量；亞洲病人起始劑量仍須評估 5 mg。':'尚無 CLcr 數值；亞洲病人起始劑量仍須評估 5 mg。');
  }
  if(d.statin==='pitavastatin'){
   cite(productSources[d.id]||'pitarty4TW');
   if(reduced||dialysis){
    if(band==='below15'&&!dialysis)add('review','eGFR ＜15 且未透析不在此仿單明列的 15–59／血液透析分組，需個別評估。');
    doseText='eGFR 15–59 或血液透析：起始 1 mg，每日一次；上限 2 mg／日。';
    if(Number(dose)>2)add('contra','Pitavastatin 劑量超過此腎功能分組的 2 mg／日上限。');
    else if(initial&&Number(dose)>1)add('adjust','起始需 1 mg；院內清單未有 1 mg，未確認可分錠，不自動推薦半錠。');
   }
  }
 }
 if(d.ezetimibe){
  cite('eze');notes.push('Ezetimibe 本身不需腎功能減量；複方仍受另一成分與產品規則限制。');
  if(['B','C'].includes(hepatic))add('avoid','Ezetimibe 不建議用於中、重度肝功能不全（Child-Pugh B／C）。');
 }
 if(d.id==='tonvasca210'){
  cite('tonvasca210TW');
  if(reduced||dialysis)add('avoid','Tonvasca 產品仿單不建議中、重度腎功能不全或血液透析者使用；不能只看 pitavastatin 2 mg 上限。');
  if(hepatic!=='normal'&&hepatic)add('avoid','Tonvasca 產品仿單不建議肝功能不全者使用。');
 }
 if(d.id==='livazebe410'){
  cite('livazebe410TW');
  if(hepatic==='A')add('contra','Livazebe 輕度肝功能不全：pitavastatin 起始 1 mg、每日最高 2 mg；院內固定 4/10 mg 超過上限，不自動分錠。');
 }
 if(['zulitor4','pitarty4','pitarty2','livalo2'].includes(d.id)&&['A','B'].includes(hepatic)){
  doseText='肝功能障礙成人：起始 1 mg，每日一次；上限 2 mg／日。';
  if(Number(dose)>2)add('contra','Pitavastatin 肝功能障礙成人最高 2 mg／日；目前規格／劑量超過上限。');
  else if(initial&&Number(dose)>1)add('adjust','肝功能障礙起始需 1 mg；院內沒有此規格且未確認可分錠，不自動推薦半錠。');
 }
 if(d.id==='cretrol1020'){
  cite('cretrol');if(high)add('avoid','Cretrol 仿單：血清轉胺酶 ＞3 倍 ULN 應調降劑量或停藥；先評估，不直接推薦此規格。');doseText='院內固定規格含 ezetimibe 10 mg／rosuvastatin 20 mg；僅肝腎條件適用時，每日 1 錠。';
  if((s.clcr==='below30'||severeRenalScreen(s))&&!dialysis)add('contra',severeRenalScreen(s)?'依低 eGFR 保守排除院內 Cretrol 10/20 mg；未以 eGFR 換算 CLcr。':'Cretrol 腎功能限制為最高 10/10 mg；院內 10/20 mg 不適用。');
 }
 if(d.id==='caduet510'){
  cite('caduet');notes.push('需同時確認 amlodipine 的血壓／心絞痛適應症；腎功能不全無須減量。');
  if(hepatic&&hepatic!=='normal')add('contra','Caduet 產品仿單不可用於肝功能不全病人。');
 }
 if(d.id==='pravafen'){
  cite('pravafen');doseText='僅符合原適應症且肝腎條件適用者：每日晚餐隨餐 1 顆。';
  if(dialysis)add('contra','Pravafen 禁用於腎功能不全及末期腎病。');
  else if(s.crcl==='below60'||s.ckd==='yes'||reduced)add('contra','Pravafen 禁用於腎功能不全；仿單要求 CrCl ＜60 mL/min 停用。');
  else if(!['below60','60plus'].includes(s.crcl))add('pending','Pravafen 須另核對未校正 CrCl（mL/min）及腎功能不全診斷；不能以 eGFR 直接替代。');
  if(active||(hepatic&&hepatic!=='normal')||persistent)add('contra','Pravafen 禁用於肝功能不全／活動性肝病；轉胺酶持續 ＞3 倍 ULN 應停用並評估。');
  notes.push('前 12 個月每 3 個月監測肝轉胺酶、腎功能及 CK；不得將單方減量規則套用此固定複方。');
 }
 if(d.id==='fenolip160'){
  cite('fenolipTW');doseText='肌酸酐清除率 ＞60 且其他條件適用：160 mg，每日 1 錠，與主餐併服。';
  if(dialysis)add('contra','嚴重慢性腎病／透析不使用 Fenolip-U。');
  else if(!['below30','30to60','above60'].includes(s.fenoCrcl)&&reduced){doseText='eGFR ＜60：本版保守排除院內 160 mg 規格；較低劑量是否適用須另核對產品所需 CrCl。';add('avoid','目前 eGFR 已顯示腎功能降低，不再要求確認後才排除 160 mg；未換算 CrCl，不自動推薦減半或其他規格。');}
  else if(!['below30','30to60','above60'].includes(s.fenoCrcl))add('pending','需補 Fenolip-U 仿單的肌酸酐清除率（mL/min）範圍；不能直接用 eGFR 代替。');
  else if(s.fenoCrcl==='below30')add('contra','肌酸酐清除率 ＜30 mL/min：不可使用 fenofibrate。');
  else if(s.fenoCrcl==='30to60'){
   doseText='肌酸酐清除率 30–60：需其他較低規格，100 mg 膠囊或 67 mg 微粒化膠囊，每日 1 顆。';
   add('adjust','院內 160 mg 規格不適用此腎功能分組。若無上述較低劑量產品，仿單不建議使用；不自動換算半錠。');
  }
  if(hepatic==='C'||persistent)add('contra','嚴重肝功能不良或不明原因持續肝功能異常禁用。');
  else if(hepatic&&hepatic!=='normal')add('avoid','產品仿單不建議用於肝功能不良病人。');
  if(active)add('review','活動性肝病需先評估肝損傷程度與病因，不直接列本品為候選。');
  if(high)add('review','AST／ALT 或 ALP ＞3 倍 ULN、黃疸時應考慮停用；肝炎確診時停用。');
  notes.push('前 12 個月每 3 個月檢查肝功能，之後定期追蹤；前 3 個月評估肌酸酐。肌酸酐 ＞1.5 倍 ULN 應中止治療。');
  notes.push('另核對膽結石、胰臟炎、過敏及交互作用；監測肌肉症狀。腎功能減量採本產品的 100／67 mg 膠囊規格，不套美國 54 mg 製劑。');
 }
 if(d.id==='nilemdo180'){
  cite('nilemdo');doseText='180 mg，口服每日一次。';
  if(severe||dialysis)add('review','eGFR ＜30 資料有限，透析尚未研究；這是證據限制，不是仿單腎功能禁忌。需額外監測後個別決定。');
  else notes.push('輕、中度腎功能不全不需減量。');
  if(hepatic==='C'||hepatic==='ungraded')add('review','Child-Pugh C 尚無資料，需個別評估及肝功能監測；A／B 不需減量。');
  if(persistent)add('avoid','Nilemdo 仿單要求轉胺酶持續 ＞3 倍 ULN 時停用。');
  else if(active||high)add('review','活動性肝病或 AST／ALT ＞3 倍 ULN：先評估肝損傷，不自動新增 Nilemdo。');
  notes.push('起始測肝功能；監測尿酸／痛風、肌腱症狀與併用 statin 的肌病風險。');
 }
 if(d.id==='repatha140'||d.id==='leqvio284'){
  const leqvio=d.id==='leqvio284';cite(leqvio?'leqvio284TW':'repatha140TW');
  doseText=leqvio?'284 mg 皮下注射，第 0、3 個月，之後每 6 個月；由醫療人員施用。':'一般成人高脂血症：140 mg 皮下注射，每 2 週；HoFH 劑量另評估。';
  notes.push('台灣產品仿單：腎功能不全不需減量；Child-Pugh A／B 不需減量。');
  if(hepatic==='C'||hepatic==='ungraded')add('review','重度肝功能不全尚無充分資料，不能視為無限制可使用。');
  if(active||high)add('review','目前有活動性肝病或明顯肝指數異常；先確認病因及肝損傷，不能僅憑 non-statin 判定適用。');
  if(leqvio&&dialysis)add('monitor','Leqvio 台灣產品仿單：給藥後至少 72 小時內不應進行血液透析，須先安排給藥與透析時程。');
  if(!leqvio&&hepatic==='B')add('monitor','中度肝功能不全需追蹤 LDL-C 反應。');
  notes.push('肝腎劑量適用不等於符合起始適應症或給付。');
 }
 if(d.id==='omacor1000'){
  cite('omacor1000TW');doseText='起始每日 2 次，每次 1 顆（共 2 g／日），餐後服用；反應不足可增至每日 2 次、每次 2 顆（共 4 g／日）；須確認 TG 適應症。';
  if(reduced||dialysis)add('review','腎功能不全使用資料有限，沒有已確立的分級減量方案；不標示為「已證實安全」。');
  if(active||(hepatic&&hepatic!=='normal')||high)add('review','Omacor 台灣仿單未有肝功能不全研究；肝功能不全治療期間須定期監測 AST／ALT，需個別評估。');
  notes.push('不能當作降 LDL-C 的替代；監測出血與心房顫動風險。');
 }
 if(d.id==='choles'){
  cite('choles');add('review','院內已停用、規格未確認，不提供處方劑量。腎功能不全／脫水時注意高氯性代謝性酸中毒，完全膽道阻塞為禁忌。');
 }
 if(productSources[d.id])refs.splice(0,refs.length,{...sources[productSources[d.id]],key:productSources[d.id]});
 if(s.gemfibrozil==='yes'&&d.statin){
  doseText='Gemfibrozil 併用：不建議此 statin 方案，需先個別評估，不提供自動建議劑量。';
  cite(d.statin==='atorvastatin'?'gemAtor':d.statin==='rosuvastatin'?'gemRosu':d.statin==='pitavastatin'?'gemPita':'gemGeneral');
  add('avoid','Gemfibrozil 與 '+d.statin+' 併用增加肌病／橫紋肌溶解及急性腎損傷風險，應避免／不建議併用；含此 statin 的複方亦須檢核。');
  if(d.statin==='rosuvastatin'){
   doseText='應避免 Gemfibrozil 併用；若經臨床評估無法避免，rosuvastatin 起始 5 mg，每日一次；最高 10 mg／日，且須同時符合肝腎限制。';
   notes.push('若臨床評估無法避免併用：rosuvastatin 起始 5 mg，每日一次；最高 10 mg／日。這是交互作用上限，仍須同時符合肝腎限制；原型不自動推薦此併用方案。');
   if(Number(dose)>10)add('contra','Gemfibrozil 併用時 rosuvastatin 超過 10 mg／日上限；目前品項／劑量不適用。');
  }
  notes.push('肌痛、壓痛、無力或深色尿時，應立即評估 CK、腎功能與藥物性肌病；正常 CK 監測不能保證此併用無風險。');
 }
 if(!refs.length)add('review','缺乏可核對的肝腎劑量來源。');
 if(refs.some(x=>x.scope.startsWith('國外')))notes.push('採國外同成分參考；正式開立須核對台灣產品與實際劑型。');
 if(enz==='to3')notes.push('AST／ALT 輕度升高不等同肝功能不全或活動性肝病；依病因與趨勢監測。');
 return {status,label:labels[status],eligible:['ok','monitor'].includes(status),notes:[...new Set(notes)],doseText,sources:refs};
}
function sortChecks(items){return [...items].sort((a,b)=>{
 const rank=d=>d.availability==='inactive'?7:(priority[d.organ.status]??4);
 return rank(a)-rank(b);
});}
const api={sources,labels,check,egfrBand,normalRenalScreen,severeRenalScreen,renalQuestion,sortChecks};root.LipidOrgan=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
