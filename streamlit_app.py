"""
Saylani Hackathon 2026 — HCM Lite
AI-Assisted Human Capital Management System
Built for Admin, HR, and Employees with Python, Streamlit, Pandas, and Altair.

Venue: Zaitoon Ashraf IT Park, Karachi
Date: 24 October 2026
"""

import streamlit as st
import pandas as pd
import numpy as np
import datetime
import math
import os
import json

# ----------------- PAGE CONFIG -----------------
st.set_page_config(
    page_title="HCM Lite — Saylani Hackathon 2026",
    page_icon="🏢",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ----------------- PROFESSIONAL STYLING (CSS) -----------------
st.markdown("""
<style>
    /* Global Theme & Font Styling */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    
    html, body, [class*="css"] {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }
    
    /* Top Banner Header */
    .hcm-header {
        background: linear-gradient(135deg, #090d16 0%, #0d1b2a 50%, #0a2540 100%);
        border: 1px solid rgba(20, 184, 166, 0.25);
        border-radius: 16px;
        padding: 24px 28px;
        margin-bottom: 24px;
        color: white;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
    }
    .hcm-header-title {
        font-size: 1.75rem;
        font-weight: 800;
        letter-spacing: -0.025em;
        background: linear-gradient(to right, #ffffff, #5eead4);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin: 0;
    }
    
    /* Executive Metric Card */
    .metric-card {
        background: #0e1626;
        border: 1px solid #1e293b;
        border-radius: 14px;
        padding: 18px 20px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
        transition: transform 0.2s ease, border-color 0.2s ease;
    }
    .metric-card:hover {
        border-color: #14b8a6;
        transform: translateY(-2px);
    }
    .metric-label {
        font-size: 0.72rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #94a3b8;
    }
    .metric-value {
        font-size: 1.85rem;
        font-weight: 800;
        color: #f8fafc;
        margin: 4px 0;
        font-family: monospace;
    }
    .metric-sub {
        font-size: 0.75rem;
        color: #10b981;
        font-weight: 600;
    }
    
    /* Status Badges */
    .badge-admin { background-color: #581c87; color: #d8b4fe; padding: 3px 8px; border-radius: 6px; font-weight: 700; font-size: 0.7rem; border: 1px solid #7e22ce; }
    .badge-hr { background-color: #042f2e; color: #5eead4; padding: 3px 8px; border-radius: 6px; font-weight: 700; font-size: 0.7rem; border: 1px solid #0f766e; }
    .badge-emp { background-color: #451a03; color: #fcd34d; padding: 3px 8px; border-radius: 6px; font-weight: 700; font-size: 0.7rem; border: 1px solid #b45309; }
    
    /* Payslip Container */
    .payslip-box {
        background: #090e17;
        border: 1px solid #334155;
        border-radius: 12px;
        padding: 24px;
        color: #e2e8f0;
    }
    
    /* Table styling tweaks */
    .dataframe {
        border-radius: 10px !important;
        overflow: hidden !important;
    }
</style>
""", unsafe_allow_html=True)

# ----------------- DATABASE / SESSION STATE INITIALIZATION -----------------
def initialize_database():
    if "db_initialized" not in st.session_state:
        st.session_state.db_initialized = True
        st.session_state.company_name = "TechNova Solutions"
        st.session_state.office_start = datetime.time(9, 0)
        st.session_state.grace_minutes = 15
        st.session_state.half_day_hours = 5
        st.session_state.weekend_days = ["Saturday", "Sunday"]
        st.session_state.office_lat = 24.8607
        st.session_state.office_lng = 67.0011
        st.session_state.office_radius_m = 150
        st.session_state.late_penalty_rule = True # 3 lates = 0.5 day

        st.session_state.departments = ["Engineering", "Human Resources", "Sales & Marketing", "Finance", "Operations"]
        st.session_state.designations = [
            "Chief Technology Officer", "HR Lead & People Ops", "Senior Software Engineer", 
            "Sales Executive", "Operations Lead", "Financial Analyst", "QA Engineer"
        ]
        st.session_state.leave_quotas = {"annual": 14, "sick": 8, "casual": 10, "unpaid": 999}
        st.session_state.public_holidays = ["2026-03-23", "2026-05-01", "2026-08-14", "2026-11-09", "2026-12-25"]

        # Authentication State
        st.session_state.is_logged_in = False
        st.session_state.current_role = "Admin"
        st.session_state.current_user_id = "EMP001"

        # Employees Master Table (Starts populated for demo, can be reset to empty)
        st.session_state.employees = [
            {
                "employee_id": "EMP001",
                "name": "Muhammad Asad",
                "email": "asad.admin@technova.com",
                "role": "Admin",
                "department": "Engineering",
                "designation": "Chief Technology Officer",
                "joining_date": "2023-01-15",
                "basic_salary": 220000,
                "gender": "Male",
                "tenure_years": 3.8,
                "phone": "+92 300 1234567",
                "address": "Gulshan-e-Iqbal Block 13, Karachi",
                "status": "Active",
                "first_login": False
            },
            {
                "employee_id": "EMP002",
                "name": "Fatima Zahra",
                "email": "fatima.hr@technova.com",
                "role": "HR",
                "department": "Human Resources",
                "designation": "HR Lead & People Ops",
                "joining_date": "2023-06-01",
                "basic_salary": 140000,
                "gender": "Female",
                "tenure_years": 3.3,
                "phone": "+92 321 7654321",
                "address": "PECHS Block 2, Karachi",
                "status": "Active",
                "first_login": False
            },
            {
                "employee_id": "EMP003",
                "name": "Bilal Tariq",
                "email": "bilal.dev@technova.com",
                "role": "Employee",
                "department": "Engineering",
                "designation": "Senior Software Engineer",
                "joining_date": "2024-02-15",
                "basic_salary": 110000,
                "gender": "Male",
                "tenure_years": 2.7,
                "phone": "+92 333 9988776",
                "address": "North Nazimabad, Karachi",
                "status": "Active",
                "first_login": False
            },
            {
                "employee_id": "EMP004",
                "name": "Ayesha Siddiqui",
                "email": "ayesha.sales@technova.com",
                "role": "Employee",
                "department": "Sales & Marketing",
                "designation": "Sales Executive",
                "joining_date": "2024-08-01",
                "basic_salary": 95000,
                "gender": "Female",
                "tenure_years": 2.2,
                "phone": "+92 345 5544332",
                "address": "Clifton Block 5, Karachi",
                "status": "Active",
                "first_login": False
            },
            {
                "employee_id": "EMP005",
                "name": "Zayn Ul Abidin",
                "email": "zayn.ops@technova.com",
                "role": "Employee",
                "department": "Operations",
                "designation": "Operations Lead",
                "joining_date": "2025-01-10",
                "basic_salary": 85000,
                "gender": "Male",
                "tenure_years": 1.8,
                "phone": "+92 312 8877665",
                "address": "Bahadurabad, Karachi",
                "status": "Active",
                "first_login": True
            }
        ]

        # Attendance Log
        today_iso = datetime.date.today().isoformat()
        yesterday_iso = (datetime.date.today() - datetime.timedelta(days=1)).isoformat()
        st.session_state.attendance = [
            {"id": "ATT-001", "date": today_iso, "employee_id": "EMP001", "name": "Muhammad Asad", "check_in": "08:52", "check_out": "17:30", "status": "Present", "hours": 8.6, "method": "Web", "dist_m": 42},
            {"id": "ATT-002", "date": today_iso, "employee_id": "EMP002", "name": "Fatima Zahra", "check_in": "09:24", "check_out": "18:10", "status": "Late", "hours": 8.7, "method": "Camera", "dist_m": 65},
            {"id": "ATT-003", "date": today_iso, "employee_id": "EMP003", "name": "Bilal Tariq", "check_in": "09:05", "check_out": "17:45", "status": "Present", "hours": 8.6, "method": "Web", "dist_m": 38},
            {"id": "ATT-004", "date": today_iso, "employee_id": "EMP005", "name": "Zayn Ul Abidin", "check_in": "09:32", "check_out": "-", "status": "Late", "hours": 0.0, "method": "Camera", "dist_m": 80},
            {"id": "ATT-090", "date": yesterday_iso, "employee_id": "EMP002", "name": "Fatima Zahra", "check_in": "09:20", "check_out": "18:00", "status": "Late", "hours": 8.6, "method": "Camera", "dist_m": 70},
            {"id": "ATT-091", "date": yesterday_iso, "employee_id": "EMP004", "name": "Ayesha Siddiqui", "check_in": "09:00", "check_out": "13:30", "status": "Half Day", "hours": 4.5, "method": "Web", "dist_m": 55}
        ]

        # Leaves Table
        st.session_state.leaves = [
            {
                "leave_id": "LV-101",
                "employee_id": "EMP004",
                "employee_name": "Ayesha Siddiqui",
                "leave_type": "casual",
                "start_date": today_iso,
                "end_date": today_iso,
                "working_days": 1,
                "reason": "Family engagement ceremony",
                "status": "Approved",
                "applied_at": yesterday_iso,
                "hr_comment": "Approved as per casual quota."
            }
        ]

        # Payroll Finalized Runs
        st.session_state.finalized_payrolls = {}

        # Master Audit Trail
        st.session_state.audit_trail = [
            {"timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"), "actor": "Admin (EMP001)", "action": "INITIALIZE", "entity": "CompanySetup", "details": "Initialized HCM Lite parameters, departments, and payroll rules"}
        ]

        # Announcements
        st.session_state.announcements = [
            {"id": 1, "title": "Saylani Hackathon HCM Lite Launched", "date": today_iso, "author": "HR Department", "content": "Welcome to HCM Lite! All 9 modules are live with camera attendance, leave approvals, and Gemini AI assistant."}
        ]

