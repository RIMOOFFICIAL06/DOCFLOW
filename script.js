/* ===============================
   AccrediFlow Frontend Script (MVP)
   Single-file version: localStorage-based demo
   =============================== */

// --------- persisted app state ----------
let users = JSON.parse(localStorage.getItem("users")) || [];
function saveUsers() { localStorage.setItem("users", JSON.stringify(users)); }

let docs = JSON.parse(localStorage.getItem("docs")) || [];
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let notes = JSON.parse(localStorage.getItem("notes")) || [];
let admins = JSON.parse(localStorage.getItem("admins")) || [];

function saveAll() {
  saveUsers();
  localStorage.setItem("docs", JSON.stringify(docs));
  localStorage.setItem("tasks", JSON.stringify(tasks));
  localStorage.setItem("notes", JSON.stringify(notes));
  localStorage.setItem("admins", JSON.stringify(admins));
}

// --------- helpers ----------
const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toISOString();
const STATUS = { PENDING: "Pending", APPROVED: "Approved", REJECTED: "Rejected" };
let currentUser = null;

function notify(userEmail, message) {
  notes.push({ id: uid(), userEmail, message, time: now(), read: false });
  saveAll();
}

// --------- simple UI visibility ----------
function showOnly(idsToShow = []) {
  const sections = [
    "landing",
    "login",
    "signup",
    "adminDashboard",
    "coordinatorDashboard",
    "hodDashboard",
    "facultyDashboard",
    "superadminDashboard"
  ];

  sections.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (idsToShow.includes(id)) el.classList.remove("hidden");
    else el.classList.add("hidden");
  });

  // Clear old dashboard headers
  ["adminHeader","coordHeader","hodHeader","facultyHeader","superadminHeader"].forEach(h => {
    const node = document.getElementById(h);
    if (node) node.replaceChildren();
  });
}

