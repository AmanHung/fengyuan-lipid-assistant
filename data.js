(function(root){
'use strict';
const version='草案 2026.10.01 · v2';
const riskFields=[
 ['cad','冠狀動脈疾病（CAD）','已確認的疾病史，非僅疑似診斷。'],
 ['acs','急性冠心症（ACS）病史','含既往已確認的事件；合併糖尿病時另評估極高風險。'],
 ['pad','符合條件的周邊動脈疾病（PAD）','曾血管再通、肢體缺血症狀或相關截肢；僅診斷碼不足。'],
 ['carotid','頸動脈狹窄','用於合併 CAD／PAD 的進階分層；單獨存在須確認影像條件。'],
 ['stroke','動脈硬化相關的缺血性中風／TIA','須合併動脈硬化相關疾病或病史。'],
 ['revasc','曾接受冠狀動脈血管再通術','PCI 或 CABG。'],
 ['stenosis','影像確認血管直徑狹窄 ≥50%','符合規範的冠狀動脈、頸動脈或周邊血管影像。'],
 ['dm','糖尿病（DM）','已確診的疾病史。'],
 ['ckd','符合條件的透析前 CKD','UACR ≥30 mg/g 或 eGFR <60 mL/min/1.73m²，並確認慢性病程至少 3 個月；原型由使用者核對。'],
 ['cac','冠狀動脈鈣化分數 ≥400','未檢測或不知道結果，請選不清楚。'],
 ['prior190','目前或已確認治療前 LDL-C ≥190 mg/dL','任一符合即選是；確認皆不符合才選否。未取得足夠檢驗資料請保留不清楚。歷史值採計策略待院內核定。']
];
const advancedFields=[['recentMI','CAD 合併一年內心肌梗塞','須同時確認 CAD；時間以事件發生日計。'],['multipleMI','CAD 合併至少兩次心肌梗塞','須同時確認 CAD；不是重複登錄同一次事件。'],['multivessel','CAD 合併多支冠狀動脈阻塞','須同時確認 CAD。']];
const rfFields=[['hypertension','高血壓','依已確認的診斷或病史。'],['family','早發性冠心病家族史','男性親屬 ≤55 歲、女性親屬 ≤65 歲；親屬範圍待院內核定。'],['smoking','目前抽菸','戒菸史可另於病歷註記。']];
const safetyFields=[['dialysis','目前接受透析','透析者先確認起始／續用適應症；仍可查看各品項肝腎檢核。'],['pregnancy','懷孕、備孕或哺乳','需個別評估，原型不提供具體藥品選擇。'],['liver','活動性肝病或不明原因轉胺酶持續升高','與單次 AST／ALT 升高不同；符合時排除含 statin 製劑，其他品項逐項判斷。']];
// IDs are prototype identifiers, NOT hospital order codes. Unknown codes remain blank.
const drugs=[
 {id:'atotin10',brand:'Atotin',strength:'10 mg',ingredients:'Atorvastatin 10 mg',statin:'atorvastatin',dose:10,group:'statin',intensity:'moderate',payment:'legacy'},
 {id:'atotin20',brand:'Atotin',strength:'20 mg',ingredients:'Atorvastatin 20 mg',statin:'atorvastatin',dose:20,group:'statin',intensity:'moderate',payment:'legacy'},
 {id:'zulitor4',brand:'Zulitor',strength:'4 mg',ingredients:'Pitavastatin 4 mg',statin:'pitavastatin',dose:4,group:'statin',intensity:'moderate',payment:'table1'},
 {id:'pitarty4',brand:'Pitarty',strength:'4 mg',ingredients:'Pitavastatin 4 mg',statin:'pitavastatin',dose:4,group:'statin',intensity:'moderate',payment:'legacy'},
 {id:'livalo2',brand:'Livalo',strength:'2 mg',ingredients:'Pitavastatin 2 mg',statin:'pitavastatin',dose:2,group:'statin',intensity:'moderate',payment:'legacy'},
 {id:'crestor10',brand:'Crestor',strength:'10 mg',ingredients:'Rosuvastatin 10 mg',statin:'rosuvastatin',dose:10,group:'statin',intensity:'moderate',payment:'table1'},
 {id:'aladdin10',brand:'Aladdin',strength:'10 mg',ingredients:'Rosuvastatin 10 mg',statin:'rosuvastatin',dose:10,group:'statin',intensity:'moderate',payment:'legacy'},
 {id:'rozinin20',brand:'Rozinin',strength:'20 mg',ingredients:'Rosuvastatin 20 mg',statin:'rosuvastatin',dose:20,group:'statin',intensity:'high',payment:'table1'},
 {id:'fenolip160',brand:'Fenolip-U',strength:'160 mg',ingredients:'Fenofibrate 160 mg',group:'tg',payment:'separate'},
 {id:'choles',brand:'Choles powder',strength:'規格待確認',ingredients:'Cholestyramine resin',group:'other',payment:'separate',availability:'inactive'},
 {id:'nilemdo180',brand:'Nilemdo',strength:'180 mg',ingredients:'Bempedoic acid 180 mg',group:'advanced',payment:'self'},
 {id:'repatha140',brand:'Repatha',strength:'140 mg',ingredients:'Evolocumab 140 mg',group:'advanced',payment:'review'},
 {id:'leqvio284',brand:'Leqvio',strength:'284 mg / 1.5 mL',ingredients:'Inclisiran 284 mg',group:'advanced',payment:'self'},
 {id:'omacor1000',brand:'Omacor',strength:'1,000 mg',ingredients:'Omega-3-acid ethyl esters 90 1,000 mg',group:'tg',payment:'self'},
 {id:'zoliton1010',brand:'Zoliton',strength:'10 / 10 mg',ingredients:'Ezetimibe 10 mg／Atorvastatin 10 mg',statin:'atorvastatin',dose:10,ezetimibe:true,group:'combo',intensity:'moderate',payment:'combo3m'},
 {id:'atozet1020',brand:'Atozet',strength:'10 / 20 mg',ingredients:'Ezetimibe 10 mg／Atorvastatin 20 mg',statin:'atorvastatin',dose:20,ezetimibe:true,group:'combo',intensity:'moderate',payment:'combo8w',specialist:true},
 {id:'zoliton1020',brand:'Zoliton',strength:'10 / 20 mg',ingredients:'Ezetimibe 10 mg／Atorvastatin 20 mg',statin:'atorvastatin',dose:20,ezetimibe:true,group:'combo',intensity:'moderate',payment:'combo3m'},
 {id:'cretrol1020',brand:'Cretrol',strength:'10 / 20 mg',ingredients:'Ezetimibe 10 mg／Rosuvastatin 20 mg',statin:'rosuvastatin',dose:20,ezetimibe:true,group:'combo',intensity:'high',payment:'combo3m',specialist:true},
 {id:'pravafen',brand:'Pravafen',strength:'160 / 40 mg',ingredients:'Fenofibrate 160 mg／Pravastatin 40 mg',statin:'pravastatin',dose:40,group:'othercombo',intensity:'moderate',payment:'legacy'},
 {id:'tonvasca210',brand:'Tonvasca',strength:'2 / 10 mg',ingredients:'Pitavastatin 2 mg／Ezetimibe 10 mg',statin:'pitavastatin',dose:2,ezetimibe:true,group:'combo',intensity:'moderate',payment:'combo8w'},
 {id:'livazebe410',brand:'Livazebe',strength:'4 / 10 mg',ingredients:'Pitavastatin 4 mg／Ezetimibe 10 mg',statin:'pitavastatin',dose:4,ezetimibe:true,group:'combo',intensity:'moderate',payment:'combo3m'},
 {id:'caduet510',brand:'Caduet',strength:'5 / 10 mg',ingredients:'Amlodipine 5 mg／Atorvastatin 10 mg',statin:'atorvastatin',dose:10,group:'othercombo',intensity:'moderate',payment:'legacy'}
].map(d=>({availability:'active',specialist:false,hospitalCode:'',nhiCode:'',note:'',...d}));
const rules=[
 ['R01','最高風險優先，未知資料不當作否','由極高、非常高、高風險到一般因子逐步判斷。當已確認等級與所有未知條件可能形成的最高等級一致時，停止追問；略過的答案保留不清楚。只有足以排除更高分層時，才確認低／零風險。','HIS 需求單、健保 2.6.1；三態與提早停止為原型設計'],
 ['R02','零項心血管風險因子','保留前版零項因子 LDL-C ＜160 mg/dL 分支，補充依據為 2024 台灣心臟學會初級預防指引；使用者提供的 2025 共識主表僅列五級，未單列零項因子。','2024 Taiwan Society of Cardiology Primary Prevention Part II；非 2025 共識五級主表'],
 ['R03','CKD 與透析分開處理','由使用者確認 UACR／eGFR、慢性病程及透析狀態。CKD 是且透析未知時先追問，不直接採透析前分支。透析、腎功能資料不足時不產生具體選藥。','健保 2.6.1；HIS 包含 N18.6，待修訂'],
 ['R04','診斷碼僅作初判','中風／TIA、PAD 等需確認附加臨床條件。原型手動輸入，不解析 ICD-10。25.6 等碼與母子碼策略待核對。','HIS 診斷碼表、健保 2.6.1'],
 ['R05','ASCVD 病史保留','不因最近 6 個月沒有診斷碼而清除已確認病史。事件時效與診斷搜尋視窗分開。','HIS 六個月搜尋視窗；保留策略待核定'],
 ['R06','歷史 LDL-C 與目前值分開','確認治療前 ≥190 mg/dL 時保留高風險背景；目前達標不能推導應停藥。原型不判定續用給付。','台灣共識／HIS；歷史值採計策略待核定'],
 ['R07','品項給付不可互相套用','表一、原給付、ezetimibe 複方、專案審查與自費各自處理。院內碼及健保碼未完成核對，不輸出最終給付通過。','115.09.01 健保公告、院內處方集'],
 ['R08','療程與適應症分開查核','複方依品項自動篩選：開始日至抽血日超過 6 週（42 天）列一般類；超過 3 個曆月才列指定類。等於門檻當日不列入；不以今天替代抽血日。','健保 2.6.3；依使用者指定採嚴格大於療程門檻'],
 ['R09','非 statin 與完全不耐受','含 statin 複方不列入完全不耐受選項。Nilemdo／Leqvio 自費，Repatha 給付需個別審查。Ezetimibe 單方未確認院內供應。','院內處方集；個別規定尚待建置'],
 ['R10','複方不得重複成分','所有複方拆解成分。更換複方須核對並調整原 statin／ezetimibe。目前精簡表單僅提供療程與肝腎篩選；適應症、遵從性、單方紀錄與 Gemfibrozil 等併用藥須於開立前另核對。','健保 2.6.3；仿單交互作用仍待逐品項核對'],
 ['R11','安全及特殊族群','未滿 18 歲、懷孕／備孕／哺乳、透析、TG ≥500 或安全資料未知時，轉個別評估，不提供具體選藥。','肝腎限制已依產品及同成分仿單逐項篩選；完整交互作用仍待建置'],
 ['R12','台灣治療目標','依 2025 台灣血脂管理臨床路徑共識，低、中、高、非常高、極高風險 LDL-C 目標分別為 ＜130、＜115、＜100、＜70、＜55 mg/dL。恢復決策樹自動分級，不要求另選治療情境。Non-HDL-C 為次要標的，目標較 LDL-C 高 30 mg/dL，維持選填。','使用者提供 PDF 第 2–4 頁（內科學誌 427–429 頁）'],
 ['R13','時間、代謝症候群與追蹤','每項數值缺漏保留未知。代謝症候群五項中至少三項；需確認同一有效評估期間。檢驗超過 6 個月提醒、超過 1 年暫停選藥。','HIS 原文日期窗不一致；需院內核定'],
 ['R14','逐品項肝腎檢核','eGFR 不再作共同禁忌門檻。分開記錄透析、活動性肝病、Child-Pugh 與轉胺酶範圍；Rosuvastatin 在未透析且 eGFR ≥60、無已知 CLcr ＜30 時省略額外 CLcr 選單，作初步篩檢而非換算；eGFR 15–未滿 30 或 ＜15 預設採 CLcr ＜30 劑量分支，不換算 CLcr；30–未滿 60 時預設採 CLcr ≥30 的劑量分支，省略額外選單；此為流程預設而非測得或換算值，已知實際 CLcr ＜30 優先。Pravafen 在已知腎功能不全時直接排除；Fenolip-U 在 eGFR ＜60 且未取得 CrCl 時保守排除 160 mg。已因肝腎條件排除的品項不再追問清除率；其他確實影響劑量的未校正 CrCl 欄位才保留。複方產品規則優先，缺少起始規格時不自動分錠。台灣產品仿單優先，查不到時採同成分來源並標示國別與限制。','2026-10-01 公開仿單查核；詳見每項候選與處方集的來源連結'],
 ['R15','正式上線前的藥品檢核','須核對院內碼、健保碼、供應、仿單劑量、專科限制及完整給付；完成簽核後才能成為正式決策工具。','目前資料為需求單及處方集快照，非即時庫存']
];
const sources=[
 {name:'院內 HIS 需求單',detail:'住院醫囑_HIS需求單1150924_ASCVD提示.docx｜主流程與藥品初稿',url:null},
 {name:'2025 台灣血脂管理臨床路徑共識',detail:'04綜論-李貽恒C-5-1212.pdf｜內科學誌 2024；35：426–430｜表一、圖一及圖二',url:'https://www.tsim.org.tw/ehc-tsim/s/viewFile?documentId=cfbd43c6ce2945d3bbab029c1607ddbd'},
 {name:'2024 台灣心臟學會初級預防指引 Part II',detail:'僅補充零項因子 LDL-C ＜160 mg/dL 分支；五級主要治療目標以使用者提供的 2025 共識為主',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC11579689/'},
 {name:'健保降血脂給付修訂條文',detail:'115 年 9 月 1 日生效｜2.6.1、2.6.2、2.6.3',url:'https://www.nhi.gov.tw/ch/dl-100842-f34d34af17374f04ae02e87f1ea8ac56-1.pdf'},
 {name:'健保藥品新制／原給付清單',detail:'逐品項核對依據；原型尚未完成院內碼對照',url:'https://www.nhi.gov.tw/ch/cp-20383-d3598-4167-1.html'},
 {name:'豐原醫院電子處方集',detail:'2026.09.30 查閱｜22 筆脂質調節劑，含 1 筆停用',url:'https://amanhung.github.io/hospital-drug-search/'},
 {name:'奇美醫院參考介面',detail:'僅參考操作呈現，不作為本院藥品或給付的權威來源',url:'https://www.chimei.org.tw/main/cmh_department/55500/vedio/ASCVD.html'}
];
const data={version,riskFields,advancedFields,rfFields,safetyFields,drugs,rules,sources};
root.LipidData=data;if(typeof module!=='undefined')module.exports=data;
})(globalThis);