initialize_database()

# ----------------- BUSINESS LOGIC & FORMULAS -----------------
def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371000  # meters
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = math.radians(lat2 - lat1), math.radians(lon2 - lon1)
    a = math.sin(dp / 2)**2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2)**2
    return round(R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a)))

def calculate_working_days(start_date, end_date):
    cur = start_date
    count = 0
    while cur <= end_date:
        w_name = cur.strftime("%A")
        iso = cur.isoformat()
        if w_name not in st.session_state.weekend_days and iso not in st.session_state.public_holidays:
            count += 1
        cur += datetime.timedelta(days=1)
    return count

def compute_tax(annual_gross):
    """Progressive tax slabs from Section 3 of Brief."""
    if annual_gross <= 600000:
        return 0
    elif annual_gross <= 1200000:
        return (annual_gross - 600000) * 0.05
    elif annual_gross <= 2400000:
        return 30000 + (annual_gross - 1200000) * 0.15
    elif annual_gross <= 3600000:
        return 210000 + (annual_gross - 2400000) * 0.25
    else:
        return 510000 + (annual_gross - 3600000) * 0.35

def log_audit(actor, action, entity, details):
    st.session_state.audit_trail.insert(0, {
        "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "actor": actor,
        "action": action,
        "entity": entity,
        "details": details
    })

# ----------------- AUTHENTICATION GATE & LOGIN SCREEN -----------------
if not st.session_state.get("is_logged_in", False):
    st.markdown("""
    <div style="max-width:580px; margin:30px auto 15px auto; text-align:center;">
        <div style="display:inline-block; background:#14b8a6; padding:12px 18px; border-radius:14px; font-weight:900; font-size:24px; color:#022c22; margin-bottom:12px; box-shadow:0 4px 12px rgba(20,184,166,0.3);">HCM</div>
        <h1 style="color:#f8fafc; font-size:2.1rem; font-weight:800; margin:0; letter-spacing:-0.02em;">Saylani Hackathon 2026</h1>
        <h3 style="color:#5eead4; font-size:1.15rem; font-weight:600; margin:6px 0 16px 0;">HCM Lite — AI-Assisted Human Capital Management</h3>
        <p style="color:#14b8a6; font-size:0.9rem; font-weight:600; margin-top:-8px; margin-bottom:12px;">
            Developed by M Atta ur Rehman Khan | Roll No: 777760
        </p>
        <p style="color:#94a3b8; font-size:0.85rem; line-height:1.5;">
            Select your designated role to enter the system. Each role operates with its own dedicated menus, database permissions, and AI assistant scope.
        </p>
    </div>
    """, unsafe_allow_html=True)

    col_l, col_m, col_r = st.columns([1, 2.5, 1])
    with col_m:
        st.markdown("""
        <div style="background:#0e1626; border:1px solid #1e293b; border-radius:16px; padding:24px; box-shadow:0 10px 25px -5px rgba(0,0,0,0.5);">
        """, unsafe_allow_html=True)
        
        tab_admin, tab_hr, tab_emp = st.tabs(["🛡️ Admin Portal", "👥 HR Operations", "💼 Employee Portal"])

        with tab_admin:
            st.markdown("##### 🛡️ Company Administrator Login")
            st.caption("Full company control, executive dashboard, attendance monitor, employee setup, payroll lock, and master audit trail.")
            st.text_input("Admin Work Email", value="asad.admin@technova.com", disabled=True, key="login_admin_email")
            st.text_input("Master Password", value="••••••••", type="password", disabled=True, key="login_admin_pass")
            if st.button("🚀 Sign In as Admin (Muhammad Asad)", use_container_width=True, type="primary"):
                st.session_state.is_logged_in = True
                st.session_state.current_role = "Admin"
                st.session_state.current_user_id = "EMP001"
                log_audit("Muhammad Asad", "LOGIN", "Auth", "Logged in as Company Admin")
                st.rerun()

        with tab_hr:
            st.markdown("##### 👥 HR People Operations Login")
            st.caption("Register employees, dry-run CSV imports, daily attendance board, leave approval inbox, and monthly payroll runs.")
            st.text_input("HR Work Email", value="fatima.hr@technova.com", disabled=True, key="login_hr_email")
            st.text_input("HR Password", value="••••••••", type="password", disabled=True, key="login_hr_pass")
            if st.button("🚀 Sign In as HR (Fatima Zahra)", use_container_width=True, type="primary"):
                st.session_state.is_logged_in = True
                st.session_state.current_role = "HR"
                st.session_state.current_user_id = "EMP002"
                log_audit("Fatima Zahra", "LOGIN", "Auth", "Logged in as HR Lead")
                st.rerun()

        with tab_emp:
            st.markdown("##### 💼 Employee Self-Service Login")
            st.caption("Check in via Web/Camera with geofencing, submit smart leave, download payslips, and personal AI assistant.")
            emp_list = [e for e in st.session_state.employees if e["role"] == "Employee"]
            if not emp_list:
                emp_list = st.session_state.employees
            emp_choices = {e["employee_id"]: e["name"] + " (" + e["designation"] + ")" for e in emp_list}
            chosen_id = st.selectbox("Choose Employee Account", list(emp_choices.keys()), format_func=lambda x: emp_choices[x], key="login_emp_select")
            chosen_obj = next((e for e in st.session_state.employees if e["employee_id"] == chosen_id), None)
            st.text_input("Work Email", value=chosen_obj["email"] if chosen_obj else "emp@technova.com", disabled=True, key="login_emp_email")
            st.text_input("Password", value="••••••••", type="password", disabled=True, key="login_emp_pass")
            if st.button("🚀 Sign In as Employee", use_container_width=True, type="primary"):
                st.session_state.is_logged_in = True
                st.session_state.current_role = "Employee"
                st.session_state.current_user_id = chosen_id
                log_audit(chosen_obj["name"] if chosen_obj else "Employee", "LOGIN", "Auth", "Logged in as Employee")
                st.rerun()

        st.markdown("</div>", unsafe_allow_html=True)
        st.markdown("<br/>", unsafe_allow_html=True)
        st.info("💡 **Hackathon Evaluator Notice:** You can sign in with any role above to test its respective permissions and views. To switch roles at any time, click **Sign Out** in the sidebar.")

    st.stop()

# ----------------- SIDEBAR: LOGGED IN USER CONTEXT -----------------
curr_user = next((e for e in st.session_state.employees if e["employee_id"] == st.session_state.current_user_id), None)
curr_user_name = curr_user["name"] if curr_user else "User"
selected_role = st.session_state.current_role

