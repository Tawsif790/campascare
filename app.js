// CampusCare - Complete Auth & App Logic

const KEY = "campuscare_issues";
const USERS_KEY = "campuscare_users";
const SESSION_KEY = "campuscare_session";

let issues = loadIssues();
let currentUser = null;

// ---------- Storage Functions ----------
function loadIssues() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; }
}
function saveIssues() {
  localStorage.setItem(KEY, JSON.stringify(issues));
}
function loadUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; } catch (e) { return []; }
}
function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// ---------- Authentication Logic ----------
function register() {
  const user = document.getElementById("reg-user").value.trim();
  const pass = document.getElementById("reg-pass").value;
  const role = document.getElementById("reg-role").value;
  const errorEl = document.getElementById("reg-error");

  if (!user || !pass) {
    errorEl.textContent = "Please fill in all fields.";
    errorEl.style.display = "block";
    return;
  }

  let users = loadUsers();
  if (users.find(u => u.username.toLowerCase() === user.toLowerCase())) {
    errorEl.textContent = "Username already exists. Try another.";
    errorEl.style.display = "block";
    return;
  }

  // Save new user
  users.push({ username: user, password: pass, role: role });
  saveUsers(users);
  
  // Clear form and switch to login
  document.getElementById("reg-user").value = "";
  document.getElementById("reg-pass").value = "";
  errorEl.style.display = "none";
  
  alert("Account created successfully! Please login.");
  toggleAuthScreen('login');
}

function login() {
  const user = document.getElementById("login-user").value.trim();
  const pass = document.getElementById("login-pass").value;
  const role = document.getElementById("login-role").value;
  const errorEl = document.getElementById("login-error");

  if (!user || !pass) {
    errorEl.textContent = "Please enter username and password.";
    errorEl.style.display = "block";
    return;
  }

  const users = loadUsers();
  const validUser = users.find(u => 
    u.username.toLowerCase() === user.toLowerCase() && 
    u.password === pass && 
    u.role === role
  );

  if (!validUser) {
    errorEl.textContent = "Invalid credentials or wrong role selected.";
    errorEl.style.display = "block";
    return;
  }

  // Success
  errorEl.style.display = "none";
  currentUser = validUser;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
  showApp();
}

function logout() {
  currentUser = null;
  sessionStorage.removeItem(SESSION_KEY);
  document.getElementById("login-user").value = "";
  document.getElementById("login-pass").value = "";
  document.getElementById("app-screen").style.display = "none";
  toggleAuthScreen('login');
}

function loadSession() {
  const session = sessionStorage.getItem(SESSION_KEY);
  if (session) {
    currentUser = JSON.parse(session);
    showApp();
  } else {
    toggleAuthScreen('login');
  }
}

function toggleAuthScreen(type) {
  document.getElementById("login-screen").style.display = "flex";
  document.getElementById("app-screen").style.display = "none";
  
  if (type === 'login') {
    document.getElementById("login-form-container").style.display = "block";
    document.getElementById("register-form-container").style.display = "none";
  } else {
    document.getElementById("login-form-container").style.display = "none";
    document.getElementById("register-form-container").style.display = "block";
  }
}

function showApp() {
  document.getElementById("login-screen").style.display = "none";
  document.getElementById("app-screen").style.display = "block";
  
  document.getElementById("current-user-display").textContent = currentUser.username;
  document.getElementById("current-role-display").textContent = `(${currentUser.role.toUpperCase()})`;
  document.getElementById("name").value = currentUser.username;

  // Role UI Adjustments
  const adminElements = document.querySelectorAll(".admin-only");
  if (currentUser.role === "teacher") {
    adminElements.forEach(el => el.style.display = "flex");
  } else {
    adminElements.forEach(el => el.style.display = "none");
  }

  render();
}

// ---------- Event Listeners (Auth) ----------
document.getElementById("btn-login").addEventListener("click", login);
document.getElementById("btn-register").addEventListener("click", register);
document.getElementById("btn-logout").addEventListener("click", logout);
document.getElementById("show-register").addEventListener("click", (e) => { e.preventDefault(); toggleAuthScreen('register'); });
document.getElementById("show-login").addEventListener("click", (e) => { e.preventDefault(); toggleAuthScreen('login'); });