// ---------- Navigation helpers ----------
function showLogin() {
  showOnly(["login"]);
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function showSignup() {
  showOnly(["signup"]);
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function backToLanding() {
  showOnly(["landing"]);
}

// === Signup (Institute) ===
function handleSignup(e) {
  e.preventDefault();

  const institute = {
    name: document.getElementById("instituteName").value,
    type: document.getElementById("instituteType").value,
    accreditation: document.getElementById("accreditationBody").value,
    emailDomain: document.getElementById("emailDomain").value,
    adminName: document.getElementById("adminName").value,
    adminEmail: document.getElementById("adminEmail").value,
    adminPhone: document.getElementById("adminPhone").value,
    password: document.getElementById("signupPassword").value,
    approved: false,   // requires superadmin approval
    role: null
  };

  users.push(institute);
  saveUsers();

  alert("Signup submitted! Please wait for approval by Superadmin.");
  backToLanding();
}

// === Login ===
function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const pwd = document.getElementById("password").value;
  const role = document.getElementById("role").value;

  const user = users.find(u => u.adminEmail === email && u.password === pwd);
  if (!user) {
    alert("Invalid email or password.");
    return;
  }
  if (!user.approved) {
    alert("Your signup is pending approval. Please wait for Superadmin approval.");
    return;
  }
  if (role !== "admin") {
    alert("Only Admin login is enabled for MVP.");
    return;
  }

  currentUser = user;

  // set nav buttons
  const nav = document.getElementById("navAuthBtn");
  nav.textContent = "Logout";
  nav.setAttribute("onclick","logout()");
  nav.classList.remove("hidden");

  const mob = document.getElementById("mobileAuthBtn");
  mob.textContent = "Logout";
  mob.setAttribute("onclick","logout()");
  mob.classList.remove("hidden");

  enterAdmin();
}

// --------- Sidebar builder ----------
function mountSidebar(elId, items) {
  const host = document.getElementById(elId);
  host.replaceChildren();
  const frag = document.getElementById("sidebarTemplate").content.cloneNode(true);
  const nav = frag.querySelector("#sidebarNav");
  items.forEach(i => {
    const a = document.createElement("button");
    a.className = "w-full text-left px-3 py-2 rounded-md hover:bg-white/10";
    a.textContent = i.label;
    a.onclick = i.onClick;
    nav.appendChild(a);
  });
  host.appendChild(frag);
}

// --------- Superadmin (Approve / Overview) ----------
function showSuperadmin() {
  const headerFrag = document.getElementById("dashboardHeader").content.cloneNode(true);
  document.getElementById("superadminHeader").appendChild(headerFrag);
  showOnly(["superadminDashboard"]);

  mountSidebar("superadminSidebar", [
    { label:"Pending Requests", onClick: renderSA_Pending },
    { label:"Admins", onClick: renderSA_Admins },
    { label:"System Overview", onClick: renderSA_Overview },
  ]);
  renderSA_Pending();
}

function renderSA_Pending() {
  const c = document.getElementById("superadminContent");
  c.innerHTML = `<h2 class="text-2xl font-semibold mb-4">Pending Admin Requests</h2>`;
  const wrap = document.createElement("div");
  wrap.className = "space-y-3";

  users.forEach((u, i) => {
    if (!u.approved) {
      const div = document.createElement("div");
      div.className = "p-4 bg-white/10 rounded-md flex justify-between items-center";
      div.innerHTML = `
        <div>
          <p class="font-semibold">${escapeHtml(u.name)} (${escapeHtml(u.type)})</p>
          <p class="text-sm text-white/70">${escapeHtml(u.adminEmail)}</p>
        </div>
        <div class="flex gap-2">
          <button class="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-black rounded-md font-semibold" onclick="approveInstitute(${i})">Approve</button>
          <button class="px-3 py-1 rounded-md border border-white/20" onclick="rejectInstitute(${i})">Reject</button>
        </div>`;
      wrap.appendChild(div);
    }
  });

  if (!wrap.children.length) wrap.innerHTML = `<div class="text-white/70">No pending requests.</div>`;
  c.appendChild(wrap);
}

function renderSA_Admins() {
  const c = document.getElementById("superadminContent");
  c.innerHTML = `<h2 class="text-2xl font-semibold mb-4">Active Admins</h2>`;
  const wrap = document.createElement("div"); wrap.className = "space-y-3";
  admins.forEach((a, idx) => {
    const row = document.createElement("div");
    row.className = "p-4 bg-white/10 rounded-md flex items-center justify-between";
    row.innerHTML = `
      <div>
        <div class="font-semibold">${escapeHtml(a.adminName)}</div>
        <div class="text-white/70 text-sm">${escapeHtml(a.adminEmail)}</div>
      </div>
      <button class="px-3 py-1 rounded-md border border-white/20" onclick="revokeAdmin(${idx})">Revoke</button>`;
    wrap.appendChild(row);
  });
  if (!wrap.children.length) wrap.innerHTML = `<div class="text-white/70">No active admins.</div>`;
  c.appendChild(wrap);
}

function renderSA_Overview() {
  const c = document.getElementById("superadminContent");
  const counts = {
    admins: admins.length,
    hods: users.filter(u => u.role === "hod" && u.approved).length,
    faculty: users.filter(u => u.role === "faculty" && u.approved).length,
    docs: docs.length,
    pending: docs.filter(d => d.status === STATUS.PENDING).length,
    approved: docs.filter(d => d.status === STATUS.APPROVED).length,
    rejected: docs.filter(d => d.status === STATUS.REJECTED).length
  };
  c.innerHTML = `
    <h2 class="text-2xl font-semibold mb-4">System Overview</h2>
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      ${Object.entries(counts).map(([k,v])=>`
        <div class="p-4 rounded-lg bg-white/10">
          <div class="text-white/70 text-sm">${k.toUpperCase()}</div>
          <div class="text-3xl font-bold">${v}</div>
        </div>`).join("")}
    </div>`;
}

// actions
function approveInstitute(index) {
  users[index].approved = true;
  users[index].role = "admin";
  admins.push(users[index]);
  saveAll();
  notify(users[index].adminEmail, "Your admin account was approved.");
  renderSA_Pending();
}
function rejectInstitute(index) {
  const email = users[index].adminEmail;
  users.splice(index,1);
  saveAll();
  notify(email, "Your admin signup was rejected.");
  renderSA_Pending();
}
function revokeAdmin(idx) {
  const email = admins[idx].adminEmail;
  admins.splice(idx,1);
  const u = users.find(x=>x.adminEmail===email); if (u) { u.approved=false; u.role=null; }
  saveAll();
  notify(email, "Your admin access was revoked.");
  renderSA_Admins();
}

// ---------- Admin Dashboard ----------
function enterAdmin() {
  const headerFrag = document.getElementById("dashboardHeader").content.cloneNode(true);
  document.getElementById("adminHeader").appendChild(headerFrag);
  showOnly(["adminDashboard"]);
  mountSidebar("adminSidebar", [
    { label:"Manage HODs", onClick: renderAD_HODs },
    { label:"Upload Institute Docs", onClick: renderAD_Uploads },
    { label:"Track Status", onClick: renderAD_Status },
    { label:"Notifications", onClick: renderAD_Notes },
  ]);
  renderAD_HODs();
}

function renderAD_HODs() {
  const c = document.getElementById("adminContent");
  c.innerHTML = `
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-2xl font-semibold">Manage HOD Accounts</h2>
      <button class="px-3 py-2 rounded-md bg-cyan-500 text-black font-semibold" onclick="openCreateHOD()">Create HOD</button>
    </div>
    <div id="hodList" class="space-y-3"></div>`;
  const list = document.getElementById("hodList");
  const hods = users.filter(u => u.role === "hod");
  hods.forEach((h, i) => {
    const row = document.createElement("div");
    row.className="p-4 bg-white/10 rounded-md flex justify-between";
    row.innerHTML = `
      <div>
        <div class="font-semibold">${escapeHtml(h.adminName||h.name)}</div>
        <div class="text-white/70 text-sm">${escapeHtml(h.adminEmail||h.email)}</div>
      </div>
      <div class="flex gap-2">
        <button class="px-3 py-1 rounded-md border border-white/20" onclick="deactivateHOD('${escapeJs(h.adminEmail||h.email)}')">Deactivate</button>
      </div>`;
    list.appendChild(row);
  });
  if (!hods.length) list.innerHTML = `<div class="text-white/70">No HODs found. Create one above.</div>`;
}
function openCreateHOD(){
  const name = prompt("HOD full name:");
  if(!name) return alert("Cancelled.");
  const email = prompt("HOD email:");
  if(!email) return alert("Cancelled.");
  const pass = prompt("Set password for HOD:");
  if(!pass) return alert("Cancelled.");
  const hod = { name, adminName: name, adminEmail: email, adminPhone: "", password: pass, approved: true, role: "hod", type: "department" };
  users.push(hod);
  saveAll();
  alert("HOD created.");
  renderAD_HODs();
}
function deactivateHOD(email){
  const h = users.find(u=> (u.adminEmail||u.email) === email );
  if (h) { h.approved=false; saveAll(); renderAD_HODs(); }
}

function renderAD_Uploads(){
  const c=document.getElementById("adminContent");
  c.innerHTML = `
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-2xl font-semibold">Upload Institute-level Documents</h2>
      <button class="px-3 py-2 rounded-md bg-cyan-500 text-black font-semibold" onclick="openModal(currentUser?.adminEmail || 'admin')">New Upload</button>
    </div>
    <div>${tableDocs(docs.filter(d=>!d.department))}</div>`;
}
function renderAD_Status(){
  const c=document.getElementById("adminContent");
  c.innerHTML = `
    <h2 class="text-2xl font-semibold mb-4">Document Status Overview</h2>
    ${tableDocs(docs)}`;
}
function renderAD_Notes(){
  const c=document.getElementById("adminContent");
  const my = notes.slice().reverse().slice(0,50);
  c.innerHTML = `<h2 class="text-2xl font-semibold mb-4">Notifications</h2>
    <div class="space-y-2">${my.map(n=>`<div class="p-3 bg-white/10 rounded-md">
      <div class="text-sm text-white/70">${new Date(n.time).toLocaleString()}</div>
      <div>${escapeHtml(n.message)}</div>
    </div>`).join("")||'<div class="text-white/70">No notifications.</div>'}</div>`;
}

// ---------- Shared document table + modal ----------
function badgeHTML(s){
  if (s === STATUS.APPROVED) return `<span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-500/20 text-green-300">${s}</span>`;
  if (s === STATUS.REJECTED) return `<span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-red-500/20 text-red-300">${s}</span>`;
  return `<span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-yellow-500/20 text-yellow-300">${s}</span>`;
}

function tableDocs(rows){
  if(!rows.length) return `<div class="text-white/70">No documents.</div>`;
  return `<div class="overflow-x-auto border border-white/10 rounded-lg">
    <table class="min-w-full text-sm">
      <thead class="bg-white/5">
        <tr>
          <th class="text-left p-3">Title</th>
          <th class="text-left p-3">Category</th>
          <th class="text-left p-3">Dept</th>
          <th class="text-left p-3">Owner</th>
          <th class="text-left p-3">Status</th>
          <th class="text-left p-3">Actions</th>
        </tr>
      </thead>
      <tbody>
      ${rows.map(r=>`
        <tr class="border-t border-white/10">
          <td class="p-3">${escapeHtml(r.title)}</td>
          <td class="p-3">${escapeHtml(r.category)}</td>
          <td class="p-3">${escapeHtml(r.department||"-")}</td>
          <td class="p-3">${escapeHtml(r.ownerEmail)}</td>
          <td class="p-3">${badgeHTML(r.status)}</td>
          <td class="p-3 space-x-2">
            <button class="px-2 py-1 rounded-md border border-white/20" onclick="approveDoc('${r.id}')">Approve</button>
            <button class="px-2 py-1 rounded-md border border-white/20" onclick="rejectDoc('${r.id}')">Reject</button>
          </td>
        </tr>`).join("")}
      </tbody>
    </table>
  </div>`;
}

function openModal(ownerEmail){
  // clone & append modal
  const frag = document.getElementById("uploadModalTemplate").content.cloneNode(true);
  document.body.appendChild(frag);
  const modals = document.querySelectorAll(".upload-modal");
  const modal = modals[modals.length - 1];
  const form = modal.querySelector("form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = modal.querySelector("#docTitle").value;
    const category = modal.querySelector("#docCategory").value;
    const department = modal.querySelector("#docDept").value || null;
    const remarks = modal.querySelector("#docRemarks").value || "";
    const fileName = modal.querySelector("#docFileName").value;

    const d = {
      id: uid(),
      title, category, department,
      remarks, fileName,
      ownerEmail: ownerEmail || (currentUser && currentUser.adminEmail) || "unknown",
      status: STATUS.PENDING,
      uploadedAt: now(),
      history: [{ at: now(), action: "Uploaded", by: ownerEmail || (currentUser && currentUser.adminEmail) || "unknown" }]
    };
    docs.push(d); saveAll();
    notify(d.ownerEmail, `Uploaded: ${d.title}`);
    closeModal();
    refreshDocTables();
  });
}

