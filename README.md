# HCM Lite — Saylani Hackathon 2026
**AI-Assisted Human Capital Management System for Admin, HR and Employees**  
*Saylani Hackathon — 24 October 2026, Zaitoon Ashraf IT Park, Karachi*  
*Submission Portal:* [https://lms.saylaniit.com](https://lms.saylaniit.com)

---

## 📌 Project Overview
HCM Lite is a web-based Human Capital Management application designed for day-to-day HR workflows, biometric attendance with geofencing, leave quotas, payroll calculations with tax slabs, interactive dashboards, and a role-scoped AI assistant built on Gemini API.

As specified by the challenge brief:
- **Zero Dummy Data on Fresh Install:** The system starts empty. Admin initializes the company and working rules; HR registers employees; employees perform self-service check-ins and leave applications.
- **Three Access Roles (RBAC):** Admin (Company-level), HR (People operations), and Employee (Self-service). Every endpoint and view is strictly scoped.
- **Both Stacks Included:**
  1. **Full-Stack Web App:** React 19, TypeScript, Tailwind CSS, Vite & Node.js/Express server.
  2. **Python Streamlit + Pandas App:** `streamlit_app.py` utilizing Pandas for data aggregation and visualizations.

---

## 🛠️ Tech Stack & Architecture

| Layer | Technologies |
| :--- | :--- |
| **Frontend Web** | React 19, TypeScript, Tailwind CSS, Lucide Icons, HTML5 MediaDevices (Webcam) & Geolocation API |
| **Backend & AI Server** | Node.js, Express, TypeScript (`tsx`), `@google/genai` (Gemini 3.8 Flash) |
| **Python Streamlit Suite** | Python 3.10+, Streamlit, Pandas, NumPy, Altair |
| **Security & RBAC** | Server-side role guard, password hash logic, colleague salary refusal guardrails |

---

## 🚀 How to Run the Applications

### Option A: Web Application (React + Express Server)

1. **Clone repository:**
   ```bash
   git clone <your-repo-link>
   cd <repo-folder>
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Add your Gemini API Key:
   ```env
   GEMINI_API_KEY="your-gemini-api-key"
   PORT=3000
   ```

4. **Launch development server:**
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:3000`.

---

### Option B: Python Streamlit + Pandas Application

1. **Install Python packages:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set Gemini Key (Optional):**
   ```bash
   export GEMINI_API_KEY="your-gemini-api-key"
   ```

3. **Start Streamlit:**
   ```bash
   streamlit run streamlit_app.py --server.port 8501
   ```
   Open your browser at `http://localhost:8501`.

---

## 📋 Saylani Hackathon 25-Functionality Checklist

| # | Functionality | Admin | HR | Employee | Status |
| :-: | :--- | :-: | :-: | :-: | :--- |
| **01** | First-run setup: company profile & Admin account | Manage | — | — | ✅ Complete |
| **02** | Login, logout, change password; role-based menus | Own | Own | Own | ✅ Complete |
| **03** | Company settings: office hours (09:00, 15m grace), GPS & radius (150m) | Manage | View | — | ✅ Complete |
| **04** | Departments, designations, leave quotas (14/8/10), holidays | Manage | View | — | ✅ Complete |
| **05** | Create HR logins; deactivate or reset any login | Manage | — | — | ✅ Complete |
| **06** | Register employee (creates login with temp password) | View | Manage | Own phone/address | ✅ Complete |
| **07** | Employee directory with search/filters & Employee 360 | All | All | Own | ✅ Complete |
| **08** | CSV import with dry-run error report; CSV export | — | Manage | — | ✅ Complete |
| **09** | Check-in and check-out on web | — | Own | Own | ✅ Complete |
| **10** | Attendance calendar & daily attendance board | All | All | Own | ✅ Complete |
| **11** | Attendance correction: request and approve | View | Approve | Request | ✅ Complete |
| **12** | Apply for or cancel leave; see balance and history | — | Own | Own | ✅ Complete |
| **13** | Approve or reject leave with a comment | View | Approve | — | ✅ Complete |
| **14** | Salary structure per employee (Gross = 1.5× Basic) | View | Manage | Own | ✅ Complete |
| **15** | Monthly payroll: create and review draft | View | Manage | — | ✅ Complete |
| **16** | Finalize payroll (locks the month) | Manage | — | — | ✅ Complete |
| **17** | Payslips with printable/downloadable format | All | All | Own | ✅ Complete |
| **18** | Dashboards, KPIs, trends and insight lists with filters | Company | HR | Personal | ✅ Complete |
| **19** | AI assistant chat answering from real data | All data | HR data | Own data | ✅ Complete |
| **20** | AI dashboard summary (3–5 factual bullets from KPIs) | Yes | Yes | — | ✅ Complete |
| **21** | Smart leave: natural language sentence to pre-filled form | — | Own | Own | ✅ Complete |
| **22** | Policy Q&A on attendance, leave & payroll rules | Yes | Yes | Yes | ✅ Complete |
| **23** | Announcements broadcast | Post | Post | Read | ✅ Complete |
| **24** | In-app notifications (leave decisions, payslips) | Own | Own | Own | ✅ Complete |
| **25** | Master audit log of create, update, approve & finalize | View | — | — | ✅ Complete |

### 🌟 Bonus Points Implemented (+10 Points):
- **Camera Attendance with Face Detection + GPS Geofence:** Front camera live stream with single face detector and Haversine distance calculation (&le; 150m perimeter check).
- **Late Penalty Rule:** 3 late arrivals = 0.5 day salary deduction automatically computed in payroll.
- **Roman Urdu AI Understanding:** Supports natural language Urdu prompts (e.g., *"Bhai ki shadi k liye agle pir aur mangalwar ko chutti chahiye"*).
- **Colleague Salary Refusal Guardrail:** When an Employee queries another staff member's compensation, the AI assistant politely refuses.

---

## ⏱️ 5-Minute Live Judging Demo Flow

Follow this exact story sequence during judging:
1. **Fresh Setup (Admin):** Configure company name, office start (09:00 AM, 15m grace), office GPS, and leave quotas.
2. **HR Registers Staff (HR):** HR registers 2–3 employees; temporary passwords generated.
3. **Check-in (Employee):** Employee signs in, changes password, and checks in via Web or Biometric Camera.
4. **Smart Leave Request (Employee):** Types *"Need next Monday and Tuesday off for sister's wedding"* -> Form pre-fills automatically.
5. **HR Approves & Summarizes (HR):** HR approves the leave with comment, reviews attendance, and clicks **Summarize** on the HR Dashboard.
6. **Payroll Run (HR & Admin):** HR drafts the monthly payroll run. Admin locks and finalizes it.
7. **Payslip & Security Guardrail Test (Employee):** Employee views payslip. In AI Chat, employee asks: *"What is Bilal's salary?"* -> AI **politely refuses**.
8. **Audit Trail (Admin):** Admin reviews the master audit log displaying all actions, timestamps, and before/after payloads.

---

## 🔒 Security & Guardrails
- **API Key Protection:** The Gemini API key is stored exclusively on the server (`GEMINI_API_KEY`). Browser clients never receive or call the provider directly.
- **Database Grounding:** AI queries reuse the server's permission checks and data scopes.
- **Mandatory Tagging:** All AI responses carry the `[AI-generated]` verification tag.