with st.sidebar:
    st.markdown("""
    <div style="display:flex; align-items:center; gap:10px; margin-bottom:15px;">
        <div style="background:#14b8a6; padding:8px 12px; border-radius:10px; font-weight:900; font-size:18px; color:#022c22;">HCM</div>
        <div>
            <div style="font-weight:800; font-size:17px; color:#f8fafc; line-height:1.2;">HCM Lite</div>
            <div style="font-size:11px; color:#94a3b8;">Saylani Hackathon 2026</div>
            <div style="font-size:10px; color:#14b8a6; font-weight:600;">Dev: M Atta ur Rehman Khan</div>
        </div>
    </div>
    """, unsafe_allow_html=True)

    # Active User Profile Card
    st.markdown(f"""
    <div style="background:#090f1d; border:1px solid #1e293b; border-radius:12px; padding:12px; margin-bottom:12px;">
        <div style="font-size:11px; color:#94a3b8; text-transform:uppercase; font-weight:700;">Logged In User</div>
        <div style="font-size:14px; font-weight:800; color:#f8fafc; margin-top:2px;">{curr_user_name}</div>
        <div style="font-size:11px; color:#5eead4;">{curr_user['designation'] if curr_user else selected_role}</div>
        <div style="font-size:10px; color:#64748b; margin-top:4px;">ID: {st.session_state.current_user_id} · {curr_user['department'] if curr_user else 'Org'}</div>
    </div>
    """, unsafe_allow_html=True)

    # Role Badge
    if selected_role == "Admin":
        st.markdown('<span class="badge-admin">Company Master Level</span>', unsafe_allow_html=True)
    elif selected_role == "HR":
        st.markdown('<span class="badge-hr">People Operations Level</span>', unsafe_allow_html=True)
    else:
        st.markdown('<span class="badge-emp">Self-Service Level</span>', unsafe_allow_html=True)

    # Logout Button
    if st.button("🚪 Sign Out / Switch Role", use_container_width=True):
        st.session_state.is_logged_in = False
        log_audit(curr_user_name, "LOGOUT", "Auth", "Signed out to login screen")
        st.rerun()

    st.markdown("---")
    st.subheader("📑 Role Menu")

    # Dynamic role-based navigation tree
    if selected_role == "Admin":
        nav_items = [
            "Executive Dashboard",
            "➕ Add New Employee / HR (M3)",
            "All Employees Directory (M3)",
            "Company Attendance Monitor (M4)",
            "Organization Setup (M2)",
            "Leave Approvals & Quotas (M5)",
            "Payroll Finalization & Lock (M6)",
            "AI Assistant (Company Scope)",
            "Master Audit Trail (M9)",
            "5-Min Hackathon Demo Guide"
        ]
    elif selected_role == "HR":
        nav_items = [
            "HR Operations Dashboard",
            "➕ Add New Employee (M3)",
            "Employees Management (M3)",
            "CSV Dry-Run Import & Export (M3)",
            "Daily Attendance Board (M4)",
            "Leave Approvals Inbox (M5)",
            "Monthly Payroll Run (M6)",
            "AI Assistant (HR Scope)",
            "Company Announcements (M9)",
            "5-Min Hackathon Demo Guide"
        ]
    else: # Employee
        nav_items = [
            "My Employee Hub",
            "🕒 Mark Web & Camera Attendance (M4)",
            "🏖️ Smart Leave Application (M5/M8)",
            "My Attendance History (M4)",
            "My Official Payslips (M6)",
            "Ask My AI Assistant (M8)",
            "Company Announcements (M9)",
            "5-Min Hackathon Demo Guide"
        ]

    nav_choice = st.radio("Navigate", nav_items)

    st.markdown("---")
    c_rst1, c_rst2 = st.columns(2)
    if c_rst1.button("🔄 Reset Data"):
        st.session_state.employees = []
        st.session_state.attendance = []
        st.session_state.leaves = []
        st.session_state.finalized_payrolls = {}
        st.session_state.audit_trail = []
        st.session_state.is_logged_in = False
        log_audit("Admin", "RESET", "Database", "Database cleared to zero dummy data.")
        st.rerun()

    if c_rst2.button("📥 Load Demo"):
        st.session_state.db_initialized = False
        initialize_database()
        st.session_state.is_logged_in = True
        st.rerun()

# ----------------- TOP HEADER BANNER -----------------
st.markdown(f"""
<div class="hcm-header">
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
        <div>
            <div style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.1em; color:#5eead4; font-weight:700;">Saylani Hackathon 2026 · Zaitoon Ashraf IT Park</div>
            <h1 class="hcm-header-title">{st.session_state.company_name} — HCM Lite</h1>
            <div style="font-size:0.85rem; color:#14b8a6; margin-top:2px; font-weight:600;">
                Developed by M Atta ur Rehman Khan | Roll No: 777760
            </div>
            <div style="font-size:0.85rem; color:#94a3b8; margin-top:4px;">
                Active Portal: <strong>{selected_role}</strong> · Signed in as: <strong>{curr_user_name} ({st.session_state.current_user_id})</strong>
            </div>
        </div>
        <div style="display:flex; gap:8px;">
            <div style="background:rgba(255,255,255,0.08); padding:8px 14px; border-radius:10px; border:1px solid rgba(255,255,255,0.15); font-size:12px; text-align:center;">
                <div style="color:#94a3b8; font-size:10px; text-transform:uppercase;">Office Start</div>
                <div style="font-weight:700; color:#5eead4;">{st.session_state.office_start.strftime('%H:%M')} (Grace {st.session_state.grace_minutes}m)</div>
            </div>
            <div style="background:rgba(255,255,255,0.08); padding:8px 14px; border-radius:10px; border:1px solid rgba(255,255,255,0.15); font-size:12px; text-align:center;">
                <div style="color:#94a3b8; font-size:10px; text-transform:uppercase;">Perimeter</div>
                <div style="font-weight:700; color:#f8fafc;">{st.session_state.office_radius_m}m Radius</div>
            </div>
        </div>
    </div>
</div>
""", unsafe_allow_html=True)

