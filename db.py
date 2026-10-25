"""
db.py — Supabase persistence layer for HCM Lite (Streamlit).

How it works
------------
* The app keeps using st.session_state exactly as before.
* load_into_session() runs once per browser session: it pulls saved data from
  Supabase (or seeds the demo data into Supabase the very first time).
* sync() runs at the start and end of every script run: it compares the session
  data with what was last saved and only sends the rows that changed
  (inserts, updates, deletes).

Needs only `requests` (already installed with Streamlit) and two secrets:
    SUPABASE_URL  = "https://<project-ref>.supabase.co"
    SUPABASE_KEY  = "<anon / publishable key>"
"""

import json
import datetime

import requests
import streamlit as st

# table -> (primary key column, columns)
TABLES = {
    "employees": ("employee_id", [
        "employee_id", "name", "email", "role", "department", "designation",
        "joining_date", "basic_salary", "gender", "tenure_years", "phone",
        "address", "status", "first_login", "password_hash", "recovery_hash",
    ]),
    "attendance": ("id", [
        "id", "date", "employee_id", "name", "check_in", "check_out",
        "status", "hours", "method", "dist_m",
    ]),
    "leaves": ("leave_id", [
        "leave_id", "employee_id", "employee_name", "leave_type", "start_date",
        "end_date", "working_days", "reason", "status", "applied_at", "hr_comment",
    ]),
    "announcements": ("id", ["id", "title", "date", "author", "content"]),
    "finalized_payrolls": ("month", ["month", "data"]),
}

AUDIT_COLS = ["timestamp", "actor", "action", "entity", "details"]

SETTING_KEYS = [
    "company_name", "office_start", "grace_minutes", "half_day_hours",
    "weekend_days", "office_lat", "office_lng", "office_radius_m",
    "late_penalty_rule", "departments", "designations", "leave_quotas",
    "public_holidays",
]

UPSERT = "resolution=merge-duplicates,return=minimal"


# ----------------------------------------------------------------- low level
def _config():
    try:
        url = str(st.secrets["SUPABASE_URL"]).strip().rstrip("/")
        key = str(st.secrets["SUPABASE_KEY"]).strip()
        if url and key:
            return url, key
    except Exception:
        pass
    return None


def enabled():
    return _config() is not None


def _req(method, path, params=None, body=None, prefer=None):
    url, key = _config()
    headers = {"apikey": key, "Content-Type": "application/json"}
    if key.startswith("eyJ"):  # legacy JWT keys also go in Authorization
        headers["Authorization"] = "Bearer " + key
    if prefer:
        headers["Prefer"] = prefer
    r = requests.request(
        method,
        f"{url}/rest/v1/{path}",
        headers=headers,
        params=params,
        data=json.dumps(body, default=str) if body is not None else None,
        timeout=20,
    )
    if not r.ok:
        raise RuntimeError(f"{path}: HTTP {r.status_code} {r.text[:200]}")
    return r.json() if r.text else None


def _get(table, order):
    return _req("GET", table, params={"select": "*", "order": order}) or []


def _clean(table, row):
    _, cols = TABLES[table]
    return {c: row.get(c) for c in cols}


def _dump(row):
    return json.dumps(row, sort_keys=True, default=str)


# ------------------------------------------------------------------ settings
def _settings_from_session():
    ss, out = st.session_state, {}
    for k in SETTING_KEYS:
        if k in ss:
            v = ss[k]
            if isinstance(v, datetime.time):
                v = v.strftime("%H:%M")
            out[k] = v
    return out


def _apply_settings(data):
    for k, v in (data or {}).items():
        if k not in SETTING_KEYS:
            continue
        if k == "office_start" and isinstance(v, str):
            h, m = v.split(":")[:2]
            v = datetime.time(int(h), int(m))
        st.session_state[k] = v


# ---------------------------------------------------------------- sync parts
def _payroll_rows():
    d = st.session_state.get("finalized_payrolls", {}) or {}
    return [{"month": m, "data": rows} for m, rows in d.items()]


def _sync_keyed(table, rows, synced, dry=False):
    key, _ = TABLES[table]
    cur = {}
    for r in rows:
        c = _clean(table, r)
        cur[str(c[key])] = c
    old = synced.get(table, {})
    upserts = [c for k, c in cur.items() if old.get(k) != _dump(c)]
    deletes = [k for k in old if k not in cur]
    if not dry:
        if upserts:
            _req("POST", table, params={"on_conflict": key}, body=upserts, prefer=UPSERT)
        if deletes:
            quoted = ",".join('"' + d.replace('"', "") + '"' for d in deletes)
            _req("DELETE", table, params={key: f"in.({quoted})"})
    synced[table] = {k: _dump(c) for k, c in cur.items()}


