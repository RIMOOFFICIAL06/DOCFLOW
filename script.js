/* ===============================
   AccrediFlow Frontend Script
   Handles navigation, signup, login,
   superadmin approval, and logout
   =============================== */

// Load saved users from localStorage
let users = JSON.parse(localStorage.getItem("users")) || [];

// Save users to localStorage
function saveUsers() {
  localStorage.setItem("users", JSON.stringify(users));
}

// Show only selected sections
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

// === Navigation helpers ===
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

// === Signup ===
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
    approved: false
  };

  users.push(institute);
  saveUsers();   // ✅ persist in localStorage

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

  const headerFrag = document.getElementById("dashboardHeader").content.cloneNode(true);
  document.getElementById("adminHeader").appendChild(headerFrag);
  showOnly(["adminDashboard"]);

  // Update nav buttons
  document.getElementById("navAuthBtn").textContent = "Logout";
  document.getElementById("navAuthBtn").setAttribute("onclick","logout()");
  document.getElementById("navAuthBtn").classList.remove("hidden");

  document.getElementById("mobileAuthBtn").textContent = "Logout";
  document.getElementById("mobileAuthBtn").setAttribute("onclick","logout()");
  document.getElementById("mobileAuthBtn").classList.remove("hidden");
}

// === Superadmin Dashboard ===
function showSuperadmin() {
  const headerFrag = document.getElementById("dashboardHeader").content.cloneNode(true);
  document.getElementById("superadminHeader").appendChild(headerFrag);
  showOnly(["superadminDashboard"]);

  const list = document.getElementById("pendingList");
  list.innerHTML = "";

  users.forEach((u, index) => {
    if (!u.approved) {
      const div = document.createElement("div");
      div.className = "p-4 bg-white/10 rounded-md flex justify-between items-center";
      div.innerHTML = `
        <div>
          <p class="font-semibold">${u.name} (${u.type})</p>
          <p class="text-sm text-white/70">${u.adminEmail}</p>
        </div>
        <button onclick="approveInstitute(${index})" 
          class="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-black rounded-md font-semibold">
          Approve
        </button>
      `;
      list.appendChild(div);
    }
  });
}

// Approve institute signup
function approveInstitute(index) {
  users[index].approved = true;
  saveUsers();   // ✅ persist in localStorage
  alert(users[index].name + " has been approved!");
  showSuperadmin();
}

// === Logout ===
function logout() {
  showOnly(["landing"]);
  document.getElementById("navAuthBtn").classList.add("hidden");
  document.getElementById("mobileAuthBtn").classList.add("hidden");
}