// ---------- App Elements ----------
const form = document.getElementById("issue-form");
const list = document.getElementById("list");
const empty = document.getElementById("empty");
const stats = document.getElementById("stats");
const search = document.getElementById("search");
const filter = document.getElementById("filter");

// ---------- App Actions ----------
form.addEventListener("submit", (e) => {
  e.preventDefault();
  issues.unshift({
    id: Date.now(),
    name: currentUser.username,
    title: document.getElementById("title").value.trim(),
    category: document.getElementById("category").value,
    priority: document.getElementById("priority").value,
    location: document.getElementById("location").value.trim(),
    description: document.getElementById("description").value.trim(),
    status: "Pending",
    date: new Date().toLocaleDateString()
  });
  saveIssues();
  form.reset();
  document.getElementById("name").value = currentUser.username; 
  render();
});

function updateStatus(id, status) {
  if (currentUser.role !== "teacher") return; // Double check security
  const issue = issues.find((i) => i.id === id);
  if (issue) issue.status = status;
  saveIssues();
  render();
}

function removeIssue(id) {
  if (currentUser.role !== "teacher") return;
  if (!confirm("Delete this report?")) return;
  issues = issues.filter((i) => i.id !== id);
  saveIssues();
  render();
}

document.getElementById("clear").addEventListener("click", () => {
  if (currentUser.role !== "teacher") return;
  if (issues.length && confirm("Delete ALL reports? This cannot be undone.")) {
    issues = [];
    saveIssues();
    render();
  }
});

document.getElementById("export").addEventListener("click", () => {
  if (currentUser.role !== "teacher") return;
  const blob = new Blob([JSON.stringify(issues, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "campuscare-data.json";
  a.click();
  URL.revokeObjectURL(a.href);
});

search.addEventListener("input", render);
filter.addEventListener("change", render);

// ---------- Display Functions ----------
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text; 
  return node;
}

function renderStats() {
  const count = (s) => issues.filter((i) => i.status === s).length;
  const data = [
    ["Total", issues.length],
    ["Pending", count("Pending")],
    ["In progress", count("In progress")],
    ["Resolved", count("Resolved")]
  ];
  stats.replaceChildren(
    ...data.map(([label, n]) => {
      const box = el("div", "stat");
      box.append(el("b", "", n), el("span", "", label));
      return box;
    })
  );
}

function renderItem(issue) {
  const li = el("li", `item ${issue.priority}` + (issue.status === "Resolved" ? " done" : ""));
  li.append(el("h3", "", issue.title));
  li.append(el("p", "meta", `${issue.category} • ${issue.location} • ${issue.priority} priority • by ${issue.name} on ${issue.date}`));
  if (issue.description) li.append(el("p", "desc", issue.description));

  const actions = el("div", "item-actions");
  
  if (currentUser.role === "teacher") {
    // Teachers get dropdowns and delete buttons
    const select = el("select");
    select.setAttribute("aria-label", "Change status");
    ["Pending", "In progress", "Resolved"].forEach((s) => {
      const opt = el("option", "", s);
      if (s === issue.status) opt.selected = true;
      select.append(opt);
    });
    select.addEventListener("change", () => updateStatus(issue.id, select.value));

    const del = el("button", "danger", "Delete");
    del.addEventListener("click", () => removeIssue(issue.id));

    actions.append(select, del);
  } else {
    // Students just see a static badge
    const badgeClass = issue.status.replace(" ", "-").toLowerCase();
    actions.append(el("span", `status-badge ${badgeClass}`, issue.status));
  }

  li.append(actions);
  return li;
}

function render() {
  if (!currentUser) return;
  
  renderStats();
  const q = search.value.trim().toLowerCase();
  const status = filter.value;

  const shown = issues.filter((i) => {
    const matchStatus = status === "All" || i.status === status;
    const text = `${i.title} ${i.location} ${i.category} ${i.description} ${i.name}`.toLowerCase();
    return matchStatus && text.includes(q);
  });

  list.replaceChildren(...shown.map(renderItem));
  empty.hidden = shown.length > 0;
  empty.textContent = issues.length
    ? "No reports match your search."
    : "No reports yet. Fill in the form to add the first one.";
}

// Start App
loadSession();
