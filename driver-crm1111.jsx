import { useState, useMemo, useRef } from "react";

const FONT_URL = "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap";

const STAGES = [
  { id:"new",         label:"New Lead",      color:"#6366f1", light:"#eef2ff" },
  { id:"contact",     label:"First Contact", color:"#3b82f6", light:"#eff6ff" },
  { id:"qualified",   label:"Qualified",     color:"#8b5cf6", light:"#f5f3ff" },
  { id:"application", label:"Application",   color:"#f59e0b", light:"#fffbeb" },
  { id:"docs",        label:"Docs Review",   color:"#f97316", light:"#fff7ed" },
  { id:"offer",       label:"Offer",         color:"#10b981", light:"#ecfdf5" },
  { id:"onboarding",  label:"Onboarding",    color:"#059669", light:"#ecfdf5" },
  { id:"hired",       label:"Hired",         color:"#16a34a", light:"#f0fdf4" },
  { id:"cold",        label:"Cold",          color:"#94a3b8", light:"#f8fafc" },
];

const DOC_LIST = [
  "CDL Copy","MVR Report","PSP Report","Drug Test Consent",
  "Employment Application","Prev. Employment Verification",
  "Medical Certificate (DOT)","SSN / Work Authorization","Background Check",
];

const SOURCES = ["Indeed","CDLjobs","Referral","LinkedIn","Cold Call","Other"];

const TEXT_TEMPLATES = [
  { label:"First Contact",       body:"Hi [NAME], this is [RECRUITER] from [COMPANY]. I saw your profile on [SOURCE] — we're hiring Class A CDL drivers in [REGION]. Pay is [RANGE]. Available for a quick 5-min call today?" },
  { label:"No Answer Follow-up", body:"Hey [NAME], tried reaching you — [RECRUITER] from [COMPANY]. We have an opening matching your experience. Reply YES and I'll send details, or call me at [PHONE]." },
  { label:"App Reminder",        body:"Hi [NAME], [RECRUITER] here. Did you get a chance to start the application? Here's the link again: [LINK]. Let me know if you have questions!" },
  { label:"Docs Reminder",       body:"Hi [NAME], we're almost done with your file! We just need [MISSING DOC]. Can you send it to [EMAIL] today so we can move forward?" },
  { label:"Offer Follow-up",     body:"Hi [NAME], following up on our offer. We'd love to have you on the team! Any questions I can answer? Looking to get paperwork started this week." },
  { label:"Re-engage Cold",      body:"Hi [NAME], [RECRUITER] from [COMPANY] — we spoke a few weeks back. We have a new opening that might be a better fit. Still looking? Takes 2 min to chat." },
];

const CALL_LOG_TPL = `Date/Time: [DATE] [TIME]\nType: [Call / Text / Email / Voicemail]\nDuration: [X min]   Spoke To: [Yes / No]\n────────────────────────────────────\nSUMMARY:\n[What was discussed]\n\nKEY POINTS:\n• CDL Class:            • Experience:\n• Available:            • Interest: [Hot/Warm/Cold]\n• Objections:\n\nNEXT ACTION: [What + When]`;

const FLAGS_OPT = [
  "🔴 DUI / Major Violation","🟡 Gaps in Employment >6 months",
  "🟡 Multiple jobs in last 2 years","🔴 Failed drug test history",
  "🟢 Referral (priority)","🔴 No-show / ghosted",
];

// ── HELPERS ───────────────────────────────────────────────────────────
function todayStr() { return new Date().toISOString().split("T")[0]; }

function getTodayPlus(d) {
  const dt = new Date(); dt.setDate(dt.getDate() + d);
  return dt.toISOString().split("T")[0];
}

// Full datetime timestamp for sorting
function nextActionTs(d) {
  if (!d.nextAction) return Infinity;
  const time = d.nextActionTime || "23:59";
  return new Date(`${d.nextAction}T${time}`).getTime();
}

// Minutes until next action (negative = overdue)
function minutesUntil(d) {
  if (!d.nextAction) return null;
  const time = d.nextActionTime || "23:59";
  return Math.round((new Date(`${d.nextAction}T${time}`) - Date.now()) / 60000);
}

function fmtDate(s) {
  if (!s) return "—";
  return new Date(s + "T00:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"});
}

function fmtSize(bytes) {
  if (bytes < 1024) return bytes + "B";
  if (bytes < 1048576) return (bytes/1024).toFixed(1) + "KB";
  return (bytes/1048576).toFixed(1) + "MB";
}

function nowDate() { return new Date().toISOString().split("T")[0]; }
function nowTime() { return new Date().toTimeString().slice(0,5); }

// ── SAMPLE DATA ───────────────────────────────────────────────────────
let _id = 20;
const SAMPLE = [
  { id:1, name:"James Miller",   phone:"555-0101", email:"j.miller@email.com",   city:"Chicago, IL",  cdl:"A", exp:7,  source:"Indeed",    stage:"qualified",   nextAction:getTodayPlus(0),  nextActionTime:"10:00", lastContact:getTodayPlus(-1), docs:{"CDL Copy":true,"MVR Report":true}, notes:[], files:[], flags:[],                       interest:"Hot"  },
  { id:2, name:"Robert Davis",   phone:"555-0102", email:"r.davis@email.com",    city:"Dallas, TX",   cdl:"A", exp:3,  source:"CDLjobs",   stage:"contact",     nextAction:getTodayPlus(-1), nextActionTime:"09:30", lastContact:getTodayPlus(-2), docs:{},                                  notes:[], files:[], flags:["🟡 Gaps in Employment"], interest:"Warm" },
  { id:3, name:"Michael Brown",  phone:"555-0103", email:"m.brown@email.com",    city:"Phoenix, AZ",  cdl:"A", exp:12, source:"Referral",  stage:"application", nextAction:getTodayPlus(0),  nextActionTime:"14:00", lastContact:getTodayPlus(0),  docs:{"CDL Copy":true},                   notes:[], files:[], flags:["🟢 Referral (priority)"], interest:"Hot"  },
  { id:4, name:"William Wilson", phone:"555-0104", email:"w.wilson@email.com",   city:"Houston, TX",  cdl:"B", exp:2,  source:"Indeed",    stage:"new",         nextAction:getTodayPlus(0),  nextActionTime:"11:00", lastContact:null,             docs:{},                                  notes:[], files:[], flags:[],                       interest:"Warm" },
  { id:5, name:"David Martinez", phone:"555-0105", email:"d.martinez@email.com", city:"Miami, FL",    cdl:"A", exp:5,  source:"LinkedIn",  stage:"docs",        nextAction:getTodayPlus(2),  nextActionTime:"15:30", lastContact:getTodayPlus(-1), docs:{"CDL Copy":true,"MVR Report":true,"PSP Report":true,"Drug Test Consent":true}, notes:[], files:[], flags:[], interest:"Hot" },
  { id:6, name:"John Anderson",  phone:"555-0106", email:"j.anderson@email.com", city:"Atlanta, GA",  cdl:"A", exp:9,  source:"CDLjobs",   stage:"offer",       nextAction:getTodayPlus(1),  nextActionTime:"13:00", lastContact:getTodayPlus(0),  docs:{"CDL Copy":true,"MVR Report":true,"PSP Report":true,"Drug Test Consent":true,"Employment Application":true}, notes:[], files:[], flags:[], interest:"Hot" },
  { id:7, name:"Thomas Taylor",  phone:"555-0107", email:"t.taylor@email.com",   city:"Denver, CO",   cdl:"A", exp:4,  source:"Cold Call", stage:"cold",        nextAction:getTodayPlus(14), nextActionTime:"10:00", lastContact:getTodayPlus(-10),docs:{},                                  notes:[], files:[], flags:["🔴 No-show / ghosted"], interest:"Cold" },
];

