"""
Saylani Hackathon 2026 — HCM Lite
AI-Assisted Human Capital Management System (Admin / HR / Employee)
Stack: Python, Streamlit, Pandas, Altair

Run:  streamlit run hcm_lite.py
Optional AI: set env var GEMINI_API_KEY for Gemini replies
             (otherwise a built-in rule-based assistant answers).
"""

import datetime
import json
import math
import os
import re
import urllib.request

import altair as alt
import pandas as pd
import streamlit as st

# ---- Pakistan Standard Time (UTC+5, no DST). Cloud servers run in UTC, so never use naive now().
PKT = datetime.timezone(datetime.timedelta(hours=5))


def now_pkt():
    return datetime.datetime.now(PKT).replace(tzinfo=None)


def today_pkt():
    return now_pkt().date()

# =====================================================================
# PAGE CONFIG
# =====================================================================
st.set_page_config(
    page_title="HCM Lite — Saylani Hackathon 2026",
    page_icon="🏢",
    layout="wide",
    initial_sidebar_state="expanded",
)

# =====================================================================
# STYLING + ANIMATIONS
# =====================================================================
CSS = """
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Great+Vibes&display=swap');
@property --angle { syntax: '<angle>'; initial-value: 0deg; inherits: false; }

:root {
    --bg: #070b14; --panel: #0e1626; --line: #1e293b;
    --teal: #14b8a6; --teal-soft: #5eead4; --violet: #8b5cf6; --pink: #f472b6; --gold: #fcd34d;
    --text: #f1f5f9; --muted: #94a3b8;
    --ease: cubic-bezier(.2,.75,.25,1);
}
html, body, [class*="css"] { font-family: 'Inter', -apple-system, sans-serif; }
html { scroll-behavior: smooth; }
#MainMenu, footer, [data-testid="stDecoration"] { visibility: hidden; }
header[data-testid="stHeader"] { background: transparent; }
body, [data-testid="stAppViewContainer"] { color: var(--text); }
.block-container { padding-top: 4.2rem !important; max-width: 1200px; position: relative; z-index: 1; }

/* custom scrollbar */
::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-thumb { background: linear-gradient(var(--teal), var(--violet)); border-radius: 10px; }
::-webkit-scrollbar-track { background: transparent; }
::selection { background: rgba(20,184,166,.4); }

/* ---------- Animated background ---------- */
.stApp {
    background:
        radial-gradient(900px 500px at 15% 10%, rgba(20,184,166,.20), transparent 60%),
        radial-gradient(800px 500px at 85% 20%, rgba(139,92,246,.18), transparent 60%),
        radial-gradient(900px 600px at 50% 100%, rgba(14,165,233,.15), transparent 60%),
        var(--bg);
    background-size: 140% 140%, 140% 140%, 140% 140%, auto;
    animation: bgShift 18s ease-in-out infinite alternate;
}
.stApp::before {  /* moving grid */
    content: ""; position: fixed; inset: 0; z-index: 0; pointer-events: none; opacity: .5;
    background-image:
        linear-gradient(rgba(94,234,212,.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(94,234,212,.05) 1px, transparent 1px);
    background-size: 56px 56px;
    mask-image: radial-gradient(ellipse at 50% 30%, #000 20%, transparent 75%);
    -webkit-mask-image: radial-gradient(ellipse at 50% 30%, #000 20%, transparent 75%);
    animation: gridMove 14s linear infinite;
}
@keyframes gridMove { to { background-position: 56px 56px, 56px 56px; } }
@keyframes bgShift {
    0%   { background-position: 0% 0%, 100% 0%, 50% 100%, 0 0; }
    100% { background-position: 100% 100%, 0% 100%, 50% 0%, 0 0; }
}

.orb { position: fixed; border-radius: 50%; opacity: .32; pointer-events: none; z-index: 0;
       filter: blur(70px); animation: floaty 14s ease-in-out infinite; }
.orb.o1 { width: 280px; height: 280px; background: #14b8a6; top: 8%;  left: 6%; }
.orb.o2 { width: 320px; height: 320px; background: #8b5cf6; top: 55%; right: 5%; animation-delay: -5s; }
.orb.o3 { width: 220px; height: 220px; background: #0ea5e9; bottom: 5%; left: 38%; animation-delay: -9s; }
@keyframes floaty {
    0%, 100% { transform: translate(0,0) scale(1); }
    33%  { transform: translate(40px,-50px) scale(1.15); }
    66%  { transform: translate(-30px,30px) scale(.9); }
}

/* rising particles */
.ptc { position: fixed; bottom: -20px; width: var(--s); height: var(--s); border-radius: 50%;
       background: rgba(94,234,212,.7); box-shadow: 0 0 12px rgba(94,234,212,.9);
       pointer-events: none; z-index: 0; opacity: 0;
       animation: rise var(--d) linear var(--dl) infinite; }
@keyframes rise {
    0%   { transform: translate(0,0); opacity: 0; }
    10%  { opacity: 1; }
    50%  { transform: translate(34px,-55vh); }
    100% { transform: translate(-24px,-110vh); opacity: 0; }
}

/* ---------- Shared keyframes ---------- */
@keyframes gradShift { 0% { background-position: 0% 50%; } 100% { background-position: 100% 50%; } }
@keyframes fadeUp { from { opacity: 0; transform: translateY(26px); } to { opacity: 1; transform: none; } }
@keyframes slideIn { from { opacity: 0; transform: translateX(-18px); } to { opacity: 1; transform: none; } }
@keyframes popIn { 0% { opacity: 0; transform: scale(.85); } 70% { transform: scale(1.04); } 100% { opacity: 1; transform: scale(1); } }
@keyframes pageEnter { from { opacity: 0; transform: translateY(16px); filter: blur(3px); } to { opacity: 1; transform: none; filter: blur(0); } }
@keyframes glowPulse { 0% { box-shadow: 0 0 18px rgba(20,184,166,.12); } 100% { box-shadow: 0 0 40px rgba(139,92,246,.28); } }
@keyframes logoFloat { 0%,100% { transform: translateY(0) rotate(-1deg); } 50% { transform: translateY(-10px) rotate(1deg); } }
@keyframes spin { to { --angle: 360deg; } }
@keyframes ripple { 0% { transform: scale(.8); opacity: .8; } 100% { transform: scale(2.4); opacity: 0; } }
@keyframes sweep { 0% { transform: translateX(-120%); } 100% { transform: translateX(220%); } }
@keyframes bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
@keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: .25; } }

.fade-up { animation: fadeUp .9s var(--ease) both; }
.d1 { animation-delay: .15s; } .d2 { animation-delay: .3s; } .d3 { animation-delay: .45s; } .d4 { animation-delay: .6s; } .d5 { animation-delay: .75s; }

[data-testid="stMainBlockContainer"] { animation: pageEnter .55s var(--ease) both; }
[data-testid="stHorizontalBlock"] > div:nth-child(1) { animation: fadeUp .6s .00s var(--ease) both; }
[data-testid="stHorizontalBlock"] > div:nth-child(2) { animation: fadeUp .6s .09s var(--ease) both; }
[data-testid="stHorizontalBlock"] > div:nth-child(3) { animation: fadeUp .6s .18s var(--ease) both; }
[data-testid="stHorizontalBlock"] > div:nth-child(4) { animation: fadeUp .6s .27s var(--ease) both; }

/* ---------- Login hero ---------- */
.hero { max-width: 700px; margin: 0 auto 18px; text-align: center; }
.logo-wrap { position: relative; display: inline-block; }
.logo-wrap::before, .logo-wrap::after {
    content: ""; position: absolute; inset: 0; border-radius: 18px; border: 2px solid var(--teal-soft);
    animation: ripple 3s ease-out infinite; }
.logo-wrap::after { animation-delay: 1.5s; }
.logo-badge {
    position: relative; display: inline-block; padding: 14px 24px; border-radius: 18px;
    font-weight: 900; font-size: 26px; letter-spacing: .08em; color: #022c22;
    background: linear-gradient(135deg, #14b8a6, #06b6d4, #8b5cf6, #14b8a6); background-size: 300% 300%;
    box-shadow: 0 0 36px rgba(20,184,166,.55);
    animation: logoFloat 4s ease-in-out infinite, gradShift 6s ease-in-out infinite alternate; overflow: hidden;
}
.logo-badge::after { content: ""; position: absolute; top: 0; left: 0; width: 40%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,.55), transparent);
    animation: sweep 3.2s ease-in-out infinite; }
.anim-title {
    font-size: 2.7rem; font-weight: 800; margin: 16px 0 4px; letter-spacing: -0.02em;
    background: linear-gradient(90deg,#fff,#5eead4,#a78bfa,#f472b6,#fcd34d,#5eead4);
    background-size: 300% 100%; -webkit-background-clip: text; background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: gradShift 8s ease-in-out infinite alternate, fadeUp .9s var(--ease) both;
}
.sub-title { color: var(--teal-soft); font-size: 1.1rem; font-weight: 600; margin: 4px 0 14px; }
.dev-name {
    font-family: 'Great Vibes', cursive; font-size: 3.1rem; line-height: 1.2;
    background: linear-gradient(90deg,#14b8a6,#fcd34d,#f472b6,#8b5cf6,#14b8a6);
    background-size: 300% 100%; -webkit-background-clip: text; background-clip: text;
    -webkit-text-fill-color: transparent; filter: drop-shadow(0 0 14px rgba(20,184,166,.4));
    animation: gradShift 6s ease-in-out infinite alternate;
}
.dev-sub { letter-spacing: .3em; text-transform: uppercase; font-size: .7rem; color: var(--muted); margin-top: 2px; }
.muted-text { color: var(--muted); font-size: .92rem; line-height: 1.7; margin: 16px auto 0; max-width: 520px; }

.chips { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-top: 18px; }
.chip {
    padding: 7px 14px; border-radius: 999px; font-size: .78rem; font-weight: 600; color: #cffafe;
    background: rgba(20,184,166,.10); border: 1px solid rgba(94,234,212,.28);
    backdrop-filter: blur(6px); animation: popIn .6s var(--ease) both, bob 4s ease-in-out infinite;
    transition: transform .2s ease, background .2s ease, border-color .2s ease; cursor: default;
}
.chip:nth-child(1) { animation-delay: .7s, 0s; } .chip:nth-child(2) { animation-delay: .85s, .6s; }
.chip:nth-child(3) { animation-delay: 1.0s, 1.2s; } .chip:nth-child(4) { animation-delay: 1.15s, 1.8s; }
.chip:hover { transform: translateY(-4px) scale(1.06); background: rgba(139,92,246,.2); border-color: rgba(167,139,250,.6); }

/* Login card: rotating gradient border */
[data-testid="stVerticalBlockBorderWrapper"]:has(.login-marker) { position: relative; border-color: transparent !important; animation: popIn .8s .3s var(--ease) both, glowPulse 5s ease-in-out infinite alternate; }
[data-testid="stVerticalBlockBorderWrapper"]:has(.login-marker)::before {
    content: ""; position: absolute; inset: -2px; border-radius: 20px; padding: 2px; pointer-events: none;
    background: conic-gradient(from var(--angle), #14b8a6, #8b5cf6, #f472b6, #fcd34d, #14b8a6);
    -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    -webkit-mask-composite: xor; mask-composite: exclude; animation: spin 6s linear infinite; }

/* ---------- Header banner ---------- */
.hcm-header {
    position: relative; overflow: hidden; display: flex; align-items: center; justify-content: space-between; gap: 16px;
    background: linear-gradient(135deg,#090d16 0%,#0d1b2a 50%,#0a2540 100%);
    border: 1px solid rgba(20,184,166,.28); border-radius: 18px; padding: 22px 28px; margin-bottom: 24px;
    box-shadow: 0 14px 30px -8px rgba(0,0,0,.5);
}
.hcm-header::after { content: ""; position: absolute; top: 0; left: 0; width: 30%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(94,234,212,.10), transparent); animation: sweep 6s ease-in-out infinite; }
.crumb { font-size: .72rem; letter-spacing: .18em; text-transform: uppercase; color: var(--teal-soft); font-weight: 700; }
.hcm-header-title {
    font-size: 1.75rem; font-weight: 800; margin: 2px 0 0; letter-spacing: -0.025em;
    background: linear-gradient(90deg,#fff,#5eead4,#a78bfa,#fff); background-size: 300% 100%;
    -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
    animation: gradShift 8s ease-in-out infinite alternate, slideIn .6s var(--ease) both;
}
.hcm-header-sub { color: var(--muted); font-size: .88rem; margin-top: 4px; }
.live { display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px; border-radius: 999px; font-size: .75rem; font-weight: 700;
        color: #bbf7d0; background: rgba(16,185,129,.12); border: 1px solid rgba(16,185,129,.4); white-space: nowrap; z-index: 1; }
.live .dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; box-shadow: 0 0 10px #10b981; animation: blink 1.4s ease-in-out infinite; }

/* ---------- Badges ---------- */
.badge { padding: 3px 9px; border-radius: 6px; font-weight: 700; font-size: .68rem; letter-spacing: .06em; }
.badge-admin { background:#581c87; color:#d8b4fe; border:1px solid #7e22ce; }
.badge-hr    { background:#042f2e; color:#5eead4; border:1px solid #0f766e; }
.badge-emp   { background:#451a03; color:#fcd34d; border:1px solid #b45309; }

/* ---------- Cards ---------- */
[data-testid="stVerticalBlockBorderWrapper"] {
    background: linear-gradient(145deg, rgba(16,27,45,.92), rgba(9,16,29,.88)); backdrop-filter: blur(10px);
    border: 1px solid rgba(94,234,212,.22) !important; border-radius: 18px;
    animation: glowPulse 5s ease-in-out infinite alternate;
    transition: border-color .25s ease, transform .25s var(--ease);
}
[data-testid="stVerticalBlockBorderWrapper"]:hover { border-color: rgba(94,234,212,.5) !important; }

[data-testid="stMetric"] {
    position: relative; overflow: hidden; background: var(--panel); border: 1px solid var(--line); border-radius: 16px;
    padding: 16px 20px; transition: transform .25s var(--ease), border-color .25s ease, box-shadow .25s ease;
}
[data-testid="stMetric"]::before { content: ""; position: absolute; top: 0; left: 0; right: 0; height: 3px;
    background: linear-gradient(90deg, var(--teal), var(--violet), var(--pink)); background-size: 200% 100%; animation: gradShift 4s linear infinite alternate; }
[data-testid="stMetric"]:hover { border-color: var(--teal); transform: translateY(-5px) scale(1.02); box-shadow: 0 16px 32px -10px rgba(20,184,166,.5); }
[data-testid="stMetricValue"] { font-weight: 800; }

.payslip-box { background: #090e17; border: 1px solid #334155; border-radius: 14px; padding: 26px; color: #e2e8f0; animation: popIn .6s var(--ease) both; }
.payslip-box table { width: 100%; border-collapse: collapse; }
.payslip-box td { padding: 8px 0; border-bottom: 1px dashed #1e293b; }
.payslip-box td:last-child { text-align: right; font-family: monospace; }

/* ---------- Tabs ---------- */
.stTabs [data-baseweb="tab-list"] { display: flex; gap: 6px; background: #090f1d; padding: 5px; border-radius: 14px; border: 1px solid var(--line); }
.stTabs [data-baseweb="tab"] { flex: 1; justify-content: center; height: auto; border-radius: 10px; padding: 10px 14px; background: transparent; transition: all .25s var(--ease); }
.stTabs [data-baseweb="tab"] p { color: var(--muted); font-weight: 600; font-size: .9rem; transition: color .2s ease; }
.stTabs [data-baseweb="tab"]:hover { background: rgba(20,184,166,.12); transform: translateY(-1px); }
.stTabs [data-baseweb="tab"]:hover p { color: var(--teal-soft); }
.stTabs [aria-selected="true"] { background: linear-gradient(90deg,#14b8a6,#06b6d4); box-shadow: 0 6px 18px rgba(20,184,166,.4); }
.stTabs [aria-selected="true"] p { color: #021a17 !important; font-weight: 800; }
.stTabs [data-baseweb="tab-highlight"], .stTabs [data-baseweb="tab-border"] { display: none; }
.stTabs [data-baseweb="tab-panel"] { padding-top: 1.2rem; animation: fadeUp .45s var(--ease) both; }

/* ---------- Buttons ---------- */
.stButton > button, .stDownloadButton > button, [data-testid="stFormSubmitButton"] > button {
    position: relative; overflow: hidden; min-height: 2.75rem; border-radius: 12px; font-weight: 600;
    transition: transform .2s var(--ease), box-shadow .2s ease, filter .2s ease, border-color .2s ease;
}
.stButton > button::after, [data-testid="stFormSubmitButton"] > button::after {
    content: ""; position: absolute; top: 0; left: 0; width: 40%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,.35), transparent); transform: translateX(-130%); }
.stButton > button:hover::after, [data-testid="stFormSubmitButton"] > button:hover::after { transform: translateX(300%); transition: transform .8s ease; }
.stButton > button:hover, .stDownloadButton > button:hover, [data-testid="stFormSubmitButton"] > button:hover {
    transform: translateY(-3px); border-color: var(--teal); box-shadow: 0 10px 24px rgba(20,184,166,.28); filter: brightness(1.08); }
.stButton > button:active, .stDownloadButton > button:active { transform: scale(.97); }
.stButton > button[kind="primary"], [data-testid="stFormSubmitButton"] > button[kind="primary"] {
    background: linear-gradient(90deg,#14b8a6,#06b6d4,#8b5cf6,#14b8a6); background-size: 300% 100%;
    color: #021a17; border: 0; font-weight: 800; animation: gradShift 5s ease-in-out infinite alternate; }
.stButton > button[kind="primary"] p { color: #021a17; font-weight: 800; }

/* ---------- Inputs ---------- */
.stTextInput input, .stNumberInput input, .stTextArea textarea, [data-baseweb="select"] > div {
    background: #090f1d !important; border-radius: 11px !important; border: 1px solid var(--line) !important; transition: border-color .2s ease, box-shadow .2s ease; }
.stTextInput input:focus, .stNumberInput input:focus, .stTextArea textarea:focus {
    border-color: #2dd4bf !important; box-shadow: 0 0 0 3px rgba(45,212,191,.16) !important; }
[data-baseweb="select"] > div:hover { border-color: rgba(94,234,212,.5) !important; }

/* ---------- Sidebar ---------- */
section[data-testid="stSidebar"] { background: linear-gradient(180deg, rgba(8,15,29,.98), rgba(9,20,34,.96)); border-right: 1px solid rgba(94,234,212,.16); }
.side-brand { font-weight: 800; font-size: 1.15rem; margin-bottom: 14px; background: linear-gradient(90deg,#fff,#5eead4); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; animation: slideIn .6s var(--ease) both; }
.side-card { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 14px; background: rgba(20,184,166,.07); border: 1px solid rgba(94,234,212,.2); animation: popIn .7s var(--ease) both; }
.avatar { position: relative; flex: none; width: 46px; height: 46px; border-radius: 50%; display: grid; place-items: center; font-weight: 800; color: #021a17;
          background: linear-gradient(135deg, #14b8a6, #8b5cf6); }
.avatar::after { content: ""; position: absolute; inset: 0; border-radius: 50%; border: 2px solid var(--teal-soft); animation: ripple 2.4s ease-out infinite; }
.side-name { font-weight: 700; font-size: .95rem; margin-bottom: 3px; }
.side-meta { color: var(--muted); font-size: .72rem; margin-top: 3px; }

section[data-testid="stSidebar"] [data-testid="stRadio"] label {
    border: 1px solid transparent; border-radius: 11px; padding: .55rem .7rem; margin: 3px 0; width: 100%;
    transition: background .22s ease, border-color .22s ease, transform .22s var(--ease); animation: slideIn .5s var(--ease) both; }
section[data-testid="stSidebar"] [data-testid="stRadio"] label:nth-of-type(1) { animation-delay: .05s; }
section[data-testid="stSidebar"] [data-testid="stRadio"] label:nth-of-type(2) { animation-delay: .10s; }
section[data-testid="stSidebar"] [data-testid="stRadio"] label:nth-of-type(3) { animation-delay: .15s; }
section[data-testid="stSidebar"] [data-testid="stRadio"] label:nth-of-type(4) { animation-delay: .20s; }
section[data-testid="stSidebar"] [data-testid="stRadio"] label:nth-of-type(5) { animation-delay: .25s; }
section[data-testid="stSidebar"] [data-testid="stRadio"] label:nth-of-type(6) { animation-delay: .30s; }
section[data-testid="stSidebar"] [data-testid="stRadio"] label:nth-of-type(7) { animation-delay: .35s; }
section[data-testid="stSidebar"] [data-testid="stRadio"] label:nth-of-type(8) { animation-delay: .40s; }
section[data-testid="stSidebar"] [data-testid="stRadio"] label:nth-of-type(9) { animation-delay: .45s; }
section[data-testid="stSidebar"] [data-testid="stRadio"] label:nth-of-type(10) { animation-delay: .50s; }
section[data-testid="stSidebar"] [data-testid="stRadio"] label:nth-of-type(11) { animation-delay: .55s; }
section[data-testid="stSidebar"] [data-testid="stRadio"] label:hover { background: rgba(20,184,166,.13); border-color: rgba(94,234,212,.3); transform: translateX(5px); }
section[data-testid="stSidebar"] [data-testid="stRadio"] label:has(input:checked) {
    background: linear-gradient(90deg, rgba(20,184,166,.28), rgba(139,92,246,.16)); border-color: rgba(94,234,212,.55);
    box-shadow: inset 3px 0 0 var(--teal-soft); }
section[data-testid="stSidebar"] [data-testid="stRadio"] label > div:first-child { display: none; } /* hide radio dot */

/* ---------- Misc ---------- */
[data-testid="stExpander"] { border: 1px solid rgba(148,163,184,.18); border-radius: 14px; overflow: hidden; transition: border-color .2s ease; }
[data-testid="stExpander"]:hover { border-color: rgba(94,234,212,.4); }
[data-testid="stDataFrame"], [data-testid="stTable"] { border: 1px solid rgba(148,163,184,.16); border-radius: 14px; overflow: hidden; }
[data-testid="stAlert"] { border-radius: 14px; animation: fadeUp .45s var(--ease) both; }
[data-testid="stChatMessage"] { animation: fadeUp .45s var(--ease) both; border-radius: 16px; }
[data-testid="stToast"] { border-radius: 14px; border: 1px solid rgba(94,234,212,.35); }
h3, h5 { letter-spacing: -0.01em; }


/* ===== Tabs: full width, rounded (button[role=tab] is what Streamlit renders) ===== */
.stTabs div[role="tablist"] { display: flex !important; width: 100%; gap: 6px; background: #090f1d; padding: 5px; border-radius: 14px; border: 1px solid var(--line); }
.stTabs button[role="tab"] { flex: 1 1 0 !important; justify-content: center; height: auto !important; padding: 10px 12px !important; border-radius: 10px !important; transition: all .25s var(--ease); }
.stTabs button[role="tab"][aria-selected="true"] { background: linear-gradient(90deg,#14b8a6,#06b6d4) !important; box-shadow: 0 6px 18px rgba(20,184,166,.4); }

/* ===== Animated office scene ===== */
.scene-wrap { margin-top: 22px; animation: popIn .9s .5s var(--ease) both; }
.office { width: 100%; height: auto; filter: drop-shadow(0 18px 36px rgba(20,184,166,.18)); }
.office * { transform-box: fill-box; }
.hand-m { transform-origin: 50% 100%; animation: tick 12s linear infinite; }
.hand-h { transform-origin: 50% 100%; animation: tick 144s linear infinite; }
@keyframes tick { to { transform: rotate(360deg); } }
.cloud { animation: drift 16s linear infinite; }
.cloud.c2 { animation-duration: 24s; animation-delay: -8s; }
@keyframes drift { from { transform: translateX(-40px); } to { transform: translateX(120px); } }
.lt { animation: twinkle 3s ease-in-out infinite; }
@keyframes twinkle { 0%,100% { opacity: 1; } 50% { opacity: .15; } }
.cal { animation: bob 4s ease-in-out infinite; }
.bar { transform-origin: 50% 100%; animation: barGrow 3.2s ease-in-out infinite alternate; }
@keyframes barGrow { 0% { transform: scaleY(.3); } 100% { transform: scaleY(1); } }
.trend { stroke-dasharray: 260; stroke-dashoffset: 260; animation: draw 5s ease-in-out infinite; }
@keyframes draw { 0% { stroke-dashoffset: 260; } 60%,100% { stroke-dashoffset: 0; } }
.pulse-dot { animation: blink 1.2s ease-in-out infinite; }
.head { animation: nod 2.8s ease-in-out infinite; }
.p2 .head { animation-delay: -1.4s; }
@keyframes nod { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-2.5px); } }
.ln { animation: twinkle 1.6s steps(2) infinite; }
.doc { opacity: 0; animation: handoff 7s ease-in-out infinite; }
.doc.d2 { animation-delay: -3.5s; }
@keyframes handoff {
    0%   { transform: translate(0,0) rotate(0); opacity: 0; }
    8%   { opacity: 1; }
    35%  { transform: translate(120px,-44px) rotate(-8deg); }
    68%  { transform: translate(262px,-30px) rotate(6deg); opacity: 1; }
    82%  { transform: translate(292px,0) rotate(0); opacity: 0; }
    100% { opacity: 0; }
}
.okbadge { opacity: 0; transform-origin: 50% 50%; animation: okPop 7s ease-in-out infinite; }
@keyframes okPop { 0%,66% { transform: scale(0); opacity: 0; } 74% { transform: scale(1.25); opacity: 1; } 82%,94% { transform: scale(1); opacity: 1; } 100% { transform: scale(0); opacity: 0; } }
.steam { opacity: 0; animation: steam 2.6s ease-out infinite; }
.steam.s2 { animation-delay: -1.3s; }
@keyframes steam { 0% { transform: translateY(4px); opacity: 0; } 40% { opacity: .8; } 100% { transform: translateY(-12px); opacity: 0; } }
.leaf { transform-origin: 50% 100%; animation: sway 4s ease-in-out infinite alternate; }
.leaf.l2 { animation-delay: -1.5s; } .leaf.l3 { animation-delay: -2.8s; }
@keyframes sway { from { transform: rotate(-7deg); } to { transform: rotate(7deg); } }
.prog { transform-origin: 0% 50%; animation: loadbar 6s ease-in-out infinite; }
@keyframes loadbar { 0% { transform: scaleX(.04); } 70%,100% { transform: scaleX(1); } }

/* ===== Ticker ===== */
.ticker { overflow: hidden; border: 1px solid rgba(94,234,212,.2); border-radius: 12px; background: rgba(14,22,38,.7);
          margin: -10px 0 22px; padding: 10px 0; animation: fadeUp .6s .15s var(--ease) both;
          -webkit-mask-image: linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent);
          mask-image: linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent); }
.ticker-track { display: inline-flex; white-space: nowrap; animation: marquee 40s linear infinite; }
.ticker:hover .ticker-track { animation-play-state: paused; }
.ticker-track span { font-size: .82rem; color: #cbd5e1; font-weight: 500; margin-right: 52px; }
@keyframes marquee { to { transform: translateX(-50%); } }

@media (max-width: 900px) {
    .block-container { padding-top: 3.4rem !important; }
    .anim-title { font-size: clamp(1.8rem, 6vw, 2.5rem); }
    .dev-name { font-size: clamp(2rem, 7vw, 3rem); }
    .hcm-header { padding: 16px; flex-direction: column; align-items: flex-start; }
}
@media (prefers-reduced-motion: reduce) {
    html { scroll-behavior: auto; }
    *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
}
</style>
<div class="orb o1"></div><div class="orb o2"></div><div class="orb o3"></div>
"""
st.markdown(CSS, unsafe_allow_html=True)