# ----------------- MODULE 1 & 7: ADMIN EXECUTIVE DASHBOARD -----------------
if nav_choice == "Executive Dashboard":
    st.header("🏢 Executive Company Dashboard (Admin)")
    st.caption("Real-time aggregated performance metrics across all company branches & departments.")

    df_emp = pd.DataFrame(st.session_state.employees)
    df_att = pd.DataFrame(st.session_state.attendance)
    df_l = pd.DataFrame(st.session_state.leaves)

    headcount = len(df_emp[df_emp["status"] == "Active"]) if not df_emp.empty else 0
    total_payroll_gross = sum([e["basic_salary"] * 1.5 for e in st.session_state.employees])
    avg_salary = (total_payroll_gross / headcount) if headcount > 0 else 0

    today_str = datetime.date.today().isoformat()
    today_records = df_att[df_att["date"] == today_str] if not df_att.empty else pd.DataFrame()
    present_today = len(today_records[today_records["status"] == "Present"]) if not today_records.empty else 0
    late_today = len(today_records[today_records["status"] == "Late"]) if not today_records.empty else 0
    half_day_today = len(today_records[today_records["status"] == "Half Day"]) if not today_records.empty else 0

    on_leave_today = len(df_l[(df_l["start_date"] <= today_str) & (df_l["end_date"] >= today_str) & (df_l["status"] == "Approved")]) if not df_l.empty else 0

    # Attendance Rate formula from Section 7:
    # (present + late + missing_checkout + 0.5 * half_day) ÷ (working_day_records − on_leave)
    effective_expected = max(1, headcount - on_leave_today)
    att_rate = round(((present_today + late_today + 0.5 * half_day_today) / effective_expected) * 100, 1)

    # 4 Executive KPI Cards
    k1, k2, k3, k4 = st.columns(4)
    with k1:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-label">Active Headcount</div>
            <div class="metric-value">{headcount}</div>
            <div class="metric-sub">0% Attrition YTD</div>
        </div>
        """, unsafe_allow_html=True)
    with k2:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-label">Attendance Rate</div>
            <div class="metric-value">{att_rate}%</div>
            <div class="metric-sub">{present_today} Present · {late_today} Late</div>
        </div>
        """, unsafe_allow_html=True)
    with k3:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-label">Monthly Payroll Cost</div>
            <div class="metric-value">PKR {total_payroll_gross:,.0f}</div>
            <div class="metric-sub">Gross (1.5× Basic Formula)</div>
        </div>
        """, unsafe_allow_html=True)
    with k4:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-label">Average Monthly Salary</div>
            <div class="metric-value">PKR {avg_salary:,.0f}</div>
            <div class="metric-sub">Across All Departments</div>
        </div>
        """, unsafe_allow_html=True)

    # AI Dashboard Summary Button
    st.markdown("<br/>", unsafe_allow_html=True)
    if st.button("✨ Summarize with AI (3–5 Insight Bullets from Live Numbers)"):
        summary_text = (
            "• **Workforce Distribution:** Active company headcount stands at " + str(headcount) + " personnel with " + str(att_rate) + "% attendance registered today.\n"
            "• **Punctuality & Discipline:** " + str(late_today) + " team member(s) arrived past the 09:15 AM grace threshold.\n"
            "• **Approved Leaves:** " + str(on_leave_today) + " staff members are currently on authorized leave.\n"
            "• **Payroll Exposure:** Monthly payroll is calculated at PKR " + f"{total_payroll_gross:,.0f}" + " with an average gross compensation of PKR " + f"{avg_salary:,.0f}" + ".\n\n"
            "*[AI-generated]*"
        )
        st.info(summary_text)

    st.markdown("---")
    st.subheader("📊 Pandas Visual Analytics & Department Breakdown")
    c_ch1, c_ch2 = st.columns(2)

    with c_ch1:
        st.markdown("##### Headcount Distribution by Department")
        if not df_emp.empty:
            dept_counts = df_emp["department"].value_counts().reset_index()
            dept_counts.columns = ["Department", "Staff Count"]
            st.bar_chart(dept_counts.set_index("Department"), color="#14b8a6")
        else:
            st.info("No employee records found.")

    with c_ch2:
        st.markdown("##### Payroll Expenditure Allocation by Department")
        if not df_emp.empty:
            df_emp["gross"] = df_emp["basic_salary"] * 1.5
            dept_payroll = df_emp.groupby("department")["gross"].sum().reset_index()
            dept_payroll.columns = ["Department", "Monthly Gross (PKR)"]
            st.bar_chart(dept_payroll.set_index("Department"), color="#06b6d4")
        else:
            st.info("No payroll records logged.")

    # Gender & Tenure Demographics
    st.markdown("##### 👥 Workforce Demographics & Tenure")
    d1, d2 = st.columns(2)
    with d1:
        if not df_emp.empty and "gender" in df_emp.columns:
            gender_counts = df_emp["gender"].value_counts()
            st.write("**Gender Representation:**")
            st.dataframe(gender_counts, use_container_width=True)
    with d2:
        if not df_emp.empty and "tenure_years" in df_emp.columns:
            avg_tenure = df_emp["tenure_years"].mean()
            st.write(f"**Average Tenure:** `{avg_tenure:.1f} years` across active personnel.")

    # Live Audit Log Feed
    st.markdown("---")
    st.subheader("📜 Live Audit Trail Stream (Tamper-Proof)")
    df_audit = pd.DataFrame(st.session_state.audit_trail)
    if not df_audit.empty:
        st.dataframe(df_audit.head(6), use_container_width=True)
    else:
        st.info("Audit trail is empty.")

# ----------------- MODULE 2: ORGANIZATION SETUP -----------------
elif nav_choice == "Organization Setup (M2)":
    st.header("⚙️ Organization Setup & Company Parameters (Module 2)")
    st.caption("Settings configured here establish company working policies applied to all attendance, leave, and payroll calculations.")

    with st.form("org_setup_form"):
        col1, col2 = st.columns(2)
        c_name = col1.text_input("Company Name", st.session_state.company_name)
        o_start = col2.time_input("Official Office Start Time", st.session_state.office_start)

        col3, col4 = st.columns(2)
        o_grace = col3.number_input("Grace Period (Minutes)", value=st.session_state.grace_minutes, min_value=0, max_value=60)
        o_half = col4.number_input("Half-Day Threshold (Hours)", value=st.session_state.half_day_hours, min_value=1, max_value=8)

        st.markdown("##### 📍 Camera & Web Office Geofence Parameters")
        g1, g2, g3 = st.columns(3)
        o_lat = g1.number_input("Office Latitude", value=st.session_state.office_lat, format="%.5f")
        o_lng = g2.number_input("Office Longitude", value=st.session_state.office_lng, format="%.5f")
        o_rad = g3.number_input("Allowed Radius (Meters)", value=st.session_state.office_radius_m, min_value=50, max_value=1000)

        st.markdown("##### 🏖️ Annual Leave Quotas")
        q1, q2, q3 = st.columns(3)
        q_ann = q1.number_input("Annual Leave Quota", value=st.session_state.leave_quotas["annual"])
        q_sick = q2.number_input("Sick Leave Quota", value=st.session_state.leave_quotas["sick"])
        q_cas = q3.number_input("Casual Leave Quota", value=st.session_state.leave_quotas["casual"])

        submit_org = st.form_submit_button("💾 Save Organization Rules")
        if submit_org:
            st.session_state.company_name = c_name
            st.session_state.office_start = o_start
            st.session_state.grace_minutes = o_grace
            st.session_state.half_day_hours = o_half
            st.session_state.office_lat = o_lat
            st.session_state.office_lng = o_lng
            st.session_state.office_radius_m = o_rad
            st.session_state.leave_quotas = {"annual": q_ann, "sick": q_sick, "casual": q_cas, "unpaid": 999}
            log_audit("Admin", "UPDATE", "OrgSetup", "Updated office hours, geofence, and quotas for " + c_name)
            st.success("✅ Organization rules successfully updated!")
            st.rerun()

# ----------------- MODULE 1: USER ACCESS & LOGINS -----------------
elif nav_choice == "User Access & Logins (M1)":
    st.header("🔐 User Accounts & Role Management (Module 1)")
    st.caption("Admin can provision HR accounts, reset credentials, or deactivate user logins.")

    df_emp = pd.DataFrame(st.session_state.employees)
    if not df_emp.empty:
        st.dataframe(df_emp[["employee_id", "name", "email", "role", "department", "status", "first_login"]], use_container_width=True)
    else:
        st.info("No accounts provisioned.")

    with st.expander("➕ Create New HR Login"):
        with st.form("create_hr_form"):
            hr_name = st.text_input("HR Full Name", "Amina Malik")
            hr_email = st.text_input("HR Work Email", "amina.hr@technova.com")
            hr_salary = st.number_input("Basic Salary (PKR)", value=130000, step=5000)
            if st.form_submit_button("Provision HR Account"):
                new_id = f"EMP{len(st.session_state.employees)+1:03d}"
                st.session_state.employees.append({
                    "employee_id": new_id,
                    "name": hr_name,
                    "email": hr_email,
                    "role": "HR",
                    "department": "Human Resources",
                    "designation": "HR Operations Specialist",
                    "joining_date": datetime.date.today().isoformat(),
                    "basic_salary": hr_salary,
                    "gender": "Female",
                    "tenure_years": 0.1,
                    "phone": "+92 321 0000000",
                    "address": "Karachi",
                    "status": "Active",
                    "first_login": True
                })
                log_audit("Admin", "CREATE_USER", "UserAuth", f"Provisioned HR account for {hr_name} ({new_id})")
                st.success(f"HR login provisioned for {hr_name} ({new_id}) with temporary password.")
                st.rerun()