function closeModal(){
  const modals = document.querySelectorAll(".upload-modal");
  if (modals.length) {
    const last = modals[modals.length - 1];
    last.remove();
  }
}

function approveDoc(id){
  const d = docs.find(x=>x.id===id); if(!d) return;
  d.status = STATUS.APPROVED;
  d.history.push({ at: now(), action: "Approved", by: currentUser ? currentUser.adminEmail : "system" });
  saveAll(); refreshDocTables();
}
function rejectDoc(id){
  const d = docs.find(x=>x.id===id); if(!d) return;
  d.status = STATUS.REJECTED;
  d.history.push({ at: now(), action: "Rejected", by: currentUser ? currentUser.adminEmail : "system" });
  saveAll(); refreshDocTables();
}

function refreshDocTables() {
  if (!document.getElementById("adminDashboard").classList.contains("hidden")) renderAD_Status();
  if (!document.getElementById("coordinatorDashboard").classList.contains("hidden")) renderIQAC_Review();
  if (!document.getElementById("hodDashboard").classList.contains("hidden")) renderHOD_Status();
  if (!document.getElementById("facultyDashboard").classList.contains("hidden")) renderFAC_Mine();
}

// ---------- Faculty ----------
function enterFaculty(){
  const headerFrag = document.getElementById("dashboardHeader").content.cloneNode(true);
  document.getElementById("facultyHeader").appendChild(headerFrag);
  showOnly(["facultyDashboard"]);
  mountSidebar("facultySidebar", [
    { label:"Upload Docs", onClick: renderFAC_Upload },
    { label:"My Submissions", onClick: renderFAC_Mine },
    { label:"Notifications", onClick: renderFAC_Notes },
  ]);
  renderFAC_Upload();
}
function renderFAC_Upload(){
  const c=document.getElementById("facultyContent");
  c.innerHTML=`
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-2xl font-semibold">Upload Documents</h2>
      <button class="px-3 py-2 rounded-md bg-cyan-500 text-black font-semibold" onclick="openModal((currentUser && currentUser.adminEmail) || 'faculty')">New Upload</button>
    </div>
    <div class="text-white/70">Use "New Upload" to simulate file submission.</div>`;
}
function renderFAC_Mine(){
  const c=document.getElementById("facultyContent");
  const my = docs.filter(d=>d.ownerEmail === ((currentUser && currentUser.adminEmail) || "faculty"));
  c.innerHTML=`<h2 class="text-2xl font-semibold mb-4">My Submissions</h2>${tableDocs(my)}`;
}
function renderFAC_Notes(){
  const c=document.getElementById("facultyContent");
  const my=notes.filter(n=>n.userEmail===((currentUser && currentUser.adminEmail) || "faculty")).reverse();
  c.innerHTML=`<h2 class="text-2xl font-semibold mb-4">Notifications</h2>
  <div class="space-y-2">${my.map(n=>`<div class="p-3 bg-white/10 rounded-md">${escapeHtml(n.message)}</div>`).join("")||'<div class="text-white/70">No notifications.</div>'}</div>`;
}

