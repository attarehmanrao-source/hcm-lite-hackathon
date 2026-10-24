import React, { useState } from 'react';
import { UserRole, Employee } from '../types';
import {
  Shield,
  Briefcase,
  User,
  ArrowRight,
  Download,
  Building2,
  CheckCircle2,
  Lock,
  Sparkles,
  Clock,
  UserPlus,
  BarChart3,
  FileSpreadsheet,
} from 'lucide-react';

interface LoginScreenProps {
  employees: Employee[];
  companyName: string;
  onLogin: (role: UserRole, user: Employee) => void;
  onOpenStreamlit: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  employees,
  companyName,
  onLogin,
  onOpenStreamlit,
}) => {
  const [selectedTab, setSelectedTab] = useState<UserRole>('Admin');
  const [selectedEmpId, setSelectedEmpId] = useState<string>('EMP003');

  const adminUser = employees.find((e) => e.role === 'Admin') || employees[0];
  const hrUser = employees.find((e) => e.role === 'HR') || employees[1] || employees[0];
  const employeeUsers = employees.filter((e) => e.role === 'Employee');
  const chosenEmployee =
    employees.find((e) => e.employeeId === selectedEmpId) || employeeUsers[0] || employees[0];

  const handleDirectZipDownload = async () => {
    try {
      const res = await fetch('/download-zip');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'hcm-lite-saylani-hackathon.zip');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      window.location.href = '/hcm-lite-saylani-hackathon.zip';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Top Bar with GitHub ZIP Download */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur px-4 sm:px-8 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-tr from-teal-500 to-emerald-400 p-2 rounded-xl text-slate-950 font-black text-base shadow-sm">
              HCM
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-100 tracking-tight">HCM Lite</span>
                <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase">
                  Saylani Hackathon 2026
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-slate-500" />
                {companyName || 'Technova Solutions (Pvt) Ltd'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDirectZipDownload}
              className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download GitHub ZIP (123 KB)</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Login Content */}
      <main className="max-w-4xl w-full mx-auto px-4 py-8 flex-1 flex flex-col items-center justify-center">
        {/* Title & Introduction */}
        <div className="text-center max-w-xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Role-Based Authentication & Permissions
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Sign In to HCM Lite
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            Select your role to access role-specific workflows: Admin executive controls, HR People
            operations & employee additions, or Employee attendance & smart leave.
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-2 mb-6 shadow-xl">
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setSelectedTab('Admin')}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                selectedTab === 'Admin'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Admin Portal</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedTab('HR')}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                selectedTab === 'HR'
                  ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>HR Operations</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedTab('Employee')}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                selectedTab === 'Employee'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Employee Portal</span>
            </button>
          </div>
        </div>

        {/* Selected Role Form Card */}
        <div className="w-full max-w-2xl bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur relative overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div
            className={`absolute top-0 right-0 w-64 h-64 blur-3xl pointer-events-none rounded-full opacity-15 ${
              selectedTab === 'Admin'
                ? 'bg-purple-500'
                : selectedTab === 'HR'
                ? 'bg-teal-500'
                : 'bg-amber-500'
            }`}
          />

          {/* ADMIN PORTAL */}
          {selectedTab === 'Admin' && (
            <div className="space-y-5">
              <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-purple-400" />
                    Company Master Admin Sign In
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Direct access to Executive Analytics, Attendance Monitoring, Employee Register,
                    Payroll Lock, and Master Audit Trail.
                  </p>
                </div>
                <span className="bg-purple-950 border border-purple-800/80 text-purple-300 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
                  Full Authority
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Admin Work Email
                  </label>
                  <input
                    type="email"
                    value={adminUser?.email || 'asad.admin@technova.com'}
                    readOnly
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Master Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value="••••••••••••"
                      readOnly
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none"
                    />
                    <Lock className="w-3.5 h-3.5 text-slate-500 absolute right-3.5 top-3" />
                  </div>
                </div>
              </div>

              {/* Module Capabilities Checklist */}
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 text-xs space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Available in this session:
                </span>
                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Executive Analytics Dashboard</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Add New Employees & Setup Org</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Company-wide Attendance Monitor</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Payroll Finalization & Audit Log</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onLogin('Admin', adminUser)}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all text-sm"
              >
                <span>Sign In as Admin ({adminUser?.name || 'Muhammad Asad'})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* HR OPERATIONS PORTAL */}
          {selectedTab === 'HR' && (
            <div className="space-y-5">
              <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-teal-400" />
                    HR & People Operations Sign In
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Register new employees, dry-run CSV imports, manage daily attendance &
                    corrections, approve leaves, and compute monthly payroll.
                  </p>
                </div>
                <span className="bg-teal-950 border border-teal-800/80 text-teal-300 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
                  People Ops
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    HR Work Email
                  </label>
                  <input
                    type="email"
                    value={hrUser?.email || 'fatima.hr@technova.com'}
                    readOnly
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    HR Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value="••••••••••••"
                      readOnly
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none"
                    />
                    <Lock className="w-3.5 h-3.5 text-slate-500 absolute right-3.5 top-3" />
                  </div>
                </div>
              </div>

              {/* Module Capabilities Checklist */}
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 text-xs space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Available in this session:
                </span>
                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <UserPlus className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>Add New Employee (Form + CSV Dry Run)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>Daily Attendance Board & Corrections</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>Leave Approval Inbox & Quotas</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>Monthly Payroll Computation & Payslips</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onLogin('HR', hrUser)}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all text-sm"
              >
                <span>Sign In as HR Lead ({hrUser?.name || 'Fatima Zahra'})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* EMPLOYEE PORTAL */}
          {selectedTab === 'Employee' && (
            <div className="space-y-5">
              <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-amber-400" />
                    Employee Self-Service Sign In
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Check in with Geofenced Camera/Web attendance, submit natural language leave,
                    access personal payslips, and query company policies.
                  </p>
                </div>
                <span className="bg-amber-950 border border-amber-800/80 text-amber-300 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
                  Self-Service
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Select Employee Account
                  </label>
                  <select
                    value={chosenEmployee.employeeId}
                    onChange={(e) => setSelectedEmpId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    {employeeUsers.map((emp) => (
                      <option key={emp.employeeId} value={emp.employeeId}>
                        {emp.name} ({emp.designation})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Employee Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value="••••••••••••"
                      readOnly
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none"
                    />
                    <Lock className="w-3.5 h-3.5 text-slate-500 absolute right-3.5 top-3" />
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 text-xs text-slate-300 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-200">{chosenEmployee.name}</p>
                  <p className="text-[11px] text-slate-400">
                    {chosenEmployee.department} · {chosenEmployee.email}
                  </p>
                </div>
                <span className="text-[11px] text-amber-400 font-semibold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                  ID: {chosenEmployee.employeeId}
                </span>
              </div>

              {/* Module Capabilities Checklist */}
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 text-xs space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Available in this session:
                </span>
                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Web & Camera Attendance (Geofence)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Smart Leave Application (NLP)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Download Monthly Payslip</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Personal AI Policy Assistant</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onLogin('Employee', chosenEmployee)}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all text-sm"
              >
                <span>Sign In as {chosenEmployee.name}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Python Streamlit Companion Info */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 text-xs text-slate-400">
          <span>Python Streamlit & Pandas edition included in this bundle:</span>
          <button
            type="button"
            onClick={onOpenStreamlit}
            className="text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2 flex items-center gap-1"
          >
            <span>View Python Streamlit Code & Architecture</span>
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-4 text-center text-xs text-slate-500">
        Saylani AI Hackathon 2026 Challenge · HCM Lite · Compliant with Challenge Brief & 25-Point
        Scoring Rubric
      </footer>
    </div>
  );
};
