/* ECR & ECN Management - no backend version */
const C = window.APP_CONFIG;
const state = { page: "dashboard", filterStatus:null, filterType:null, search:"", editId:null, admin:false, activeEntry:"ECR", reportFrom:"2026-09-01", reportTo:"2026-09-30", excelHandle:null, plant:"", priority:"", teamFilter:"" };
const plants = ["P538","P452","P546"];
const teams = ["HW Part","SW Part","Mechanical Part","New Model Part","Part Development"];
const statuses = ["Open","Closed","Rejected"];
const priorities = ["High","Medium","Low"];

const $ = s => document.querySelector(s);
const esc = v => String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const uid = p => `${p.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;

function seedData(){
  const raw = localStorage.getItem(C.storageKey);
  if(raw){ try { const parsed=JSON.parse(raw); return {ecr:Array.isArray(parsed.ecr)?parsed.ecr:[], ecn:Array.isArray(parsed.ecn)?parsed.ecn:[]}; } catch(e){} }
  return {ecr:[],ecn:[]};
}
let data = seedData();

function saveLocal(show=true){
  localStorage.setItem(C.storageKey, JSON.stringify(data));
  if(show) toast("Data saved successfully","success");
}
function all(type){return type==="ECR"?data.ecr:data.ecn}
function total(type){return all(type).length}
function count(type,status){return all(type).filter(x=>x.status===status).length}
function fmtDate(s){if(!s)return ""; const d=new Date(s); if(isNaN(d))return s; return d.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})}
function badge(s){return `<span class="badge ${String(s).toLowerCase()}">${esc(s)}</span>`}
function priorityBadge(s){return `<span class="badge ${String(s).toLowerCase()}">${esc(s)}</span>`}
function navItem(key,icon,label){return `<button class="${state.page===key?"active":""}" onclick="go('${key}')"><span class="ico">${icon}</span>${label}</button>`}

function shell(){
 return `<div class="app">
  <aside class="sidebar">
   <div class="brand"><span class="brand-icon">⚙</span><span>ECR & ECN<br>Management</span></div>
   <nav class="nav">
    ${navItem("dashboard","⌂","Dashboard")}
    ${navItem("ecr","▣","SIEL ECR Details")}
    ${navItem("ecn","▤","SIEL ECN Details")}
    ${navItem("team","♟","Team Wise Data")}
    ${navItem("entry","✎","All Users Data Entry")}
    ${navItem("admin","♙","Admin")}
    ${navItem("reports","▥","Reports")}
    ${navItem("settings","⚙","Settings")}
   </nav>
  </aside>
  <main class="main">
   <header class="topbar"><div class="top-title">SIEL · Engineering Change Request / Notice</div><div class="user">Last Updated: 17 Sep 2026 10:45 AM &nbsp; | &nbsp; ${state.admin?"Admin":"User"} ▾</div></header>
   <section class="content" id="content"></section>
   <footer class="footer"><b>⚙ ECR & ECN Management</b><span>Better Tracking &nbsp;|&nbsp; Better Collaboration &nbsp;|&nbsp; Better Results</span></footer>
  </main>
 </div>`;
}
function render(){document.getElementById("app").innerHTML=shell(); renderPage();}

function kpi(label,value,cls,click){return `<div class="kpi ${cls}" onclick="${click}"><div class="label">${label}</div><div class="value">${value}</div></div>`}
function dashboard(){
 const eo=count("ECR","Open"), ec=count("ECR","Closed"), er=count("ECR","Rejected");
 const no=count("ECN","Open"), nc=count("ECN","Closed"), nr=count("ECN","Rejected");
 const latestE=data.ecr.slice(0,5), latestN=data.ecn.slice(0,5);
 const pct=(v,t)=>t?((v/t)*100).toFixed(1):0;
 return `<div class="page-title"><div><h1>Overview Dashboard</h1><p>ECR and ECN monitoring overview</p></div><button class="btn" onclick="refreshData()">↻ Refresh</button></div>
 <div class="kpis">
  ${kpi("Total ECR",data.ecr.length,"blue","go('ecr')")}${kpi("Open ECR",eo,"green","go('ecr'); state.filterStatus='Open'; renderPage()")}${kpi("Closed ECR",ec,"orange","go('ecr'); state.filterStatus='Closed'; renderPage()")}${kpi("Rejected ECR",er,"red","go('ecr'); state.filterStatus='Rejected'; renderPage()")}
  ${kpi("Total ECN",data.ecn.length,"blue","go('ecn')")}${kpi("Open ECN",no,"green","go('ecn'); state.filterStatus='Open'; renderPage()")}${kpi("Closed ECN",nc,"orange","go('ecn'); state.filterStatus='Closed'; renderPage()")}${kpi("Rejected ECN",nr,"red","go('ecn'); state.filterStatus='Rejected'; renderPage()")}
 </div>
 <div class="grid2">
  <div class="panel"><h3>ECR Status</h3><div class="chart-wrap"><div class="donut" style="--open:${eo/data.ecr.length*100}%;--closed:${(eo+ec)/data.ecr.length*100}%"><span>${data.ecr.length}</span></div><div class="legend"><div><i class="dot" style="background:var(--blue)"></i>Open ${eo} (${pct(eo,data.ecr.length)}%)</div><div><i class="dot" style="background:var(--green)"></i>Closed ${ec} (${pct(ec,data.ecr.length)}%)</div><div><i class="dot" style="background:var(--red)"></i>Rejected ${er} (${pct(er,data.ecr.length)}%)</div></div></div></div>
  <div class="panel"><h3>ECN Status</h3><div class="chart-wrap"><div class="donut" style="--open:${no/data.ecn.length*100}%;--closed:${(no+nc)/data.ecn.length*100}%"><span>${data.ecn.length}</span></div><div class="legend"><div><i class="dot" style="background:var(--blue)"></i>Open ${no} (${pct(no,data.ecn.length)}%)</div><div><i class="dot" style="background:var(--green)"></i>Closed ${nc} (${pct(nc,data.ecn.length)}%)</div><div><i class="dot" style="background:var(--red)"></i>Rejected ${nr} (${pct(nr,data.ecn.length)}%)</div></div></div></div>
 </div>
 <div class="grid2" style="margin-top:18px">
  ${recentPanel("Latest SIEL ECR",latestE,"ECR")}
  ${recentPanel("Latest SIEL ECN",latestN,"ECN")}
 </div>`;
}
function recentPanel(title,rows,type){
 return `<div class="panel recent"><div style="display:flex;justify-content:space-between;align-items:center"><h3>${title}</h3><button class="link" onclick="go('${type.toLowerCase()}')">View All</button></div>
 <div class="table-wrap"><table class="table"><thead><tr><th>${type} No</th><th>Title</th><th>Plant</th><th>Status</th><th>Date</th></tr></thead><tbody>
 ${rows.map(r=>`<tr><td><button class="link" onclick="viewRecord('${type}','${r.id}')">${esc(r.number)}</button></td><td>${esc(r.title)}</td><td>${esc(r.plant)}</td><td>${badge(r.status)}</td><td>${fmtDate(r.receivedDate)}</td></tr>`).join("")}</tbody></table></div></div>`;
}

function details(type){
 const rows=filtered(type);
 const t=type==="ECR"?"ECR":"ECN";
 const totalRows=total(type), op=count(type,"Open"), cl=count(type,"Closed"), rej=count(type,"Rejected");
 return `<div class="page-title"><div><h1>SIEL ${t} Details</h1><p>View and manage SIEL ${t} records</p></div><button class="btn" onclick="openEntry('${t}')">＋ Add ${t}</button></div>
 <div class="kpis">${kpi(`Total ${t}`,totalRows,"blue",`state.filterStatus=null; renderPage()`)}${kpi("Open",op,"green",`state.filterStatus='Open'; renderPage()`)}${kpi("Closed",cl,"orange",`state.filterStatus='Closed'; renderPage()`)}${kpi("Rejected",rej,"red",`state.filterStatus='Rejected'; renderPage()`)}</div>
 <div class="toolbar"><input class="input search" id="detailSearch" placeholder="Search by ${t} No, Title, Plant, etc..." value="${esc(state.search)}" oninput="state.search=this.value; renderTable('${t}')">
 <label>Plant <select class="select" onchange="state.plant=this.value;renderTable('${t}')"><option value="">All</option>${plants.map(p=>`<option ${state.plant===p?"selected":""}>${p}</option>`).join("")}</select></label>
 <label>Status <select class="select" onchange="state.filterStatus=this.value;renderTable('${t}')"><option value="">All</option>${statuses.map(s=>`<option ${state.filterStatus===s?"selected":""}>${s}</option>`).join("")}</select></label>
 <label>Priority <select class="select" onchange="state.priority=this.value;renderTable('${t}')"><option value="">All</option>${priorities.map(s=>`<option ${state.priority===s?"selected":""}>${s}</option>`).join("")}</select></label>
 <button class="btn secondary" onclick="state.search='';state.filterStatus='';state.plant='';state.priority='';renderPage()">Reset</button></div>
 <div id="detailTable"></div>`;
}
function filtered(type){
 let rows=[...all(type)];
 const q=(state.search||"").toLowerCase();
 if(q) rows=rows.filter(r=>Object.values(r).some(v=>String(v).toLowerCase().includes(q)));
 if(state.filterStatus) rows=rows.filter(r=>r.status===state.filterStatus);
 if(state.plant) rows=rows.filter(r=>r.plant===state.plant);
 if(state.priority) rows=rows.filter(r=>r.priority===state.priority);
 return rows;
}
function renderTable(type){
 const rows=filtered(type);
 const msg=rows.length?`<div class="table-wrap"><table class="table"><thead><tr><th>#</th><th>${type} No</th><th>Title</th><th>Plant</th><th>Status</th><th>Priority</th><th>Received Date</th><th>Actions</th></tr></thead><tbody>
 ${rows.slice(0,100).map((r,i)=>`<tr><td>${i+1}</td><td><button class="link" onclick="viewRecord('${type}','${r.id}')">${esc(r.number)}</button></td><td>${esc(r.title)}</td><td>${esc(r.plant)}</td><td>${badge(r.status)}</td><td>${priorityBadge(r.priority)}</td><td>${fmtDate(r.receivedDate)}</td><td>
 <button class="action" title="View" onclick="viewRecord('${type}','${r.id}')">◉</button>
 <button class="action ${r.status!=="Open"?"disabled":""}" ${r.status!=="Open"?"disabled":""} title="${r.status==="Open"?"Edit":"Closed/Rejected cannot be edited here"}" onclick="editRecord('${type}','${r.id}')">✎</button>
 ${state.admin?`<button class="action delete" title="Delete" onclick="deleteRecord('${type}','${r.id}')">🗑</button>`:""}
 </td></tr>`).join("")}</tbody></table></div><div class="subtle" style="padding:12px">Showing ${Math.min(rows.length,100)} of ${rows.length} records</div>`:`<div class="panel empty">No records found. Please check your search or filters.</div>`;
 const el=$("#detailTable"); if(el) el.innerHTML=msg;
}
function viewRecord(type,id){
 const r=all(type).find(x=>x.id===id); if(!r)return;
 $("#modalRoot").innerHTML=`<div class="modal-backdrop" onclick="if(event.target===this)closeModal()"><div class="modal"><div class="modal-head"><div><b>${esc(r.number)}</b><div class="subtle">${esc(type)} record</div></div><button class="close" onclick="closeModal()">×</button></div><div class="modal-body"><div class="form-grid">
 ${Object.entries(r).filter(([k])=>!["id","createdAt"].includes(k)).map(([k,v])=>`<div class="field"><label>${esc(k)}</label><div class="input" style="background:#f7fafc">${esc(v)}</div></div>`).join("")}</div></div></div></div>`;
}
function closeModal(){ $("#modalRoot").innerHTML=""; }

function openEntry(type="ECR", edit=null){
 state.page="entry"; state.activeEntry=type; state.editId=edit; render();
}
function entryPage(){
 const editing=state.editId ? all(state.activeEntry).find(x=>x.id===state.editId) : null;
 const r=editing||{};
 const fields=[
 ["hqNo","HQ EC No","text",true],["number","SIEL EC No","text",true],["receivedDate","EC Received Date","date",true],["title","Title","text",true],
 ["reason","Reason","text",false],["plant","Plant","select",false],["user","Agreement Raise By - User Name","text",false],["team","Agreement Raise By - Team","team",false],
 ["ecrType","ECR Type","text",false],["pendingSince","Pending Since Date","date",false],["status","Status","status",false],["product","Product","text",false],
 ["vendor","Vendor","text",false],["hqPic","HQ PIC","text",false],["runDate","RUN Date","date",false],["approvalWeek","ECR Approval Week","text",false],
 ["localImport","Local/Import","local",false],["pa","PA","text",false],["partcode","Partcode","text",false],["priority","Priority","text",false],["remarks","Remarks","textarea",false]
 ];
 return `<div class="page-title"><div><h1>ECR / ECN Data Entry</h1><p>Add or update ${state.activeEntry} records</p></div></div>
 <div class="tabs"><button class="tab ${state.activeEntry==="ECR"?"active":""}" onclick="state.activeEntry='ECR';state.editId=null;renderPage()">ECR Entry</button><button class="tab ${state.activeEntry==="ECN"?"active":""}" onclick="state.activeEntry='ECN';state.editId=null;renderPage()">ECN Entry</button></div>
 <div class="panel"><form id="entryForm" onsubmit="submitEntry(event)">
 <div class="form-grid">${fields.map(([key,label,type,req])=>fieldHtml(key,label,type,req,r[key])).join("")}</div>
 <div class="form-actions"><button type="button" class="btn secondary" onclick="document.getElementById('entryForm').reset()">Reset</button><button class="btn" type="submit">${editing?"Update":"Add"} ${state.activeEntry}</button></div>
 </form></div>`;
}
function fieldHtml(key,label,type,req,val=""){
 let el="";
 if(type==="select") el=`<select class="select" name="${key}"><option value="">Select Plant</option>${plants.map(x=>`<option ${val===x?"selected":""}>${x}</option>`).join("")}</select>`;
 else if(type==="team") el=`<select class="select" name="${key}"><option value="">Select Team</option>${teams.map(x=>`<option ${val===x?"selected":""}>${x}</option>`).join("")}</select>`;
 else if(type==="status") el=`<select class="select" name="${key}"><option value="">Select Status</option>${statuses.map(x=>`<option ${val===x?"selected":""}>${x}</option>`).join("")}</select>`;
 else if(type==="local") el=`<select class="select" name="${key}"><option value="">Select</option>${["Local","Import","Local & Import Both"].map(x=>`<option ${val===x?"selected":""}>${x}</option>`).join("")}</select>`;
 else if(type==="textarea") el=`<textarea class="textarea" name="${key}">${esc(val)}</textarea>`;
 else el=`<input class="input" name="${key}" type="${type}" value="${esc(val)}">`;
 return `<div class="field ${req?"required":""}"><label>${label}</label>${el}</div>`;
}
function submitEntry(ev){
 ev.preventDefault();
 const fd=new FormData(ev.target), r=Object.fromEntries(fd.entries());
 if(!r.hqNo||!r.number||!r.receivedDate||!r.title){toast("Please fill all mandatory fields","error");return}
 if(!r.status) r.status="Open"; if(!r.priority) r.priority="Medium";
 const list=all(state.activeEntry);
 if(state.editId){const i=list.findIndex(x=>x.id===state.editId);if(i>=0)list[i]={...list[i],...r};}
 else {r.id=uid(state.activeEntry);r.createdAt=new Date().toISOString();list.unshift(r);}
 saveLocal(true); state.editId=null; renderPage();
 maybeSyncExcel();
}
function editRecord(type,id){
 const r=all(type).find(x=>x.id===id); if(!r)return;
 if(!state.admin && r.status!=="Open"){toast("Only Open records can be edited here","error");return}
 openEntry(type,id);
}
function deleteRecord(type,id){
 if(!state.admin){toast("Admin login required","error");return}
 if(!confirm("Delete this record permanently?"))return;
 const list=all(type), i=list.findIndex(x=>x.id===id); if(i>=0){list.splice(i,1);saveLocal();renderPage();maybeSyncExcel();}
}

function teamPage(){
 const rows=teams.map(team=>{
  const er=data.ecr.filter(x=>x.team===team), en=data.ecn.filter(x=>x.team===team);
  return {team,er,en};
 });
 return `<div class="page-title"><div><h1>Team Wise Data</h1><p>Each team maintains their own ECR & ECN data</p></div></div>
 <div class="team-cards">${rows.map(x=>`<div class="team-card" onclick="openTeam('${esc(x.team)}')"><h4>${esc(x.team)}</h4><strong>${x.er.length+x.en.length}</strong><div>ECR: ${x.er.length} · ECN: ${x.en.length}</div></div>`).join("")}</div>
 <div class="panel" style="margin-top:18px"><h3>Team Summary</h3><div class="table-wrap"><table class="table"><thead><tr><th>Team</th><th>Total ECR</th><th>Open</th><th>Closed</th><th>Rejected</th><th>Total ECN</th><th>Open</th><th>Closed</th><th>Rejected</th></tr></thead><tbody>
 ${rows.map(x=>`<tr><td><b>${esc(x.team)}</b></td>${teamCells(x.er,'ECR')}${teamCells(x.en,'ECN')}</tr>`).join("")}</tbody></table></div></div>`;
}
function teamCells(rows,type){const team=rows.length?rows[0].team:"";return `<td><button class="link" onclick="drillTeam('${esc(team)}','', '${type}')">${rows.length}</button></td><td><button class="link" onclick="drillTeam('${esc(team)}','Open','${type}')">${rows.filter(x=>x.status==="Open").length}</button></td><td><button class="link" onclick="drillTeam('${esc(team)}','Closed','${type}')">${rows.filter(x=>x.status==="Closed").length}</button></td><td><button class="link" onclick="drillTeam('${esc(team)}','Rejected','${type}')">${rows.filter(x=>x.status==="Rejected").length}</button></td>`}
function openTeam(team){drillTeam(team,"");}
function drillTeam(team,status,type="ECR"){
 state.page=type.toLowerCase();state.search="";state.plant="";state.priority="";state.filterStatus=status||"";state.teamFilter=team;render();setTimeout(()=>{let rows=filtered(type).filter(x=>x.team===team); const el=$("#detailTable"); if(el) el.innerHTML=teamTable(rows,type,team)},0);
}
function teamTable(rows,type,team){return `<div class="table-wrap"><table class="table"><thead><tr><th>${type} No</th><th>Title</th><th>Team</th><th>Status</th><th>Priority</th><th>Date</th></tr></thead><tbody>${rows.map(r=>`<tr><td><button class="link" onclick="viewRecord('${type}','${r.id}')">${esc(r.number)}</button></td><td>${esc(r.title)}</td><td>${esc(r.team)}</td><td>${badge(r.status)}</td><td>${priorityBadge(r.priority)}</td><td>${fmtDate(r.receivedDate)}</td></tr>`).join("")}</tbody></table></div><div class="subtle" style="padding:12px">${rows.length} ${type} records for ${esc(team)}</div>`}

function adminPage(){
 if(!state.admin) return `<div class="page-title"><div><h1>Admin Panel</h1><p>Manage users, records and system settings</p></div></div><div class="panel login"><h3>Admin Login</h3><form onsubmit="adminLogin(event)" class="login"><div><label>Login ID</label><input class="input" name="u" required></div><div><label>Password</label><input class="input" name="p" type="password" required></div><button class="btn">Login</button></form><p class="subtle">Demo credentials are documented in Config.js / Readme.md.</p></div>`;
 return `<div class="page-title"><div><h1>Admin Panel</h1><p>Manage users, teams, records and system settings</p></div><button class="btn danger" onclick="state.admin=false;render()">Logout</button></div>
 <div class="admin-tabs"><button class="active">User Management</button><button>Team Management</button><button>Settings</button><button>Audit Logs</button></div>
 <div class="panel"><h3>Record Administration</h3><div class="toolbar"><input class="input search" placeholder="Search all records..." oninput="adminSearch(this.value)"><button class="btn secondary" onclick="downloadXLSX()">Download XLSX</button><button class="btn secondary" onclick="downloadCSV()">Download CSV</button><button class="btn" onclick="chooseExcelFile()">Choose Excel File</button></div><div id="adminTable"></div></div>`;
}
function adminSearch(q){let rows=[...data.ecr.map(r=>({...r,_type:"ECR"})),...data.ecn.map(r=>({...r,_type:"ECN"}))].filter(r=>Object.values(r).some(v=>String(v).toLowerCase().includes(q.toLowerCase())));$("#adminTable").innerHTML=`<div class="table-wrap"><table class="table"><thead><tr><th>Type</th><th>No</th><th>Title</th><th>Status</th><th>Actions</th></tr></thead><tbody>${rows.slice(0,200).map(r=>`<tr><td>${r._type}</td><td><button class="link" onclick="viewRecord('${r._type}','${r.id}')">${esc(r.number)}</button></td><td>${esc(r.title)}</td><td>${badge(r.status)}</td><td><button class="action" onclick="editRecord('${r._type}','${r.id}')">✎</button><button class="action delete" onclick="deleteRecord('${r._type}','${r.id}')">🗑</button></td></tr>`).join("")}</tbody></table></div>`}
function adminLogin(ev){ev.preventDefault();const fd=new FormData(ev.target);if(fd.get("u")===C.admin.username&&fd.get("p")===C.admin.password){state.admin=true;toast("Admin login successful","success");render()}else toast("Invalid login credentials","error")}
function reportsPage(){
 const from=state.reportFrom,to=state.reportTo;
 const inRange=r=>(!from||r.receivedDate>=from)&&(!to||r.receivedDate<=to);
 const er=data.ecr.filter(inRange), en=data.ecn.filter(inRange);
 return `<div class="page-title"><div><h1>Reports</h1><p>View and download ECR / ECN reports</p></div></div>
 <div class="panel"><div class="toolbar"><label>From Date<input class="input" type="date" value="${from}" onchange="state.reportFrom=this.value;renderPage()"></label><label>To Date<input class="input" type="date" value="${to}" onchange="state.reportTo=this.value;renderPage()"></label><button class="btn" onclick="renderPage()">Generate</button></div></div>
 <div class="report-cards" style="margin-top:18px">
 ${reportCard("ECR Report",`Overdue / filtered ECR report`,`downloadReportByCurrentRange('ECR')`)}
 ${reportCard("ECN Report",`Overdue / filtered ECN report`,`downloadReportByCurrentRange('ECN')`)}
 ${reportCard("Team Wise Report",`Download team wise report`,`downloadReportByCurrentRange('TEAM')`)}
 ${reportCard("Status Wise Report",`Download status wise report`,`downloadReportByCurrentRange('STATUS')`)}
 </div>
 <div class="panel" style="margin-top:18px"><h3>Quick Statistics</h3><div class="grid3"><div><b>Total ECR</b><h2>${er.length}</h2></div><div><b>Total ECN</b><h2>${en.length}</h2></div><div><b>Open / Closed / Rejected</b><h2>${er.filter(x=>x.status==="Open").length} / ${er.filter(x=>x.status==="Closed").length} / ${er.filter(x=>x.status==="Rejected").length}</h2></div></div></div>`;
}
function reportCard(title,desc,action){return `<div class="report-card"><h3>${title}</h3><p class="subtle">${desc}</p><button class="btn secondary" onclick="${action}">Excel</button></div>`}
function settingsPage(){return `<div class="page-title"><div><h1>Settings</h1><p>Configure application preferences</p></div></div><div class="panel"><h3>Application Settings</h3><div class="form-grid"><div class="field"><label>Application Name</label><input class="input" value="${esc(C.appName)}"></div><div class="field"><label>Records Per Page</label><select class="select"><option>10</option><option>25</option><option>50</option></select></div><div class="field"><label>Date Format</label><select class="select"><option>DD MMM YYYY</option><option>DD/MM/YYYY</option></select></div></div><p class="subtle">Data is persisted in this browser. Use Reports/Admin to export the latest data.</p></div>`}

function renderPage(){
 const c=$("#content"); if(!c)return;
 state.plant ||= ""; state.priority ||= ""; state.filterStatus ||= "";
 if(state.page==="dashboard") c.innerHTML=dashboard();
 else if(state.page==="ecr"){c.innerHTML=details("ECR");setTimeout(()=>renderTable("ECR"),0)}
 else if(state.page==="ecn"){c.innerHTML=details("ECN");setTimeout(()=>renderTable("ECN"),0)}
 else if(state.page==="team") c.innerHTML=teamPage();
 else if(state.page==="entry") c.innerHTML=entryPage();
 else if(state.page==="admin"){c.innerHTML=adminPage();if(state.admin)setTimeout(()=>adminSearch(""),0)}
 else if(state.page==="reports") c.innerHTML=reportsPage();
 else if(state.page==="settings") c.innerHTML=settingsPage();
}
function go(page){state.page=page;state.search="";state.filterStatus="";state.plant="";state.priority="";state.teamFilter="";render()}
function refreshData(){render();toast("Dashboard refreshed","success")}
function toast(msg,type=""){const t=$("#toast");t.textContent=msg;t.className=`toast show ${type}`;setTimeout(()=>t.className="toast",2400)}
function openEntryFromDashboard(type){openEntry(type)}
function openECN(){openEntry("ECN")}
function openECR(){openEntry("ECR")}

function exportRows(rows,sheetName="Data"){
 const headers=["number","hqNo","receivedDate","title","reason","plant","user","team","ecrType","pendingSince","status","product","vendor","hqPic","runDate","approvalWeek","localImport","pa","partcode","remarks","priority"];
 return rows.map(r=>Object.fromEntries(headers.map(h=>[h,r[h]??""])));
}
function downloadXLSX(){
 if(typeof XLSX==="undefined"){toast("Excel library not loaded. Check internet connection.","error");return}
 const wb=XLSX.utils.book_new();
 XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(exportRows(data.ecr)),"ECR");
 XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(exportRows(data.ecn)),"ECN");
 XLSX.writeFile(wb,"ecrdata.xlsx");toast("Updated XLSX downloaded","success");
}
function csvText(rows){const a=exportRows(rows);if(!a.length)return "";const h=Object.keys(a[0]);return [h.join(","),...a.map(r=>h.map(k=>`"${String(r[k]??"").replaceAll('"','""')}"`).join(","))].join("\n")}
function downloadCSV(){
 const text=csvText([...data.ecr.map(x=>({...x,type:"ECR"})),...data.ecn.map(x=>({...x,type:"ECN"}))]);downloadBlob(text,"ecrdata.csv","text/csv");toast("CSV downloaded","success")
}
function downloadBlob(text,name,type){const b=new Blob([text],{type});const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function downloadType(type,rows){if(typeof XLSX!=="undefined"){const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(exportRows(rows)),type);XLSX.writeFile(wb,`${type.toLowerCase()}_report.xlsx`)}else downloadBlob(csvText(rows),`${type.toLowerCase()}_report.csv`,"text/csv")}
function downloadReportByCurrentRange(kind){
 const inRange=r=>(!state.reportFrom||r.receivedDate>=state.reportFrom)&&(!state.reportTo||r.receivedDate<=state.reportTo);
 const er=data.ecr.filter(inRange), en=data.ecn.filter(inRange);
 if(kind==="ECR") return downloadType("ECR",er);
 if(kind==="ECN") return downloadType("ECN",en);
 if(kind==="TEAM") return downloadTeamReport(er,en);
 if(kind==="STATUS") return downloadStatusReport(er,en);
}
function downloadTeamReport(er,en){
 const rows=[...er.map(r=>({...r,reportType:"ECR"})),...en.map(r=>({...r,reportType:"ECN"}))];
 if(typeof XLSX!=="undefined"){const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(rows),"Team Wise");XLSX.writeFile(wb,"team_wise_report.xlsx")}
 else downloadBlob(csvText(rows),"team_wise_report.csv","text/csv");
}
function downloadStatusReport(er,en){const rows=[...er,...en];const out=[];["Open","Closed","Rejected"].forEach(s=>out.push({Status:s,ECR:er.filter(x=>x.status===s).length,ECN:en.filter(x=>x.status===s).length}));downloadBlob(out.map(r=>Object.values(r).join(",")).join("\n"),"status_wise_report.csv","text/csv")}
async function chooseExcelFile(){
 if(!window.showSaveFilePicker){toast("File System Access API is not supported. Use Download XLSX.","error");return}
 try{state.excelHandle=await showSaveFilePicker({suggestedName:"ecrdata.xlsx",types:[{description:"Excel Workbook",accept:{"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":[".xlsx"]}}]});await writeExcelHandle();toast("Excel file connected","success")}catch(e){}
}
async function writeExcelHandle(){
 if(!state.excelHandle||typeof XLSX==="undefined")return;
 const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(exportRows(data.ecr)),"ECR");XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(exportRows(data.ecn)),"ECN");
 const arr=XLSX.write(wb,{bookType:"xlsx",type:"array"});const w=await state.excelHandle.createWritable();await w.write(arr);await w.close();
}
async function maybeSyncExcel(){if(C.autoDownloadExcelOnSave)downloadXLSX();if(state.excelHandle)try{await writeExcelHandle();}catch(e){toast("Could not update connected Excel file","error")}}

document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal()});
render();