import random as _rnd
_r = _rnd.Random(7)  # seeded so particles don't jump on rerun
st.markdown("".join(
    f'<span class="ptc" style="left:{_r.randint(2, 98)}%;--s:{_r.randint(3, 8)}px;'
    f'--d:{_r.randint(14, 28)}s;--dl:-{_r.randint(0, 20)}s"></span>' for _ in range(24)
), unsafe_allow_html=True)

# =====================================================================
# DATABASE (session state)
# =====================================================================
def initialize_database():
    if "db_initialized" in st.session_state:
        return
    today = today_pkt()
    today_iso = today.isoformat()
    yest_iso = (today - datetime.timedelta(days=1)).isoformat()
    d2_iso = (today - datetime.timedelta(days=2)).isoformat()
    ss = st.session_state

    ss.db_initialized = True
    ss.company_name = "TechNova Solutions"
    ss.office_start = datetime.time(9, 0)
    ss.grace_minutes = 15
    ss.half_day_hours = 5
    ss.weekend_days = ["Saturday", "Sunday"]
    ss.office_lat, ss.office_lng, ss.office_radius_m = 24.8607, 67.0011, 150
    ss.departments = ["Engineering", "Human Resources", "Sales & Marketing", "Finance", "Operations"]
    ss.designations = ["Chief Technology Officer", "HR Lead & People Ops", "Senior Software Engineer",
                       "Sales Executive", "Operations Lead", "Financial Analyst", "QA Engineer"]
    ss.leave_quotas = {"annual": 14, "sick": 8, "casual": 10, "unpaid": 999}
    ss.public_holidays = ["2026-03-23", "2026-05-01", "2026-08-14", "2026-11-09", "2026-12-25"]

    ss.is_logged_in = False
    ss.current_role = "Admin"
    ss.current_user_id = "EMP001"
    ss.chat_history = []
    ss.finalized_payrolls = {}

    def emp(i, name, email, role, dept, desig, join, sal, gender, ten, phone, addr, first=False):
        return dict(employee_id=i, name=name, email=email, role=role, department=dept,
                    designation=desig, joining_date=join, basic_salary=sal, gender=gender,
                    tenure_years=ten, phone=phone, address=addr, status="Active", first_login=first)

    ss.employees = [
        emp("EMP001", "M Atta Ur Rehman Khan", "asad.admin@technova.com", "Admin", "Engineering",
            "Chief Technology Officer", "2023-01-15", 220000, "Male", 3.8, "+92 300 1234567", "Gulshan-e-Iqbal, Karachi"),
        emp("EMP002", "Fatima Zahra", "fatima.hr@technova.com", "HR", "Human Resources",
            "HR Lead & People Ops", "2023-06-01", 140000, "Female", 3.3, "+92 321 7654321", "PECHS, Karachi"),
        emp("EMP003", "Bilal Tariq", "bilal.dev@technova.com", "Employee", "Engineering",
            "Senior Software Engineer", "2024-02-15", 110000, "Male", 2.7, "+92 333 9988776", "North Nazimabad, Karachi"),
        emp("EMP004", "Ayesha Siddiqui", "ayesha.sales@technova.com", "Employee", "Sales & Marketing",
            "Sales Executive", "2024-08-01", 95000, "Female", 2.2, "+92 345 5544332", "Clifton, Karachi"),
        emp("EMP005", "Zayn Ul Abidin", "zayn.ops@technova.com", "Employee", "Operations",
            "Operations Lead", "2025-01-10", 85000, "Male", 1.8, "+92 312 8877665", "Bahadurabad, Karachi", True),
    ]

    def att(i, d, eid, name, cin, cout, status, hrs, method, dist):
        return dict(id=i, date=d, employee_id=eid, name=name, check_in=cin, check_out=cout,
                    status=status, hours=hrs, method=method, dist_m=dist)

    ss.attendance = [
        att("ATT-001", d2_iso, "EMP001", "M Atta Ur Rehman Khan", "08:52", "17:30", "Present", 8.6, "Web", 42),
        att("ATT-002", d2_iso, "EMP002", "Fatima Zahra", "09:24", "18:10", "Late", 8.7, "Camera", 65),
        att("ATT-003", d2_iso, "EMP003", "Bilal Tariq", "09:05", "17:45", "Present", 8.6, "Web", 38),
        att("ATT-004", today_iso, "EMP005", "Zayn Ul Abidin", "09:32", "-", "Late", 0.0, "Camera", 80),
        att("ATT-090", yest_iso, "EMP002", "Fatima Zahra", "09:20", "18:00", "Late", 8.6, "Camera", 70),
        att("ATT-091", yest_iso, "EMP004", "Ayesha Siddiqui", "09:00", "13:30", "Half Day", 4.5, "Web", 55),
    ]

    ss.leaves = [dict(
        leave_id="LV-101", employee_id="EMP004", employee_name="Ayesha Siddiqui", leave_type="casual",
        start_date=today_iso, end_date=today_iso, working_days=1, reason="Family ceremony",
        status="Approved", applied_at=yest_iso, hr_comment="Approved as per casual quota.")]

    ss.audit_trail = [dict(timestamp=now_pkt().strftime("%Y-%m-%d %H:%M:%S"),
                           actor="System", action="INITIALIZE", entity="CompanySetup",
                           details="Initialized HCM Lite parameters, departments and payroll rules")]

    ss.announcements = [dict(
        id=1, title="Saylani Hackathon HCM Lite Launched", date=today_iso, author="HR Department",
        content="Welcome to HCM Lite! Attendance, leave approvals, payroll and the AI assistant are live.")]