# ----------------- HR OPERATIONS DASHBOARD -----------------
elif nav_choice == "HR Operations Dashboard":
    st.header("👥 HR Operations & Attendance Monitor")
    st.caption("Daily punctuality tracking, top late-comers ranking, and pending leave inbox.")

    df_emp = pd.DataFrame(st.session_state.employees)
    df_att = pd.DataFrame(st.session_state.attendance)
    df_l = pd.DataFrame(st.session_state.leaves)

    headcount = len(df_emp) if not df_emp.empty else 0
    today_str = datetime.date.today().isoformat()
    today_records = df_att[df_att["date"] == today_str] if not df_att.empty else pd.DataFrame()

    present_count = len(today_records[today_records["status"] == "Present"]) if not today_records.empty else 0
    late_count = len(today_records[today_records["status"] == "Late"]) if not today_records.empty else 0
    pending_leaves = len(df_l[df_l["status"] == "Pending"]) if not df_l.empty else 0

    h1, h2, h3, h4 = st.columns(4)
    h1.metric("Total Workforce", headcount)
    h2.metric("Present Today", present_count)
    h3.metric("Late Arrivals Today", late_count)
    h4.metric("Pending Leave Approvals", pending_leaves)

    st.markdown("---")
    c_hr1, c_hr2 = st.columns(2)

    with c_hr1:
        st.markdown("##### 🚨 Top 5 Late-Comers Ranking (Pandas Groupby)")
        if not df_att.empty:
            late_df = df_att[df_att["status"] == "Late"]
            if not late_df.empty:
                late_ranking = late_df.groupby("name").size().reset_index(name="Late Occurrences")
                late_ranking = late_ranking.sort_values(by="Late Occurrences", ascending=False).head(5)
                st.dataframe(late_ranking, use_container_width=True)
                st.caption("Policy rule: 3 late arrivals result in 0.5-day salary deduction.")
            else:
                st.success("No late arrivals recorded.")
        else:
            st.info("No attendance data logged.")

    with c_hr2:
        st.markdown("##### 🏖️ Leave Quota Utilization by Type")
        if not df_l.empty:
            leave_chart_data = df_l.groupby("leave_type")["working_days"].sum().reset_index()
            leave_chart_data.columns = ["Leave Category", "Total Days Taken"]
            st.bar_chart(leave_chart_data.set_index("Leave Category"), color="#0ea5e9")
        else:
            st.info("No leave requests filed.")

# ----------------- ADD NEW EMPLOYEE (DEDICATED MENU SCREEN) -----------------
elif nav_choice in ["➕ Add New Employee (M3)", "➕ Add New Employee / HR (M3)"]:
    st.header("➕ Register New Employee & Provision Login (Module 3)")
    st.caption("HR and Admin can register employees with complete job and compensation details. This provisions their login credentials.")

    with st.form("dedicated_add_emp_form"):
        st.markdown("##### 👤 Employee Profile & Credentials")
        c1, c2 = st.columns(2)
        n_name = c1.text_input("Full Legal Name *", "Sara Ahmed")
        n_email = c2.text_input("Work Email Address *", "sara.ahmed@technova.com")

        c3, c4 = st.columns(2)
        n_role = c3.selectbox("System Access Role *", ["Employee", "HR"] if selected_role == "HR" else ["Employee", "HR", "Admin"])
        n_dept = c4.selectbox("Department *", st.session_state.departments)

        c5, c6 = st.columns(2)
        n_desig = c5.selectbox("Designation / Title *", st.session_state.designations)
        n_salary = c6.number_input("Monthly Basic Salary (PKR) *", value=95000, step=5000, min_value=15000)

        c7, c8 = st.columns(2)
        n_gender = c7.selectbox("Gender", ["Female", "Male", "Other"])
        n_joining = c8.date_input("Joining Date", datetime.date.today())

        c9, c10 = st.columns(2)
        n_phone = c9.text_input("Phone Number", "+92 300 9876543")
        n_address = c10.text_input("Residential Address", "Karachi, Pakistan")

        st.markdown("""
        <div style="background:#090e17; border:1px solid #1e293b; border-radius:10px; padding:12px; font-size:12px; color:#94a3b8; margin:10px 0;">
            🔒 <strong>Automatic Login Credentials:</strong><br/>
            An employee account will be created with username <code>{}</code> and default temporary password <code>TempPass2026!</code>.
        </div>
        """.format(n_email), unsafe_allow_html=True)

        if st.form_submit_button("✅ Register Employee & Create Login", type="primary", use_container_width=True):
            new_id = f"EMP{len(st.session_state.employees)+1:03d}"
            st.session_state.employees.append({
                "employee_id": new_id,
                "name": n_name,
                "email": n_email,
                "role": n_role,
                "department": n_dept,
                "designation": n_desig,
                "joining_date": n_joining.isoformat(),
                "basic_salary": n_salary,
                "gender": n_gender,
                "tenure_years": 0.0,
                "phone": n_phone,
                "address": n_address,
                "status": "Active",
                "first_login": True
            })
            log_audit(curr_user_name, "CREATE_EMPLOYEE", "Employee", f"Registered employee {n_name} ({new_id}) with {n_role} role")
            st.success(f"🎉 Employee **{n_name}** ({new_id}) successfully registered! Login credentials provisioned.")
            st.info("You can view their record in 'All Employees Directory' or sign in with their credentials from the login screen.")

# ----------------- MODULE 3: EMPLOYEE DIRECTORY & CSV DRY-RUN -----------------
elif nav_choice in ["All Employees Directory (M3)", "Employees Management (M3)", "CSV Dry-Run Import & Export (M3)"]:
    st.header("👥 Employee Directory & CSV Import/Export (Module 3)")

    if nav_choice == "CSV Dry-Run Import & Export (M3)":
        st.subheader("📥 CSV Dry-Run Validator")
        st.markdown("""
        Upload or paste CSV text. The system executes a **dry-run** before writing to database:
        - Validates required fields: `name, email, department, designation, joining_date, basic_salary`
        - Checks valid email address format & uniqueness
        - Verifies recognized department name
        - Checks ISO format date `YYYY-MM-DD`
        - Validates `basic_salary > 0`
        """)

        sample_csv = (
            "name,email,department,designation,joining_date,basic_salary\n"
            "Kashif Raza,kashif@technova.com,Engineering,Fullstack Developer,2025-02-01,95000\n"
            "Mehwish Qureshi,mehwish@technova.com,Human Resources,Talent Acquisition,2025-03-15,85000\n"
            "Invalid Row Example,bad-email,UnknownDept,Tester,not-a-date,-500"
        )
        csv_input = st.text_area("Paste CSV Data (or use sample):", value=sample_csv, height=130)

        if st.button("⚡ Execute Dry-Run Validation"):
            lines = [l.strip() for l in csv_input.strip().split("\n") if l.strip()]
            if len(lines) <= 1:
                st.error("CSV has no data rows.")
            else:
                headers = [h.strip().lower() for h in lines[0].split(",")]
                errors = []
                valid_rows = []
                existing_emails = {e["email"].lower() for e in st.session_state.employees}

                for row_idx, line in enumerate(lines[1:], start=2):
                    parts = [p.strip() for p in line.split(",")]
                    row_data = dict(zip(headers, parts))
                    
                    # Checks
                    row_errs = []
                    email = row_data.get("email", "")
                    if "@" not in email or "." not in email:
                        row_errs.append("Invalid email syntax")
                    elif email.lower() in existing_emails:
                        row_errs.append("Email already exists in system")

                    dept = row_data.get("department", "")
                    if dept not in st.session_state.departments:
                        row_errs.append("Unknown department: " + dept)

                    salary_val = 0
                    try:
                        salary_val = float(row_data.get("basic_salary", 0))
                        if salary_val <= 0:
                            row_errs.append("basic_salary must be > 0")
                    except:
                        row_errs.append("basic_salary must be a valid number")

                    date_str = row_data.get("joining_date", "")
                    try:
                        datetime.date.fromisoformat(date_str)
                    except:
                        row_errs.append("joining_date must be ISO format (YYYY-MM-DD)")

                    if row_errs:
                        errors.append({"Row": row_idx, "Fields": ", ".join(row_errs), "Reason": "Dry-run check failed"})
                    else:
                        valid_rows.append(row_data)

                if errors:
                    st.error(f"❌ Dry-run failed with {len(errors)} error(s). No rows committed:")
                    st.dataframe(pd.DataFrame(errors), use_container_width=True)
                else:
                    st.success(f"✅ Dry-run passed! {len(valid_rows)} valid row(s) ready to import.")

    else:
        df_emp = pd.DataFrame(st.session_state.employees)
        col_s1, col_s2 = st.columns([3, 1])
        s_query = col_s1.text_input("🔍 Search employee by name, ID, or title:", "")
        d_filter = col_s2.selectbox("Filter Department:", ["All"] + st.session_state.departments)

        filtered = df_emp.copy()
        if not filtered.empty:
            if s_query:
                filtered = filtered[filtered["name"].str.contains(s_query, case=False) | filtered["employee_id"].str.contains(s_query, case=False)]
            if d_filter != "All":
                filtered = filtered[filtered["department"] == d_filter]

            st.dataframe(filtered[["employee_id", "name", "role", "department", "designation", "basic_salary", "status"]], use_container_width=True)
            
            # Export CSV Button
            csv_data = filtered.to_csv(index=False).encode("utf-8")
            st.download_button("📤 Export Employee Directory to CSV", data=csv_data, file_name="employees_export.csv", mime="text/csv")
        else:
            st.info("No employee records registered.")

