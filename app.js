// CampusCare - LocalStorage App with Role-Based Login

const KEY = "campuscare_issues";
const SESSION_KEY = "campuscare_session";

let issues = load();
let currentUser = null;

// ---------- Storage & Auth ----------
function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; }
}

function save() {
  localStorage.setItem(KEY, JSON.stringify(issues));
}

function loadSession() {
  const session = sessionStorage.getItem(SESSION_KEY);
  if (session) {
    currentUser = JSON.parse(session);
    showApp();
  } else {
    document.getElementById("login-screen").style.display = "flex";
    document.getElementById("app-screen").style.display = "none";
  }
}

function login() {
  const userInp = document.getElementById("login-user").value.trim();
  const roleInp = document.getElementById("login-role").value;
  const error = document.getElementById("login-error");

  if (!userInp) {
    error.style.display = "block";
    return;
  }
  error.style.display = "none";

  currentUser = { name: userInp, role: roleInp };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
  showApp();
}

function logout() {
  currentUser = null;
  sessionStorage.removeItem(SESSION_KEY);
  document.getElementById("login-screen").style.display = "flex";
  document.getElementById("app-screen").style.display = "none";
  document.getElementById("issue-form").reset();
  document.getElementById("login-user").value = "";
}

function showApp() {
  document.getElementById("login-screen").style.display = "none";
  document.getElementById("app-screen").style.display = "block";
  
  // Set user info
  document.getElementById("current-user-display").textContent = currentUser.name;
  document.getElementById("current-role-display").textContent = `(${currentUser.role.toUpperCase()})`;
  
  // Auto-fill hidden name field for form submission
  document.getElementById("name").value = currentUser.name;

  // UI Adjustments based on Role
  const adminElements = document.querySelectorAll(".admin-only");
  if (currentUser.role === "teacher") {
    // Teachers see all admin buttons
    adminElements.forEach(el => el.style.display = "flex");
  } else {
    // Students don't see export/delete all buttons
    adminElements.forEach(el => el.style.display = "none");
  }

  render(); // Initial render
}

// ---------- App Elements ----------
const form = document.getElementById("issue-form");
const list = document.getElementById("list");
const empty = document.getElementById("empty");
const stats = document.getElementById("stats");
const search = document.getElementById("search");
const filter = document.getElementById("filter");

// ---------- Actions ----------
form.addEventListener("submit", (e) => {
  e.preventDefault();
  issues.unshift({
    id: Date.now(),
    name: currentUser.name, // Gets name from logged-in user
    title: document.getElementById("title").value.trim(),
    category: document.getElementById("category").value,
    priority: document.getElementById("priority").value,
    location: document.getElementById("location").value.trim(),
    description: document.getElementById("description").value.trim(),
    status: "Pending",
    date: new Date().toLocaleDateString()
  });
  save();
  form.reset();
  document.getElementById("name").value = currentUser.name; // Re-fill hidden input
  render();
});

function updateStatus(id, status) {
  if (currentUser.role !== "teacher") return alert("Only teachers can change statuses.");
  const issue = issues.find((i) => i.id === id);
  if (issue) issue.status = status;
  save();
  render();
}

function removeIssue(id) {
  if (currentUser.role !== "teacher") return alert("Only teachers can delete reports.");
  if (!confirm("Delete this report?")) return;
  issues = issues.filter((i) => i.id !== id);
  save();
  render();
}

document.getElementById("clear").addEventListener("click", () => {
  if (currentUser.role !== "teacher") return;
  if (issues.length && confirm("Delete ALL reports? This cannot be undone.")) {
    issues = [];
    save();
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

// Login/Logout Listeners
document.getElementById("btn-login").addEventListener("click", login);
document.getElementById("btn-logout").addEventListener("click", logout);

// ---------- Display ----------
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
  
  // Only show status dropdown and delete button if user is a Teacher
  if (currentUser.role === "teacher") {
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
    // For students, just show the current status as text
    actions.append(el("span", `status-badge ${issue.status.replace(" ", "-").toLowerCase()}`, issue.status));
  }

  li.append(actions);
  return li;
}

function render() {
  if (!currentUser) return; // Don't render if not logged in
  
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

// Initialize App
loadSession();
