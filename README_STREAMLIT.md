# Saylani Hackathon 2026 - HCM Lite
**AI-Assisted Human Capital Management System**  
Built for the Saylani Hackathon (Zaitoon Ashraf IT Park, 24 October 2026).

---

## 🚀 Running the Python Streamlit + Pandas Application

### Prerequisites:
- Python 3.10+
- pip

### 1. Install Dependencies:
```bash
pip install -r requirements.txt
```

### 2. Set Up Gemini API Key (Optional for AI Assistant):
```bash
export GEMINI_API_KEY="your-gemini-api-key"
```
*(If unset, the application automatically uses deterministic fallback intelligence based strictly on the HCM Lite database).*

### 3. Launch Streamlit:
```bash
streamlit run streamlit_app.py --server.port 8501
```

---

## 🎯 Saylani Hackathon Module Coverage (All 9 Modules & 25 Checklist Items)

1. **M1 Auth & Access Control:**
   - 3 Roles: Admin (Company-level), HR (People operations), Employee (Self-service).
   - Server-side and UI scope guarding.
   - First-run install and password management.

2. **M2 Organization Setup:**
   - Office start: 09:00 AM, 15-minute grace threshold (late marked after 09:15 AM).
   - Half-day threshold: under 5 hours.
   - Weekend configuration: Saturday & Sunday.
   - Office GPS Geofence: Haversine distance calculation with 150m radius.
   - Departments, designations, yearly leave quotas, and holidays.

3. **M3 Employee Management:**
   - Searchable Employee Directory with department and status filters.
   - Employee 360 profile viewer.
   - CSV Dry-run upload: checks required columns, unique codes/emails, valid email format, known departments, ISO dates, and salary > 0.
   - CSV Export functionality.

4. **M4 Attendance:**
   - Web check-in/out and live camera snapshot check-in.
   - Real-time Haversine distance check against office coordinates.
   - Status rules: Present, Late (after 09:15), Half-day (< 5h).
   - Duplicate check-in prevention (HTTP 409 rule).

5. **M5 Leave Management:**
   - Quotas: Annual 14, Sick 8, Casual 10, Unpaid unlimited.
   - Working days calculator (skips weekends and company holidays).
   - Overlap check and over-balance prevention (HTTP 422 rule).
   - HR approval inbox with comments.

6. **M6 Payroll Lite:**
   - Gross formula: `1.5 * Basic` (HRA 40%, Medical 10%).
   - Daily rate: `Gross / Working Days in Month`.
   - Deductions: absent days, unpaid leave, half days (0.5x), late penalty rule (3 lates = 0.5 day).
   - Progressive annualized tax slab computation (0%, 5%, 15%, 25%, 35%).
   - HR drafts; Admin locks and finalizes. Printable/viewable payslip breakdown.

7. **M7 Dashboards & Analytics:**
   - Headcount, present today, late arrivals, approved leaves, payroll costs.
   - Attendance rate formula: `(present + late + missing_checkout + 0.5 * half_day) / (working_days - on_leave)`.
   - Pandas data visual charts (bar charts, metrics, groupby late-comers).

8. **M8 AI Assistant:**
   - Role-scoped AI: Admin (all company data), HR (HR operations), Employee (own records only).
   - Security Guardrail: Employee asking for colleague's salary is **politely refused**.
   - Dashboard AI Summary button generating 3-5 concise bullet insights from current numbers.
   - Smart Leave parser: converts natural language (e.g. *"Need next Monday and Tuesday off for sister's wedding"*, plus Roman Urdu) to structured leave form.
   - Grounded Policy Q&A with `[AI-generated]` tag.

9. **M9 Comms & Audit Trail:**
   - Company announcements broadcast.
   - In-app notification alerts.
   - Immutable audit log tracking actor, action, timestamp, entity, and change details.