def _audit_keyed(rows):
    seen, out = {}, []
    for r in reversed(rows):  # oldest first so occurrence numbers stay stable
        base = "|".join(str(r.get(c, "")) for c in AUDIT_COLS)
        n = seen.get(base, 0)
        seen[base] = n + 1
        out.append((f"{base}#{n}", r))
    return out


def _sync_audit(rows, synced, dry=False):
    old = synced.get("audit_trail", set())
    keyed = _audit_keyed(rows)
    if not rows and old:
        if not dry:
            _req("DELETE", "audit_trail", params={"id": "gte.0"})
        synced["audit_trail"] = set()
        return
    new = [{c: r.get(c) for c in AUDIT_COLS} for k, r in keyed if k not in old]
    if new and not dry:
        _req("POST", "audit_trail", body=new, prefer="return=minimal")
    synced["audit_trail"] = {k for k, _ in keyed}


def _sync_settings(synced, dry=False):
    data = _settings_from_session()
    dumped = _dump(data)
    if synced.get("settings") != dumped:
        if not dry:
            _req("POST", "app_settings", params={"on_conflict": "id"},
                 body=[{"id": 1, "data": data}], prefer=UPSERT)
        synced["settings"] = dumped


def _run_sync(dry=False):
    ss = st.session_state
    synced = ss.setdefault("db_synced", {})
    _sync_keyed("employees", ss.get("employees", []), synced, dry)
    _sync_keyed("attendance", ss.get("attendance", []), synced, dry)
    _sync_keyed("leaves", ss.get("leaves", []), synced, dry)
    _sync_keyed("announcements", ss.get("announcements", []), synced, dry)
    _sync_keyed("finalized_payrolls", _payroll_rows(), synced, dry)
    _sync_audit(ss.get("audit_trail", []), synced, dry)
    _sync_settings(synced, dry)


# -------------------------------------------------------------------- public
def sync():
    """Save whatever changed since the last sync. Safe to call on every run."""
    ss = st.session_state
    if not enabled() or not ss.get("db_ready"):
        return
    try:
        _run_sync()
        ss.db_error = None
    except Exception as e:  # keep the app alive, show status in sidebar
        ss.db_error = str(e)


def _fmt_ts(value):
    return str(value)[:19].replace("T", " ")


def load_into_session():
    """Run once per browser session: pull saved data, or seed demo data once."""
    ss = st.session_state
    if ss.get("db_ready") or not enabled():
        return
    try:
        flag = _req("GET", "app_settings", params={"select": "data", "id": "eq.2"})
        if not flag:
            # First ever run: store the demo data that the app just created.
            ss.db_synced = {}
            ss.db_ready = True
            sync()
            if ss.get("db_error"):
                ss.db_ready = False
                return
            _req("POST", "app_settings", params={"on_conflict": "id"},
                 body=[{"id": 2, "data": {"seeded": True}}], prefer=UPSERT)
            return

        ss.employees = _get("employees", "employee_id.asc")
        ss.attendance = _get("attendance", "date.asc,id.asc")
        ss.leaves = _get("leaves", "leave_id.asc")
        ss.announcements = _get("announcements", "id.desc")
        ss.finalized_payrolls = {r["month"]: r["data"] for r in _get("finalized_payrolls", "month.asc")}
        ss.audit_trail = [
            {c: (_fmt_ts(r[c]) if c == "timestamp" else r[c]) for c in AUDIT_COLS}
            for r in _get("audit_trail", "id.desc")
        ]
        s = _req("GET", "app_settings", params={"select": "data", "id": "eq.1"})
        if s:
            _apply_settings(s[0]["data"])

        ss.db_synced = {}
        _run_sync(dry=True)  # remember the loaded state without writing it back
        ss.db_ready = True
        ss.db_error = None
    except Exception as e:
        ss.db_ready = False
        ss.db_error = str(e)


def refresh():
    """Save pending changes, then pull the latest data (call this at login)."""
    ss = st.session_state
    if not enabled() or not ss.get("db_ready"):
        return
    sync()
    if ss.get("db_error"):
        return
    ss.db_ready = False
    load_into_session()


def status_badge():
    """Small status line for the sidebar."""
    ss = st.session_state
    if not enabled():
        st.caption("🟡 Database not configured — data lives only in this session")
    elif ss.get("db_error"):
        st.caption("🔴 Database error: " + str(ss.db_error)[:160])
    elif ss.get("db_ready"):
        st.caption("🟢 Supabase connected — changes are saved")
    else:
        st.caption("⚪ Connecting to database…")