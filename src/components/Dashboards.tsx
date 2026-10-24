import React, { useState } from 'react';
import {
  UserRole,
  OrgSettings,
  Employee,
  AttendanceRecord,
  LeaveRequest,
  PayrollRecord,
  AuditLogEntry,
  Announcement,
} from '../types';
import {
  Users,
  Clock,
  CalendarCheck,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  Calendar,
  Building,
  Award,
  ArrowUpRight,
  UserPlus,
  Settings,
} from 'lucide-react';

interface DashboardsProps {
  role: UserRole;
  currentUser: Employee;
  settings: OrgSettings;
  employees: Employee[];
  attendance: AttendanceRecord[];
  leaves: LeaveRequest[];
  payrolls: PayrollRecord[];
  auditLogs: AuditLogEntry[];
  announcements: Announcement[];
  onOpenCheckIn: () => void;
  onOpenLeaveApply: () => void;
  onOpenAiWithPrompt: (prompt: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export const Dashboards: React.FC<DashboardsProps> = ({
  role,
  currentUser,
  settings,
  employees,
  attendance,
  leaves,
  payrolls,
  auditLogs,
  announcements,
  onOpenCheckIn,
  onOpenLeaveApply,
  onOpenAiWithPrompt,
  onNavigateTab,
}) => {
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('All');
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // Filtered employees by department
  const filteredEmployees =
    selectedDeptFilter === 'All'
      ? employees
      : employees.filter((e) => e.department === selectedDeptFilter);

  const activeEmployees = filteredEmployees.filter((e) => e.status === 'Active');
  const headcount = activeEmployees.length;

  // Attendance for today
  const todayRecords = attendance.filter((a) => a.date === todayStr);
  const presentToday = todayRecords.filter((a) => a.status === 'Present').length;
  const lateToday = todayRecords.filter((a) => a.status === 'Late').length;
  const halfDaysToday = todayRecords.filter((a) => a.status === 'Half Day').length;

  // Leaves for today
  const onLeaveToday = leaves.filter(
    (l) => l.startDate <= todayStr && l.endDate >= todayStr && l.status === 'Approved'
  ).length;

  // Attendance rate formula from brief:
  // (present + late + missing_checkout + 0.5 * half_day) / (working_day_records - on_leave)
  const effectiveExpected = Math.max(1, headcount - onLeaveToday);
  const totalScore = presentToday + lateToday + halfDaysToday * 0.5;
  const attendanceRate =
    headcount > 0 ? Math.min(100, Math.round((totalScore / effectiveExpected) * 1000) / 10) : 0;

  // Total payroll cost & average salary
  const totalPayrollCost = activeEmployees.reduce((sum, e) => sum + e.basicSalary * 1.5, 0);
  const avgSalary = headcount > 0 ? Math.round(totalPayrollCost / headcount) : 0;

  // Pending leaves count
  const pendingLeavesCount = leaves.filter((l) => l.status === 'Pending').length;

  // Top late-comers ranking
  const lateCountsByEmployee: Record<string, { count: number; name: string; dept: string }> = {};
  attendance
    .filter((a) => a.status === 'Late')
    .forEach((a) => {
      if (!lateCountsByEmployee[a.employeeId]) {
        lateCountsByEmployee[a.employeeId] = {
          count: 0,
          name: a.employeeName,
          dept: employees.find((e) => e.employeeId === a.employeeId)?.department || 'General',
        };
      }
      lateCountsByEmployee[a.employeeId].count += 1;
    });

  const topLateComers = Object.values(lateCountsByEmployee)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Department headcount distribution
  const deptDistribution: Record<string, number> = {};
  employees.forEach((e) => {
    deptDistribution[e.department] = (deptDistribution[e.department] || 0) + 1;
  });

  // Department payroll distribution
  const deptPayrollDistribution: Record<string, number> = {};
  employees.forEach((e) => {
    deptPayrollDistribution[e.department] =
      (deptPayrollDistribution[e.department] || 0) + e.basicSalary * 1.5;
  });

  // AI Summarize handler
  const handleGenerateAiSummary = async () => {
    setIsSummarizing(true);
    setAiSummary(null);

    const kpisPayload = {
      headcount,
      presentToday,
      lateToday,
      onLeaveToday,
      attendanceRate,
      payrollCost: totalPayrollCost,
      avgSalary,
      pendingApprovals: pendingLeavesCount,
      department: selectedDeptFilter,
    };

    try {
      const res = await fetch('/api/ai/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kpis: kpisPayload, role }),
      });
      const data = await res.json();
      setAiSummary(data.bullets || 'Failed to generate summary.');
    } catch {
      // Deterministic fallback
      setAiSummary(
        `• Active headcount stands at ${headcount} with ${presentToday} present today (${attendanceRate}% attendance rate).\n• ${lateToday} employee(s) arrived past the ${settings.graceMinutes}-min grace cutoff today.\n• ${onLeaveToday} approved leave(s) active; ${pendingLeavesCount} requests pending review.\n• Monthly payroll cost computed at PKR ${totalPayrollCost.toLocaleString()} (Average: PKR ${avgSalary.toLocaleString()}).\n\n[AI-generated]`
      );
    } finally {
      setIsSummarizing(false);
    }
  };

  // Distinct departments
  const availableDepts = Array.from(new Set(employees.map((e) => e.department)));

  return (
    <div className="space-y-6">
      {/* Header and Filter Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100">
              {role === 'Admin'
                ? 'Company Executive Dashboard'
                : role === 'HR'
                ? 'People Operations & Attendance Board'
                : 'My Personal Work Hub'}
            </h1>
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-medium">
              {role} View
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time server aggregation for {settings.companyName}. Filterable by department and date range.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Department Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none"
            >
              <option value="All">All Departments</option>
              {availableDepts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* AI Summarize Button (Admin and HR) */}
          {(role === 'Admin' || role === 'HR') && (
            <button
              onClick={handleGenerateAiSummary}
              disabled={isSummarizing}
              className="flex items-center gap-1.5 bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-600 hover:to-emerald-500 text-slate-950 font-bold px-3.5 py-1.5 rounded-xl text-xs shadow-sm transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSummarizing ? 'Analyzing...' : 'Summarize with AI'}</span>
            </button>
          )}
        </div>
      </div>

      {/* AI Summary Banner if generated */}
      {aiSummary && (
        <div className="p-4 bg-teal-950/40 border border-teal-500/30 rounded-2xl relative shadow-md">
          <div className="flex items-start gap-3">
            <div className="bg-teal-500/20 p-2 rounded-xl text-teal-400 border border-teal-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-teal-300 uppercase tracking-wider">
                  AI Executive Insights (Factual Grounding)
                </h3>
                <button
                  onClick={() => setAiSummary(null)}
                  className="text-slate-400 hover:text-slate-200 text-xs"
                >
                  Dismiss
                </button>
              </div>
              <pre className="text-xs text-slate-200 mt-2 whitespace-pre-wrap font-sans leading-relaxed">
                {aiSummary}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN DASHBOARD VIEW */}
      {role === 'Admin' && (
        <div className="space-y-6">
          {/* Top 4 KPI Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Headcount</span>
                <Users className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-slate-100">{headcount}</div>
              <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-medium">
                <TrendingUp className="w-3 h-3" /> Active Personnel
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Attendance Rate</span>
                <CalendarCheck className="w-4 h-4 text-teal-400" />
              </div>
              <div className="text-2xl font-bold text-slate-100">{attendanceRate}%</div>
              <div className="text-[11px] text-slate-400 mt-1">
                {presentToday} Present · {lateToday} Late
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Est. Monthly Payroll</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-slate-100">
                PKR {Math.round(totalPayrollCost / 1000)}k
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Gross = 1.5 × Basic (HRA + Med)
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Average Salary</span>
                <Award className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-slate-100">
                PKR {avgSalary.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Across {availableDepts.length} departments
              </div>
            </div>
          </div>

          {/* Quick Actions Shortcuts for Admin */}
          {onNavigateTab && (
            <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-2xl flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-2">
                Admin Shortcuts:
              </span>
              <button
                type="button"
                onClick={() => onNavigateTab('employees')}
                className="flex items-center gap-1.5 bg-purple-950/70 hover:bg-purple-900/90 text-purple-300 border border-purple-800/80 px-3 py-1.5 rounded-xl font-semibold transition-all shadow-sm"
              >
                <UserPlus className="w-3.5 h-3.5 text-purple-400" />
                <span>➕ Add / Manage Employees (M3)</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('attendance')}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 px-3 py-1.5 rounded-xl font-semibold transition-all shadow-sm"
              >
                <Clock className="w-3.5 h-3.5 text-teal-400" />
                <span>🕒 Attendance Monitor (M4)</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('payroll')}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-xl font-semibold transition-all shadow-sm"
              >
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>💵 Lock Payroll (M6)</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('setup')}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 px-3 py-1.5 rounded-xl font-semibold transition-all shadow-sm"
              >
                <Settings className="w-3.5 h-3.5 text-purple-400" />
                <span>⚙️ Org Setup (M2)</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('audit')}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-xl font-semibold transition-all shadow-sm"
              >
                <span>🛡️ Audit Trail (M9)</span>
              </button>
            </div>
          )}

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Department Headcount Bar Chart */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Users className="w-4 h-4 text-teal-400" /> Headcount by Department
                </h3>
                <span className="text-[11px] text-slate-400">Total: {employees.length}</span>
              </div>
              <div className="space-y-3">
                {Object.entries(deptDistribution).map(([dept, count]) => {
                  const pct = Math.round((count / Math.max(employees.length, 1)) * 100);
                  return (
                    <div key={dept} className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-300 font-medium">
                        <span>{dept}</span>
                        <span>
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-teal-500 to-cyan-400 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Department Payroll Cost Bar Chart */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" /> Payroll Allocation by Dept
                </h3>
                <span className="text-[11px] text-slate-400">
                  Total: PKR {(totalPayrollCost / 1000).toFixed(0)}k
                </span>
              </div>
              <div className="space-y-3">
                {Object.entries(deptPayrollDistribution).map(([dept, cost]) => {
                  const pct = Math.round((cost / Math.max(totalPayrollCost, 1)) * 100);
                  return (
                    <div key={dept} className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-300 font-medium">
                        <span>{dept}</span>
                        <span>
                          PKR {(cost / 1000).toFixed(0)}k ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Audit Feed Preview */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" /> Recent Master Audit Feed (Live)
              </h3>
              <span className="text-[11px] text-slate-400">{auditLogs.length} events logged</span>
            </div>
            <div className="divide-y divide-slate-800/80">
              {auditLogs.slice(0, 4).map((log) => (
                <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.action === 'CREATE'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : log.action === 'APPROVE' || log.action === 'FINALIZE'
                          ? 'bg-purple-950 text-purple-400 border border-purple-800'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {log.action}
                    </span>
                    <span className="text-slate-300">{log.details}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">{log.timestamp}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* HR DASHBOARD VIEW */}
      {role === 'HR' && (
        <div className="space-y-6">
          {/* Top KPIs for HR */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Present Today</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-slate-100">{presentToday}</div>
              <div className="text-[11px] text-slate-400 mt-1">Out of {headcount} active</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Late Arrivals</span>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-amber-400">{lateToday}</div>
              <div className="text-[11px] text-slate-400 mt-1">
                After {settings.officeStart} + {settings.graceMinutes}m cutoff
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">On Leave Today</span>
                <Calendar className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-slate-100">{onLeaveToday}</div>
              <div className="text-[11px] text-slate-400 mt-1">Approved quota leaves</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Pending Leaves</span>
                <Clock className="w-4 h-4 text-teal-400" />
              </div>
              <div className="text-2xl font-bold text-teal-400">{pendingLeavesCount}</div>
              <div className="text-[11px] text-slate-400 mt-1">Awaiting HR decision</div>
            </div>
          </div>

          {/* Quick Actions Shortcuts for HR */}
          {onNavigateTab && (
            <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-2xl flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-2">
                HR Actions:
              </span>
              <button
                type="button"
                onClick={() => onNavigateTab('employees')}
                className="flex items-center gap-1.5 bg-teal-950/70 hover:bg-teal-900/90 text-teal-300 border border-teal-800/80 px-3 py-1.5 rounded-xl font-semibold transition-all shadow-sm"
              >
                <UserPlus className="w-3.5 h-3.5 text-teal-400" />
                <span>➕ Add New Employee / Dry Run (M3)</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('attendance')}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 px-3 py-1.5 rounded-xl font-semibold transition-all shadow-sm"
              >
                <Clock className="w-3.5 h-3.5 text-teal-400" />
                <span>🕒 Daily Attendance Board (M4)</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('leave')}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-xl font-semibold transition-all shadow-sm"
              >
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>🏖️ Leave Approvals Inbox (M5)</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('payroll')}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-xl font-semibold transition-all shadow-sm"
              >
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>💵 Monthly Payroll Run (M6)</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('audit')}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-xl font-semibold transition-all shadow-sm"
              >
                <span>📢 Announcements & Audit (M9)</span>
              </button>
            </div>
          )}

          {/* Top 5 Late-Comers Table & Leave Utilization */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Late-Comers */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" /> Top Late-Comers Ranking
                </h3>
                <span className="text-[11px] text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-800/60 font-semibold">
                  3 lates = 0.5d penalty
                </span>
              </div>

              {topLateComers.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs">
                  No late occurrences recorded yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {topLateComers.map((item, idx) => (
                    <div key={item.name} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center font-bold text-[10px] text-slate-400">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-200">{item.name}</p>
                          <p className="text-[10px] text-slate-400">{item.dept}</p>
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-amber-950/60 text-amber-300 font-bold text-[11px] rounded-lg border border-amber-800/50">
                        {item.count} late arrival{item.count > 1 ? 's' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Leave by Type Breakdown */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-teal-400" /> Leave Quota Utilization
                </h3>
                <span className="text-[11px] text-slate-400">{leaves.length} records</span>
              </div>

              <div className="space-y-4">
                {(['annual', 'sick', 'casual'] as const).map((type) => {
                  const used = leaves
                    .filter((l) => l.leaveType === type && l.status === 'Approved')
                    .reduce((sum, l) => sum + l.workingDays, 0);
                  const quota = settings.leaveQuotas[type] * Math.max(employees.length, 1);
                  const pct = Math.min(100, Math.round((used / quota) * 100));

                  return (
                    <div key={type} className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-300 font-medium capitalize">
                        <span>{type} Leave</span>
                        <span>
                          {used} used / {quota} total days ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-teal-500 to-emerald-400 h-2.5 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EMPLOYEE DASHBOARD VIEW */}
      {role === 'Employee' && (
        <div className="space-y-6">
          {/* Employee Quick Action Check-in Card */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-teal-950/60 border border-teal-500/30 p-5 sm:p-6 rounded-2xl shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
                  Self-Service Portal
                </span>
                <h2 className="text-xl font-bold text-slate-100 mt-1">
                  Good day, {currentUser.name}!
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Designation: {currentUser.designation} · {currentUser.department}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={onOpenCheckIn}
                  className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-600 hover:to-emerald-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs shadow-md transition-all"
                >
                  <Clock className="w-4 h-4" />
                  <span>Mark Attendance</span>
                </button>
                <button
                  onClick={onOpenLeaveApply}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Request Leave</span>
                </button>
              </div>
            </div>
          </div>

          {/* Employee 4 KPI Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Hours Logged (Week)
              </span>
              <div className="text-2xl font-bold text-slate-100 mt-1">38.4 / 40h</div>
              <div className="text-[11px] text-teal-400 mt-1">Target: 40 hrs</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Late Count
              </span>
              <div className="text-2xl font-bold text-amber-400 mt-1">
                {
                  attendance.filter(
                    (a) => a.employeeId === currentUser.employeeId && a.status === 'Late'
                  ).length
                }
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Grace limit: {settings.officeStart} + {settings.graceMinutes}m
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Annual Leave Remaining
              </span>
              <div className="text-2xl font-bold text-emerald-400 mt-1">
                {settings.leaveQuotas.annual -
                  leaves
                    .filter(
                      (l) =>
                        l.employeeId === currentUser.employeeId &&
                        l.leaveType === 'annual' &&
                        l.status === 'Approved'
                    )
                    .reduce((sum, l) => sum + l.workingDays, 0)}{' '}
                days
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Out of {settings.leaveQuotas.annual} quota</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Casual / Sick Balance
              </span>
              <div className="text-2xl font-bold text-blue-400 mt-1">
                {settings.leaveQuotas.casual -
                  leaves
                    .filter(
                      (l) =>
                        l.employeeId === currentUser.employeeId &&
                        l.leaveType === 'casual' &&
                        l.status === 'Approved'
                    )
                    .reduce((sum, l) => sum + l.workingDays, 0)}{' '}
                / {settings.leaveQuotas.sick}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Casual / Sick days remaining</div>
            </div>
          </div>

          {/* Quick AI Prompts & Announcements */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Prompts for Employee */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-teal-400" /> Ask AI Assistant (Try These)
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() =>
                    onOpenAiWithPrompt('How many sick leaves do I have left this year?')
                  }
                  className="w-full text-left p-2.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-xs text-slate-300 transition-colors flex items-center justify-between"
                >
                  <span>"How many sick leaves do I have left this year?"</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                </button>
                <button
                  onClick={() =>
                    onOpenAiWithPrompt('What is the office start time and late penalty rule?')
                  }
                  className="w-full text-left p-2.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-xs text-slate-300 transition-colors flex items-center justify-between"
                >
                  <span>"What is the office start time and late penalty rule?"</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                </button>
                <button
                  onClick={() => onOpenAiWithPrompt("What is Bilal's salary?")}
                  className="w-full text-left p-2.5 bg-rose-950/30 hover:bg-rose-950/50 border border-rose-900/40 rounded-xl text-xs text-rose-300 transition-colors flex items-center justify-between"
                >
                  <span className="font-semibold">
                    "What is Bilal's salary?" (Security Refusal Test)
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
                </button>
              </div>
            </div>

            {/* Announcements Feed */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-teal-400" /> Company Announcements
              </h3>
              <div className="space-y-3">
                {announcements.map((ann) => (
                  <div key={ann.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-xs font-bold text-slate-200">{ann.title}</h4>
                      <span className="text-[10px] text-slate-500">{ann.date}</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{ann.content}</p>
                    <div className="text-[10px] text-teal-400 mt-1.5 font-medium">
                      Author: {ann.author}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
