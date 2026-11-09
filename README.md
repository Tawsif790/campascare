# CampusCare

A small web app where students report campus problems (broken facilities, Wi-Fi, safety, health) and track them until they are resolved.

**SDP 2 project** · Team: _Name 1_, _Name 2_

## Features
- Submit an issue with category, priority, location and details
- Change status: Pending → In progress → Resolved
- Search and filter reports
- Live counters (total / pending / in progress / resolved)
- Delete a report, or delete all
- Download all data as a JSON file
- Data is stored **locally** in the browser (`localStorage`), no server or database needed

## Tech
HTML, CSS, JavaScript (no libraries, no build step)

## How to run
1. Clone or download this repository
2. Open `index.html` in any browser

Optional: enable **GitHub Pages** (Settings → Pages → Deploy from `main` branch) to get a live link.

## Project structure
```
campuscare/
├── index.html   # page layout and form
├── style.css    # styling
├── app.js       # logic + localStorage
└── README.md
```

## Team work split
| Member | Work |
|---|---|
| Name 1 | `index.html`, `style.css` (UI design, responsive layout) |
| Name 2 | `app.js` (add / update / delete, search, filter, storage, export) |
| Both | Testing, README, presentation |

## Limitations & future work
- Data is only on the device/browser that created it
- No login (anyone can change status)
- Future: admin login, photo upload, backend database