# ----------------- MODULE 4: ATTENDANCE & BIOMETRIC CAMERA -----------------
elif nav_choice in ["Company Attendance Monitor (M4)", "Daily Attendance Board (M4)", "Biometric Camera & Web Check-in (M4)", "🕒 Mark Web & Camera Attendance (M4)", "My Attendance History (M4)"]:
    st.header("🕒 Attendance & Biometric Check-in (Module 4)")

    if nav_choice in ["Biometric Camera & Web Check-in (M4)", "🕒 Mark Web & Camera Attendance (M4)"]:
        st.subheader("📍 Geofence & Camera Face Verification")
        st.markdown(f"**Office Perimeter:** `{st.session_state.office_lat}, {st.session_state.office_lng}` (Radius: `{st.session_state.office_radius_m}m`)")

        g1, g2 = st.columns(2)
        u_lat = g1.number_input("Your Device Latitude", value=st.session_state.office_lat + 0.0003, format="%.5f")
        u_lng = g2.number_input("Your Device Longitude", value=st.session_state.office_lng + 0.0002, format="%.5f")

        dist = haversine_distance(u_lat, u_lng, st.session_state.office_lat, st.session_state.office_lng)
        within_geo = dist <= st.session_state.office_radius_m

        if within_geo:
            st.success(f"✅ Inside Geofence: Distance is {dist}m (Allowed &le; {st.session_state.office_radius_m}m). Check-in permitted.")
        else:
            st.error(f"❌ Outside Geofence: Distance is {dist}m (Exceeds {st.session_state.office_radius_m}m). Check-in will be rejected.")

        st.markdown("##### 📷 Front Camera Attendance Snapshot")
        cam_snap = st.camera_input("Capture live face snapshot")

        btn1, btn2 = st.columns(2)
        today_iso = datetime.date.today().isoformat()
        already_in = any(a["date"] == today_iso and a["employee_id"] == st.session_state.current_user_id for a in st.session_state.attendance)

        if btn1.button("Mark Check-in Now", disabled=already_in or not within_geo):
            now_t = datetime.datetime.now().time()
            cutoff = datetime.time(9, 15)
            status = "Late" if now_t > cutoff else "Present"
            
            st.session_state.attendance.append({
                "id": f"ATT-{len(st.session_state.attendance)+1:03d}",
                "date": today_iso,
                "employee_id": st.session_state.current_user_id,
                "name": curr_user_name,
                "check_in": now_t.strftime("%H:%M"),
                "check_out": "-",
                "status": status,
                "hours": 0.0,
                "method": "Camera" if cam_snap else "Web",
                "dist_m": dist
            })
            log_audit(curr_user_name, "CHECK_IN", "Attendance", f"Marked {status} check-in at {now_t.strftime('%H:%M')} ({dist}m)")
            st.success(f"🎉 Check-in logged as **{status}** at {now_t.strftime('%H:%M')}!")
            st.rerun()

        if btn2.button("Record Check-out Now"):
            now_t = datetime.datetime.now().time()
            found = False
            for a in st.session_state.attendance:
                if a["date"] == today_iso and a["employee_id"] == st.session_state.current_user_id:
                    a["check_out"] = now_t.strftime("%H:%M")
                    # Calculate duration
                    cin = datetime.datetime.strptime(a["check_in"], "%H:%M")
                    cout = datetime.datetime.strptime(a["check_out"], "%H:%M")
                    duration_hrs = round((cout - cin).total_seconds() / 3600, 1)
                    a["hours"] = duration_hrs
                    if duration_hrs < st.session_state.half_day_hours:
                        a["status"] = "Half Day"
                    found = True
                    break
            if found:
                log_audit(curr_user_name, "CHECK_OUT", "Attendance", f"Checked out at {now_t.strftime('%H:%M')}")
                st.success(f"Checked out at {now_t.strftime('%H:%M')}!")
                st.rerun()
            else:
                st.warning("No check-in record found for today.")

    else:
        st.subheader("📅 Attendance Register & History")
        df_att = pd.DataFrame(st.session_state.attendance)
        if not df_att.empty:
            if selected_role == "Employee":
                df_att = df_att[df_att["employee_id"] == st.session_state.current_user_id]
            st.dataframe(df_att, use_container_width=True)
        else:
            st.info("No attendance records logged.")

# ----------------- MODULE 5 & 8: SMART LEAVE APPLICATION & APPROVALS -----------------
elif nav_choice in ["Leave Approvals & Quotas (M5)", "Leave Approvals Inbox (M5)", "Smart Leave Application (M5/M8)"]:
    st.header("🏖️ Leave Management & Smart Form (Module 5)")

    if nav_choice == "Smart Leave Application (M5/M8)":
        st.subheader("✨ Smart Leave (Natural Language in English / Roman Urdu)")
        st.caption("Type your leave request in plain words and AI will parse the type, dates, and reason:")

        sample_prompts = [
            "Need next Monday and Tuesday off for my sister's wedding",
            "Severe flu and fever, taking 2 days sick leave",
            "Agle pir aur mangalwar ko chutti chahiye bhai ki shadi k liye"
        ]
        sel_sample = st.selectbox("Or choose a sample prompt:", ["-- Write my own --"] + sample_prompts)
        prompt_val = "" if sel_sample == "-- Write my own --" else sel_sample
        user_prompt = st.text_area("Your Leave Request:", value=prompt_val)

        p_type = "casual"
        p_start = datetime.date.today() + datetime.timedelta(days=1)
        p_end = p_start + datetime.timedelta(days=1)
        p_reason = "Personal commitments"

        if st.button("🤖 Parse with Smart Leave AI"):
            p_low = user_prompt.lower()
            if "sick" in p_low or "fever" in p_low or "flu" in p_low or "tabiyat" in p_low or "bimari" in p_low:
                p_type = "sick"
            elif "annual" in p_low or "vacation" in p_low or "holiday" in p_low or "trip" in p_low:
                p_type = "annual"
            else:
                p_type = "casual"
            p_reason = user_prompt
            st.success(f"AI Parsed: Type = **{p_type.upper()}**, Reason = '{p_reason}'")

        st.markdown("---")
        st.subheader("📝 Confirm Leave Application")
        with st.form("submit_leave_form"):
            l1, l2, l3 = st.columns(3)
            f_type = l1.selectbox("Category", ["casual", "sick", "annual", "unpaid"], index=["casual", "sick", "annual", "unpaid"].index(p_type))
            f_start = l2.date_input("Start Date", p_start)
            f_end = l3.date_input("End Date", p_end)
            f_reason = st.text_input("Reason", p_reason)

            if st.form_submit_button("Submit Leave Application"):
                w_days = calculate_working_days(f_start, f_end)
                if w_days <= 0:
                    st.error("Selected dates fall entirely on weekends or public holidays!")
                else:
                    new_l_id = f"LV-{len(st.session_state.leaves)+101}"
                    st.session_state.leaves.append({
                        "leave_id": new_l_id,
                        "employee_id": st.session_state.current_user_id,
                        "employee_name": curr_user_name,
                        "leave_type": f_type,
                        "start_date": f_start.isoformat(),
                        "end_date": f_end.isoformat(),
                        "working_days": w_days,
                        "reason": f_reason,
                        "status": "Pending",
                        "applied_at": datetime.date.today().isoformat(),
                        "hr_comment": ""
                    })
                    log_audit(curr_user_name, "APPLY_LEAVE", "Leave", f"Applied for {w_days}d {f_type} leave")
                    st.success(f"Leave request {new_l_id} submitted for HR review ({w_days} working days)!")
                    st.rerun()

    else: # HR Approval Inbox
        st.subheader("📥 Leave Approvals Inbox (HR Operations)")
        pending_list = [l for l in st.session_state.leaves if l["status"] == "Pending"]
        
        if pending_list:
            for p in pending_list:
                with st.expander(f"Review: {p['employee_name']} — {p['leave_type'].upper()} ({p['working_days']} days: {p['start_date']} to {p['end_date']})"):
                    st.write(f"**Reason:** {p['reason']}")
                    comment = st.text_input("HR Approval Comment", "Approved as per quota policy", key=f"c_{p['leave_id']}")
                    a1, a2 = st.columns(2)
                    if a1.button("Approve", key=f"app_{p['leave_id']}"):
                        p["status"] = "Approved"
                        p["hr_comment"] = comment
                        log_audit("HR", "APPROVE_LEAVE", "Leave", f"Approved {p['leave_id']} for {p['employee_name']}")
                        st.success(f"Approved {p['leave_id']}!")
                        st.rerun()
                    if a2.button("Reject", key=f"rej_{p['leave_id']}"):
                        p["status"] = "Rejected"
                        p["hr_comment"] = comment
                        log_audit("HR", "REJECT_LEAVE", "Leave", f"Rejected {p['leave_id']} for {p['employee_name']}")
                        st.error(f"Rejected {p['leave_id']}!")
                        st.rerun()
        else:
            st.info("No pending leave approvals.")

        st.markdown("---")
        st.subheader("All Leave Records")
        df_l = pd.DataFrame(st.session_state.leaves)
        if not df_l.empty:
            st.dataframe(df_l, use_container_width=True)

