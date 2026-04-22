# Smart Student Management & Performance Analysis System - TO-DO List

Based on the `student_management_system_prd.txt` and `frontend_ui_prd.txt` documents.

## Phase 1: Project Setup & Configuration
- [x] Initialize project directory structure (frontend & backend folders).
- [x] Setup Python virtual environment.
- [x] Install backend dependencies (Flask, PyMongo, Flask-CORS, Pandas).
- [x] Setup basic configuration for MongoDB Atlas connection.

## Phase 2: Database & Business Logic Models
- [x] Create database connection helper module.
- [x] Implement smart grade calculation logic (90+=A, 75-89=B, 50-74=C, <50=Fail).
- [x] Implement at-risk tracking logic (Marks < 50 OR Attendance < 75% -> At Risk).

## Phase 3: Backend API Development
- [x] Initialize Flask application & CORS.
- [x] `POST /api/login` - Basic Authentication endpoint.
- [x] `POST /api/students` - Add new student.
- [x] `GET /api/students` - Get all students (with search & filter params).
- [x] `GET /api/students/:id` - Get specific student details.
- [x] `PUT /api/students/:id` - Update student.
- [x] `DELETE /api/students/:id` - Delete student.
- [x] `GET /api/dashboard` - Return dashboard metrics (total, avg marks, etc).
- [x] `GET /api/analytics` - Return advanced analytics data.
- [x] `POST /api/export` - Export student records as CSV.

## Phase 4: Frontend Base Setup & Design System
- [x] Create base CSS architecture (design tokens, variables, components).
- [x] Define global CSS design tokens (colors, typography, spacing).
- [x] Implement reusable components in CSS (Buttons, Inputs, Cards, Badges, Modals, Tables).
- [x] Setup Vanilla JS API fetch wrapper.

## Phase 5: Frontend Page Implementation
- [x] Build Login Page UI.
- [x] Build Main Dashboard Page UI (Metric Cards, Charts, At-Risk table).
- [x] Build Students Management Page UI (Search/Filter bar, Student Table with actions).
- [x] Build Add/Edit Student Modal UI with client-side validation.
- [x] Build Analytics Page UI (Charts: distribution, scatter, risk, performers).

## Phase 6: Frontend/Backend Integration
- [x] Hook up authentication requests and state.
- [x] Hook up Student table to fetch and display data.
- [x] Hook up Add/Edit / Delete features with loading states and notifications.
- [x] Hook up Dashboard metrics API.
- [x] Integrate Chart.js for Data Visualization.

## Phase 7: Polish & Review
- [x] Ensure mobile responsiveness across breakpoints (<768px, 768-1024px, >1024px).
- [ ] Verify end-to-end by starting backend and opening frontend in browser.
- [ ] Test all CRUD operations in the browser.