// ---------- HOD ----------
function enterHOD(){
  const headerFrag = document.getElementById("dashboardHeader").content.cloneNode(true);
  document.getElementById("hodHeader").appendChild(headerFrag);
  showOnly(["hodDashboard"]);
  mountSidebar("hodSidebar", [
    { label:"Assign Tasks", onClick: renderHOD_Tasks },
    { label:"Approve Faculty Uploads", onClick: renderHOD_Approve },
    { label:"Upload Dept Docs", onClick: renderHOD_Upload },
    { label:"Status Overview", onClick: renderHOD_Status },
  ]);
  renderHOD_Tasks();
}
function renderHOD_Tasks(){
  const c=document.getElementById("hodContent");
  c.innerHTML=`<h2 class="text-2xl font-semibold mb-4">Assign Faculty Upload Tasks</h2>
    <div class="text-white/70">MVP: Use "Create HOD" from Admin to add HODs and use Faculty uploads for tasks.</div>`;
}
function renderHOD_Approve(){
  const c=document.getElementById("hodContent");
  const facDocs = docs.filter(d=>d.ownerEmail !== (currentUser && currentUser.adminEmail));
  c.innerHTML=`<h2 class="text-2xl font-semibold mb-4">Approve Faculty Uploads</h2>${tableDocs(facDocs)}`;
}
function renderHOD_Upload(){
  const c=document.getElementById("hodContent");
  c.innerHTML=`<div class="flex items-center justify-between mb-4">
    <h2 class="text-2xl font-semibold">Upload Department-level Docs</h2>
    <button class="px-3 py-2 rounded-md bg-cyan-500 text-black font-semibold" onclick="openModal((currentUser && currentUser.adminEmail) || 'hod')">New Upload</button>
  </div>`;
}
function renderHOD_Status(){
  const c=document.getElementById("hodContent");
  const deptDocs = docs.filter(d=>d.department);
  c.innerHTML=`<h2 class="text-2xl font-semibold mb-4">Department Document Status</h2>${tableDocs(deptDocs)}`;
}

