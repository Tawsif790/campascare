// CampusCare - all data is saved in the browser's localStorage (no server needed)
const KEY = "campuscare_issues";

let issues = load();

const form = document.getElementById("issue-form");
const list = document.getElementById("list");
const empty = document.getElementById("empty");
const stats = document.getElementById("stats");
const search = document.getElementById("search");
const filter = document.getElementById("filter");

// ---------- Storage ----------
function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch (e) {
    return [];
  }
}

function save() {
  localStorage.setItem(KEY, JSON.stringify(issues));
}

// ---------- Actions ----------
form.addEventListener("submit", (e) => {
  e.preventDefault();
  issues.unshift({
    id: Date.now(),
    name: document.getElementById("name").value.trim(),
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
  render();
});

function updateStatus(id, status) {
  const issue = issues.find((i) => i.id === id);
  if (issue) issue.status = status;
  save();
  render();
}

function removeIssue(id) {
  if (!confirm("Delete this report?")) return;
  issues = issues.filter((i) => i.id !== id);
  save();
  render();
}

document.getElementById("clear").addEventListener("click", () => {
  if (issues.length && confirm("Delete ALL reports? This cannot be undone.")) {
    issues = [];
    save();
    render();
  }
});

document.getElementById("export").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(issues, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "campuscare-data.json";
  a.click();
  URL.revokeObjectURL(a.href);
});

search.addEventListener("input", render);
filter.addEventListener("change", render);

// ---------- Display ----------
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text; // textContent keeps user input safe
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
  li.append(actions);
  return li;
}

function render() {
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

render();