// ── APP ───────────────────────────────────────────────────────────────
export default function App() {
  const [view,setView]               = useState("pipeline");
  const [drivers,setDrivers]         = useState(SAMPLE);
  const [selected,setSelected]       = useState(null);
  const [showAdd,setShowAdd]         = useState(false);
  const [filterStage,setFilter]      = useState("all");
  const [search,setSearch]           = useState("");
  const [searchFocus,setSearchFocus] = useState(false);
  const [copiedTpl,setCopied]        = useState(null);
  const [stageModal,setStageModal]   = useState(null);

  // Search: by name (first/last), phone digits
  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.trim().toLowerCase();
    const qd = q.replace(/\D/g,"");
    return drivers.filter(d => {
      const nl = d.name.toLowerCase();
      const pd = d.phone.replace(/\D/g,"");
      return nl.includes(q)
        || nl.split(" ").some(p => p.startsWith(q))
        || d.phone.toLowerCase().includes(q)
        || (qd.length >= 3 && pd.includes(qd));
    }).slice(0, 8);
  }, [drivers, search]);

  const showDropdown = searchFocus && search.trim().length > 0;

  // Filtered + sorted by next action datetime ascending (overdue first)
  const filtered = useMemo(() => {
    const list = drivers.filter(d => filterStage === "all" || d.stage === filterStage);
    return [...list].sort((a,b) => nextActionTs(a) - nextActionTs(b));
  }, [drivers, filterStage]);

  const overdue = drivers.filter(d => {
    const m = minutesUntil(d);
    return m !== null && m < 0 && !["hired","cold"].includes(d.stage);
  }).length;
  const stale = drivers.filter(d =>
    d.lastContact && (new Date(todayStr()) - new Date(d.lastContact))/86400000 >= 3 && !["hired","cold"].includes(d.stage)
  ).length;
  const hot   = drivers.filter(d => d.interest === "Hot"  && !["hired","cold"].includes(d.stage)).length;
  const hired = drivers.filter(d => d.stage === "hired").length;

  function upd(id, patch) {
    setDrivers(p => p.map(d => d.id === id ? {...d, ...patch} : d));
    setSelected(p => p && p.id === id ? {...p, ...patch} : p);
  }

  function addNote(id, text) {
    const entry = { text, date: new Date().toLocaleString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}) };
    setDrivers(p => p.map(d => d.id === id ? {...d, notes:[entry,...d.notes], lastContact:todayStr()} : d));
    setSelected(p => p && p.id === id ? {...p, notes:[entry,...p.notes], lastContact:todayStr()} : p);
  }

  function addFile(id, fileObj) {
    setDrivers(p => p.map(d => d.id === id ? {...d, files:[...(d.files||[]), fileObj]} : d));
    setSelected(p => p && p.id === id ? {...p, files:[...(p.files||[]), fileObj]} : p);
  }

  function addDriver(data) {
    setDrivers(p => [{id:++_id, notes:[], files:[], docs:{}, flags:[], interest:"Warm", lastContact:null, ...data}, ...p]);
    setShowAdd(false);
  }

  function copyTpl(text, id) {
    navigator.clipboard.writeText(text).catch(()=>{});
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  // Stage change → open modal
  function requestStageChange(driverId, toStage) {
    const driver = drivers.find(d => d.id === driverId);
    if (!driver || driver.stage === toStage) return;
    setStageModal({ driverId, fromStage: driver.stage, toStage });
  }

  function confirmStageChange({ driverId, toStage, nextAction, nextActionTime, comment }) {
    const patch = { stage: toStage };
    if (nextAction) { patch.nextAction = nextAction; patch.nextActionTime = nextActionTime || "10:00"; }
    upd(driverId, patch);
    if (comment && comment.trim()) {
      const from = STAGES.find(s => s.id === stageModal?.fromStage)?.label || "";
      const to   = STAGES.find(s => s.id === toStage)?.label || "";
      addNote(driverId, `[Stage: ${from} → ${to}]\n${comment.trim()}`);
    }
    setStageModal(null);
  }

  const sel = selected ? drivers.find(d => d.id === selected.id) : null;

  return (
    <>
      <style>{`
        @import url('${FONT_URL}');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body{background:#f1f5f9;height:100%;}
        ::-webkit-scrollbar{width:5px;height:5px;}
        ::-webkit-scrollbar-track{background:#f1f5f9;}
        ::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:4px;}
        input,textarea,select{font-family:'DM Sans',sans-serif;}
        .card-hover:hover{box-shadow:0 6px 24px rgba(0,0,0,.10)!important;transform:translateY(-2px);}
        .nav-item:hover{background:#f1f5f9!important;color:#1e293b!important;}
        .btn-p:hover{background:#1d4ed8!important;}
        .btn-g:hover{background:#f1f5f9!important;}
        .row-hover:hover{background:#f8fafc!important;}
        .tab-btn{border-bottom:2px solid transparent;transition:color .15s;}
        .tab-btn:hover{color:#1e293b!important;}
        .tab-btn.on{border-bottom-color:#2563eb;color:#2563eb!important;font-weight:600;}
        .file-zone:hover{border-color:#2563eb!important;background:#eff6ff!important;}
        @keyframes sIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
        @keyframes fUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .s-in{animation:sIn .2s ease forwards;}
        .f-up{animation:fUp .18s ease forwards;}
      `}</style>

      <div style={{fontFamily:"'DM Sans',sans-serif",display:"flex",height:"100vh",background:"#f1f5f9",overflow:"hidden"}}>

        {/* ── SIDEBAR ── */}
        <aside style={{width:58,background:"#fff",borderRight:"1px solid #e2e8f0",display:"flex",flexDirection:"column",alignItems:"center",padding:"14px 0",gap:4,flexShrink:0}}>
          <div style={{width:34,height:34,background:"#2563eb",borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:14,fontSize:16}}>🚛</div>
          {[{id:"pipeline",icon:"⊞",title:"Pipeline"},{id:"dashboard",icon:"▤",title:"Dashboard"},{id:"templates",icon:"≡",title:"Templates"}].map(item=>(
            <button key={item.id} className="nav-item" title={item.title} onClick={()=>setView(item.id)}
              style={{width:38,height:38,border:"none",borderRadius:9,background:view===item.id?"#eff6ff":"transparent",color:view===item.id?"#2563eb":"#94a3b8",fontSize:17,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s"}}>
              {item.icon}
            </button>
          ))}
        </aside>

        {/* ── MAIN ── */}
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>

          {/* ── TOPBAR ── */}
          <header style={{background:"#fff",borderBottom:"1px solid #e2e8f0",padding:"0 20px",display:"flex",alignItems:"center",gap:10,height:56,flexShrink:0}}>
            <div style={{fontSize:18,fontWeight:700,color:"#0f172a",marginRight:4,letterSpacing:"-.3px",flexShrink:0}}>Driver CRM</div>

            {/* SEARCH */}
            <div style={{position:"relative",flex:"0 0 300px"}}>
              <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"#94a3b8",fontSize:13,pointerEvents:"none"}}>🔍</span>
              <input
                value={search}
                onChange={e=>setSearch(e.target.value)}
                onFocus={()=>setSearchFocus(true)}
                onBlur={()=>setTimeout(()=>setSearchFocus(false),160)}
                placeholder="Search by name or phone…"
                style={{width:"100%",padding:"7px 28px 7px 32px",fontSize:13,background:"#f8fafc",border:`1px solid ${showDropdown?"#2563eb":"#e2e8f0"}`,borderRadius:showDropdown?"8px 8px 0 0":"8px",color:"#0f172a",outline:"none",transition:"border .15s"}}
              />
              {search.trim() && (
                <button onClick={()=>setSearch("")} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"#94a3b8",fontSize:17,cursor:"pointer",lineHeight:1,padding:0}}>×</button>
              )}
              {showDropdown && (
                <div style={{position:"absolute",top:"100%",left:0,right:0,background:"#fff",border:"1px solid #2563eb",borderTop:"none",borderRadius:"0 0 10px 10px",boxShadow:"0 8px 24px rgba(37,99,235,.12)",zIndex:300,overflow:"hidden"}}>
                  {searchResults.length === 0
                    ? <div style={{padding:"13px 14px",fontSize:13,color:"#94a3b8",textAlign:"center"}}>No drivers found</div>
                    : searchResults.map(d => {
                        const stg = STAGES.find(s=>s.id===d.stage)||STAGES[0];
                        const q = search.trim();
                        const hl = d.name.replace(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")})`,"gi"),"|||$1|||");
                        return (
                          <div key={d.id}
                            onMouseDown={()=>{setSelected(d);setSearch("");setSearchFocus(false);}}
                            onMouseEnter={e=>e.currentTarget.style.background="#f0f7ff"}
                            onMouseLeave={e=>e.currentTarget.style.background="#fff"}
                            style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",cursor:"pointer",borderBottom:"1px solid #f1f5f9",transition:"background .1s"}}>
                            <div>
                              <div style={{fontSize:14,fontWeight:600,color:"#0f172a"}}>
                                {hl.split("|||").map((p,i)=>
                                  p.toLowerCase()===q.toLowerCase()
                                    ? <mark key={i} style={{background:"#dbeafe",color:"#1d4ed8",borderRadius:2,padding:"0 1px"}}>{p}</mark>
                                    : <span key={i}>{p}</span>
                                )}
                              </div>
                              <div style={{fontSize:11,color:"#94a3b8",marginTop:1}}>{d.phone} · {d.city}</div>
                            </div>
                            <span style={{fontSize:11,background:stg.light,color:stg.color,borderRadius:20,padding:"2px 8px",fontWeight:600,whiteSpace:"nowrap"}}>{stg.label}</span>
                          </div>
                        );
                      })
                  }
                  <div style={{padding:"6px 14px",fontSize:11,color:"#94a3b8",background:"#fafafa",borderTop:"1px solid #f1f5f9"}}>
                    {searchResults.length > 0 ? `${searchResults.length} result${searchResults.length!==1?"s":""} · click to open` : ""}
                  </div>
                </div>
              )}
            </div>

            {/* Stage filter */}
            <select value={filterStage} onChange={e=>setFilter(e.target.value)}
              style={{padding:"7px 10px",fontSize:13,background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:8,color:"#374151",outline:"none"}}>
              <option value="all">All stages</option>
              {STAGES.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
            </select>

            {/* Pills */}
            <div style={{display:"flex",gap:6}}>
              <SPill n={drivers.length} l="Total"   c="#6366f1" bg="#eef2ff"/>
              {overdue>0 && <SPill n={overdue} l="Overdue" c="#dc2626" bg="#fef2f2"/>}
              {stale>0   && <SPill n={stale}   l="Stale"   c="#d97706" bg="#fffbeb"/>}
              <SPill n={hot}   l="Hot 🔥" c="#059669" bg="#ecfdf5"/>
              <SPill n={hired} l="Hired"  c="#2563eb" bg="#eff6ff"/>
            </div>

            <button onClick={()=>setShowAdd(true)} className="btn-p"
              style={{marginLeft:"auto",background:"#2563eb",border:"none",color:"#fff",padding:"8px 16px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
              <span style={{fontSize:15}}>+</span> Add Driver
            </button>
          </header>

          {/* ── VIEWS ── */}
          <div style={{flex:1,overflow:"hidden",display:"flex"}}>

            {/* PIPELINE */}
            {view==="pipeline" && (
              <div style={{flex:1,overflowX:"auto",overflowY:"hidden",padding:"16px 20px",display:"flex",gap:10,alignItems:"flex-start"}}>
                {STAGES.map(stage=>{
                  const cards = filtered.filter(d=>d.stage===stage.id);
                  return (
                    <div key={stage.id} style={{minWidth:218,maxWidth:218,display:"flex",flexDirection:"column",gap:7,flexShrink:0}}>
                      {/* Column header */}
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",background:"#fff",borderRadius:10,border:"1px solid #e2e8f0",boxShadow:"0 1px 3px rgba(0,0,0,.04)"}}>
                        <div style={{display:"flex",alignItems:"center",gap:7}}>
                          <div style={{width:8,height:8,borderRadius:"50%",background:stage.color}}/>
                          <span style={{fontSize:12,fontWeight:600,color:"#374151"}}>{stage.label}</span>
                        </div>
                        <span style={{fontSize:11,background:stage.light,color:stage.color,borderRadius:20,padding:"1px 8px",fontWeight:700}}>{cards.length}</span>
                      </div>
                      {/* Cards — sorted by next action time */}
                      <div style={{display:"flex",flexDirection:"column",gap:6,overflowY:"auto",maxHeight:"calc(100vh - 162px)",paddingBottom:6}}>
                        {cards.map(d=>(
                          <KCard key={d.id} d={d} stage={stage}
                            onClick={()=>setSelected(d)}
                            onStageChange={requestStageChange}/>
                        ))}
                        {cards.length===0 && (
                          <div style={{textAlign:"center",padding:"18px 0",fontSize:12,color:"#cbd5e1",border:"1px dashed #e2e8f0",borderRadius:9,background:"#fafafa"}}>—</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {view==="dashboard" && <DashView drivers={drivers}/>}

            {view==="templates" && (
              <div style={{flex:1,overflowY:"auto",padding:24}}>
                <PTitle title="Templates" sub="Copy-ready messages — fill brackets before sending"/>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(310px,1fr))",gap:12,marginBottom:26}}>
                  {TEXT_TEMPLATES.map((t,i)=>(
                    <div key={i} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,.04)"}}>
                      <div style={{padding:"10px 14px",borderBottom:"1px solid #f1f5f9",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <span style={{fontSize:14,fontWeight:600,color:"#1e293b"}}>{t.label}</span>
                        <CBtn id={i} copied={copiedTpl} onCopy={()=>copyTpl(t.body,i)}/>
                      </div>
                      <div style={{padding:"12px 14px",fontSize:13,color:"#64748b",lineHeight:1.65}}>{t.body}</div>
                    </div>
                  ))}
                </div>
                <PTitle title="Call Log Template" sub=""/>
                <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,overflow:"hidden",maxWidth:540,boxShadow:"0 1px 3px rgba(0,0,0,.04)"}}>
                  <div style={{padding:"10px 14px",borderBottom:"1px solid #f1f5f9",display:"flex",justifyContent:"flex-end"}}>
                    <CBtn id="cl" copied={copiedTpl} onCopy={()=>copyTpl(CALL_LOG_TPL,"cl")}/>
                  </div>
                  <pre style={{padding:"14px 16px",fontSize:12,color:"#64748b",lineHeight:1.7,overflowX:"auto",whiteSpace:"pre-wrap"}}>{CALL_LOG_TPL}</pre>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── DRIVER DRAWER ── */}
        {sel && (
          <Drawer
            driver={sel}
            onClose={()=>setSelected(null)}
            onUpd={upd}
            onNote={addNote}
            onFile={addFile}
            onStageChange={requestStageChange}
          />
        )}

        {/* ── ADD MODAL ── */}
        {showAdd && <AddModal onClose={()=>setShowAdd(false)} onAdd={addDriver}/>}

        {/* ── STAGE CHANGE MODAL ── */}
        {stageModal && (
          <StageModal
            modal={stageModal}
            onConfirm={confirmStageChange}
            onCancel={()=>setStageModal(null)}
          />
        )}
      </div>
    </>
  );
}

// ── KANBAN CARD ───────────────────────────────────────────────────────
function KCard({ d, stage, onClick, onStageChange }) {
  const mins = minutesUntil(d);
  const over = mins !== null && mins < 0;
  const soon = mins !== null && mins >= 0 && mins <= 90;
  const docs = Object.values(d.docs).filter(Boolean).length;
  const intC = d.interest==="Hot"?"#10b981":d.interest==="Warm"?"#f59e0b":"#94a3b8";

  // Format next action label
  let naLabel = null, naTimeLabel = null;
  if (d.nextAction) {
    const dt = new Date(d.nextAction + "T00:00:00");
    naLabel = dt.toLocaleDateString("en-US",{month:"short",day:"numeric"});
    naTimeLabel = d.nextActionTime || null;
  }

  return (
    <div className="card-hover" onClick={onClick}
      style={{background:"#fff",border:`1px solid ${over?"#fecaca":soon?"#fde68a":"#e2e8f0"}`,borderRadius:10,padding:"12px 13px",cursor:"pointer",transition:"all .15s",boxShadow:"0 1px 3px rgba(0,0,0,.04)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
        <div style={{fontSize:14,fontWeight:600,color:"#0f172a",lineHeight:1.2}}>{d.name}</div>
        <div style={{width:8,height:8,borderRadius:"50%",background:intC,flexShrink:0,marginTop:3}} title={d.interest}/>
      </div>
      <div style={{fontSize:11,color:"#94a3b8",marginBottom:7}}>{d.city} · CDL {d.cdl} · {d.exp}yr</div>

      {d.flags.length > 0 && (
        <div style={{display:"flex",flexWrap:"wrap",gap:3,marginBottom:6}}>
          {d.flags.map((f,i)=>(
            <span key={i} style={{fontSize:9,background:"#f8fafc",color:"#64748b",border:"1px solid #e2e8f0",padding:"1px 5px",borderRadius:4}}>{f}</span>
          ))}
        </div>
      )}

      {/* Next action row */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:2}}>
        {d.nextAction ? (
          <div style={{display:"flex",alignItems:"center",gap:4}}>
            <span style={{fontSize:11,color:over?"#dc2626":soon?"#d97706":"#64748b",fontWeight:over||soon?600:400}}>
              {over
                ? `⚠ ${Math.abs(Math.round(mins/60)) < 48 ? Math.abs(Math.round(mins/60))+"h" : Math.abs(Math.round(mins/1440))+"d"} overdue`
                : soon && mins < 60
                  ? `⚡ in ${mins}min`
                  : `→ ${naLabel}`}
            </span>
            {naTimeLabel && !over && (
              <span style={{fontSize:10,color:soon?"#d97706":"#94a3b8",background:soon?"#fffbeb":"#f8fafc",padding:"1px 5px",borderRadius:3,border:`1px solid ${soon?"#fde68a":"#e2e8f0"}`}}>
                {naTimeLabel}
              </span>
            )}
          </div>
        ) : (
          <span style={{fontSize:11,color:"#d1d5db"}}>No action set</span>
        )}
        <span style={{fontSize:10,color:"#d1d5db"}}>{docs}/{DOC_LIST.length}</span>
      </div>
    </div>
  );
}

// ── STAGE CHANGE MODAL ────────────────────────────────────────────────
function StageModal({ modal, onConfirm, onCancel }) {
  const [nextDate,setNextDate] = useState(getTodayPlus(1));
  const [nextTime,setNextTime] = useState("10:00");
  const [comment,setComment]   = useState("");
  const from = STAGES.find(s=>s.id===modal.fromStage);
  const to   = STAGES.find(s=>s.id===modal.toStage);

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.5)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onCancel}>
      <div className="f-up" onClick={e=>e.stopPropagation()}
        style={{background:"#fff",borderRadius:16,width:"100%",maxWidth:440,padding:26,boxShadow:"0 20px 60px rgba(0,0,0,.2)"}}>

        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
          <div>
            <div style={{fontSize:17,fontWeight:700,color:"#0f172a",marginBottom:8}}>Stage change</div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:12,background:from?.light,color:from?.color,borderRadius:20,padding:"3px 10px",fontWeight:600}}>{from?.label}</span>
              <span style={{color:"#94a3b8",fontSize:14}}>→</span>
              <span style={{fontSize:12,background:to?.light,color:to?.color,borderRadius:20,padding:"3px 10px",fontWeight:600}}>{to?.label}</span>
            </div>
          </div>
          <button onClick={onCancel}
            style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:7,width:30,height:30,cursor:"pointer",color:"#64748b",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:14}}>

          {/* Next contact */}
          <div>
            <FL t="When is the next contact?"/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <div>
                <div style={{fontSize:10,color:"#94a3b8",marginBottom:3}}>Date</div>
                <input type="date" value={nextDate} onChange={e=>setNextDate(e.target.value)}
                  style={{width:"100%",padding:"9px 10px",fontSize:13,background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:8,color:"#0f172a",outline:"none"}}/>
              </div>
              <div>
                <div style={{fontSize:10,color:"#94a3b8",marginBottom:3}}>Time</div>
                <input type="time" value={nextTime} onChange={e=>setNextTime(e.target.value)}
                  style={{width:"100%",padding:"9px 10px",fontSize:13,background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:8,color:"#0f172a",outline:"none"}}/>
              </div>
            </div>
          </div>

          {/* Comment */}
          <div>
            <FL t="Comment (optional — saved to notes)"/>
            <textarea value={comment} onChange={e=>setComment(e.target.value)}
              placeholder="e.g. Driver confirmed interest, waiting for CDL copy…"
              rows={3}
              style={{width:"100%",padding:"10px 12px",fontSize:13,background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:8,resize:"none",lineHeight:1.6,color:"#0f172a",outline:"none"}}/>
          </div>

          {/* Buttons */}
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>onConfirm({driverId:modal.driverId,toStage:modal.toStage,nextAction:nextDate,nextActionTime:nextTime,comment})}
              className="btn-p"
              style={{flex:1,background:"#2563eb",border:"none",color:"#fff",padding:"11px",borderRadius:9,fontSize:14,fontWeight:600,cursor:"pointer"}}>
              Confirm move →
            </button>
            <button onClick={onCancel} className="btn-g"
              style={{background:"#f8fafc",border:"1px solid #e2e8f0",color:"#374151",padding:"11px 18px",borderRadius:9,fontSize:13,cursor:"pointer"}}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── DRIVER DRAWER ─────────────────────────────────────────────────────
function Drawer({ driver:d, onClose, onUpd, onNote, onFile, onStageChange }) {
  const [tab,setTab]     = useState("info");
  const [note,setNote]   = useState("");
  const [editing,setEdit]= useState(false);
  const [ed,setEd]       = useState({...d});
  const fileRef          = useRef();

  const stage = STAGES.find(s=>s.id===d.stage) || STAGES[0];
  const mins  = minutesUntil(d);
  const over  = mins !== null && mins < 0;
  const docs  = Object.values(d.docs).filter(Boolean).length;

  function save() { onUpd(d.id, ed); setEdit(false); }
  function submitNote() { if(!note.trim()) return; onNote(d.id,note.trim()); setNote(""); }
  function toggleDoc(k)  { onUpd(d.id, { docs:{...d.docs,[k]:!d.docs[k]} }); }
  function toggleFlag(f) { onUpd(d.id, { flags: d.flags.includes(f) ? d.flags.filter(x=>x!==f) : [...d.flags,f] }); }

  const [pendingFile, setPendingFile] = useState(null); // {name, type, mime, data, size, date}

  function handleFiles(files) {
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        // Show "what doc is this?" modal for each uploaded file
        setPendingFile({
          name: file.name,
          type: file.type.startsWith("image/") ? "image" : "file",
          mime: file.type,
          data: ev.target.result,
          size: file.size,
          date: new Date().toLocaleString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}),
          linkedDoc: null,
        });
      };
      reader.readAsDataURL(file);
    });
  }

  function confirmPendingFile(linkedDoc) {
    if (!pendingFile) return;
    const fileToSave = { ...pendingFile, linkedDoc };
    onFile(d.id, fileToSave);
    // Auto-tick the checkbox if a doc type was selected
    if (linkedDoc) {
      onUpd(d.id, { docs: { ...d.docs, [linkedDoc]: true } });
    }
    setPendingFile(null);
  }

  function deleteFile(fileIdx) {
    const file = (d.files || [])[fileIdx];
    const newFiles = (d.files || []).filter((_,i) => i !== fileIdx);
    // Un-tick the checkbox if no other file links to the same doc
    let newDocs = { ...d.docs };
    if (file?.linkedDoc) {
      const stillLinked = newFiles.some(f => f.linkedDoc === file.linkedDoc);
      if (!stillLinked) newDocs[file.linkedDoc] = false;
    }
    onUpd(d.id, { files: newFiles, docs: newDocs });
  }

  return (
    <div style={{position:"fixed",inset:0,zIndex:100,display:"flex"}} onClick={onClose}>
      <div style={{flex:1}}/>
      <div className="s-in" onClick={e=>e.stopPropagation()}
        style={{width:490,background:"#fff",borderLeft:"1px solid #e2e8f0",display:"flex",flexDirection:"column",height:"100%",boxShadow:"-8px 0 40px rgba(0,0,0,.10)"}}>

        {/* Header */}
        <div style={{padding:"18px 22px 14px",borderBottom:"1px solid #f1f5f9",flexShrink:0}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
            <div>
              <div style={{fontSize:20,fontWeight:700,color:"#0f172a"}}>{d.name}</div>
              <div style={{fontSize:12,color:"#94a3b8",marginTop:2}}>{d.city} · CDL {d.cdl} · {d.exp} yrs · {d.source}</div>
            </div>
            <button onClick={onClose}
              style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:8,width:32,height:32,cursor:"pointer",color:"#64748b",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
          </div>

          {/* Stage + interest */}
          <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:10}}>
            <select value={d.stage} onChange={e=>onStageChange(d.id,e.target.value)}
              style={{padding:"5px 10px",fontSize:12,fontWeight:600,background:stage.light,color:stage.color,border:`1px solid ${stage.color}55`,borderRadius:7,outline:"none"}}>
              {STAGES.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <select value={d.interest} onChange={e=>onUpd(d.id,{interest:e.target.value})}
              style={{padding:"5px 10px",fontSize:12,background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:7,outline:"none",color:"#374151"}}>
              {["Hot","Warm","Cold"].map(v=><option key={v}>{v}</option>)}
            </select>
          </div>

          {/* Next action: date + time */}
          <div style={{background:over?"#fef2f2":"#f8fafc",border:`1px solid ${over?"#fca5a5":"#e2e8f0"}`,borderRadius:9,padding:"10px 13px"}}>
            <div style={{fontSize:10,color:over?"#dc2626":"#94a3b8",fontWeight:700,letterSpacing:".06em",marginBottom:7}}>
              {over ? "⚠ OVERDUE — NEXT ACTION" : "NEXT ACTION"}
            </div>
            <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
              <div>
                <div style={{fontSize:10,color:"#94a3b8",marginBottom:3}}>Date</div>
                <input type="date" value={d.nextAction||""} onChange={e=>onUpd(d.id,{nextAction:e.target.value})}
                  style={{padding:"7px 9px",fontSize:13,background:"#fff",border:`1px solid ${over?"#fca5a5":"#e2e8f0"}`,borderRadius:7,color:over?"#dc2626":"#374151",outline:"none"}}/>
              </div>
              <div>
                <div style={{fontSize:10,color:"#94a3b8",marginBottom:3}}>Time</div>
                <input type="time" value={d.nextActionTime||"10:00"} onChange={e=>onUpd(d.id,{nextActionTime:e.target.value})}
                  style={{padding:"7px 9px",fontSize:13,background:"#fff",border:"1px solid #e2e8f0",borderRadius:7,color:"#374151",outline:"none"}}/>
              </div>
              {!over && mins !== null && mins <= 120 && (
                <span style={{fontSize:11,color:"#d97706",fontWeight:600,marginTop:16}}>⚡ in {mins < 60 ? mins+"min" : Math.round(mins/60)+"h"}</span>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{display:"flex",borderBottom:"1px solid #f1f5f9",padding:"0 22px",flexShrink:0}}>
          {[["info","Info"],["documents","Documents"],["notes","Log"],["flags","Flags"]].map(([id,lbl])=>(
            <button key={id} className={`tab-btn ${tab===id?"on":""}`} onClick={()=>setTab(id)}
              style={{background:"none",border:"none",padding:"10px 11px 9px",fontSize:13,color:tab===id?"#2563eb":"#64748b",cursor:"pointer"}}>
              {lbl}
              {id==="documents" && <span style={{fontSize:10,color:"#94a3b8",marginLeft:3}}>({docs}/{DOC_LIST.length}{(d.files||[]).length>0?` · ${(d.files||[]).length} files`:""})</span>}
              {id==="notes" && <span style={{fontSize:10,color:"#94a3b8",marginLeft:3}}>({d.notes.length})</span>}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{flex:1,overflowY:"auto",padding:"16px 22px"}}>

          {/* INFO */}
          {tab==="info" && (
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {editing ? (
                <>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    {[["name","Full Name"],["phone","Phone"],["email","Email"],["city","City / State"]].map(([k,l])=>(
                      <div key={k}>
                        <FL t={l}/>
                        <input value={ed[k]||""} onChange={e=>setEd(p=>({...p,[k]:e.target.value}))}
                          style={{width:"100%",padding:"8px 10px",fontSize:13,background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:7,color:"#0f172a",outline:"none"}}/>
                      </div>
                    ))}
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                    <div><FL t="CDL"/>
                      <select value={ed.cdl} onChange={e=>setEd(p=>({...p,cdl:e.target.value}))}
                        style={{width:"100%",padding:"8px 10px",fontSize:13,background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:7,color:"#374151",outline:"none"}}>
                        <option>A</option><option>B</option>
                      </select>
                    </div>
                    <div><FL t="Exp (yrs)"/>
                      <input type="number" value={ed.exp} onChange={e=>setEd(p=>({...p,exp:+e.target.value}))}
                        style={{width:"100%",padding:"8px 10px",fontSize:13,background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:7,color:"#0f172a",outline:"none"}}/>
                    </div>
                    <div><FL t="Source"/>
                      <select value={ed.source} onChange={e=>setEd(p=>({...p,source:e.target.value}))}
                        style={{width:"100%",padding:"8px 10px",fontSize:13,background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:7,color:"#374151",outline:"none"}}>
                        {SOURCES.map(s=><option key={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <Btn label="Save" onClick={save} primary/>
                    <Btn label="Cancel" onClick={()=>setEdit(false)}/>
                  </div>
                </>
              ) : (
                <>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    {[["Phone",d.phone],["Email",d.email],["City",d.city],["CDL",`Class ${d.cdl}`],["Experience",`${d.exp} years`],["Source",d.source],["Available",d.startDate||"TBD"],["Last Contact",d.lastContact?fmtDate(d.lastContact):"—"]].map(([k,v])=>(
                      <div key={k} style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:8,padding:"9px 11px"}}>
                        <div style={{fontSize:10,color:"#94a3b8",marginBottom:3,fontWeight:500}}>{k}</div>
                        <div style={{fontSize:13,color:"#0f172a"}}>{v}</div>
                      </div>
                    ))}
                  </div>
                  <Btn label="✎  Edit Info" onClick={()=>{setEd({...d});setEdit(true);}}/>
                </>
              )}
            </div>
          )}

          {/* DOCUMENTS (checklist + uploaded files merged) */}
          {tab==="documents" && (
            <div style={{display:"flex",flexDirection:"column",gap:20}}>

              {/* ── Checklist section ── */}
              <div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                  <span style={{fontSize:13,fontWeight:600,color:"#0f172a"}}>Required Documents</span>
                  <span style={{fontSize:12,color: docs===DOC_LIST.length?"#16a34a":"#94a3b8",fontWeight:500}}>{docs} / {DOC_LIST.length} received</span>
                </div>
                {/* Progress bar */}
                <div style={{background:"#f1f5f9",borderRadius:4,height:5,marginBottom:12}}>
                  <div style={{height:"100%",width:`${(docs/DOC_LIST.length)*100}%`,background: docs===DOC_LIST.length?"#10b981":"#3b82f6",borderRadius:4,transition:"width .3s ease"}}/>
                </div>
                <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,overflow:"hidden"}}>
                  {DOC_LIST.map((doc,i)=>(
                    <label key={doc} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",borderBottom:i<DOC_LIST.length-1?"1px solid #f8fafc":"none",cursor:"pointer",background:d.docs[doc]?"#f0fdf4":"#fff",transition:"background .12s"}}>
                      <div style={{width:18,height:18,borderRadius:5,border:`2px solid ${d.docs[doc]?"#10b981":"#d1d5db"}`,background:d.docs[doc]?"#10b981":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .15s"}}>
                        {d.docs[doc] && <span style={{color:"#fff",fontSize:10,fontWeight:700}}>✓</span>}
                      </div>
                      <input type="checkbox" checked={!!d.docs[doc]} onChange={()=>toggleDoc(doc)} style={{display:"none"}}/>
                      <span style={{fontSize:13,color:d.docs[doc]?"#166534":"#374151",flex:1}}>{doc}</span>
                      {d.docs[doc] && <span style={{fontSize:10,color:"#10b981",fontWeight:600}}>Received</span>}
                    </label>
                  ))}
                </div>
              </div>

              {/* ── Divider ── */}
              <div style={{borderTop:"1px solid #f1f5f9"}}/>

              {/* ── Uploaded Files section ── */}
              <div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                  <span style={{fontSize:13,fontWeight:600,color:"#0f172a"}}>Uploaded Files</span>
                  <span style={{fontSize:12,color:"#94a3b8"}}>{(d.files||[]).length} file{(d.files||[]).length!==1?"s":""}</span>
                </div>
                <div
                  className="file-zone"
                  onDragOver={e=>e.preventDefault()}
                  onDrop={e=>{e.preventDefault();handleFiles(e.dataTransfer.files);}}
                  onClick={()=>fileRef.current?.click()}
                  style={{border:"2px dashed #e2e8f0",borderRadius:10,padding:"18px 16px",textAlign:"center",cursor:"pointer",transition:"all .15s",background:"#fafafa",marginBottom:12}}>
                  <div style={{fontSize:22,marginBottom:6}}>📎</div>
                  <div style={{fontSize:13,fontWeight:600,color:"#374151",marginBottom:3}}>Drop files or click to upload</div>
                  <div style={{fontSize:11,color:"#94a3b8"}}>PDFs, photos, Word, Excel — any format</div>
                  <input ref={fileRef} type="file" multiple onChange={e=>handleFiles(e.target.files)} style={{display:"none"}}/>
                </div>
                {(d.files||[]).length === 0
                  ? <div style={{textAlign:"center",padding:"14px 0",fontSize:13,color:"#cbd5e1"}}>No files uploaded yet</div>
                  : (
                    <div style={{display:"flex",flexDirection:"column",gap:7}}>
                      {(d.files||[]).map((f,i)=>(
                        <div key={i} style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:9,overflow:"hidden"}}>
                          {f.type==="image" ? (
                            <>
                              <img src={f.data} alt={f.name} style={{width:"100%",maxHeight:160,objectFit:"cover",display:"block"}}/>
                              <div style={{padding:"8px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                                <div>
                                  <div style={{fontSize:12,fontWeight:600,color:"#374151"}}>{f.name}</div>
                                  <div style={{fontSize:10,color:"#94a3b8"}}>
                                    {fmtSize(f.size)} · {f.date}
                                    {f.linkedDoc && <span style={{marginLeft:6,color:"#10b981",fontWeight:600}}>· {f.linkedDoc}</span>}
                                  </div>
                                </div>
                                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                                  <a href={f.data} download={f.name} style={{fontSize:11,color:"#2563eb",textDecoration:"none",fontWeight:600}}>↓ Save</a>
                                  <button onClick={()=>deleteFile(i)} title="Delete" style={{background:"none",border:"none",color:"#fca5a5",fontSize:15,cursor:"pointer",lineHeight:1,padding:0,display:"flex",alignItems:"center"}} onMouseEnter={e=>e.currentTarget.style.color="#dc2626"} onMouseLeave={e=>e.currentTarget.style.color="#fca5a5"}>🗑</button>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div style={{padding:"11px 14px",display:"flex",alignItems:"center",gap:12}}>
                              <div style={{width:34,height:34,background:"#eff6ff",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>
                                {f.mime?.includes("pdf")?"📄":f.mime?.includes("word")||f.mime?.includes("doc")?"📝":f.mime?.includes("sheet")||f.mime?.includes("excel")?"📊":"📎"}
                              </div>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{fontSize:13,fontWeight:600,color:"#374151",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{f.name}</div>
                                <div style={{fontSize:10,color:"#94a3b8",marginTop:2}}>
                                  {fmtSize(f.size)} · {f.date}
                                  {f.linkedDoc && <span style={{marginLeft:6,color:"#10b981",fontWeight:600}}>· {f.linkedDoc}</span>}
                                </div>
                              </div>
                              <div style={{display:"flex",gap:8,alignItems:"center",flexShrink:0}}>
                                <a href={f.data} download={f.name} style={{fontSize:11,color:"#2563eb",textDecoration:"none",fontWeight:600}}>↓ Save</a>
                                <button onClick={()=>deleteFile(i)} title="Delete" style={{background:"none",border:"none",color:"#fca5a5",fontSize:15,cursor:"pointer",lineHeight:1,padding:0,display:"flex",alignItems:"center"}} onMouseEnter={e=>e.currentTarget.style.color="#dc2626"} onMouseLeave={e=>e.currentTarget.style.color="#fca5a5"}>🗑</button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                }
              </div>
            </div>
          )}

          {/* NOTES LOG */}
          {tab==="notes" && (
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div>
                <FL t="Add Entry"/>
                <textarea value={note} onChange={e=>setNote(e.target.value)}
                  placeholder="Log a call, text, email or note…"
                  rows={4}
                  style={{width:"100%",padding:"10px 12px",fontSize:13,background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:8,resize:"vertical",lineHeight:1.6,color:"#0f172a",outline:"none"}}/>
                <div style={{marginTop:6}}><Btn label="+ Log Entry" onClick={submitNote} primary/></div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:7}}>
                {d.notes.length === 0 && <div style={{textAlign:"center",padding:24,fontSize:13,color:"#cbd5e1"}}>No entries yet</div>}
                {d.notes.map((n,i)=>(
                  <div key={i} style={{background:"#f8fafc",border:`1px solid ${n.text.startsWith("[Stage:")?"#dbeafe":"#e2e8f0"}`,borderRadius:9,padding:"10px 12px"}}>
                    <div style={{fontSize:10,color:"#94a3b8",marginBottom:4}}>{n.date}</div>
                    <div style={{fontSize:13,color:"#374151",lineHeight:1.6,whiteSpace:"pre-wrap"}}>{n.text}</div>
                  </div>
                ))}
              </div>
            </div>
          )}



          {/* FLAGS */}
          {tab==="flags" && (
            <div style={{display:"flex",flexDirection:"column",gap:7}}>
              <div style={{fontSize:12,color:"#94a3b8",marginBottom:4}}>Toggle risk flags for this driver</div>
              {FLAGS_OPT.map(flag=>(
                <label key={flag} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 14px",background:d.flags.includes(flag)?"#f0f9ff":"#f8fafc",border:`1px solid ${d.flags.includes(flag)?"#bae6fd":"#e2e8f0"}`,borderRadius:9,cursor:"pointer",transition:"all .12s"}}>
                  <div style={{width:16,height:16,borderRadius:4,border:`2px solid ${d.flags.includes(flag)?"#3b82f6":"#d1d5db"}`,background:d.flags.includes(flag)?"#3b82f6":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .15s"}}>
                    {d.flags.includes(flag) && <span style={{color:"#fff",fontSize:9,fontWeight:700}}>✓</span>}
                  </div>
                  <input type="checkbox" checked={d.flags.includes(flag)} onChange={()=>toggleFlag(flag)} style={{display:"none"}}/>
                  <span style={{fontSize:13,color:"#374151"}}>{flag}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── DOC LINK MODAL ── */}
      {pendingFile && (
        <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.55)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setPendingFile(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:16,width:"100%",maxWidth:420,padding:24,boxShadow:"0 20px 60px rgba(0,0,0,.2)"}}>
            <div style={{fontSize:16,fontWeight:700,color:"#0f172a",marginBottom:4}}>What document is this?</div>
            <div style={{fontSize:13,color:"#64748b",marginBottom:16}}>
              <span style={{fontWeight:600,color:"#374151"}}>"{pendingFile.name}"</span> — select a type to auto-check the list, or skip.
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:14,maxHeight:320,overflowY:"auto"}}>
              {DOC_LIST.map(doc=>(
                <button key={doc} onClick={()=>confirmPendingFile(doc)}
                  style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:d.docs[doc]?"#f0fdf4":"#f8fafc",border:`1px solid ${d.docs[doc]?"#6ee7b7":"#e2e8f0"}`,borderRadius:8,cursor:"pointer",fontSize:13,color:"#374151",textAlign:"left",fontFamily:"'DM Sans',sans-serif"}}
                  onMouseEnter={e=>{e.currentTarget.style.background="#eff6ff";e.currentTarget.style.borderColor="#93c5fd";}}
                  onMouseLeave={e=>{e.currentTarget.style.background=d.docs[doc]?"#f0fdf4":"#f8fafc";e.currentTarget.style.borderColor=d.docs[doc]?"#6ee7b7":"#e2e8f0";}}>
                  <span>{doc}</span>
                  {d.docs[doc]
                    ? <span style={{fontSize:11,color:"#10b981",fontWeight:600}}>✓ Already received</span>
                    : <span style={{fontSize:11,color:"#94a3b8"}}>Mark as received →</span>
                  }
                </button>
              ))}
            </div>
            <button onClick={()=>confirmPendingFile(null)}
              style={{width:"100%",padding:"10px",background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:8,fontSize:13,color:"#64748b",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
              Skip — upload without linking to checklist
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── DASHBOARD ─────────────────────────────────────────────────────────
function DashView({ drivers }) {
  const total   = drivers.length;
  const hired   = drivers.filter(d=>d.stage==="hired").length;
  const active  = drivers.filter(d=>!["hired","cold"].includes(d.stage)).length;
  const cold    = drivers.filter(d=>d.stage==="cold").length;
  const overdue = drivers.filter(d=>{ const m=minutesUntil(d); return m!==null&&m<0&&!["hired","cold"].includes(d.stage); }).length;
  const stale   = drivers.filter(d=>d.lastContact&&(new Date(todayStr())-new Date(d.lastContact))/86400000>=3&&!["hired","cold"].includes(d.stage)).length;
  const hot     = drivers.filter(d=>d.interest==="Hot"&&!["hired","cold"].includes(d.stage)).length;
  const noAct   = drivers.filter(d=>!d.nextAction&&!["hired","cold"].includes(d.stage)).length;

  const kpis = [
    {label:"Total",       value:total,   color:"#6366f1", bg:"#eef2ff"},
    {label:"Active",      value:active,  color:"#3b82f6", bg:"#eff6ff"},
    {label:"Hired ✓",     value:hired,   color:"#16a34a", bg:"#f0fdf4"},
    {label:"Hot 🔥",      value:hot,     color:"#059669", bg:"#ecfdf5"},
    {label:"Overdue ⚠",   value:overdue, color:overdue>0?"#dc2626":"#94a3b8", bg:overdue>0?"#fef2f2":"#f8fafc"},
    {label:"Stale (72h+)",value:stale,   color:stale>0?"#d97706":"#94a3b8",   bg:stale>0?"#fffbeb":"#f8fafc"},
    {label:"No Action",   value:noAct,   color:noAct>0?"#f97316":"#94a3b8",   bg:noAct>0?"#fff7ed":"#f8fafc"},
    {label:"Cold ❄️",      value:cold,    color:"#94a3b8", bg:"#f8fafc"},
  ];

  const srcC   = SOURCES.reduce((a,s)=>({...a,[s]:drivers.filter(d=>d.source===s).length}),{});
  const maxSrc = Math.max(...Object.values(srcC),1);

  return (
    <div style={{flex:1,overflowY:"auto",padding:24}}>
      <PTitle title="Dashboard" sub="Live pipeline overview"/>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(148px,1fr))",gap:10,marginBottom:24}}>
        {kpis.map(k=>(
          <div key={k.label} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,padding:"14px 16px",boxShadow:"0 1px 3px rgba(0,0,0,.04)"}}>
            <div style={{fontSize:11,color:"#94a3b8",marginBottom:6,fontWeight:500}}>{k.label}</div>
            <div style={{fontSize:32,fontWeight:700,color:k.color,lineHeight:1}}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
        {/* By stage */}
        <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:"18px 20px",boxShadow:"0 1px 3px rgba(0,0,0,.04)"}}>
          <div style={{fontSize:14,fontWeight:700,color:"#0f172a",marginBottom:14}}>By Stage</div>
          {STAGES.map(s=>{
            const cnt = drivers.filter(d=>d.stage===s.id).length;
            const pct = total>0?(cnt/total)*100:0;
            return (
              <div key={s.id} className="row-hover" style={{display:"grid",gridTemplateColumns:"115px 28px 1fr",gap:10,alignItems:"center",padding:"6px 8px",borderRadius:7}}>
                <span style={{fontSize:12,color:"#374151"}}>{s.label}</span>
                <span style={{fontSize:12,fontWeight:600,color:s.color,textAlign:"right"}}>{cnt}</span>
                <div style={{background:"#f1f5f9",borderRadius:4,height:6}}>
                  <div style={{height:"100%",width:`${pct}%`,background:s.color,borderRadius:4}}/>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sources + checklist */}
        <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:"18px 20px",boxShadow:"0 1px 3px rgba(0,0,0,.04)"}}>
          <div style={{fontSize:14,fontWeight:700,color:"#0f172a",marginBottom:14}}>Lead Sources</div>
          {Object.entries(srcC).map(([src,cnt])=>(
            <div key={src} className="row-hover" style={{display:"grid",gridTemplateColumns:"100px 28px 1fr",gap:10,alignItems:"center",padding:"6px 8px",borderRadius:7}}>
              <span style={{fontSize:12,color:"#374151"}}>{src}</span>
              <span style={{fontSize:12,fontWeight:600,color:"#6366f1",textAlign:"right"}}>{cnt}</span>
              <div style={{background:"#f1f5f9",borderRadius:4,height:6}}>
                <div style={{height:"100%",width:`${(cnt/maxSrc)*100}%`,background:"#6366f1",borderRadius:4}}/>
              </div>
            </div>
          ))}
          <div style={{marginTop:18,borderTop:"1px solid #f1f5f9",paddingTop:14}}>
            <div style={{fontSize:11,color:"#94a3b8",marginBottom:10,fontWeight:600,letterSpacing:".04em"}}>DAILY CHECKLIST</div>
            {["Zero overdue cards before EOD","Every card has a Next Action","New leads entered same day","All calls logged in card","Friday: no stale cards"].map((r,i)=>(
              <div key={i} style={{display:"flex",gap:8,alignItems:"center",padding:"5px 0"}}>
                <div style={{width:15,height:15,borderRadius:4,border:"1.5px solid #d1d5db",flexShrink:0}}/>
                <span style={{fontSize:12,color:"#64748b"}}>{r}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── ADD MODAL ─────────────────────────────────────────────────────────
function AddModal({ onClose, onAdd }) {
  const [f,setF] = useState({name:"",phone:"",email:"",city:"",cdl:"A",exp:"",source:"Indeed",stage:"new",nextAction:getTodayPlus(1),nextActionTime:"10:00"});
  const set = (k,v) => setF(p=>({...p,[k]:v}));
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.45)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
      <div className="f-up" onClick={e=>e.stopPropagation()}
        style={{background:"#fff",borderRadius:16,width:"100%",maxWidth:480,padding:26,boxShadow:"0 20px 60px rgba(0,0,0,.18)",maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div style={{fontSize:18,fontWeight:700,color:"#0f172a"}}>Add New Driver</div>
          <button onClick={onClose} style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:7,width:30,height:30,cursor:"pointer",color:"#64748b",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:11}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {[["name","Full Name *","James Miller"],["phone","Phone *","555-0100"],["email","Email","driver@email.com"],["city","City / State","Chicago, IL"]].map(([k,l,ph])=>(
              <div key={k}>
                <FL t={l}/>
                <input value={f[k]} onChange={e=>set(k,e.target.value)} placeholder={ph}
                  style={{width:"100%",padding:"9px 11px",fontSize:13,background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:8,color:"#0f172a",outline:"none"}}/>
              </div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
            <div><FL t="CDL"/>
              <select value={f.cdl} onChange={e=>set("cdl",e.target.value)} style={{width:"100%",padding:"9px 10px",fontSize:13,background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:8,color:"#374151",outline:"none"}}>
                <option>A</option><option>B</option>
              </select>
            </div>
            <div><FL t="Exp (yrs)"/>
              <input type="number" value={f.exp} onChange={e=>set("exp",e.target.value)} placeholder="0" min="0"
                style={{width:"100%",padding:"9px 10px",fontSize:13,background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:8,color:"#0f172a",outline:"none"}}/>
            </div>
            <div><FL t="Source"/>
              <select value={f.source} onChange={e=>set("source",e.target.value)} style={{width:"100%",padding:"9px 10px",fontSize:13,background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:8,color:"#374151",outline:"none"}}>
                {SOURCES.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div><FL t="Initial Stage"/>
              <select value={f.stage} onChange={e=>set("stage",e.target.value)} style={{width:"100%",padding:"9px 10px",fontSize:13,background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:8,color:"#374151",outline:"none"}}>
                {STAGES.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <FL t="Next Action"/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                <input type="date" value={f.nextAction} onChange={e=>set("nextAction",e.target.value)}
                  style={{padding:"9px 8px",fontSize:12,background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:8,color:"#374151",outline:"none"}}/>
                <input type="time" value={f.nextActionTime} onChange={e=>set("nextActionTime",e.target.value)}
                  style={{padding:"9px 8px",fontSize:12,background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:8,color:"#374151",outline:"none"}}/>
              </div>
            </div>
          </div>
          <button
            onClick={()=>{ if(!f.name.trim()||!f.phone.trim()) return; onAdd({...f,exp:+f.exp||0}); }}
            className="btn-p"
            style={{background:"#2563eb",border:"none",color:"#fff",padding:"11px",borderRadius:9,fontSize:14,fontWeight:600,cursor:"pointer",marginTop:4}}>
            Add Driver →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MICRO COMPONENTS ──────────────────────────────────────────────────
function SPill({n,l,c,bg}){
  return <div style={{display:"flex",alignItems:"center",gap:5,background:bg,border:`1px solid ${c}33`,borderRadius:20,padding:"3px 10px",flexShrink:0}}>
    <span style={{fontSize:13,fontWeight:700,color:c}}>{n}</span>
    <span style={{fontSize:11,color:c,opacity:.8}}>{l}</span>
  </div>;
}
function Btn({label,onClick,primary}){
  return <button className={primary?"btn-p":"btn-g"} onClick={onClick}
    style={{background:primary?"#2563eb":"#f8fafc",border:`1px solid ${primary?"#2563eb":"#e2e8f0"}`,color:primary?"#fff":"#374151",padding:"8px 16px",borderRadius:8,fontSize:13,fontWeight:primary?600:400,cursor:"pointer",transition:"all .15s"}}>
    {label}
  </button>;
}
function FL({t}){
  return <div style={{fontSize:11,color:"#94a3b8",marginBottom:4,fontWeight:500}}>{t}</div>;
}
function PTitle({title,sub}){
  return <div style={{marginBottom:20}}>
    <div style={{fontSize:22,fontWeight:700,color:"#0f172a"}}>{title}</div>
    {sub && <div style={{fontSize:13,color:"#94a3b8",marginTop:2}}>{sub}</div>}
  </div>;
}
function CBtn({id,copied,onCopy}){
  return <button onClick={onCopy}
    style={{background:copied===id?"#ecfdf5":"#eff6ff",border:`1px solid ${copied===id?"#6ee7b7":"#bfdbfe"}`,color:copied===id?"#059669":"#2563eb",padding:"4px 12px",borderRadius:6,fontSize:11,fontWeight:600,cursor:"pointer",transition:"all .15s"}}>
    {copied===id?"✓ Copied":"Copy"}
  </button>;
}