// ---------- IQAC / Coordinator ----------
function showCoordinator(){
  const headerFrag = document.getElementById("dashboardHeader").content.cloneNode(true);
  document.getElementById("coordHeader").appendChild(headerFrag);
  showOnly(["coordinatorDashboard"]);
  mountSidebar("coordinatorSidebar", [
    { label:"Review Submissions", onClick: renderIQAC_Review },
    { label:"Generate Reports (CSV)", onClick: renderIQAC_Report },
    { label:"Forward to External", onClick: renderIQAC_Forward },
  ]);
  renderIQAC_Review();
}
function renderIQAC_Review(){
  const c=document.getElementById("coordinatorContent");
  c.innerHTML=`<h2 class="text-2xl font-semibold mb-4">Review Submissions</h2>${tableDocs(docs)}`;
}
function renderIQAC_Report(){
  const c=document.getElementById("coordinatorContent");
  c.innerHTML=`<div class="flex items-center justify-between mb-4">
    <h2 class="text-2xl font-semibold">Generate CSV Report</h2>
    <button class="px-3 py-2 rounded-md bg-cyan-500 text-black font-semibold" onclick="downloadCSV()">Download CSV</button>
  </div>`;
}
function renderIQAC_Forward(){
  const c=document.getElementById("coordinatorContent");
  c.innerHTML=`<h2 class="text-2xl font-semibold mb-2">Forward to External Authority</h2>
    <div class="text-white/70">MVP: Mark Approved docs as "Ready for Submission" (simulated).</div>
    <button class="mt-3 px-3 py-2 rounded-md border border-white/20" onclick="alert('Forwarded (simulated).')">Forward</button>`;
}
function downloadCSV(){
  const headers = ["title","category","department","ownerEmail","status","uploadedAt","fileName"];
  const rows = docs.map(d => headers.map(h => (d[h]??"").toString().replace(/,/g," ")).join(","));
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], {type:"text/csv"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "accrediflow_report.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}

// ---------- Utility & session ----------
function logout(){
  currentUser = null;
  showOnly(["landing"]);
  document.getElementById("navAuthBtn").classList.add("hidden");
  document.getElementById("mobileAuthBtn").classList.add("hidden");
}

// Small safety helpers (escape user text for HTML)
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function escapeJs(str) {
  if (!str) return "";
  return String(str).replace(/'/g, "\\'");
}