initialize_database()
ss = st.session_state

# =====================================================================
# BUSINESS LOGIC
# =====================================================================
def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371000
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = math.radians(lat2 - lat1), math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return round(R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a)))


def calculate_working_days(start, end):
    cur, count = start, 0
    while cur <= end:
        if cur.strftime("%A") not in ss.weekend_days and cur.isoformat() not in ss.public_holidays:
            count += 1
        cur += datetime.timedelta(days=1)
    return count


def compute_tax(annual):
    if annual <= 600000:
        return 0
    if annual <= 1200000:
        return (annual - 600000) * 0.05
    if annual <= 2400000:
        return 30000 + (annual - 1200000) * 0.15
    if annual <= 3600000:
        return 210000 + (annual - 2400000) * 0.25
    return 510000 + (annual - 3600000) * 0.35


def log_audit(actor, action, entity, details):
    ss.audit_trail.insert(0, dict(timestamp=now_pkt().strftime("%Y-%m-%d %H:%M:%S"),
                                  actor=actor, action=action, entity=entity, details=details))


def get_emp(eid):
    return next((e for e in ss.employees if e["employee_id"] == eid), None)


def next_emp_id():
    return f"EMP{len(ss.employees) + 1:03d}"


def compute_payroll_row(e, month):
    """month = 'YYYY-MM'. Returns a dict with full salary breakdown."""
    basic = e["basic_salary"]
    allowance = round(basic * 0.10)
    gross = basic + allowance
    per_day = basic / 30

    late_n = sum(1 for a in ss.attendance
                 if a["employee_id"] == e["employee_id"] and a["status"] == "Late" and a["date"].startswith(month))
    late_ded = round((late_n // 3) * 0.5 * per_day)

    unpaid_days = sum(l["working_days"] for l in ss.leaves
                      if l["employee_id"] == e["employee_id"] and l["leave_type"] == "unpaid"
                      and l["status"] == "Approved" and l["start_date"].startswith(month))
    unpaid_ded = round(unpaid_days * per_day)

    tax = round(compute_tax(gross * 12) / 12)
    net = gross - late_ded - unpaid_ded - tax
    return dict(employee_id=e["employee_id"], name=e["name"], department=e["department"], month=month,
                basic=basic, allowance=allowance, gross=gross, late_count=late_n, late_deduction=late_ded,
                unpaid_days=unpaid_days, unpaid_deduction=unpaid_ded, tax=tax, net=net)


def ai_reply(prompt, role, uid):
    """Gemini if key present, else rule-based assistant scoped by role."""
    today = today_pkt().isoformat()
    me = get_emp(uid)
    key = os.environ.get("GEMINI_API_KEY")

    if role == "Employee":
        scope = {"employee": me,
                 "attendance": [a for a in ss.attendance if a["employee_id"] == uid],
                 "leaves": [l for l in ss.leaves if l["employee_id"] == uid]}
    else:
        scope = {"employees": ss.employees, "attendance": ss.attendance, "leaves": ss.leaves}

    if key:
        try:
            body = json.dumps({"contents": [{"parts": [{"text":
                f"You are an HR assistant for {ss.company_name}. Role of user: {role}. "
                f"Answer briefly using ONLY this data:\n{json.dumps(scope, default=str)}\n\nQuestion: {prompt}"}]}]}).encode()
            req = urllib.request.Request(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={key}",
                data=body, headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=15) as r:
                return json.loads(r.read())["candidates"][0]["content"]["parts"][0]["text"]
        except Exception as ex:  # fall through to rules
            st.toast(f"Gemini unavailable ({type(ex).__name__}); using built-in assistant", icon="⚠️")

    q = prompt.lower()
    if role == "Employee":
        used = sum(l["working_days"] for l in scope["leaves"] if l["status"] == "Approved")
        late = sum(1 for a in scope["attendance"] if a["status"] == "Late")
        if "leave" in q:
            return f"You have used **{used}** approved leave day(s). Annual quota: {ss.leave_quotas['annual']}."
        if "late" in q or "attend" in q:
            return f"You have **{len(scope['attendance'])}** attendance record(s), **{late}** late arrival(s)."
        return "Ask me about your attendance, late arrivals, or leave balance."

    if "late" in q:
        names = [a["name"] for a in ss.attendance if a["date"] == today and a["status"] == "Late"]
        return "Late today: " + (", ".join(names) if names else "nobody 🎉")
    if "present" in q or "attend" in q:
        n = sum(1 for a in ss.attendance if a["date"] == today)
        return f"**{n}** of **{len(ss.employees)}** employees have checked in today."
    if "pending" in q or "leave" in q:
        n = sum(1 for l in ss.leaves if l["status"] == "Pending")
        return f"There are **{n}** pending leave request(s)."
    if "headcount" in q or "employee" in q:
        return f"Total workforce: **{len(ss.employees)}** across {len(ss.departments)} departments."
    if "payroll" in q or "salary" in q:
        total = sum(e["basic_salary"] for e in ss.employees)
        return f"Total monthly basic payroll: **PKR {total:,.0f}**."
    return "Try: *who is late today?*, *pending leaves*, *headcount*, *payroll total*."


# =====================================================================
# LOGIN SCREEN
# =====================================================================
OFFICE_SCENE = """
<div class="scene-wrap">
<svg class="office" viewBox="0 0 560 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Animated office scene">
<defs>
<linearGradient id="gRoom" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#14b8a6" stop-opacity=".22"/><stop offset="1" stop-color="#8b5cf6" stop-opacity=".16"/></linearGradient>
<linearGradient id="gBar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5eead4"/><stop offset="1" stop-color="#0ea5e9"/></linearGradient>
<linearGradient id="gSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0ea5e9" stop-opacity=".55"/><stop offset="1" stop-color="#312e81" stop-opacity=".75"/></linearGradient>
<linearGradient id="gProg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#14b8a6"/><stop offset="1" stop-color="#8b5cf6"/></linearGradient>
<clipPath id="clipRoom"><rect x="4" y="4" width="552" height="312" rx="22"/></clipPath>
<clipPath id="clipWin"><rect x="98" y="34" width="78" height="72" rx="6"/></clipPath>
</defs>
<g clip-path="url(#clipRoom)">
<rect x="4" y="4" width="552" height="312" fill="url(#gRoom)"/>
<rect x="4" y="262" width="552" height="54" fill="rgba(2,6,16,.55)"/>
<line x1="4" y1="262" x2="556" y2="262" stroke="rgba(94,234,212,.25)"/>
</g>
<rect x="4" y="4" width="552" height="312" rx="22" fill="none" stroke="rgba(94,234,212,.3)"/>
<circle cx="52" cy="62" r="28" fill="#0b1220" stroke="#5eead4" stroke-width="2"/>
<line x1="52" y1="37" x2="52" y2="41" stroke="#94a3b8" stroke-width="2"/><line x1="77" y1="62" x2="73" y2="62" stroke="#94a3b8" stroke-width="2"/><line x1="52" y1="87" x2="52" y2="83" stroke="#94a3b8" stroke-width="2"/><line x1="27" y1="62" x2="31" y2="62" stroke="#94a3b8" stroke-width="2"/>
<line class="hand-h" x1="52" y1="62" x2="52" y2="48" stroke="#e2e8f0" stroke-width="3" stroke-linecap="round"/>
<line class="hand-m" x1="52" y1="62" x2="52" y2="42" stroke="#5eead4" stroke-width="2" stroke-linecap="round"/>
<circle cx="52" cy="62" r="2.8" fill="#5eead4"/>
<rect x="94" y="30" width="86" height="80" rx="8" fill="#0b1220" stroke="#334155" stroke-width="2"/>
<g clip-path="url(#clipWin)">
<rect x="98" y="34" width="78" height="72" fill="url(#gSky)"/>
<ellipse class="cloud" cx="118" cy="52" rx="14" ry="5" fill="rgba(255,255,255,.55)"/>
<ellipse class="cloud c2" cx="140" cy="68" rx="10" ry="4" fill="rgba(255,255,255,.4)"/>
<rect x="102" y="76" width="16" height="30" fill="#0f172a"/><rect x="120" y="64" width="18" height="42" fill="#111c33"/><rect x="140" y="82" width="14" height="24" fill="#0f172a"/><rect x="156" y="70" width="18" height="36" fill="#111c33"/>
<rect class="lt" style="animation-delay:-.4s" x="106" y="82" width="3" height="3" fill="#fcd34d"/><rect class="lt" style="animation-delay:-1.6s" x="110" y="92" width="3" height="3" fill="#fcd34d"/>
<rect class="lt" style="animation-delay:-2.2s" x="125" y="70" width="3" height="3" fill="#fcd34d"/><rect class="lt" style="animation-delay:-.9s" x="131" y="80" width="3" height="3" fill="#fcd34d"/>
<rect class="lt" style="animation-delay:-2.7s" x="125" y="92" width="3" height="3" fill="#fcd34d"/><rect class="lt" style="animation-delay:-1.2s" x="145" y="88" width="3" height="3" fill="#fcd34d"/>
<rect class="lt" style="animation-delay:-.2s" x="161" y="76" width="3" height="3" fill="#fcd34d"/><rect class="lt" style="animation-delay:-2s" x="167" y="86" width="3" height="3" fill="#fcd34d"/>
<rect class="lt" style="animation-delay:-1s" x="161" y="96" width="3" height="3" fill="#fcd34d"/>
</g>
<line x1="137" y1="34" x2="137" y2="106" stroke="#334155" stroke-width="2"/>
<g class="cal">
<rect x="404" y="40" width="58" height="64" rx="8" fill="#0b1220" stroke="#334155" stroke-width="2"/>
<rect x="404" y="40" width="58" height="18" rx="8" fill="#8b5cf6"/><rect x="404" y="50" width="58" height="8" fill="#8b5cf6"/>
<text x="433" y="54" text-anchor="middle" font-size="9" font-weight="700" fill="#fff">__MON__</text>
<text x="433" y="90" text-anchor="middle" font-size="26" font-weight="800" fill="#f1f5f9">__DAY__</text>
<circle cx="416" cy="38" r="3" fill="#5eead4"/><circle cx="450" cy="38" r="3" fill="#5eead4"/>
</g>
<rect x="190" y="46" width="180" height="124" rx="10" fill="#0b1220" stroke="#334155" stroke-width="2"/>
<rect x="198" y="54" width="164" height="108" rx="6" fill="#070d1a"/>
<circle cx="207" cy="62" r="2.5" fill="#f87171"/><circle cx="215" cy="62" r="2.5" fill="#fbbf24"/><circle cx="223" cy="62" r="2.5" fill="#34d399"/>
<text x="236" y="65" font-size="8" fill="#94a3b8" font-weight="600">Attendance · Live</text>
<circle class="pulse-dot" cx="345" cy="62" r="3" fill="#10b981"/>
<line x1="206" y1="148" x2="354" y2="148" stroke="#1e293b"/><line x1="206" y1="120" x2="354" y2="120" stroke="#1e293b" stroke-dasharray="3 3"/><line x1="206" y1="92" x2="354" y2="92" stroke="#1e293b" stroke-dasharray="3 3"/>
<rect class="bar" style="animation-duration:3.0s" x="214" y="98" width="16" height="50" rx="3" fill="url(#gBar)"/>
<rect class="bar" style="animation-duration:2.4s;animation-delay:-.8s" x="238" y="110" width="16" height="38" rx="3" fill="url(#gBar)"/>
<rect class="bar" style="animation-duration:3.6s;animation-delay:-1.6s" x="262" y="86" width="16" height="62" rx="3" fill="url(#gBar)"/>
<rect class="bar" style="animation-duration:2.8s;animation-delay:-.4s" x="286" y="114" width="16" height="34" rx="3" fill="url(#gBar)"/>
<rect class="bar" style="animation-duration:3.3s;animation-delay:-2.1s" x="310" y="100" width="16" height="48" rx="3" fill="url(#gBar)"/>
<path class="trend" pathLength="260" d="M210 124 C 240 92, 262 112, 292 84 S 336 76, 352 70" fill="none" stroke="#f472b6" stroke-width="2.6" stroke-linecap="round"/>
<rect x="272" y="170" width="16" height="24" fill="#1e293b"/><rect x="250" y="194" width="60" height="6" rx="3" fill="#334155"/>
<rect x="40" y="200" width="480" height="10" rx="5" fill="#17264a"/>
<rect x="60" y="210" width="8" height="52" fill="#13203a"/><rect x="492" y="210" width="8" height="52" fill="#13203a"/>
<g class="person p1"><rect x="92" y="166" width="36" height="42" rx="16" fill="#8b5cf6"/><g class="head"><circle cx="110" cy="148" r="14" fill="#fcd9b6"/><path d="M96 147 a14 14 0 0 1 28 0 q-14 -9 -28 0z" fill="#1e293b"/></g></g>
<rect x="84" y="196" width="52" height="4" rx="2" fill="#334155"/><rect x="92" y="176" width="36" height="20" rx="3" fill="#0b1220" stroke="#5eead4"/>
<rect class="ln" x="97" y="181" width="20" height="2" fill="#5eead4"/><rect class="ln" style="animation-delay:-.5s" x="97" y="186" width="14" height="2" fill="#5eead4"/><rect class="ln" style="animation-delay:-1s" x="97" y="191" width="24" height="2" fill="#5eead4"/>
<g class="person p2"><rect x="432" y="166" width="36" height="42" rx="16" fill="#0ea5e9"/><g class="head"><circle cx="450" cy="148" r="14" fill="#e8b98f"/><path d="M436 147 a14 14 0 0 1 28 0 q-14 -9 -28 0z" fill="#0f172a"/></g></g>
<rect x="424" y="196" width="52" height="4" rx="2" fill="#334155"/><rect x="432" y="176" width="36" height="20" rx="3" fill="#0b1220" stroke="#a78bfa"/>
<rect class="ln" style="animation-delay:-.3s" x="437" y="181" width="22" height="2" fill="#a78bfa"/><rect class="ln" style="animation-delay:-.8s" x="437" y="186" width="16" height="2" fill="#a78bfa"/><rect class="ln" style="animation-delay:-1.3s" x="437" y="191" width="20" height="2" fill="#a78bfa"/>
<g class="doc"><rect x="150" y="174" width="16" height="20" rx="2" fill="#f8fafc"/><rect x="153" y="179" width="10" height="1.8" fill="#94a3b8"/><rect x="153" y="183" width="10" height="1.8" fill="#94a3b8"/><rect x="153" y="187" width="6" height="1.8" fill="#94a3b8"/></g>
<g class="doc d2"><rect x="150" y="174" width="16" height="20" rx="2" fill="#f8fafc"/><rect x="153" y="179" width="10" height="1.8" fill="#94a3b8"/><rect x="153" y="183" width="10" height="1.8" fill="#94a3b8"/><rect x="153" y="187" width="6" height="1.8" fill="#94a3b8"/></g>
<g class="okbadge"><circle cx="486" cy="146" r="12" fill="#10b981"/><path d="M480 146 l4.5 4.5 l8.5 -9" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></g>
<rect x="298" y="186" width="14" height="14" rx="3" fill="#f8fafc"/><path d="M312 190 q6 0 6 5 q0 5 -6 5" fill="none" stroke="#f8fafc" stroke-width="2"/>
<path class="steam" d="M302 182 q-3 -5 0 -9" fill="none" stroke="rgba(255,255,255,.65)" stroke-width="1.8" stroke-linecap="round"/><path class="steam s2" d="M308 182 q3 -5 0 -9" fill="none" stroke="rgba(255,255,255,.65)" stroke-width="1.8" stroke-linecap="round"/>
<rect x="525" y="240" width="22" height="22" rx="4" fill="#92400e"/>
<g class="leaf"><ellipse cx="530" cy="228" rx="4.5" ry="14" fill="#10b981" transform="rotate(-18 530 240)"/></g>
<g class="leaf l2"><ellipse cx="536" cy="224" rx="4.5" ry="15" fill="#34d399"/></g>
<g class="leaf l3"><ellipse cx="542" cy="229" rx="4.5" ry="14" fill="#10b981" transform="rotate(18 542 240)"/></g>
<text x="40" y="282" font-size="9" fill="#94a3b8" font-weight="600">Monthly payroll run</text>
<rect x="40" y="288" width="300" height="8" rx="4" fill="#0b1220" stroke="#1e293b"/>
<rect class="prog" x="40" y="288" width="300" height="8" rx="4" fill="url(#gProg)"/>
<text x="380" y="282" font-size="9" fill="#94a3b8" font-weight="600">Approvals</text>
<rect x="380" y="288" width="140" height="8" rx="4" fill="#0b1220" stroke="#1e293b"/>
<rect class="prog" style="animation-duration:4s;animation-delay:-1s" x="380" y="288" width="140" height="8" rx="4" fill="#10b981"/>
</svg>
</div>
"""


def do_login(role, uid):
    me = get_emp(uid)
    ss.is_logged_in, ss.current_role, ss.current_user_id = True, role, uid
    log_audit(me["name"], "LOGIN", "Auth", f"Logged in as {role}")
    st.rerun()


def render_login():
    left, mid = st.columns([1.15, 1], gap="large")
    with left:
        st.markdown("""
        <div class="hero">
            <div class="logo-wrap"><div class="logo-badge">HCM</div></div>
            <h1 class="anim-title">Saylani Hackathon 2026</h1>
            <div class="sub-title fade-up d2">HCM Lite — AI-Assisted Human Capital Management</div>
            <div class="dev-name fade-up d3">M Atta ur Rehman Khan</div>
            <div class="dev-sub fade-up d3">Developer · Roll No 777760</div>
            <p class="muted-text fade-up d4">Select your role to enter. Each role has its own menus,
            permissions and AI assistant scope.</p>
            <div class="chips">
                <span class="chip">📍 Geofenced Attendance</span>
                <span class="chip">🏖️ Leave Workflow</span>
                <span class="chip">💰 Smart Payroll</span>
                <span class="chip">🤖 AI Assistant</span>
            </div>
        </div>""", unsafe_allow_html=True)
        _today = today_pkt()
        st.markdown(OFFICE_SCENE.replace("__MON__", _today.strftime("%b").upper())
                                .replace("__DAY__", str(_today.day)), unsafe_allow_html=True)
    with mid:
        st.markdown('<div style="height:2.6rem"></div>', unsafe_allow_html=True)
        with st.container(border=True):
            st.markdown('<div class="login-marker"></div>', unsafe_allow_html=True)
            tabs = st.tabs(["🛡️ Admin Portal", "👥 HR Operations", "💼 Employee Portal"])

            with tabs[0]:
                st.markdown("##### 🛡️ Company Administrator Login")
                st.caption("Executive dashboard, org setup, user access, payroll lock and master audit trail.")
                st.text_input("Admin Work Email", "asad.admin@technova.com", disabled=True, key="la_e")
                st.text_input("Master Password", "••••••••", type="password", disabled=True, key="la_p")
                if st.button("🚀 Sign In as Admin (M Atta Ur Rehman Khan)", use_container_width=True, type="primary", key="b_admin"):
                    do_login("Admin", "EMP001")

            with tabs[1]:
                st.markdown("##### 👥 HR People Operations Login")
                st.caption("Register employees, CSV import, attendance board, leave inbox and payroll runs.")
                st.text_input("HR Work Email", "fatima.hr@technova.com", disabled=True, key="lh_e")
                st.text_input("HR Password", "••••••••", type="password", disabled=True, key="lh_p")
                if st.button("🚀 Sign In as HR (Fatima Zahra)", use_container_width=True, type="primary", key="b_hr"):
                    do_login("HR", "EMP002")

            with tabs[2]:
                st.markdown("##### 💼 Employee Self-Service Login")
                st.caption("Check in/out, apply for leave, view payslips and chat with your AI assistant.")
                staff = [e for e in ss.employees if e["role"] == "Employee"]
                pick = st.selectbox("Choose employee account", [e["employee_id"] for e in staff],
                                    format_func=lambda i: f"{get_emp(i)['name']} — {get_emp(i)['designation']}")
                st.text_input("Password", "••••••••", type="password", disabled=True, key="le_p")
                if st.button("🚀 Sign In as Employee", use_container_width=True, type="primary", key="b_emp"):
                    do_login("Employee", pick)


if not ss.is_logged_in:
    render_login()
    st.stop()

# =====================================================================
# SIDEBAR + NAVIGATION
# =====================================================================
selected_role = ss.current_role
me = get_emp(ss.current_user_id)
curr_user_name = me["name"]

MENUS = {
    "Admin": ["📊 Executive Dashboard", "⚙️ Organization Setup", "🔐 User Access", "➕ Add Employee",
              "👥 Employee Directory", "🕒 Attendance", "🏖️ Leave Management", "💰 Payroll",
              "📢 Announcements", "🧾 Audit Trail", "🤖 AI Assistant"],
    "HR": ["👥 HR Dashboard", "➕ Add Employee", "👥 Employee Directory", "📥 CSV Import",
           "🕒 Attendance", "🏖️ Leave Management", "💰 Payroll", "📢 Announcements", "🤖 AI Assistant"],
    "Employee": ["💼 My Hub", "🕒 My Attendance", "🏖️ My Leaves", "💵 My Payslip", "🤖 AI Assistant"],
}
BADGE = {"Admin": "badge-admin", "HR": "badge-hr", "Employee": "badge-emp"}

with st.sidebar:
    _ini = "".join(w[0] for w in curr_user_name.split()[:2]).upper()
    st.markdown(f"""
    <div class="side-brand">🏢 {ss.company_name}</div>
    <div class="side-card">
        <div class="avatar">{_ini}</div>
        <div>
            <div class="side-name">{curr_user_name}</div>
            <span class="badge {BADGE[selected_role]}">{selected_role.upper()}</span>
            <div class="side-meta">{me['designation']} · {me['department']}</div>
        </div>
    </div>""", unsafe_allow_html=True)
    st.markdown("---")
    nav_choice = st.radio("Navigation", MENUS[selected_role], label_visibility="collapsed")
    st.markdown("---")
    if st.button("🚪 Sign Out", use_container_width=True):
        log_audit(curr_user_name, "LOGOUT", "Auth", "Signed out")
        ss.is_logged_in = False
        st.rerun()

# Header banner (re-animates on every page change)
page_title = nav_choice
st.markdown(f"""
<div class="hcm-header">
    <div>
        <div class="crumb">{selected_role} · Workspace</div>
        <div class="hcm-header-title">{page_title}</div>
        <div class="hcm-header-sub">{ss.company_name} · {today_pkt().strftime('%A, %d %B %Y')}</div>
    </div>
    <div class="live"><span class="dot"></span> Live</div>
</div>""", unsafe_allow_html=True)

import html as _html
_today_iso = today_pkt().isoformat()
_items = [f"📢 {_html.escape(a['title'])}" for a in ss.announcements[:2]] + [
    f"👥 {len(ss.employees)} employees on roster",
    f"🕒 {sum(1 for a in ss.attendance if a['date'] == _today_iso)} checked in today",
    f"🏖️ {sum(1 for l in ss.leaves if l['status'] == 'Pending')} pending leave request(s)",
    "🔒 Payroll locked: " + (", ".join(ss.finalized_payrolls) or "none yet"),
    f"📍 Geofence radius {ss.office_radius_m} m",
]
_ticker_html = "".join(f"<span>{i}</span>" for i in _items)
st.markdown(f'<div class="ticker"><div class="ticker-track">{_ticker_html}{_ticker_html}</div></div>',
            unsafe_allow_html=True)

# =====================================================================
# SHARED PAGE RENDERERS
# =====================================================================
ALT_COLORS = ["#14b8a6", "#8b5cf6", "#0ea5e9", "#f472b6", "#fcd34d"]


def style_chart(c):
    return c.configure_view(strokeWidth=0).configure(background="transparent") \
            .configure_axis(labelColor="#94a3b8", titleColor="#94a3b8", gridColor="#1e293b") \
            .configure_legend(labelColor="#cbd5e1", titleColor="#94a3b8")


def page_admin_dashboard():
    df_e = pd.DataFrame(ss.employees)
    df_a = pd.DataFrame(ss.attendance)
    today = today_pkt().isoformat()
    t = df_a[df_a["date"] == today] if not df_a.empty else pd.DataFrame(columns=["status"])

    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Total Workforce", len(df_e))
    c2.metric("Monthly Payroll (Basic)", f"PKR {df_e['basic_salary'].sum():,.0f}")
    c3.metric("Checked-in Today", len(t))
    c4.metric("Pending Leaves", sum(1 for l in ss.leaves if l["status"] == "Pending"))

    st.markdown("")
    a, b = st.columns(2)
    with a:
        with st.container(border=True):
            st.markdown("##### 🏬 Headcount by Department")
            d = df_e.groupby("department").size().reset_index(name="count")
            ch = alt.Chart(d).mark_bar(cornerRadiusTopRight=6, cornerRadiusBottomRight=6).encode(
                y=alt.Y("department:N", sort="-x", title=None), x=alt.X("count:Q", title="Employees"),
                color=alt.Color("department:N", scale=alt.Scale(range=ALT_COLORS), legend=None),
                tooltip=["department", "count"]).properties(height=260)
            st.altair_chart(style_chart(ch), use_container_width=True)
    with b:
        with st.container(border=True):
            st.markdown("##### 🕒 Today's Attendance Mix")
            if t.empty:
                st.info("No check-ins yet today.")
            else:
                d = t.groupby("status").size().reset_index(name="count")
                ch = alt.Chart(d).mark_arc(innerRadius=60, cornerRadius=6).encode(
                    theta="count:Q",
                    color=alt.Color("status:N", scale=alt.Scale(range=ALT_COLORS)),
                    tooltip=["status", "count"]).properties(height=260)
                st.altair_chart(style_chart(ch), use_container_width=True)

    with st.container(border=True):
        st.markdown("##### 💵 Basic Salary by Employee")
        ch = alt.Chart(df_e).mark_bar(cornerRadiusTopLeft=6, cornerRadiusTopRight=6, color="#14b8a6").encode(
            x=alt.X("name:N", sort="-y", title=None, axis=alt.Axis(labelAngle=-20)),
            y=alt.Y("basic_salary:Q", title="PKR"), tooltip=["name", "department", "basic_salary"]).properties(height=240)
        st.altair_chart(style_chart(ch), use_container_width=True)


def page_hr_dashboard():
    df_e, df_a, df_l = pd.DataFrame(ss.employees), pd.DataFrame(ss.attendance), pd.DataFrame(ss.leaves)
    today = today_pkt().isoformat()
    t = df_a[df_a["date"] == today] if not df_a.empty else pd.DataFrame(columns=["status"])

    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Total Workforce", len(df_e))
    c2.metric("Present Today", int((t["status"] == "Present").sum()))
    c3.metric("Late Today", int((t["status"] == "Late").sum()))
    c4.metric("Pending Approvals", int((df_l["status"] == "Pending").sum()) if not df_l.empty else 0)
    st.markdown("")

    a, b = st.columns(2)
    with a:
        with st.container(border=True):
            st.markdown("##### 🚨 Top Late-Comers")
            late = df_a[df_a["status"] == "Late"] if not df_a.empty else pd.DataFrame()
            if late.empty:
                st.success("No late arrivals recorded.")
            else:
                r = late.groupby("name").size().reset_index(name="Late Occurrences") \
                        .sort_values("Late Occurrences", ascending=False).head(5)
                st.dataframe(r, use_container_width=True, hide_index=True)
                st.caption("Policy: every 3 late arrivals = 0.5-day salary deduction.")
    with b:
        with st.container(border=True):
            st.markdown("##### 🏖️ Leave Days by Type")
            if df_l.empty:
                st.info("No leave requests filed.")
            else:
                d = df_l.groupby("leave_type")["working_days"].sum().reset_index()
                ch = alt.Chart(d).mark_bar(cornerRadiusTopLeft=6, cornerRadiusTopRight=6, color="#0ea5e9").encode(
                    x=alt.X("leave_type:N", title=None), y=alt.Y("working_days:Q", title="Days"),
                    tooltip=["leave_type", "working_days"]).properties(height=220)
                st.altair_chart(style_chart(ch), use_container_width=True)


def page_org_setup():
    st.caption("These policies drive all attendance, leave and payroll calculations.")
    with st.form("org_form"):
        c1, c2 = st.columns(2)
        name = c1.text_input("Company Name", ss.company_name)
        start = c2.time_input("Office Start Time", ss.office_start)
        c3, c4 = st.columns(2)
        grace = c3.number_input("Grace Period (min)", 0, 60, int(ss.grace_minutes))
        half = c4.number_input("Half-Day Threshold (hours)", 1, 8, int(ss.half_day_hours))
        st.markdown("##### 📍 Office Geofence")
        g1, g2, g3 = st.columns(3)
        lat = g1.number_input("Latitude", value=float(ss.office_lat), format="%.5f")
        lng = g2.number_input("Longitude", value=float(ss.office_lng), format="%.5f")
        rad = g3.number_input("Radius (m)", 50, 1000, int(ss.office_radius_m))
        st.markdown("##### 🏖️ Leave Quotas")
        q1, q2, q3 = st.columns(3)
        qa = q1.number_input("Annual", 0, 60, ss.leave_quotas["annual"])
        qs = q2.number_input("Sick", 0, 60, ss.leave_quotas["sick"])
        qc = q3.number_input("Casual", 0, 60, ss.leave_quotas["casual"])
        if st.form_submit_button("💾 Save Organization Rules", type="primary", use_container_width=True):
            ss.company_name, ss.office_start, ss.grace_minutes, ss.half_day_hours = name, start, grace, half
            ss.office_lat, ss.office_lng, ss.office_radius_m = lat, lng, rad
            ss.leave_quotas = {"annual": qa, "sick": qs, "casual": qc, "unpaid": 999}
            log_audit(curr_user_name, "UPDATE", "OrgSetup", f"Updated policies for {name}")
            st.toast("Organization rules updated", icon="✅")
            st.rerun()


def page_user_access():
    df = pd.DataFrame(ss.employees)
    st.dataframe(df[["employee_id", "name", "email", "role", "department", "status", "first_login"]],
                 use_container_width=True, hide_index=True)

    a, b = st.columns(2)
    with a:
        with st.container(border=True):
            st.markdown("##### 🔄 Activate / Deactivate Login")
            target = st.selectbox("Account", [e["employee_id"] for e in ss.employees],
                                  format_func=lambda i: f"{get_emp(i)['name']} ({get_emp(i)['status']})")
            if st.button("Toggle Status", use_container_width=True):
                if target == ss.current_user_id:
                    st.error("You cannot deactivate your own account.")
                else:
                    e = get_emp(target)
                    e["status"] = "Inactive" if e["status"] == "Active" else "Active"
                    log_audit(curr_user_name, "TOGGLE_USER", "UserAuth", f"{e['name']} → {e['status']}")
                    st.toast(f"{e['name']} is now {e['status']}", icon="🔁")
                    st.rerun()
    with b:
        with st.container(border=True):
            st.markdown("##### 🔑 Reset Credentials")
            tgt = st.selectbox("Account to reset", [e["employee_id"] for e in ss.employees],
                               format_func=lambda i: get_emp(i)["name"], key="reset_t")
            if st.button("Force Password Reset", use_container_width=True):
                get_emp(tgt)["first_login"] = True
                log_audit(curr_user_name, "RESET_PASSWORD", "UserAuth", f"Reset for {get_emp(tgt)['name']}")
                st.toast("Temporary password issued", icon="🔑")
                st.rerun()


def page_add_employee():
    st.caption("Registers the employee and provisions their login credentials.")
    roles = ["Employee", "HR"] if selected_role == "HR" else ["Employee", "HR", "Admin"]
    with st.form("add_emp", clear_on_submit=True):
        c1, c2 = st.columns(2)
        name = c1.text_input("Full Legal Name *")
        email = c2.text_input("Work Email *")
        c3, c4 = st.columns(2)
        role = c3.selectbox("System Role *", roles)
        dept = c4.selectbox("Department *", ss.departments)
        c5, c6 = st.columns(2)
        desig = c5.selectbox("Designation *", ss.designations)
        sal = c6.number_input("Monthly Basic Salary (PKR) *", min_value=15000, value=95000, step=5000)
        c7, c8 = st.columns(2)
        gender = c7.selectbox("Gender", ["Female", "Male", "Other"])
        join = c8.date_input("Joining Date", today_pkt())
        c9, c10 = st.columns(2)
        phone = c9.text_input("Phone", "+92 300 0000000")
        addr = c10.text_input("Address", "Karachi, Pakistan")
        st.info("🔒 Login is created with the email as username and a temporary password (reset on first login).")

        if st.form_submit_button("✅ Register Employee & Create Login", type="primary", use_container_width=True):
            emails = {e["email"].lower() for e in ss.employees}
            if not name.strip() or not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
                st.error("Please enter a valid name and email.")
            elif email.lower() in emails:
                st.error("This email already exists.")
            else:
                nid = next_emp_id()
                ss.employees.append(dict(
                    employee_id=nid, name=name.strip(), email=email.strip(), role=role, department=dept,
                    designation=desig, joining_date=join.isoformat(), basic_salary=sal, gender=gender,
                    tenure_years=0.0, phone=phone, address=addr, status="Active", first_login=True))
                log_audit(curr_user_name, "CREATE_EMPLOYEE", "Employee", f"Registered {name} ({nid}) as {role}")
                st.balloons()
                st.success(f"🎉 {name} ({nid}) registered successfully.")


def page_directory():
    df = pd.DataFrame(ss.employees)
    c1, c2 = st.columns([3, 1])
    q = c1.text_input("🔍 Search by name, ID or title")
    d = c2.selectbox("Department", ["All"] + ss.departments)
    f = df.copy()
    if q:
        m = (f["name"].str.contains(q, case=False, na=False) |
             f["employee_id"].str.contains(q, case=False, na=False) |
             f["designation"].str.contains(q, case=False, na=False))
        f = f[m]
    if d != "All":
        f = f[f["department"] == d]
    cols = ["employee_id", "name", "email", "department", "designation", "joining_date", "status"]
    if selected_role in ("Admin", "HR"):
        cols.insert(6, "basic_salary")
    st.dataframe(f[cols], use_container_width=True, hide_index=True)
    st.caption(f"{len(f)} of {len(df)} employees shown")
    st.download_button("⬇️ Export CSV", f[cols].to_csv(index=False).encode(), "employees.csv", "text/csv")


def page_csv_import():
    st.markdown("""Paste CSV text. A **dry-run** validates everything before anything is written:
required fields, email format & uniqueness, known department, ISO date, and `basic_salary > 0`.""")
    sample = ("name,email,department,designation,joining_date,basic_salary\n"
              "Kashif Raza,kashif@technova.com,Engineering,QA Engineer,2025-02-01,95000\n"
              "Mehwish Qureshi,mehwish@technova.com,Human Resources,HR Lead & People Ops,2025-03-15,85000\n"
              "Invalid Row,bad-email,UnknownDept,Tester,not-a-date,-500")
    text = st.text_area("CSV data", sample, height=150)

    if st.button("⚡ Execute Dry-Run Validation", type="primary"):
        try:
            import io
            df = pd.read_csv(io.StringIO(text), dtype=str).fillna("")
            df.columns = [c.strip().lower() for c in df.columns]
        except Exception as ex:
            st.error(f"Could not parse CSV: {ex}")
            return
        need = ["name", "email", "department", "designation", "joining_date", "basic_salary"]
        missing = [c for c in need if c not in df.columns]
        if missing:
            st.error(f"Missing columns: {', '.join(missing)}")
            return

        existing = {e["email"].lower() for e in ss.employees}
        seen, errors, valid = set(), [], []
        for i, row in df.iterrows():
            r = {k: str(v).strip() for k, v in row.items()}
            errs = []
            if not r["name"]:
                errs.append("name required")
            if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", r["email"]):
                errs.append("invalid email")
            elif r["email"].lower() in existing or r["email"].lower() in seen:
                errs.append("duplicate email")
            seen.add(r["email"].lower())
            if r["department"] not in ss.departments:
                errs.append(f"unknown department '{r['department']}'")
            try:
                datetime.date.fromisoformat(r["joining_date"])
            except ValueError:
                errs.append("joining_date must be YYYY-MM-DD")
            try:
                if float(r["basic_salary"]) <= 0:
                    errs.append("basic_salary must be > 0")
            except ValueError:
                errs.append("basic_salary must be a number")
            if errs:
                errors.append({"Row": i + 2, "Problems": "; ".join(errs)})
            else:
                valid.append(r)
        ss.csv_valid, ss.csv_errors = valid, errors

    if "csv_errors" in ss:
        if ss.csv_errors:
            st.error(f"❌ Dry-run found {len(ss.csv_errors)} bad row(s). Nothing was committed.")
            st.dataframe(pd.DataFrame(ss.csv_errors), use_container_width=True, hide_index=True)
        else:
            st.success(f"✅ Dry-run passed — {len(ss.csv_valid)} row(s) ready to import.")
            if st.button("📥 Commit Import", type="primary"):
                for r in ss.csv_valid:
                    ss.employees.append(dict(
                        employee_id=next_emp_id(), name=r["name"], email=r["email"], role="Employee",
                        department=r["department"], designation=r["designation"], joining_date=r["joining_date"],
                        basic_salary=float(r["basic_salary"]), gender="Other", tenure_years=0.0,
                        phone="-", address="-", status="Active", first_login=True))
                log_audit(curr_user_name, "CSV_IMPORT", "Employee", f"Imported {len(ss.csv_valid)} employees")
                del ss["csv_valid"], ss["csv_errors"]
                st.balloons()
                st.rerun()


def page_attendance(own_only=False):
    uid = ss.current_user_id
    today = today_pkt()
    today_iso = today.isoformat()
    mine_today = next((a for a in ss.attendance if a["employee_id"] == uid and a["date"] == today_iso), None)
    is_open = mine_today is not None and mine_today["check_out"] == "-"

    with st.container(border=True):
        st.markdown("##### 📍 Check In / Out (Geofenced)")

        # Clear status so the user always knows why a button is (in)active
        if mine_today is None:
            st.info("You have not checked in today.")
        elif is_open:
            st.success(f"Checked in at **{mine_today['check_in']}** ({mine_today['status']}, {mine_today['method']}). "
                       "Remember to check out before leaving.")
        else:
            st.success(f"Today's attendance is complete: in **{mine_today['check_in']}**, "
                       f"out **{mine_today['check_out']}** · {mine_today['hours']} h · {mine_today['status']}.")

        st.caption("Simulate your GPS position. Defaults are inside the office radius.")
        g1, g2, g3 = st.columns(3)
        lat = g1.number_input("Your Latitude", value=float(ss.office_lat), format="%.5f", key="my_lat")
        lng = g2.number_input("Your Longitude", value=float(ss.office_lng), format="%.5f", key="my_lng")
        method = g3.selectbox("Method", ["Web", "Camera"], key="att_method")
        dist = haversine_distance(lat, lng, ss.office_lat, ss.office_lng)
        inside = dist <= ss.office_radius_m
        (st.success if inside else st.error)(
            f"You are **{dist} m** from office — {'inside' if inside else 'OUTSIDE'} the {ss.office_radius_m} m geofence.")

        photo = None
        if method == "Camera" and (mine_today is None or is_open):
            photo = st.camera_input("📸 Take a selfie to verify your identity",
                                    key=f"cam_{uid}_{'out' if mine_today else 'in'}")

        b1, b2 = st.columns(2)
        if b1.button("🟢 Check In", use_container_width=True, disabled=mine_today is not None, key="btn_in"):
            if not inside:
                st.error("Check-in blocked: you are outside the office geofence.")
            elif method == "Camera" and photo is None:
                st.error("Camera mode needs a selfie. Take a photo above, then press Check In again.")
            else:
                now = now_pkt()
                limit = datetime.datetime.combine(today, ss.office_start) + datetime.timedelta(minutes=int(ss.grace_minutes))
                status = "Late" if now > limit else "Present"
                ss.attendance.append(dict(
                    id=f"ATT-{len(ss.attendance) + 1:03d}", date=today_iso, employee_id=uid, name=curr_user_name,
                    check_in=now.strftime("%H:%M"), check_out="-", status=status, hours=0.0,
                    method=method, dist_m=dist))
                log_audit(curr_user_name, "CHECK_IN", "Attendance", f"{status} via {method}, {dist} m")
                st.toast(f"Checked in at {now.strftime('%H:%M')} — {status}", icon="🟢")
                st.rerun()

        if b2.button("🔴 Check Out", use_container_width=True, disabled=not is_open, key="btn_out"):
            if method == "Camera" and photo is None:
                st.error("Camera mode needs a selfie. Take a photo above, then press Check Out again.")
            else:
                now = now_pkt()
                h, m = map(int, mine_today["check_in"].split(":"))
                started = datetime.datetime.combine(today, datetime.time(h, m))
                hrs = round(max((now - started).total_seconds() / 3600, 0), 1)
                mine_today.update(check_out=now.strftime("%H:%M"), hours=hrs)
                if hrs < ss.half_day_hours:
                    mine_today["status"] = "Half Day"
                log_audit(curr_user_name, "CHECK_OUT", "Attendance", f"{hrs} hours via {method}")
                st.toast(f"Checked out at {now.strftime('%H:%M')} — {hrs} h", icon="🔴")
                st.rerun()

        if mine_today is not None:
            if st.button("🔄 Reset today's record (demo / testing)", key="btn_reset_att"):
                ss.attendance.remove(mine_today)
                log_audit(curr_user_name, "RESET_ATTENDANCE", "Attendance", f"Cleared record for {today_iso}")
                st.toast("Today's record cleared — you can check in again", icon="🔄")
                st.rerun()

    # ---- Records ----
    df = pd.DataFrame(ss.attendance)
    if own_only or selected_role == "Employee":
        df = df[df["employee_id"] == uid]
    st.markdown("##### 📋 Attendance Records")
    if df.empty:
        st.info("No attendance records yet.")
        return
    f1, f2 = st.columns(2)
    sf = f1.multiselect("Status", sorted(df["status"].unique()), default=sorted(df["status"].unique()))
    df = df[df["status"].isin(sf)].sort_values("date", ascending=False)
    st.dataframe(df.drop(columns=["id"]), use_container_width=True, hide_index=True)


def page_leaves(own_only=False):
    uid = ss.current_user_id
    can_approve = selected_role in ("Admin", "HR") and not own_only

    with st.expander("➕ Apply for Leave", expanded=own_only):
        with st.form("leave_form", clear_on_submit=True):
            c1, c2, c3 = st.columns(3)
            ltype = c1.selectbox("Type", list(ss.leave_quotas.keys()))
            s = c2.date_input("From", today_pkt())
            e = c3.date_input("To", today_pkt())
            reason = st.text_input("Reason")
            if st.form_submit_button("📨 Submit Request", type="primary", use_container_width=True):
                if e < s:
                    st.error("End date is before start date.")
                else:
                    days = calculate_working_days(s, e)
                    used = sum(l["working_days"] for l in ss.leaves if l["employee_id"] == uid
                               and l["leave_type"] == ltype and l["status"] in ("Approved", "Pending"))
                    if days == 0:
                        st.error("Selected range has no working days.")
                    elif used + days > ss.leave_quotas[ltype]:
                        st.error(f"Quota exceeded: {used} used + {days} requested > {ss.leave_quotas[ltype]}.")
                    else:
                        ss.leaves.append(dict(
                            leave_id=f"LV-{101 + len(ss.leaves)}", employee_id=uid, employee_name=curr_user_name,
                            leave_type=ltype, start_date=s.isoformat(), end_date=e.isoformat(),
                            working_days=days, reason=reason, status="Pending",
                            applied_at=today_pkt().isoformat(), hr_comment=""))
                        log_audit(curr_user_name, "APPLY_LEAVE", "Leave", f"{ltype}, {days} day(s)")
                        st.toast("Leave request submitted", icon="📨")
                        st.rerun()

    # Quota balance
    st.markdown("##### 📊 My Leave Balance")
    cols = st.columns(3)
    for col, k in zip(cols, ["annual", "sick", "casual"]):
        used = sum(l["working_days"] for l in ss.leaves if l["employee_id"] == uid
                   and l["leave_type"] == k and l["status"] == "Approved")
        col.metric(k.title(), f"{ss.leave_quotas[k] - used} left", f"{used} used of {ss.leave_quotas[k]}",
                   delta_color="off")

    if can_approve:
        st.markdown("##### 📥 Approval Inbox")
        pending = [l for l in ss.leaves if l["status"] == "Pending"]
        if not pending:
            st.success("Inbox zero — no pending requests 🎉")
        for l in pending:
            with st.container(border=True):
                st.markdown(f"**{l['employee_name']}** · {l['leave_type'].title()} · "
                            f"{l['start_date']} → {l['end_date']} ({l['working_days']} day(s))")
                st.caption(f"Reason: {l['reason'] or '—'}")
                cm = st.text_input("HR comment", key=f"cm_{l['leave_id']}")
                a, r = st.columns(2)
                if a.button("✅ Approve", key=f"ap_{l['leave_id']}", use_container_width=True):
                    l.update(status="Approved", hr_comment=cm or "Approved")
                    log_audit(curr_user_name, "APPROVE_LEAVE", "Leave", l["leave_id"])
                    st.toast("Leave approved", icon="✅")
                    st.rerun()
                if r.button("❌ Reject", key=f"rj_{l['leave_id']}", use_container_width=True):
                    l.update(status="Rejected", hr_comment=cm or "Rejected")
                    log_audit(curr_user_name, "REJECT_LEAVE", "Leave", l["leave_id"])
                    st.toast("Leave rejected", icon="❌")
                    st.rerun()

    st.markdown("##### 🗂️ Leave History")
    rows = [l for l in ss.leaves if (l["employee_id"] == uid or (can_approve and not own_only))]
    if rows:
        st.dataframe(pd.DataFrame(rows).drop(columns=["employee_id"]), use_container_width=True, hide_index=True)
    else:
        st.info("No leave history yet.")


def render_payslip(r):
    st.markdown(f"""
    <div class="payslip-box">
        <h3 style="margin:0;">{ss.company_name}</h3>
        <div style="color:#94a3b8; margin-bottom:12px;">Payslip · {r['month']}</div>
        <b>{r['name']}</b> ({r['employee_id']}) · {r['department']}
        <table style="margin-top:12px;">
            <tr><td>Basic Salary</td><td>PKR {r['basic']:,.0f}</td></tr>
            <tr><td>Allowances (10%)</td><td>PKR {r['allowance']:,.0f}</td></tr>
            <tr><td><b>Gross</b></td><td><b>PKR {r['gross']:,.0f}</b></td></tr>
            <tr><td>Late deduction ({r['late_count']} late)</td><td>− PKR {r['late_deduction']:,.0f}</td></tr>
            <tr><td>Unpaid leave ({r['unpaid_days']} d)</td><td>− PKR {r['unpaid_deduction']:,.0f}</td></tr>
            <tr><td>Income tax (monthly)</td><td>− PKR {r['tax']:,.0f}</td></tr>
            <tr><td style="color:#5eead4;"><b>NET PAY</b></td>
                <td style="color:#5eead4;"><b>PKR {r['net']:,.0f}</b></td></tr>
        </table>
    </div>""", unsafe_allow_html=True)


def page_payroll():
    month = st.text_input("Payroll month (YYYY-MM)", today_pkt().strftime("%Y-%m"))
    if not re.match(r"^\d{4}-(0[1-9]|1[0-2])$", month):
        st.error("Use format YYYY-MM, e.g. 2026-10")
        return
    locked = month in ss.finalized_payrolls
    rows = ss.finalized_payrolls[month] if locked else \
        [compute_payroll_row(e, month) for e in ss.employees if e["status"] == "Active"]
    df = pd.DataFrame(rows)

    c1, c2, c3 = st.columns(3)
    c1.metric("Total Gross", f"PKR {df['gross'].sum():,.0f}")
    c2.metric("Total Deductions", f"PKR {(df['gross'] - df['net']).sum():,.0f}")
    c3.metric("Total Net Payout", f"PKR {df['net'].sum():,.0f}")

    if locked:
        st.success(f"🔒 Payroll for {month} is finalized and locked.")
    st.dataframe(df, use_container_width=True, hide_index=True)

    a, b = st.columns(2)
    a.download_button("⬇️ Export Payroll CSV", df.to_csv(index=False).encode(), f"payroll_{month}.csv", "text/csv",
                      use_container_width=True)
    if selected_role == "Admin" and not locked:
        if b.button("🔒 Finalize & Lock Payroll", type="primary", use_container_width=True):
            ss.finalized_payrolls[month] = rows
            log_audit(curr_user_name, "FINALIZE_PAYROLL", "Payroll", f"Locked {month}")
            st.balloons()
            st.rerun()
    elif not locked:
        b.caption("Only Admin can finalize and lock payroll.")

    st.markdown("##### 🧾 Payslip Preview")
    who = st.selectbox("Employee", [r["employee_id"] for r in rows],
                       format_func=lambda i: next(r["name"] for r in rows if r["employee_id"] == i))
    render_payslip(next(r for r in rows if r["employee_id"] == who))


def page_my_payslip():
    month = st.text_input("Month (YYYY-MM)", today_pkt().strftime("%Y-%m"))
    if not re.match(r"^\d{4}-(0[1-9]|1[0-2])$", month):
        st.error("Use format YYYY-MM")
        return
    if month in ss.finalized_payrolls:
        r = next((x for x in ss.finalized_payrolls[month] if x["employee_id"] == me["employee_id"]), None)
        st.success("Finalized payslip")
    else:
        r = compute_payroll_row(me, month)
        st.info("Estimated payslip — payroll not finalized yet.")
    if r:
        render_payslip(r)


def page_my_hub():
    uid = ss.current_user_id
    att = [a for a in ss.attendance if a["employee_id"] == uid]
    lv = [l for l in ss.leaves if l["employee_id"] == uid]
    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Attendance Records", len(att))
    c2.metric("Late Arrivals", sum(1 for a in att if a["status"] == "Late"))
    c3.metric("Approved Leave Days", sum(l["working_days"] for l in lv if l["status"] == "Approved"))
    c4.metric("Pending Requests", sum(1 for l in lv if l["status"] == "Pending"))
    st.markdown("---")
    st.subheader("📢 Latest Announcements")
    for a in ss.announcements[:3]:
        st.info(f"**{a['title']}** ({a['date']}) — *{a['author']}*\n\n{a['content']}")


def page_announcements():
    with st.form("ann_form", clear_on_submit=True):
        t = st.text_input("Title")
        body = st.text_area("Content")
        if st.form_submit_button("📢 Publish", type="primary", use_container_width=True):
            if t.strip() and body.strip():
                ss.announcements.insert(0, dict(id=len(ss.announcements) + 1, title=t,
                                                date=today_pkt().isoformat(),
                                                author=curr_user_name, content=body))
                log_audit(curr_user_name, "ANNOUNCE", "Announcement", t)
                st.toast("Announcement published", icon="📢")
                st.rerun()
            else:
                st.error("Title and content are required.")
    for a in ss.announcements:
        st.info(f"**{a['title']}** ({a['date']}) — *{a['author']}*\n\n{a['content']}")


def page_audit():
    df = pd.DataFrame(ss.audit_trail)
    q = st.text_input("🔍 Filter audit log")
    if q:
        df = df[df.apply(lambda r: q.lower() in " ".join(map(str, r.values)).lower(), axis=1)]
    st.dataframe(df, use_container_width=True, hide_index=True)
    st.download_button("⬇️ Export Audit CSV", df.to_csv(index=False).encode(), "audit_trail.csv", "text/csv")


def page_ai():
    scope = "your own records only" if selected_role == "Employee" else "company-wide data"
    st.caption(f"Assistant scope: **{scope}**. "
               f"{'Gemini connected.' if os.environ.get('GEMINI_API_KEY') else 'Built-in assistant active (set GEMINI_API_KEY for Gemini).'}")
    if not ss.chat_history:
        ss.chat_history.append(("assistant", f"Hi {curr_user_name.split()[0]}! 👋 How can I help today?"))
    for role, msg in ss.chat_history:
        with st.chat_message(role):
            st.markdown(msg)
    if prompt := st.chat_input("Ask about attendance, leave, payroll…"):
        ss.chat_history.append(("user", prompt))
        with st.spinner("Thinking…"):
            ans = ai_reply(prompt, selected_role, ss.current_user_id)
        ss.chat_history.append(("assistant", ans))
        st.rerun()


# =====================================================================
# ROUTER
# =====================================================================
ROUTES = {
    "📊 Executive Dashboard": page_admin_dashboard,
    "👥 HR Dashboard": page_hr_dashboard,
    "⚙️ Organization Setup": page_org_setup,
    "🔐 User Access": page_user_access,
    "➕ Add Employee": page_add_employee,
    "👥 Employee Directory": page_directory,
    "📥 CSV Import": page_csv_import,
    "🕒 Attendance": page_attendance,
    "🕒 My Attendance": lambda: page_attendance(own_only=True),
    "🏖️ Leave Management": page_leaves,
    "🏖️ My Leaves": lambda: page_leaves(own_only=True),
    "💰 Payroll": page_payroll,
    "💵 My Payslip": page_my_payslip,
    "💼 My Hub": page_my_hub,
    "📢 Announcements": page_announcements,
    "🧾 Audit Trail": page_audit,
    "🤖 AI Assistant": page_ai,
}

ROUTES[nav_choice]()