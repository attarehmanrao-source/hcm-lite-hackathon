import React, { useState } from 'react';
import {
  Code2,
  Download,
  Copy,
  Check,
  Terminal,
  FileText,
  BarChart2,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export const StreamlitViewer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'code' | 'requirements' | 'pandas'>('overview');
  const [copied, setCopied] = useState<boolean>(false);

  // Trigger download of streamlit_app.py
  const handleDownloadApp = async () => {
    try {
      const res = await fetch('/streamlit_app.py');
      const text = await res.text();
      const blob = new Blob([text], { type: 'text/x-python;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'streamlit_app.py';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Could not download file directly. Please copy code from the viewer.');
    }
  };

  // Trigger download of requirements.txt
  const handleDownloadRequirements = async () => {
    try {
      const res = await fetch('/requirements.txt');
      const text = await res.text();
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'requirements.txt';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Could not download requirements.');
    }
  };

  const copyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="bg-amber-500/20 text-amber-400 p-2 rounded-xl border border-amber-500/30">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">
                Python Streamlit & Pandas Application Suite
              </h2>
              <p className="text-xs text-slate-400">
                Complete Python solution implementing all 9 modules and Pandas data visualizations for Saylani Hackathon.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleDownloadRequirements}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs px-3 py-2 rounded-xl transition-colors font-medium"
          >
            <Download className="w-3.5 h-3.5" /> requirements.txt
          </button>
          <button
            onClick={handleDownloadApp}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-xl shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" /> Download streamlit_app.py
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-800 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            activeTab === 'overview'
              ? 'bg-amber-950 text-amber-300 border border-amber-800/80'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Overview & Runner Guide
        </button>
        <button
          onClick={() => setActiveTab('pandas')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            activeTab === 'pandas'
              ? 'bg-amber-950 text-amber-300 border border-amber-800/80'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Pandas Visualizations
        </button>
        <button
          onClick={() => setActiveTab('code')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            activeTab === 'code'
              ? 'bg-amber-950 text-amber-300 border border-amber-800/80'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Full Python Source (streamlit_app.py)
        </button>
        <button
          onClick={() => setActiveTab('requirements')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            activeTab === 'requirements'
              ? 'bg-amber-950 text-amber-300 border border-amber-800/80'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          requirements.txt
        </button>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <Terminal className="w-4 h-4" /> 1. Install Dependencies
              </div>
              <p className="text-xs text-slate-400">
                Install Streamlit, Pandas, Google GenAI SDK, and numerical libraries:
              </p>
              <pre className="p-2.5 bg-slate-950 rounded-lg text-[11px] font-mono text-slate-200">
                pip install -r requirements.txt
              </pre>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Sparkles className="w-4 h-4" /> 2. Set Gemini Key (Optional)
              </div>
              <p className="text-xs text-slate-400">
                Enable LLM tool calling and natural language smart leave parser:
              </p>
              <pre className="p-2.5 bg-slate-950 rounded-lg text-[11px] font-mono text-slate-200">
                export GEMINI_API_KEY="..."
              </pre>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
                <ExternalLink className="w-4 h-4" /> 3. Run Streamlit App
              </div>
              <p className="text-xs text-slate-400">
                Launch the interactive Streamlit server on your chosen port:
              </p>
              <pre className="p-2.5 bg-slate-950 rounded-lg text-[11px] font-mono text-slate-200">
                streamlit run streamlit_app.py
              </pre>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" /> Hackathon Brief Compliance Matrix
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="font-bold text-teal-300">M1 Auth & Scope Guard</span>
                <p className="text-slate-400 text-[11px]">
                  Role-based switching in sidebar; strict data scoping for Admin, HR, and Employee.
                </p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="font-bold text-teal-300">M2 Org Setup & Rules</span>
                <p className="text-slate-400 text-[11px]">
                  Office hours 09:00, 15m grace, 5h half-day, GPS lat/lng and 150m perimeter.
                </p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="font-bold text-teal-300">M3 Employee Directory</span>
                <p className="text-slate-400 text-[11px]">
                  Pandas DataFrame directory, CSV dry-run with row+field+reason validation, CSV export.
                </p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="font-bold text-teal-300">M4 Attendance & Camera</span>
                <p className="text-slate-400 text-[11px]">
                  st.camera_input snapshot, Haversine geofence calculation, duplicate check-in blocking.
                </p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="font-bold text-teal-300">M5 Leave & Quotas</span>
                <p className="text-slate-400 text-[11px]">
                  Annual 14, Sick 8, Casual 10; working days calculator skipping weekends and holidays.
                </p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="font-bold text-teal-300">M6 Payroll Lite & Tax</span>
                <p className="text-slate-400 text-[11px]">
                  Gross = 1.5x Basic, daily rates, 5 tax slab brackets, deductions, printable payslip.
                </p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="font-bold text-teal-300">M7 Dashboards & Analytics</span>
                <p className="text-slate-400 text-[11px]">
                  Pandas aggregation, groupby charts, attendance trends, late-comers table.
                </p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="font-bold text-teal-300">M8 AI Assistant</span>
                <p className="text-slate-400 text-[11px]">
                  Smart Leave NLP form pre-fill, Colleague salary refusal guardrail, AI dashboard summaries.
                </p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="font-bold text-teal-300">M9 Comms & Audit</span>
                <p className="text-slate-400 text-[11px]">
                  Company announcements, notifications, master immutable audit trail.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PANDAS VISUALIZATIONS TAB */}
      {activeTab === 'pandas' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm space-y-5">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base text-slate-100">
              Pandas Data Visualization & Processing Engine in streamlit_app.py
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <span className="font-bold text-amber-300 font-mono text-xs">
                1. Headcount & Distribution by Department
              </span>
              <pre className="p-3 bg-slate-900 rounded-lg text-slate-200 font-mono text-[11px]">
{`# Pandas Groupby & Chart in Streamlit
df_emp = pd.DataFrame(st.session_state.employees)
dept_counts = df_emp["department"].value_counts()
st.bar_chart(dept_counts)`}
              </pre>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <span className="font-bold text-amber-300 font-mono text-xs">
                2. Payroll Cost Allocation by Department
              </span>
              <pre className="p-3 bg-slate-900 rounded-lg text-slate-200 font-mono text-[11px]">
{`# Departmental Gross Payroll Summation
df_emp["gross_salary"] = df_emp["basic_salary"] * 1.5
dept_payroll = df_emp.groupby("department")["gross_salary"].sum()
st.bar_chart(dept_payroll)`}
              </pre>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <span className="font-bold text-amber-300 font-mono text-xs">
                3. Late-Comers Frequency Ranking
              </span>
              <pre className="p-3 bg-slate-900 rounded-lg text-slate-200 font-mono text-[11px]">
{`# Pandas Filtering & Aggregation
late_df = df_att[df_att["status"] == "Late"]
late_counts = late_df.groupby("name").size().reset_index(name="Late Occurrences")
st.dataframe(late_counts.sort_values(by="Late Occurrences", ascending=False))`}
              </pre>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <span className="font-bold text-amber-300 font-mono text-xs">
                4. Leave Utilization by Leave Type
              </span>
              <pre className="p-3 bg-slate-900 rounded-lg text-slate-200 font-mono text-[11px]">
{`# Leave category sum
leave_counts = df_leaves.groupby("leave_type")["days"].sum()
st.bar_chart(leave_counts)`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* FULL PYTHON CODE TAB */}
      {activeTab === 'code' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-300 font-bold">
              streamlit_app.py (~650 lines, Full 9-Module Implementation)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadApp}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1 rounded-lg text-xs"
              >
                Download File
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-400">
            This Python script contains the entire standalone application. Run it using{' '}
            <code className="text-amber-300 font-mono">streamlit run streamlit_app.py</code>.
          </p>
        </div>
      )}

      {/* REQUIREMENTS TAB */}
      {activeTab === 'requirements' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100">requirements.txt</h3>
            <button
              onClick={handleDownloadRequirements}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1 rounded-lg text-xs font-medium border border-slate-700"
            >
              Download
            </button>
          </div>
          <pre className="p-4 bg-slate-950 rounded-xl font-mono text-xs text-teal-300">
{`streamlit>=1.35.0
pandas>=2.2.0
numpy>=1.26.0
google-genai>=2.4.0
python-dotenv>=1.0.0
altair>=5.3.0`}
          </pre>
        </div>
      )}
    </div>
  );
};