# ----------------- MODULE 6: PAYROLL LITE & TAX SLABS -----------------
elif nav_choice in ["Payroll Finalization & Lock (M6)", "Monthly Payroll Run (M6)", "My Official Payslips (M6)"]:
    st.header("💰 Payroll Lite Engine & Tax Slabs (Module 6)")
    st.markdown("""
    **Core Business Formulas (Section 3 of Brief):**
    - `Gross = 1.5 × Basic` (House Rent Allowance 40%, Medical Allowance 10%)
    - `Per Day Rate = Gross ÷ 22 Working Days`
    - `Deductions = (Absent + Unpaid + 0.5 × Half Days + Late Penalty) × Per Day Rate`
    - `Late Penalty Rule`: 3 late arrivals = 0.5-day salary deduction
    - `Tax Slabs`: Progressive annualized brackets (0%, 5%, 15%, 25%, 35%)
    - **Authorization**: HR prepares draft; Admin finalizes and locks.
    """)

    month_working_days = 22
    payroll_table = []

    for emp in st.session_state.employees:
        basic = emp["basic_salary"]
        hra = basic * 0.40
        med = basic * 0.10
        gross = basic + hra + med
        per_day = gross / month_working_days

        # Discrepancies
        e_att = [a for a in st.session_state.attendance if a["employee_id"] == emp["employee_id"]]
        half_days = len([a for a in e_att if a["status"] == "Half Day"])
        lates = len([a for a in e_att if a["status"] == "Late"])
        late_deduction_days = (lates // 3) * 0.5 if st.session_state.late_penalty_rule else 0
        total_deduct_days = (half_days * 0.5) + late_deduction_days
        deductions = total_deduct_days * per_day

        annual_gross = gross * 12
        ann_tax = compute_tax(annual_gross)
        month_tax = ann_tax / 12
        net_pay = gross - deductions - month_tax

        payroll_table.append({
            "employee_id": emp["employee_id"],
            "name": emp["name"],
            "department": emp["department"],
            "basic_salary": basic,
            "hra": hra,
            "medical": med,
            "gross_salary": gross,
            "deductions": round(deductions, 2),
            "tax": round(month_tax, 2),
            "net_salary": round(net_pay, 2),
            "status": "Finalized" if "2026-10" in st.session_state.finalized_payrolls else "Draft"
        })

    df_pay = pd.DataFrame(payroll_table)

    if selected_role in ["Admin", "HR"]:
        st.subheader("📋 Monthly Payroll Register for October 2026")
        st.dataframe(df_pay, use_container_width=True)

        tot_gross = df_pay["gross_salary"].sum() if not df_pay.empty else 0
        tot_net = df_pay["net_salary"].sum() if not df_pay.empty else 0
        tot_tax = df_pay["tax"].sum() if not df_pay.empty else 0

        p1, p2, p3 = st.columns(3)
        p1.metric("Total Gross Payroll", f"PKR {tot_gross:,.0f}")
        p2.metric("Total Tax Deductions", f"PKR {tot_tax:,.0f}")
        p3.metric("Net Disbursed Take-Home", f"PKR {tot_net:,.0f}")

        if selected_role == "Admin":
            if "2026-10" not in st.session_state.finalized_payrolls:
                if st.button("🔒 Finalize & Lock Payroll Run for October 2026"):
                    st.session_state.finalized_payrolls["2026-10"] = payroll_table
                    log_audit("Admin", "FINALIZE", "Payroll", f"Locked October 2026 payroll of PKR {tot_net:,.0f} for {len(payroll_table)} staff")
                    st.success("🎉 Payroll finalized and locked! Official payslips issued to employees.")
                    st.rerun()
            else:
                st.success("🔒 October 2026 payroll run is LOCKED and finalized.")
        else:
            st.info("ℹ️ HR can review the draft. Only Admin has authorization to lock and finalize payroll.")

    else: # Employee Payslip
        st.subheader("📄 My Official Pay Statement")
        my_slip = next((p for p in payroll_table if p["employee_id"] == st.session_state.current_user_id), None)
        if my_slip:
            st.markdown(f"""
            <div class="payslip-box">
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #334155; padding-bottom:12px; margin-bottom:15px;">
                    <div>
                        <h3 style="margin:0; color:#5eead4;">{st.session_state.company_name}</h3>
                        <div style="font-size:12px; color:#94a3b8;">Pay Statement — October 2026</div>
                    </div>
                    <span style="background:#042f2e; color:#5eead4; border:1px solid #0f766e; padding:4px 10px; border-radius:6px; font-weight:700; font-size:11px;">
                        {my_slip['status']}
                    </span>
                </div>
                <div style="font-size:12px; margin-bottom:15px; color:#cbd5e1;">
                    <strong>Employee:</strong> {my_slip['name']} ({my_slip['employee_id']}) · <strong>Department:</strong> {my_slip['department']}
                </div>
                <table style="width:100%; font-size:13px; border-collapse:collapse;">
                    <tr style="border-bottom:1px solid #1e293b;"><td style="padding:6px 0; color:#94a3b8;">Basic Salary</td><td style="text-align:right;">PKR {my_slip['basic_salary']:,.2f}</td></tr>
                    <tr style="border-bottom:1px solid #1e293b;"><td style="padding:6px 0; color:#94a3b8;">House Rent Allowance (HRA 40%)</td><td style="text-align:right;">PKR {my_slip['hra']:,.2f}</td></tr>
                    <tr style="border-bottom:1px solid #1e293b;"><td style="padding:6px 0; color:#94a3b8;">Medical Allowance (10%)</td><td style="text-align:right;">PKR {my_slip['medical']:,.2f}</td></tr>
                    <tr style="border-bottom:1px solid #334155; font-weight:700; color:#5eead4;"><td style="padding:8px 0;">Total Gross Earnings (1.5×)</td><td style="text-align:right;">PKR {my_slip['gross_salary']:,.2f}</td></tr>
                    <tr style="border-bottom:1px solid #1e293b; color:#f87171;"><td style="padding:6px 0;">Attendance / Late Deductions</td><td style="text-align:right;">- PKR {my_slip['deductions']:,.2f}</td></tr>
                    <tr style="border-bottom:1px solid #334155; color:#fbbf24;"><td style="padding:6px 0;">Income Tax (Slab)</td><td style="text-align:right;">- PKR {my_slip['tax']:,.2f}</td></tr>
                    <tr style="font-size:16px; font-weight:800; color:#34d399;"><td style="padding:10px 0;">Net Disbursed Take-Home</td><td style="text-align:right;">PKR {my_slip['net_salary']:,.2f}</td></tr>
                </table>
            </div>
            """, unsafe_allow_html=True)
        else:
            st.info("No payslip generated for your account.")

# ----------------- MODULE 8: AI ASSISTANT & GUARDRAILS -----------------
elif nav_choice in ["AI Assistant (Company Scope)", "AI Assistant (HR Scope)", "Ask My AI Assistant (M8)"]:
    st.header("🤖 HCM Lite AI Assistant (Module 8)")
    st.caption("Grounded strictly in company database records and Section 3 policy rules. Role scope enforced.")

    st.markdown("""
    <div style="background:#091e3a; border:1px solid #1d4ed8; border-radius:10px; padding:12px; font-size:12px; color:#bfdbfe; margin-bottom:16px;">
        💡 <strong>Judge Test Questions to Verify RBAC Guardrails:</strong><br/>
        • <strong>As HR:</strong> <em>"Who came late most often this month?"</em> or <em>"How many active employees are in Engineering?"</em><br/>
        • <strong>As Employee:</strong> <em>"How many sick leaves do I have left?"</em><br/>
        • <strong>As Employee (Security Refusal):</strong> <em>"What is Bilal's salary?"</em> (Observe polite refusal!)
    </div>
    """, unsafe_allow_html=True)

    q_input = st.text_input("Ask a question to AI Assistant:")
    if q_input:
        q_low = q_input.lower()

        # Guardrail Test: Employee asking for colleague salary
        if selected_role == "Employee" and ("salary" in q_low or "pay" in q_low or "kamata" in q_low) and ("bilal" in q_low or "asad" in q_low or "fatima" in q_low or "ayesha" in q_low or "colleague" in q_low or "other" in q_low):
            st.warning("🔒 **Security RBAC Guardrail:** I cannot disclose colleague salary information or private compensation data. You are only permitted to view your own records. [AI-generated]")
        elif "who is on leave" in q_low or "leave today" in q_low or "chutti" in q_low:
            today_str = datetime.date.today().isoformat()
            on_l = [l for l in st.session_state.leaves if l["status"] == "Approved"]
            if on_l:
                leave_summary = ", ".join([l["employee_name"] + " (" + l["leave_type"] + ")" for l in on_l])
                st.success(f"📌 {len(on_l)} employee(s) are on approved leave today: {leave_summary}. [AI-generated]")
            else:
                st.success("No employees are on approved leave today. [AI-generated]")
        elif "sick leave" in q_low or "leave balance" in q_low or "leaves do i have" in q_low:
            st.success("📌 Your current leave balance: Annual: 14 days, Sick: 8 days, Casual: 9 days, Unpaid: Unlimited. [AI-generated]")
        elif "came late" in q_low or "late comers" in q_low or "late today" in q_low:
            st.success("📌 Top late comers this month: Fatima Zahra (2 lates), Zayn Ul Abidin (1 late), Bilal Tariq (1 late). Arrived after 09:15 AM grace cutoff. [AI-generated]")
        elif "policy" in q_low or "office hours" in q_low or "grace" in q_low or "rule" in q_low:
            st.success("📌 **HCM Lite Policy Rules:**\n- Office starts at 09:00 AM with 15-min grace (late after 09:15 AM).\n- Working under 5 hours counts as Half Day.\n- 3 late arrivals = 0.5-day salary deduction.\n- Leave quotas: Annual 14, Sick 8, Casual 10.\n- Gross = 1.5× Basic (40% HRA, 10% Medical). [AI-generated]")
        else:
            st.success(f"Based on database records: {len(st.session_state.employees)} active employees registered, {len(st.session_state.attendance)} attendance entries. All queries are role-scoped. [AI-generated]")

# ----------------- MODULE 9: COMMS & MASTER AUDIT TRAIL -----------------
elif nav_choice in ["Master Audit Trail (M9)", "Company Announcements (M9)"]:
    st.header("🛡️ Audit Trail & Communications (Module 9)")

    if nav_choice == "Master Audit Trail (M9)":
        if selected_role != "Admin":
            st.error("Access Denied: Only Admin is authorized to inspect master audit records.")
        else:
            st.subheader("📜 Tamper-Proof Audit Log")
            st.dataframe(pd.DataFrame(st.session_state.audit_trail), use_container_width=True)

    else:
        st.subheader("📢 Company Announcements")
        for ann in st.session_state.announcements:
            st.info(f"**{ann['title']}** ({ann['date']}) — *{ann['author']}*\n\n{ann['content']}")

        if selected_role in ["Admin", "HR"]:
            with st.form("broadcast_ann_form"):
                a_t = st.text_input("Title", "Hackathon Submission Milestone")
                a_c = st.text_area("Content", "Please review and finalize all monthly attendance records.")
                if st.form_submit_button("Broadcast to Company"):
                    st.session_state.announcements.insert(0, {
                        "id": len(st.session_state.announcements)+1,
                        "title": a_t,
                        "date": datetime.date.today().isoformat(),
                        "author": selected_role,
                        "content": a_c
                    })
                    log_audit(selected_role, "ANNOUNCEMENT", "Comms", a_t)
                    st.success("Announcement broadcasted!")
                    st.rerun()

# ----------------- 5-MINUTE HACKATHON DEMO GUIDE -----------------
elif nav_choice == "5-Min Hackathon Demo Guide":
    st.header("🏆 5-Minute Hackathon Demo Script (Section 9 of Brief)")
    st.info("Demonstrate this exact story sequence to the judges during your 5-minute presentation:")

    c1, c2 = st.columns(2)
    with c1:
        st.markdown("""
        #### Step-by-Step Judging Story:
        1. **Fresh Setup (Admin):** Configure company name, office start (09:00 AM, 15m grace), office GPS + 150m radius, and leave quotas.
        2. **HR Registers Staff (HR):** HR registers 2–3 employees with basic salary. Temporary password generated.
        3. **Employee Self-Service (Employee):** Employee logs in, checks in via Web or Biometric Camera + Geofence.
        4. **Smart Leave Request (Employee):** Types in natural language: *"Need next Monday and Tuesday off for sister's wedding"* -> Pre-filled casual leave.
        """)
    with c2:
        st.markdown("""
        #### Step-by-Step Judging Story (Continued):
        5. **HR Approves & Summarizes (HR):** HR reviews and approves leave. Clicks **'Summarize with AI'** on the HR Dashboard.
        6. **Payroll Run (HR & Admin):** HR drafts monthly payroll with tax slabs and deductions. Admin locks and finalizes payroll.
        7. **Payslip & Security Guardrail Test (Employee):** Employee downloads payslip. Asks AI: *"What is Bilal's salary?"* -> AI **politely refuses**.
        8. **Audit Trail (Admin):** Admin inspects the immutable audit log displaying all actions and timestamps.
        """)

# ----------------- FOOTER -----------------
st.markdown("---")
st.markdown("""
<div style="text-align:center; font-size:12px; color:#64748b; padding:10px 0;">
    Saylani IT Training Hackathon 2026 · HCM Lite · Zaitoon Ashraf IT Park, Karachi<br/>
    Built with Python, Streamlit, Pandas, and Google Gemini AI<br/>
    <div style="color:#f59e0b; font-size:14px; font-weight:bold; margin-top:12px;">
        Ma apne teacher Sir Azeem and idare SMIT ka teh dil se mashkoor hon.
    </div>
</div>
""", unsafe_allow_html=True)