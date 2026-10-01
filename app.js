(function(){
'use strict';
const D=LipidData,E=LipidEngine,$=id=>document.getElementById(id);
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let state={...E.blank(),liverScreen:'unknown',simplifiedTreatment:true},step=0,result,submitted=false,selected='',showAll=false,overrides={},catalogQuery='',catalogGroup='all';
const storageKey='fengyuan-lipid-formulary-draft-v1';
try{const v=JSON.parse(localStorage.getItem(storageKey)||'{}');if(v&&typeof v==='object'&&!Array.isArray(v))for(const d of D.drugs){const x=v[d.id];if(x&&['active','shortage','inactive'].includes(x.availability)&&typeof x.specialist==='boolean'&&typeof x.note==='string')overrides[d.id]={availability:x.availability,specialist:x.specialist,note:x.note.slice(0,300)};}}catch{}
const drugs=()=>D.drugs.map(d=>({...d,...overrides[d.id]}));
const fieldNames={liverScreen:'肝病／肝功能異常確認',age:'年齡',sex:'性別',ldl:'目前 LDL-C',labDate:'檢驗日期',baseline:'治療前 LDL-C',hdl:'HDL-C',tg:'TG',tc:'總膽固醇',egfr:'eGFR',clcr:'CLcr',crcl:'CrCl',fenoCrcl:'Fenolip-U 肌酸酐清除率',hepatic:'肝功能不全程度',enzymes:'AST／ALT 範圍',waist:'腰圍',sbp:'收縮壓',dbp:'舒張壓',glucose:'空腹血糖',mode:'治療狀況',drug:'目前藥品',dose:'每日 statin 劑量',since:'治療開始日期',lifestyleMonths:'生活型態介入月數',tolerance:'Statin 耐受性'};
const unit=(id,label,suffix='',help='',type='number',extra='')=>E.ranges[id]?select(id,label,[['','請選擇'],...E.rangeOptions(id)],extra,help):`<div class="field ${type==='date'?'date-field':''} ${extra}"><label for="${id}">${label}</label><div class="unit-input"><input id="${id}" name="${id}" type="${type==='date'?'text':type}" ${type==='number'?'inputmode="decimal" min="0" step="any"':''} ${type==='date'?'readonly data-date-picker aria-haspopup="dialog" placeholder="點選日期"':''} autocomplete="off" ${help?`aria-describedby="${id}-help"`:''}>${suffix?`<span class="unit">${suffix}</span>`:''}</div>${help?`<small id="${id}-help">${help}</small>`:''}</div>`;
const select=(id,label,options,extra='',help='')=>`<div class="field ${extra}"><label for="${id}">${label}</label><select id="${id}" name="${id}" ${help?`aria-describedby="${id}-help"`:""}>${options.map(([v,t])=>`<option value="${v}">${escape(t)}</option>`).join('')}</select>${help?`<small id="${id}-help">${help}</small>`:''}</div>`;
const tri=([id,label,help])=>`<div class="tri-row"><div class="tri-label" id="${id}-label">${label}${help?`<small>${help}</small>`:''}</div><fieldset class="tri" aria-labelledby="${id}-label"><legend>${label}</legend>${[['yes','是'],['no','否'],['unknown','不清楚']].map(([v,t])=>`<label><input type="radio" name="${id}" value="${v}" ${v==='unknown'?'checked':''}><span>${t}</span></label>`).join('')}</fieldset></div>`;
function renderForm(){
 $('basic-fields').innerHTML=unit('age','年齡','歲')+select('sex','性別',[['','請選擇'],['male','男性'],['female','女性']], '', '依本版風險公式所採性別。')+unit('ldl','目前 LDL-C','mg/dL')+unit('labDate','本次血脂檢驗日期','','','date')+unit('baseline','治療前 LDL-C','mg/dL','不知道請留白，不以目前值替代。')+unit('hdl','HDL-C','mg/dL','用於風險因子與代謝症候群。')+unit('tg','TG','mg/dL','代謝症候群採空腹數值。')+unit('egfr','近期 eGFR','','依近期檢驗選範圍；已在上方確認未透析。各藥物的減量與禁忌門檻不同，eGFR 不可直接當作 CrCl／CLcr。若仿單要求其他指標或精確數值，須另行核對。選藥會依各成分與產品規則篩選；不以 60 作共同禁忌門檻。','number','full');
 $('safety-fields').innerHTML=D.safetyFields.filter(([k])=>k!=='liver').map(tri).join('')+tri(['liverScreen','是否有已知肝病、肝功能不全或肝指數異常？','請依已取得的病史與近期檢驗確認。皆無選「否」；未查驗或無法確認選「不清楚」。'])+`<p id="liver-screen-hint" class="hint"></p><div id="liver-details">${tri(D.safetyFields.find(([k])=>k==='liver'))}<div class="fields organ-fields">${select('hepatic','肝功能不全程度',[['','請選擇'],['normal','無已知肝功能不全'],['A','Child-Pugh A（輕度）'],['B','Child-Pugh B（中度）'],['C','Child-Pugh C（重度）'],['ungraded','已知肝功能不全，但尚未分級']],'','AST／ALT 不能換算 Child-Pugh；需依臨床診斷確認。')}${select('enzymes','AST／ALT 相對正常上限',[['','請選擇'],['normal','皆在正常範圍'],['to3','任一升高，但皆 ≤3 倍 ULN'],['above3','任一 ＞3 倍 ULN，持續性未確認'],['persistent3','已確認持續 ＞3 倍 ULN']],'','ULN 為該檢驗室正常上限；輕度升高不等同活動性肝病。')}</div></div>`;
 document.querySelector('[name="dialysis"]').closest('.tri-row').insertAdjacentElement('afterend',$('egfr').closest('.field'));
 $('risk-fields').innerHTML=`<div id="risk-progress" class="tree-progress" role="status"></div><div id="quick-risk" class="quick-risk"><p class="section-label">已確認完整組合？可直接套用</p><button type="button" class="quick-choice" data-quick="acs,dm">ACS ＋糖尿病 <span>直接確認極高風險 →</span></button><button type="button" class="quick-choice" data-quick="cad,recentMI">CAD ＋一年內心肌梗塞 <span>直接確認極高風險 →</span></button></div><div id="tree-heading" tabindex="-1"></div><div id="tree-active"></div><button type="button" id="tree-none" class="secondary">確認上列疾病皆無</button><div id="tree-complete" class="tree-complete" hidden></div><div id="lower-risk" hidden><p class="hint">已排除更高分層。確認至少 2 項因子即可完成中風險分級，不再要求其餘因子。</p><div id="lower-basic" class="fields"></div><div id="rf-derived" class="derived"></div><details id="metabolic-details" class="risk-details"><summary>需要時再填：代謝症候群五項條件</summary><p class="hint">至少三項符合，且需確認空腹狀態與資料可共同判讀。</p><div class="fields">${unit('waist','腰圍','cm')+unit('glucose','空腹血糖','mg/dL')+unit('sbp','收縮壓','mmHg')+unit('dbp','舒張壓','mmHg')}</div>${[['bpMeds','使用降血壓藥物',''],['glucoseMeds','使用糖尿病藥物',''],['tgMeds','使用治療 TG 的血脂藥物',''],['metabolicPeriod','已確認代謝症候群資料可共同判讀','含空腹狀態與資料時間。']].map(tri).join('')}</details></div><details id="risk-review" class="risk-details"><summary>檢視／修改已填答案與其他病史</summary><p class="hint">略過的問題仍保留「不清楚」。修改任何答案後，系統會重新判斷。</p><div id="tree-review">${[...D.riskFields,...D.advancedFields,...D.rfFields].map(tri).join('')}</div></details>`;

 const drugOpts=[['','請選擇院內藥品'],...D.drugs.filter(d=>d.availability!=='inactive').map(d=>[d.id,`${d.brand} ${d.strength}`]),['other','其他或多重組合：需個別評估']];
 $('treatment-fields').innerHTML=select('mode','目前治療狀況',[['','請選擇'],['none','尚未接受降血脂藥物治療'],['lifestyle','生活型態介入中'],['treated','目前使用降血脂藥物']],'full')+select('drug','目前藥品',drugOpts,'full')+unit('dose','每日 statin 成分劑量','mg','複方只填 statin 含量；不等於錠數。')+unit('since','目前方案開始日期','','調整藥品／劑量後，填新方案起始日。','date')+`<div id="current-note" class="current-note"></div>`+unit('lifestyleMonths','生活型態介入時間','個月','低／中風險及零項因子者評估 3–6 個月。')+select('tolerance','Statin 耐受性',[['','請選擇'],['full','無已知不耐受／尚未使用'],['partial','部分不耐受'],['none','已確認完全不耐受']]);
 $('treatment-tris').innerHTML='';
}
function syncForm(){
 for(const [k,v] of Object.entries(state)){const els=document.getElementsByName(k);for(const el of els){if(el.type==='radio')el.checked=el.value===v;else {if(E.ranges[k])state[k]=E.toRange(k,v);el.value=state[k];}}}
 conditional();
}
function conditional(){
 $('egfr').closest('.field').hidden=state.dialysis!=='no';
 $('liver-details').hidden=state.liverScreen!=='yes';
 $('liver-screen-hint').textContent=state.liverScreen==='no'?'已確認無上述肝病、肝功能不全及肝指數異常，省略細項。若有新資料，請改選「是」。':state.liverScreen==='yes'?'請補充下方資料；已知肝病不一定代表活動性肝病或肝功能不全。':'肝功能狀態待確認，不視為正常；確認後再列可討論品項。';
 const on=state.mode==='treated';for(const id of ['drug','dose','since'])$(id).closest('.field').hidden=!on;
 for(const id of ['adherence','maxTolerated','addEze'])document.querySelector(`[name="${id}"]`)?.closest('.tri-row')?.toggleAttribute('hidden',!on);
 const current=D.drugs.find(d=>d.id===state.drug);$('dose').closest('.field').hidden=!on||!current?.statin;
 $('current-note').hidden=!on||!current;
 if(current){$('current-note').textContent=current.ingredients+(current.ezetimibe?'。已含 ezetimibe，勿重複加用。':'。請核對實際每日劑量。');}
 $('lifestyleMonths').closest('.field').hidden=on||E.classify(state).rank>=3;
 document.querySelector('[name=primaryHyper]')?.closest('.tri-row')?.toggleAttribute('hidden',!on);
 document.querySelector('[name=addEze]')?.closest('.tri-row')?.toggleAttribute('hidden',!on||!!current?.ezetimibe);
}
function renderTree(){
 const r=result.risk;
 const invalidRisk=result.errors.some(k=>['age','ldl','baseline','hdl','tg','waist','sbp','dbp','glucose'].includes(k));
 const planned=E.nextRisk(state),q=invalidRisk?{...planned,done:false,lower:planned.lower||planned.rank<=2}:planned;
 const active=document.activeElement;
 const restore=active?.matches('input[type=radio]')?{name:active.name,value:active.value}:null;
 // Reuse the same controls; no duplicate IDs, stale branch values or implicit negatives.
 const all=[...D.riskFields,...D.advancedFields,...D.rfFields];
 for(const [k]of all){const row=document.querySelector(`[name="${k}"]`).closest('.tri-row');const dest=q.keys.includes(k)?$('tree-active'):$('tree-review');if(row.parentElement!==dest)dest.append(row);}
 const dialysis=document.querySelector('[name=dialysis]').closest('.tri-row');const dialysisDest=q.keys.includes('dialysis')?$('tree-active'):$('safety-fields');if(dialysis.parentElement!==dialysisDest)dialysisDest.prepend(dialysis);
 $('lower-risk').hidden=!q.lower;
 const lowerInputs=q.lower&&step===0;
 const tgField=$('tg').closest('.field');const tgDest=lowerInputs?$('metabolic-details').querySelector('.fields'):$('basic-fields');if(tgField.parentElement!==tgDest)tgDest.append(tgField);
 for(const k of ['age','sex','hdl']){const field=$(k).closest('.field');const dest=lowerInputs?$('lower-basic'):k==='hdl'?$('optional-labs'):$('basic-fields');if(field.parentElement!==dest)dest.append(field);}
 const showMetabolic=q.lower&&r.rf[5]===null;
 $('metabolic-details').hidden=!showMetabolic;
 $('quick-risk').hidden=q.done||all.some(([k])=>state[k]!=='unknown');
 $('tree-none').hidden=q.done||!q.keys.length||q.keys.includes('dialysis');
 $('tree-none').textContent=q.lower?'確認上列風險因子皆無':'確認上列疾病／條件皆無';
 $('tree-heading').innerHTML=invalidRisk?'<h3>請先修正輸入數值</h3><p class="hint">目前有不合理的數值，修正後再確認分級。</p>':q.done?'<h3>風險分級已完成</h3>':`<h3>${q.lower?'最後確認：一般風險因子':`優先確認：${E.levels[q.rank].name}條件`}</h3><p class="hint">${q.rank===5?'符合完整疾病組合即停止；單一疾病不一定是極高風險。':q.lower?'不需逐項填滿；足以決定等級即可停止。':'只需確認仍可能改變最高等級的條件。'}</p>`;
 $('risk-progress').textContent=q.done?'已完成分級 → 可繼續治療評估':`極高風險 → 非常高風險 → 高風險 → 一般因子｜目前${q.lower?'確認一般因子':'確認'+E.levels[q.rank].name}`;
 $('tree-complete').hidden=!q.done;
 $('tree-complete').innerHTML=q.done?`<strong>${r.name} · LDL-C 治療目標 ＜${r.target} mg/dL</strong><p>${escape(r.reasons.join('、'))}</p><p>其他因子不會提高本次風險分級，無須繼續填寫。需要修改時可展開下方答案。</p><button type="button" class="primary" id="continue-treatment">繼續：血脂與用藥評估</button>`:'';
 if(restore){const el=document.querySelector(`[name="${restore.name}"][value="${restore.value}"]`);if(el&&el.closest('#tree-active'))el.focus({preventScroll:true});else if(el&&el.closest('details')?.open)el.focus({preventScroll:true});else $('tree-heading').focus({preventScroll:true});}
}

function setStep(n,scroll=true){const changed=step!==Math.max(0,Math.min(1,n));step=Math.max(0,Math.min(1,n));for(let i=0;i<2;i++){$(`step-${i}`).hidden=i!==step;const b=$(`step-tab-${i}`);b.classList.toggle('active',i===step);b.setAttribute('aria-selected',String(i===step));} $('previous').disabled=step===0;$('next').textContent=['下一步：輸入基本資料','查看評估結果'][step];$('step-description').textContent=`步驟 ${step+1}／2`;if(result)renderResult();if(scroll&&changed){document.querySelector('.steps').scrollIntoView({block:'start'});if(step===1)$('basic-heading').focus({preventScroll:true});}}
function updateValidation(){
 const required=new Set(E.requiredFields(state,drugs()));
 const missing=new Set(submitted?E.missingFields(state,drugs()):[]);
 const errors=new Set(result.errors);
 const form=$('assessment-form');
 form.querySelectorAll('.required-tag').forEach(el=>el.remove());
 form.querySelectorAll('.missing-control').forEach(el=>el.classList.remove('missing-control'));
 form.querySelectorAll('[aria-required],[aria-invalid]').forEach(el=>{el.removeAttribute('aria-required');el.removeAttribute('aria-invalid');});
 for(const key of Object.keys(state)){
  const input=document.getElementsByName(key)[0];if(!input||!form.contains(input))continue;
  const radio=input.type==='radio';const control=radio?input.closest('fieldset'):input;
  const container=radio?input.closest('.tri-row'):input.closest('.field');
  const label=radio?container.querySelector('.tri-label'):container.querySelector('label');
  if(required.has(key)){label.insertAdjacentHTML('beforeend','<span class="required-tag" aria-hidden="true">必填</span>');control.setAttribute('aria-required','true');}
  if(missing.has(key))control.classList.add('missing-control');
  if(missing.has(key)||errors.has(key))control.setAttribute('aria-invalid','true');
 }
 for(let i=0;i<2;i++){const panel=$(`step-${i}`);$(`step-tab-${i}`).classList.toggle('has-missing',!!panel.querySelector('.missing-control'));}
 const summary=$('validation-summary');
 summary.hidden=!submitted||(!missing.size&&!errors.size);
 summary.textContent=errors.size?'請修正標示的數值或日期；紅框欄位仍需填寫。':`尚有 ${missing.size} 項必要資料未填或未確認，請完成紅框欄位。`;
}
function viewResults(){
 submitted=true;renderResult();
 const keys=[...E.missingFields(state,drugs()),...result.errors];
 if(keys.length){
  const controls=keys.filter(k=>!renalOptions[k]).map(k=>document.getElementsByName(k)[0]).filter(Boolean);
  const input=controls.find(el=>el.closest('.step-content').id===`step-${step}`)||controls[0];
  if(input){const panel=input.closest('.step-content');setStep(Number(panel.id.slice(-1)));for(let p=input.parentElement;p&&p!==$('assessment-form');p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;const target=input.type==='radio'?input.closest('fieldset'):input;target.scrollIntoView({behavior:'smooth',block:'center'});input.focus({preventScroll:true});}
  if(!input){setStep(1);const renal=$('results').querySelector('[data-renal-key].missing-control');if(renal){for(let p=renal.parentElement;p&&p!==$('results');p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;renal.scrollIntoView({behavior:'smooth',block:'center'});renal.focus({preventScroll:true});}}
  toast('請先完成紅框的必填欄位；個別藥品腎功能資料請在結果中的對應品項下方選擇。');return;
 }
 setStep(1);$('results').scrollIntoView({behavior:'smooth',block:'start'});
}
function specialAdvicePanel(r){return (r.specialAdvice||[]).map(c=>'<div class="card special-advice" data-special-advice="'+escape(c.id)+'"><h2>'+escape(c.title)+'</h2>'+c.items.map(i=>'<div class="notice '+(/避免|高 TG|懷孕|哺乳/.test(i.label)?'danger':'info')+'"><strong>'+escape(i.label)+'</strong><p>'+escape(i.text)+'</p></div>').join('')+'<details class="disclosure"><summary>指引與適用範圍</summary>'+c.sources.map(x=>'<p>'+(x.url?'<a href="'+escape(x.url)+'" target="_blank" rel="noopener noreferrer">'+escape(x.title)+'</a>':escape(x.title))+'<br><small>'+escape(x.scope)+'</small></p>').join('')+'</details></div>').join('');}
function renderResult(){
 const expanded=[...$('results').querySelectorAll('details[open]')].map(d=>d.querySelector('summary')?.textContent);
 result=E.evaluate(state,drugs());renderTree();const r=result,hasRisk=!!state.age||state.ldl!==''||[...D.riskFields,...D.rfFields].some(([k])=>state[k]!=='unknown');
 const m=r.risk.metabolic,ageRF=r.risk.rf[0];
 $('rf-derived').innerHTML=`年齡因子：${ageRF===null?'待確認':ageRF?'符合':'不符合'} · 低 HDL-C：${m.lowHDL===null?'待確認':m.lowHDL?'符合':'不符合'}<br>代謝症候群：${m.value===null?'待確認':m.value?'符合':'不符合'}（五項中已知 ${m.yes} 項符合、${m.unknown} 項缺資料）`;
 for(const el of $('assessment-form').querySelectorAll('.error-input')){el.classList.remove('error-input');el.removeAttribute('aria-invalid');}
 r.errors.forEach(k=>{$(k)?.classList.add('error-input');$(k)?.setAttribute('aria-invalid','true');});
 if(selected&&!r.candidates.some(d=>d.id===selected))selected='';
 const riskName=!hasRisk?'等待評估':r.risk.provisional?(r.risk.rank===0?'風險待確認':`至少${r.risk.name}`):r.risk.name;
 const current=hasRisk&&r.ldl!==null&&!r.errors.includes('ldl')?escape(r.ldl):'—';
 const target=hasRisk&&!r.errors.length&&!r.risk.provisional?`&lt;${r.risk.target}`:'—';
 const validMeasured=r.ldl!==null&&!r.errors.length;
 const status=r.risk.provisional?'分層未確認，暫不判定達標':validMeasured?(r.achieved?'低於目前分層目標':'尚未達目前分層目標'):'尚未取得有效血脂資料';
 const percent=validMeasured&&!r.risk.provisional?Math.min(100,Math.max(0,r.risk.target/r.ldl*100)):0;
 const orderedCandidates=LipidOrgan.sortChecks(r.candidates);const candidates=orderedCandidates;
 const safetyUnknown=r.missing.length>0;
 let details=r.description;
 if(!r.canRecommend&&!r.stops.length&&!r.errors.length)details='目前僅顯示初步方向。補齊下方資料後才提供具體藥品候選，避免依不完整資訊選藥。';
 $('results').innerHTML=`<div class="result-hero"><div class="result-topline"><span>評估摘要</span><span class="risk-badge">${!hasRisk?'尚未填寫':r.risk.provisional?'待補資料':'依已填資料分層'}</span></div><h2>${riskName}</h2><p class="result-reason">${hasRisk?escape(r.risk.reasons.join('、')):'選擇已確認的疾病，即可開始逐步分級。'}${hasRisk&&r.risk.provisional?`<br>未知條件可能提高至${r.risk.upperName}。`:''}</p><div class="metric-grid"><div><span class="metric-label">目前 LDL-C</span><strong class="metric-number">${current}<small>mg/dL</small></strong></div><div><span class="metric-label">治療目標</span><strong class="metric-number metric-target">${target}<small>mg/dL</small></strong></div></div><div class="progress-track" aria-hidden="true"><div class="progress-fill" style="width:${percent}%"></div></div><div class="hero-foot"><span>${status}</span><span>${state.labDate?escape(state.labDate):'未填檢驗日'}</span></div>${r.baselineReduction!==null&&!r.errors.length?`<div class="hero-foot"><span>相對治療前下降 ${r.baselineReduction.toFixed(1)}%（不等於已符合所有治療目標）</span></div>`:''}</div>
 <div class="card"><div class="card-title"><h2>下一步治療方向</h2><span class="step-tag">臨床建議</span></div><h3 class="action-title">${!hasRisk?'先完成風險分級':escape(r.title)}</h3><p class="body-copy">${escape(details)}</p>${r.errors.length?`<div class="notice danger">請修正：${r.errors.map(k=>fieldNames[k]||k).join('、')}。日期不得在未來，血脂等數值須大於零。</div>`:''}${r.stops.length?`<div class="notice danger">${r.stops.map(escape).join('<br>')}</div>`:''}${r.warnings.map(w=>`<div class="notice">${escape(w)}</div>`).join('')}${safetyUnknown&&!r.errors.length?`<details class="disclosure" ${hasRisk&&step>0?'open':''}><summary>需補齊 ${r.missing.length} 項資料</summary><ul class="missing-list">${r.missing.map(x=>`<li>${escape(x)}</li>`).join('')}</ul></details>`:''}${r.canRecommend?`<div class="notice info">追蹤：${escape(r.followup)}</div>`:''}</div>
 ${specialAdvicePanel(r)}<div class="card"><div class="card-title"><h2>院內藥品選項</h2><span class="step-tag">${r.candidates.length?`${r.candidates.length} 項討論候選`:'逐品項檢核'}</span></div>${r.candidates.length?`<p class="hint">依療程與肝腎條件列出選項；適應症、單方治療紀錄與併用藥請於開立時核對。此處選擇僅加入摘要。</p>${candidates.map(drugCard).join('')}`:`<div class="empty-result"><div class="empty-symbol" aria-hidden="true">${r.action==='maintain'?'✓':'＋'}</div>${r.action==='maintain'&&r.canRecommend?'目前達標，原型不列新增藥品。':r.action==='lifestyle'&&r.canRecommend?'目前先採生活型態介入，尚不列初始藥品。':r.canRecommend?'目前沒有可直接列出的合適品項；請檢視遵從性、療程或個別評估。':r.specialAdvice.length?'此特殊族群不自動列新增藥品；請先依上方具體建議處理。下方肝腎檢核僅提供產品限制，不代表已通過孕期或哺乳安全評估。':'完成資料與安全檢核後，顯示可討論的院內品項。'}</div>`}${organPanel(r)}<details class="disclosure"><summary>選藥範圍與限制</summary><ul><li>複方依療程與適應症列出，不限制與原處方相同成分或劑量；更換時重新確認適合的強度與耐受性。</li><li>複方以取代原處方評估，不能直接加在相同成分上。</li><li>單方 ezetimibe 尚未確認院內供應；查無可選品項不代表無臨床治療選擇。</li><li>處方集非即時庫存，正式開立前仍需核對。</li></ul></details></div>
 <div class="result-actions"><button class="secondary" id="summary-button">查看／複製摘要</button><button class="secondary" data-go-rules>查看規則依據</button></div>`;
 if(step<1){$('results').querySelectorAll('.card').forEach(el=>el.hidden=true);$('results').querySelector('.result-actions').insertAdjacentHTML('beforebegin',`<div class="notice info">${step===0?'先完成風險分級即可查看治療目標。若要評估治療，再填血脂、療程與安全資料。':'完成本步的血脂與安全資料後，再確認目前治療，即可查看治療方向與院內藥品。'}</div>${r.errors.length?`<div class="notice danger">請修正：${r.errors.map(k=>escape(fieldNames[k]||k)).join('、')}。</div>`:''}`);}
 $('summary-button').addEventListener('click',openSummary);$('expand-drugs')?.addEventListener('click',()=>{showAll=!showAll;renderResult();});
 $('results').querySelector('[data-go-rules]').addEventListener('click',()=>setPage('rules'));
 $('results').querySelectorAll('[data-select-drug]').forEach(b=>b.addEventListener('click',()=>{selected=selected===b.dataset.selectDrug?'':b.dataset.selectDrug;renderResult();}));
 $('results').querySelectorAll('details').forEach(d=>{if(expanded.includes(d.querySelector('summary')?.textContent))d.open=true;});
 updateValidation();
}
function drugCard(d){const chosen=selected===d.id;const use=d.group==='combo'?`評估換為此複方；${result.current?.statin!==d.statin?'更換 statin 成分，不同成分的 mg 劑量不可直接比較':d.dose===Number(state.dose)?'保留相同 statin 劑量並加入 ezetimibe':'會變動 statin 劑量，需確認治療強度與耐受性'}。原處方須同步調整。`:d.group==='advanced'?'進階評估選項，需確認個別適應症、療效證據與病人偏好。':`${d.intensity==='high'?'高':'中'}強度 statin 參考品項；實際處方劑量須依病人條件核對。`;
 return `<article class="drug-card"><div class="drug-top"><div class="drug-name">${escape(d.brand)} <span>${escape(d.strength)}</span><small>${escape(d.ingredients)}</small></div><span class="tag ${d.payment==='self'?'self':''}">${d.payment==='self'?'院內自費':d.group==='combo'?'複方':d.intensity==='high'?'高強度':d.group==='advanced'?'進階治療':'中強度'}</span></div><p class="drug-use">${escape(use)}</p>${d.specialist?'<span class="tag">限專科，條件待核對</span>':''}${d.note?`<p class="drug-use">本機備註：${escape(d.note)}</p>`:''}${organDetails(d.organ,d,'candidate')}<div class="coverage">療程檢核｜${escape(d.coverage)}</div><button class="select-drug ${chosen?'selected':''}" data-select-drug="${d.id}" aria-pressed="${chosen}">${chosen?'已加入討論摘要':'加入討論摘要'}</button></article>`;
}
const renalOptions={
 clcr:{label:'CLcr 範圍（mL/min/1.73m²）',options:[['','請選擇範圍'],['30plus','≥30 mL/min/1.73m²'],['below30','＜30 mL/min/1.73m²']],help:'Rosuvastatin 仿單採體表面積校正的 CLcr，不以 eGFR 或未校正 CrCl 代替。'},
 crcl:{label:'CrCl 範圍（mL/min）',options:[['','請選擇範圍'],['60plus','≥60 mL/min'],['below60','＜60 mL/min']],help:'Pravafen 仿單採未校正 CrCl，不能直接以 eGFR 代替。'},
 fenoCrcl:{label:'肌酸酐清除率範圍（mL/min）',options:[['','請選擇範圍'],['above60','＞60 mL/min'],['30to60','30–60 mL/min（包含 60）'],['below30','＜30 mL/min']],help:'Fenolip-U 產品分組包括 60；不能直接以 eGFR 代替。'}
};
function renalDrugField(d,context){
 if(!d||!context||state.dialysis!=='no')return '';
 const key=LipidOrgan.renalQuestion(d,state);if(!key)return '';
 if(key==='clcr'&&LipidOrgan.normalRenalScreen(state))return '';
 const spec=renalOptions[key],id='renal-'+context+'-'+d.id,required=E.requiredFields(state,drugs()).includes(key),missing=submitted&&required&&!state[key];
 return '<div class="field renal-drug-field"><label for="'+id+'">'+escape(spec.label)+(required?'<span class="required-tag">必填</span>':'')+'</label><p class="hint">'+(required?'目前用藥需要此資料，才能完成劑量檢核。':'考慮此品項時再選；同一指標的選擇會同步套用相關品項。')+'</p><select id="'+id+'" name="'+key+'" data-renal-key="'+key+'" class="'+(missing?'missing-control':'')+'" '+(required?'aria-required="true"':'')+' '+(missing?'aria-invalid="true"':'')+' aria-describedby="'+id+'-help">'+spec.options.map(([v,t])=>'<option value="'+v+'" '+(state[key]===v?'selected':'')+'>'+escape(t)+'</option>').join('')+'</select><small id="'+id+'-help">'+escape(spec.help)+'</small></div>';
}
function organDetails(o,d,context){const alert=['adjust','avoid','contra'].includes(o.status);return `<div class="organ-check ${alert?'organ-alert':''}" data-organ-status="${escape(o.status)}"><strong>${escape(o.label)}</strong>${renalDrugField(d,context)}${o.status==='pending'?'<p>尚缺必要資料，暫不提供可用劑量；需補項目見下方。</p>':o.doseText?`<p>${escape(o.doseText)}</p>`:''}<ul>${o.notes.map(n=>`<li class="${/禁用|不建議|不可用|超過|上限|起始需|需較低|停用|最高|不適用|不應進行|避免血液透析/.test(n)?'organ-restriction':''}">${escape(n)}</li>`).join('')}</ul><details><summary>仿單／成分依據</summary>${o.sources.map(x=>`<p><a href="${escape(x.url)}" target="_blank" rel="noopener noreferrer">${escape(x.title)}</a><small>${escape(x.scope)}｜${escape(x.section)}｜查核 2026-10-01</small></p>`).join('')}</details></div>`;}
function organReference(d){const o=LipidOrgan.check(d,state);return `<details><summary>肝腎用藥依據</summary>${organDetails(o)}</details>`;}
function organPanel(r){const excluded=LipidOrgan.sortChecks(r.excludedCandidates||[]);return `${r.currentOrgan?`<div class="notice ${r.currentOrgan.eligible?'info':'danger'}"><h3>目前用藥肝腎檢核｜${escape(r.current.brand)}</h3>${organDetails(r.currentOrgan,r.current,'current')}</div>`:''}${excluded.length?`<details class="disclosure" open><summary>另有 ${excluded.length} 項因肝腎條件／資料未列入候選</summary>${excluded.map(d=>`<h3>${escape(d.brand)} ${escape(d.strength)}</h3>${organDetails(d.organ,d,'excluded')}`).join('')}</details>`:''}<details class="disclosure"><summary>查看全部院內品項的肝腎檢核（${r.organChecks.length} 項）</summary><p class="hint">此清單僅檢查肝腎限制，不表示符合治療適應症、給付或可直接開立。未填條件仍列待確認。透析不自動起始治療；固定複方不自動分錠。</p>${LipidOrgan.sortChecks(r.organChecks).map(d=>`<h3>${escape(d.brand)} ${escape(d.strength)}${d.availability==='inactive'?'（已停用）':''}</h3>${organDetails(d.organ,d,'all')}`).join('')}</details>`;}
const payLabels={table1:'新制表一候選',legacy:'維持原給付',combo8w:'複方：療程超過 6 週',combo3m:'複方：療程超過 3 個曆月',review:'個別審查',self:'院內自費',separate:'獨立規定待核對'};
const groupLabels={statin:'Statin 單方',combo:'Statin＋ezetimibe',advanced:'進階降 LDL-C',tg:'TG 相關用藥',othercombo:'其他複方',other:'其他'};
const availabilityLabels={active:'正常供應',shortage:'缺貨',inactive:'已停用'};
function renderCatalog(){
 const list=drugs().filter(d=>(catalogGroup==='all'||d.group===catalogGroup)&&`${d.brand} ${d.ingredients} ${d.strength}`.toLowerCase().includes(catalogQuery.toLowerCase()));
 $('page-formulary').innerHTML=`<div class="page-heading"><div><p class="eyebrow">HOSPITAL FORMULARY</p><h1>院內藥品，依實際品項維護。</h1><p class="subtle">來源為 2026.09.30 處方集查閱結果與 HIS 需求單；院內碼／健保碼仍待核對。</p></div><button class="secondary" id="export-formulary">匯出目前主檔</button></div><div class="notice info">本頁為本機維護示範。調整供應狀態會影響本瀏覽器的候選清單，不會更新院內正式系統。</div><div class="toolbar"><label class="sr-only" for="drug-search">搜尋藥名或成分</label><input id="drug-search" type="search" placeholder="搜尋藥名或成分" value="${escape(catalogQuery)}"><label class="sr-only" for="drug-group">藥品分類</label><select id="drug-group"><option value="all">全部分類</option>${Object.entries(groupLabels).map(([v,t])=>`<option value="${v}" ${v===catalogGroup?'selected':''}>${t}</option>`).join('')}</select></div><p class="hint">顯示 ${list.length}／${D.drugs.length} 筆 · 已修改 ${Object.keys(overrides).length} 筆本機設定 · 空白代碼不以推測補值</p><div class="table-wrap"><table><caption class="sr-only">院內降血脂藥品主檔</caption><thead><tr><th>品項／成分</th><th>類別／強度</th><th>給付分支</th><th>供應與限制</th><th>維護</th></tr></thead><tbody>${list.map(d=>`<tr><td><strong>${escape(d.brand)} ${escape(d.strength)}</strong><small>${escape(d.ingredients)}</small><small>院內碼／健保碼：待核對</small></td><td>${groupLabels[d.group]}${d.intensity?`<small>${d.intensity==='high'?'高強度':'中強度'} statin 成分</small>`:''}</td><td>${payLabels[d.payment]}<small>${d.payment==='combo8w'?'開始日至抽血日超過 6 週才列入建議':d.payment==='combo3m'?'開始日至抽血日超過 3 個曆月才列入建議':'依個別給付分支檢核'}</small></td><td><span class="tag">${availabilityLabels[d.availability]}</span>${d.specialist?'<small>限專科</small>':''}${d.note?`<small>${escape(d.note)}</small>`:''}${overrides[d.id]?'<small>本機已調整</small>':''}${organReference(d)}</td><td><button class="secondary" data-edit="${d.id}">維護</button></td></tr>`).join('')||'<tr><td colspan="5">查無符合品項。</td></tr>'}</tbody></table></div>`;
 $('drug-search').addEventListener('input',ev=>{const p=ev.target.selectionStart;catalogQuery=ev.target.value;renderCatalog();$('drug-search').focus();try{$('drug-search').setSelectionRange(p,p);}catch{}});
 $('drug-group').addEventListener('change',ev=>{catalogGroup=ev.target.value;renderCatalog();});
 $('export-formulary').addEventListener('click',()=>download('院內降血脂藥品_原型主檔.json',JSON.stringify({version:D.version,status:'draft-not-clinically-approved',sourceDate:'2026-09-30',drugs:drugs()},null,2),'application/json'));
 $('page-formulary').querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click',()=>openEditor(b.dataset.edit)));
}
function renderRules(){
 $('page-rules').innerHTML=`<div class="page-heading"><div><p class="eyebrow">RULES & EVIDENCE</p><h1>每個判斷，都保留來源與限制。</h1><p class="subtle">${D.version} · 狀態：待院內核定 · 目前以手動輸入驗證操作流程</p></div><button class="secondary" id="export-rules">匯出規則核對表</button></div><div class="rules-grid"><div class="card"><h2>治療目標</h2><p class="hint">主要五級採 2025 台灣血脂管理臨床路徑共識。零項因子 ＜160 為 2024 台灣初級預防指引的補充分支；給付條件另行確認。</p><table><thead><tr><th>風險分層</th><th>LDL-C 治療目標</th></tr></thead><tbody>${[...E.levels].reverse().map(l=>`<tr><td>${l.name}</td><td>＜${l.target} mg/dL</td></tr>`).join('')}</tbody></table></div><div class="card"><h2>來源文件與網站</h2><ul class="source-list">${[...D.sources,...Object.values(LipidOrgan.sources).map(s=>({name:s.title,url:s.url,detail:s.scope+'｜'+s.section+'｜查閱 2026-10-01'}))].map(s=>`<li>${s.url?`<a href="${s.url}" target="_blank" rel="noopener noreferrer">${escape(s.name)}</a>`:escape(s.name)}<small>${escape(s.detail)}</small></li>`).join('')}</ul></div></div><h2 class="rules-title">規則核對與待決事項</h2><p class="subtle">以下項目皆保留為草案。原型未串接 HIS、未提供正式給付認證、已建置分項肝腎劑量檢核；完整交互作用與其他特殊族群規則仍待建置。</p><div class="rule-stack">${D.rules.map(([id,title,body,source])=>`<article class="rule-row"><span class="rule-index">${id}</span><div><h3>${title}</h3><p>${body}</p><small>依據／核定需求：${source}</small></div></article>`).join('')}</div>`;
 $('export-rules').addEventListener('click',()=>{const rows=[['規則編號','主題','原型處理','來源與待核對','狀態'],...D.rules.map(r=>[...r,'待院內核定'])];const csv='\uFEFF'+rows.map(row=>row.map(cell=>'"'+cell.replace(/"/g,'""')+'"').join(',')).join('\r\n');download('降血脂決策_規則核對表.csv',csv,'text/csv;charset=utf-8');});
}
function setPage(name){for(const n of ['assessment','formulary','rules'])$(`page-${n}`).hidden=n!==name;document.querySelectorAll('[data-page]').forEach(b=>{b.classList.toggle('active',b.dataset.page===name);if(b.dataset.page===name)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});document.querySelector('.mobile-result').hidden=name!=='assessment';if(name==='formulary')renderCatalog();if(name==='rules')renderRules();window.scrollTo({top:0,behavior:'auto'});}
function toast(message){$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').classList.remove('visible'),3500);}
function download(name,content,type){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function openEditor(id){const d=drugs().find(d=>d.id===id);$('edit-id').value=id;$('edit-name').textContent=`${d.brand} ${d.strength}`;$('edit-availability').value=d.availability;$('edit-specialist').value=String(d.specialist);$('edit-note').value=d.note;$('drug-editor').showModal();}
function saveOverrides(){try{localStorage.setItem(storageKey,JSON.stringify(overrides));return true;}catch{toast('瀏覽器無法儲存，變更僅於本次頁面有效。');return false;}}
function organInputText(key){if(key==='clcr'&&LipidOrgan.severeRenalScreen(state))return '系統預設 ＜30（依 eGFR 分支；非實測或換算）';if(key==='clcr'&&LipidOrgan.defaultClcr30Screen(state))return '系統預設 ≥30（依 eGFR 分支；非實測或換算）';if(renalOptions[key]&&!state[key])return '未提供';if(renalOptions[key])return renalOptions[key].options.find(([v])=>v===state[key])?.[1]||'未提供';return state[key]?$(key).selectedOptions[0].textContent:'未提供';}
function summary(){const r=result;const d=r.candidates.find(d=>d.id===selected);return ['【原型評估摘要・未經臨床核定・非處方】',`產生日期：${E.todayString()}｜規則版本：${D.version}`,`性別／年齡：${state.sex==='male'?'男性':state.sex==='female'?'女性':'未填'}／${E.displayValue(state.age)}`,r.errors.length?`輸入錯誤：${r.errors.map(k=>fieldNames[k]||k).join('、')}；風險與治療數值不可採用。`:`分層：${r.risk.provisional?'至少':''}${r.risk.name}；${r.risk.provisional?'未知條件可能提高至'+r.risk.upperName:'依已填資料判定'}`,`依據：${r.risk.reasons.join('、')}`,`LDL-C：${state.ldl||'未填'} mg/dL；日期：${state.labDate||'未填'}；${r.errors.length||r.risk.provisional?'治療目標：資料確認後判定':`治療目標：＜${r.risk.target} mg/dL`}`,`方向：${r.title}`,r.description,...(r.specialAdvice||[]).flatMap(c=>[c.title,...c.items.map(i=>i.label+'：'+i.text)]),`目前方案：${r.current?r.current.brand+' '+r.current.strength:state.mode==='treated'?'未確認':state.mode==='lifestyle'?'生活型態介入':'未填或未治療'}`,`尚缺資料：${r.missing.join('、')||'本版必要資料已填'}`,`個別評估／提醒：${[...r.stops,...r.warnings].join('；')||'未觸發本版已建置項目；不代表全面安全檢核完成'}`,`肝功能總篩選：${state.liverScreen==='no'?'已確認皆無，細項省略':state.liverScreen==='yes'?'有，依細項判斷':'待確認'}`,`肝腎範圍：eGFR ${state.dialysis==='yes'?'透析者省略':E.displayValue(state.egfr)}；CLcr ${organInputText('clcr')}；CrCl ${organInputText('crcl')}；Fenolip-U 肌酸酐清除率 ${organInputText('fenoCrcl')}；肝功能 ${organInputText('hepatic')}；AST／ALT ${organInputText('enzymes')}`,r.currentOrgan?`目前用藥肝腎檢核：${r.currentOrgan.label}；${r.currentOrgan.notes.join('；')}`:'',d?`肝腎候選劑量：${d.organ.doseText}；${d.organ.notes.join('；')}`:'',d?`討論候選：${d.brand} ${d.strength}（${d.ingredients}）；${d.coverage}`:'尚未選取討論品項。',r.canRecommend?`追蹤：${r.followup}`:'追蹤：資料確認後由臨床決定。','給付：本原型未提供最終資格認證。院內碼、健保碼及完整規範待核對。','院內藥品資料：2026.09.30 處方集與 HIS 需求單快照。'].join('\n');}
function openSummary(){$('summary-text').value=summary();$('summary-dialog').showModal();}
let dateInput=null,dateMonth='';
document.body.insertAdjacentHTML('beforeend',`<dialog id="date-picker" aria-labelledby="date-title"><div class="dialog-head"><h2 id="date-title">選擇日期</h2><button type="button" id="date-close" class="icon-button" aria-label="關閉日期選擇">×</button></div><p class="hint">點選日期即可填入。</p><div class="calendar-nav"><button type="button" id="date-prev" class="secondary" aria-label="上一個月">‹</button><select id="date-year" aria-label="年份"></select><select id="date-month" aria-label="月份"></select><button type="button" id="date-next" class="secondary" aria-label="下一個月">›</button></div><div class="calendar-week" aria-hidden="true">${['日','一','二','三','四','五','六'].map(d=>`<span>${d}</span>`).join('')}</div><div id="calendar-days" class="calendar-days"></div><div class="dialog-actions"><button type="button" id="date-clear" class="secondary">清除日期</button><button type="button" id="date-today" class="secondary">今天</button></div></dialog>`);
function drawCalendar(){
 const [year,month]=dateMonth.split('-').map(Number),today=E.todayString(),last=new Date(year,month,0).getDate(),offset=new Date(year,month-1,1).getDay();
 const currentYear=Number(today.slice(0,4));$('date-year').innerHTML=Array.from({length:currentYear-1900+1},(_,i)=>`<option value="${currentYear-i}" ${currentYear-i===year?'selected':''}>${currentYear-i} 年</option>`).join('');
 $('date-month').innerHTML=Array.from({length:12},(_,i)=>`<option value="${i+1}" ${i+1===month?'selected':''}>${i+1} 月</option>`).join('');
 $('calendar-days').innerHTML='<span></span>'.repeat(offset)+Array.from({length:last},(_,i)=>{const value=`${dateMonth}-${String(i+1).padStart(2,'0')}`;return `<button type="button" data-date="${value}" aria-label="${year} 年 ${month} 月 ${i+1} 日" ${value>today?'disabled':''} ${value===dateInput.value?'aria-pressed="true"':''}>${i+1}</button>`;}).join('');
 $('date-prev').disabled=year===1900&&month===1;$('date-next').disabled=dateMonth>=today.slice(0,7);
}
function openDate(input){dateInput=input;dateMonth=(input.value||E.todayString()).slice(0,7);$('date-title').textContent=fieldNames[input.name];drawCalendar();$('date-picker').showModal();}
function commitDate(value){dateInput.value=value;change({target:dateInput});$('date-picker').close();dateInput.focus({preventScroll:true});}
$('date-close').addEventListener('click',()=>$('date-picker').close());
$('calendar-days').addEventListener('click',ev=>{const button=ev.target.closest('[data-date]');if(button)commitDate(button.dataset.date);});
for(const [id,delta] of [['date-prev',-1],['date-next',1]])$(id).addEventListener('click',()=>{const [y,m]=dateMonth.split('-').map(Number),d=new Date(y,m-1+delta,1);dateMonth=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;drawCalendar();});
for(const id of ['date-year','date-month'])$(id).addEventListener('change',()=>{dateMonth=`${$('date-year').value}-${$('date-month').value.padStart(2,'0')}`;drawCalendar();});
$('date-today').addEventListener('click',()=>commitDate(E.todayString()));$('date-clear').addEventListener('click',()=>commitDate(''));
renderForm();
for(const input of document.querySelectorAll('[data-date-picker]')){input.addEventListener('click',()=>openDate(input));input.addEventListener('keydown',ev=>{if(['Enter',' '].includes(ev.key)){ev.preventDefault();openDate(input);}});}
 document.querySelector('.form-footer').insertAdjacentHTML('beforebegin','<div id="validation-summary" class="notice danger validation-summary" role="alert" hidden></div>');
 $('basic-fields').insertAdjacentHTML('afterend','<details class="risk-details"><summary>必要時填寫：治療前 LDL-C 與 HDL-C</summary><p class="hint">尚未確認高風險時，治療前 LDL-C ≥190 可能提高分級；HDL-C 用於一般風險判定。前面已足以分級時可留白。</p><div id="optional-labs" class="fields"></div></details>');
 for(const k of ['baseline','hdl'])$('optional-labs').append($(k).closest('.field'));
 $('risk-fields').addEventListener('click',ev=>{
  const quick=ev.target.closest('[data-quick]');
  if(quick){quick.dataset.quick.split(',').forEach(k=>state[k]='yes');selected='';syncForm();renderResult();$('tree-heading').focus();}
  if(ev.target.id==='tree-none'){const q=E.nextRisk(state);q.keys.filter(k=>k!=='dialysis').forEach(k=>state[k]='no');selected='';syncForm();renderResult();$('tree-heading').focus();}
  if(ev.target.id==='continue-treatment')setStep(1);
 });
syncForm();setStep(0,false);renderResult();
document.querySelectorAll('[data-page]').forEach(b=>b.addEventListener('click',()=>setPage(b.dataset.page)));
document.querySelectorAll('[data-step]').forEach(b=>b.addEventListener('click',()=>setStep(Number(b.dataset.step))));
document.querySelector('.steps').addEventListener('keydown',ev=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(ev.key)){ev.preventDefault();setStep(ev.key==='Home'?0:ev.key==='End'?1:step+(ev.key==='ArrowRight'?1:-1));$(`step-tab-${step}`).focus();}});
function change(ev){const el=ev.target;if(!el.name||!(el.name in state))return;if(el.type==='radio'&&!el.checked)return;if(el.name==='dialysis'&&el.value!=='no'){state.egfr='';$('egfr').value='';}
 if(el.name==='liverScreen'){state=E.setLiverScreen(state,el.value);syncForm();}else state[el.name]=el.value;selected='';if(el.name==='drug'){const d=D.drugs.find(d=>d.id===el.value);state.dose=d?.dose?String(d.dose):'';$('dose').value=state.dose;state.since='';$('since').value='';}conditional();renderResult();}
 $('results').addEventListener('change',ev=>{const el=ev.target,key=el.dataset.renalKey;if(!renalOptions[key])return;const id=el.id;state[key]=el.value;selected='';renderResult();($(id)||$('results').querySelector('[data-renal-key="'+key+'"]'))?.focus({preventScroll:true});});
 $('assessment-form').addEventListener('input',change);$('assessment-form').addEventListener('change',ev=>{if(ev.target.tagName==='SELECT')change(ev);});$('assessment-form').addEventListener('submit',ev=>ev.preventDefault());
 $('next').addEventListener('click',()=>step<1?setStep(step+1):viewResults());$('previous').addEventListener('click',()=>setStep(step-1));$('jump-result').addEventListener('click',viewResults);
 $('reset').addEventListener('click',()=>{state={...E.blank(),liverScreen:'unknown',simplifiedTreatment:true};submitted=false;selected='';showAll=false;syncForm();setStep(0,false);renderResult();toast('已清空，所有未確認條件回到不清楚。');});
 document.querySelectorAll('[data-clear-group]').forEach(b=>b.addEventListener('click',()=>{const list=b.dataset.clearGroup==='disease'?[...D.riskFields,...D.advancedFields]:D.rfFields;for(const [k]of list)state[k]='no';selected='';syncForm();renderResult();toast('本組已依您的確認設為否；可逐項修改。');}));
 $('close-editor').addEventListener('click',()=>$('drug-editor').close());$('close-summary').addEventListener('click',()=>$('summary-dialog').close());
 $('drug-edit-form').addEventListener('submit',ev=>{ev.preventDefault();const id=$('edit-id').value;if(!D.drugs.some(d=>d.id===id))return;overrides[id]={availability:$('edit-availability').value,specialist:$('edit-specialist').value==='true',note:$('edit-note').value.trim().slice(0,300)};const saved=saveOverrides();$('drug-editor').close();renderCatalog();renderResult();if(saved)toast('已儲存本機設定，候選清單已更新。');});
 $('reset-drug').addEventListener('click',()=>{delete overrides[$('edit-id').value];saveOverrides();$('drug-editor').close();renderCatalog();renderResult();toast('已還原為來源快照。');});
 $('copy-summary').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('summary-text').value);toast('已複製含待確認事項的評估摘要。');}catch{$('summary-text').focus();$('summary-text').select();toast('請使用 Ctrl+C 或手機選取功能複製。');}});
 // Optional, local-only agent surface. No patient data is sent or persisted.
 if(document.modelContext?.registerTool){
  const lifecycle=new AbortController();
  const tools=[{name:'read_lipid_assessment_summary',description:'讀取目前原型畫面的評估摘要，含缺漏條件與非正式給付聲明。',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:true},execute(input){if(!input||typeof input!=='object'||Object.keys(input).length)throw new Error('Expected empty object');return {summary:summary()};}}];
  for(const tool of tools){try{Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}}
  window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
 }
})();

