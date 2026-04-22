<h1 align="center">
  <br>
  &#127891; StudOps
  <br>
</h1>

<h4 align="center">A premium student management &amp; performance analytics dashboard built with Flask + MongoDB.</h4>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.x-3776AB?style=flat-square&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/Flask-3.x-000000?style=flat-square&logo=flask&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Chart.js-4.x-FF6384?style=flat-square&logo=chartdotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" />
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#project-structure">Structure</a> •
  <a href="#api-reference">API</a> •
  <a href="#screenshots">Screenshots</a>
</p>

---

## Features

- **Full CRUD** — Add, edit, delete students with real-time validation
- **Auto-grading** — Marks auto-compute Grade (A/B/C/Fail) and Risk Status (Safe / At Risk)
- **Analytics Dashboard** — Pass/Fail radial rings, grade bar charts, marks distribution, risk breakdown, scatter plot
- **Radial Progress Charts** — Apple Fitness-style SVG concentric rings (no Chart.js for donuts)
- **At-Risk Detection** — Students flagged if marks < 50 or attendance < 75%
- **CSV Export** — Download full student list as CSV
- **Premium Dark UI** — Glassmorphism cards, backdrop blur, smooth animations
- **Keyboard Shortcuts** — `Ctrl+N` new student · `Ctrl+F` search · `Ctrl+E` export · `1/2/3` switch pages
- **Theme Toggle** — Dark / Light mode with `localStorage` persistence
- **Pagination + Search** — Server-side filtering, sorting, and pagination

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python · Flask · Flask-CORS |
| Database | MongoDB Atlas (PyMongo) |
| Frontend | Vanilla HTML · CSS · JavaScript |
| Charts | Chart.js 4 (bar, scatter) · Custom SVG radial charts |
| Fonts | Inter · Fira Code (Google Fonts) |

---

## Getting Started

### Prerequisites

- Python 3.9+
- MongoDB Atlas account (free tier works)
- Git

### 1. Clone the repo

```bash
git clone https://github.com/aniket-d18/StudOps.git
cd StudOps
```

### 2. Set up the backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

pip install flask flask-cors pymongo python-dotenv
```

### 3. Configure environment

Create `backend/.env`:

```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/student_db?retryWrites=true&w=majority
SECRET_KEY=your-secret-key-here
```

> **Note:** Never commit `.env` — it is already in `.gitignore`

### 4. Run the server

```bash
python app.py
```

Open **http://localhost:5000** in your browser.

**Default credentials:**
```
Username: admin
Password: admin123
```

---

## Project Structure

```
StudOps/
├── backend/
│   ├── app.py          # Flask routes & API
│   ├── db.py           # MongoDB connection
│   ├── utils.py        # Grade/status calculation helpers
│   └── .env            # Secrets (not committed)
│
├── frontend/
│   ├── index.html      # Main dashboard SPA
│   ├── login.html      # Login page
│   ├── styles.css      # Design system & all styles
│   ├── app.js          # Dashboard logic, CRUD, charts
│   └── radial-chart.js # Reusable SVG radial progress chart
│
├── .gitignore
└── README.md
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/login` | Authenticate user |
| `POST` | `/api/logout` | Clear session |
| `GET` | `/api/students` | List students (paginated, filterable) |
| `POST` | `/api/students` | Add new student |
| `GET` | `/api/students/:id` | Get single student |
| `PUT` | `/api/students/:id` | Update student |
| `DELETE` | `/api/students/:id` | Delete student |
| `GET` | `/api/dashboard` | Dashboard stats (totals, topper, at-risk) |
| `GET` | `/api/analytics` | Grade dist, marks dist, risk breakdown, scatter |
| `POST` | `/api/export` | Download students as CSV |

---

## Grading Logic

| Marks | Grade |
|---|---|
| >= 90 | A |
| >= 75 | B |
| >= 50 | C |
| < 50 | Fail |

**At Risk** = marks < 50 **OR** attendance < 75%

---

## Screenshots

> Dashboard with radial progress charts, metric cards, and at-risk table.

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit: `git commit -m "feat: add your feature"`
4. Push: `git push origin feat/your-feature`
5. Open a Pull Request

---

## License

MIT © [Vansh Bhat](https://github.com/aniket-d18)
