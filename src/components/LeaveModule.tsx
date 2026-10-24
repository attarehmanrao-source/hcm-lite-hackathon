import React, { useState } from 'react';
import { UserRole, Employee, LeaveRequest, LeaveType, OrgSettings } from '../types';
import { calculateWorkingDays } from '../utils/rules';
import {
  Calendar,
  Sparkles,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Send,
  UserCheck,
} from 'lucide-react';

interface LeaveModuleProps {
  role: UserRole;
  currentUser: Employee;
  settings: OrgSettings;
  leaves: LeaveRequest[];
  onApplyLeave: (leave: LeaveRequest) => void;
  onApproveLeave: (leaveId: string, comment: string) => void;
  onRejectLeave: (leaveId: string, comment: string) => void;
  onCancelLeave: (leaveId: string) => void;
}

export const LeaveModule: React.FC<LeaveModuleProps> = ({
  role,
  currentUser,
  settings,
  leaves,
  onApplyLeave,
  onApproveLeave,
  onRejectLeave,
  onCancelLeave,
}) => {
  const [activeTab, setActiveTab] = useState<'apply' | 'inbox' | 'history'>(
    role === 'HR' ? 'inbox' : 'apply'
  );

  // Smart Leave NLP prompt input
  const [smartPrompt, setSmartPrompt] = useState<string>('');
  const [isParsingSmartLeave, setIsParsingSmartLeave] = useState<boolean>(false);
  const [parseMessage, setParseMessage] = useState<string | null>(null);

  // Leave Form Fields
  const [leaveType, setLeaveType] = useState<LeaveType>('casual');
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
  );
  const [reason, setReason] = useState<string>('Personal and family commitments');

  // Approval comment inputs
  const [approvalComments, setApprovalComments] = useState<Record<string, string>>({});

  // Calculate my leave balances
  const myLeaves = leaves.filter((l) => l.employeeId === currentUser.employeeId);
  const usedAnnual = myLeaves
    .filter((l) => l.leaveType === 'annual' && l.status === 'Approved')
    .reduce((sum, l) => sum + l.workingDays, 0);
  const usedSick = myLeaves
    .filter((l) => l.leaveType === 'sick' && l.status === 'Approved')
    .reduce((sum, l) => sum + l.workingDays, 0);
  const usedCasual = myLeaves
    .filter((l) => l.leaveType === 'casual' && l.status === 'Approved')
    .reduce((sum, l) => sum + l.workingDays, 0);

  const balanceAnnual = Math.max(0, settings.leaveQuotas.annual - usedAnnual);
  const balanceSick = Math.max(0, settings.leaveQuotas.sick - usedSick);
  const balanceCasual = Math.max(0, settings.leaveQuotas.casual - usedCasual);

  // Smart Leave NLP Parser handler
  const handleParseSmartLeave = async () => {
    if (!smartPrompt.trim()) return;
    setIsParsingSmartLeave(true);
    setParseMessage(null);

    try {
      const res = await fetch('/api/ai/smart-leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: smartPrompt }),
      });
      const data = await res.json();
      if (data.data) {
        setLeaveType(data.data.type || 'casual');
        if (data.data.startDate) setStartDate(data.data.startDate);
        if (data.data.endDate) setEndDate(data.data.endDate);
        if (data.data.reason) setReason(data.data.reason);
        setParseMessage(
          `AI analyzed: Category [${data.data.type.toUpperCase()}] from ${data.data.startDate} to ${data.data.endDate}. Review & confirm below.`
        );
      }
    } catch {
      // Fallback parser
      const low = smartPrompt.toLowerCase();
      let type: LeaveType = 'casual';
      if (low.includes('sick') || low.includes('fever') || low.includes('doctor') || low.includes('tabiyat')) {
        type = 'sick';
      } else if (low.includes('annual') || low.includes('vacation')) {
        type = 'annual';
      }
      setLeaveType(type);
      setReason(smartPrompt);
      setParseMessage(`Identified type: ${type.toUpperCase()}. Form pre-filled for your confirmation.`);
    } finally {
      setIsParsingSmartLeave(false);
    }
  };

  // Submit Leave Application
  const handleSubmitApplication = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Calculate working days
    const workingDays = calculateWorkingDays(startDate, endDate, settings);
    if (workingDays <= 0) {
      alert('Application Rejected: Selected dates fall entirely on weekends or public holidays.');
      return;
    }

    // 2. Over-balance check (HTTP 422 rule)
    if (leaveType !== 'unpaid') {
      const availableBalance =
        leaveType === 'annual'
          ? balanceAnnual
          : leaveType === 'sick'
          ? balanceSick
          : balanceCasual;

      if (workingDays > availableBalance) {
        alert(
          `Error 422 (Over-balance): Requested ${workingDays} days, but remaining ${leaveType} balance is only ${availableBalance} days.`
        );
        return;
      }
    }

    // 3. Overlap check (HTTP 422 rule)
    const hasOverlap = myLeaves.some(
      (l) =>
        (l.status === 'Approved' || l.status === 'Pending') &&
        !(endDate < l.startDate || startDate > l.endDate)
    );

    if (hasOverlap) {
      alert('Error 422 (Overlap): You already have an approved or pending leave during this date interval.');
      return;
    }

    const newLeave: LeaveRequest = {
      id: `LV-${Date.now()}`,
      employeeId: currentUser.employeeId,
      employeeName: currentUser.name,
      leaveType,
      startDate,
      endDate,
      workingDays,
      reason,
      status: 'Pending',
      appliedAt: new Date().toISOString().split('T')[0],
    };

    onApplyLeave(newLeave);
    alert(`Leave application submitted successfully for ${workingDays} working days! Awaiting HR review.`);
    setActiveTab('history');
  };

  const pendingLeavesForApproval = leaves.filter((l) => l.status === 'Pending');

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-400" /> Leave Management & Smart Form (Module 5)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Working days only (weekends & holidays excluded). Overlap and over-balance validated against company quotas.
          </p>
        </div>

        {/* Tab selection */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('apply')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'apply' ? 'bg-slate-800 text-teal-300' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Apply Leave
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'history'
                ? 'bg-slate-800 text-teal-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            My History ({myLeaves.length})
          </button>
          {(role === 'HR' || role === 'Admin') && (
            <button
              onClick={() => setActiveTab('inbox')}
              className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'inbox'
                  ? 'bg-slate-800 text-teal-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Approval Inbox
              {pendingLeavesForApproval.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 bg-amber-500 text-slate-950 rounded-full font-bold text-[10px]">
                  {pendingLeavesForApproval.length}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Quotas Balance Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Annual Quota
          </span>
          <div className="text-2xl font-bold text-emerald-400 mt-0.5">
            {balanceAnnual}{' '}
            <span className="text-xs text-slate-500 font-normal">/ {settings.leaveQuotas.annual}</span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-1">{usedAnnual} days used</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Sick Quota
          </span>
          <div className="text-2xl font-bold text-teal-400 mt-0.5">
            {balanceSick}{' '}
            <span className="text-xs text-slate-500 font-normal">/ {settings.leaveQuotas.sick}</span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-1">{usedSick} days used</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Casual Quota
          </span>
          <div className="text-2xl font-bold text-amber-400 mt-0.5">
            {balanceCasual}{' '}
            <span className="text-xs text-slate-500 font-normal">/ {settings.leaveQuotas.casual}</span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-1">{usedCasual} days used</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Unpaid Leave
          </span>
          <div className="text-2xl font-bold text-slate-200 mt-0.5">Unlimited</div>
          <span className="text-[10px] text-slate-500 block mt-1">Deducted from gross payroll</span>
        </div>
      </div>

      {/* APPLY LEAVE VIEW (WITH SMART LEAVE PARSER) */}
      {activeTab === 'apply' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Smart Leave Assistant Panel (Left 1 Col) */}
          <div className="bg-gradient-to-br from-slate-900 to-teal-950/40 border border-teal-500/30 p-5 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-teal-300 font-bold text-sm">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span>Smart Leave: Plain Words</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Describe your leave in everyday English or Roman Urdu. AI automatically maps the category, calculates working days, and pre-fills the form:
            </p>

            <textarea
              rows={4}
              value={smartPrompt}
              onChange={(e) => setSmartPrompt(e.target.value)}
              placeholder="e.g. Need next Monday and Tuesday off for sister's wedding in Lahore..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />

            <div className="space-y-1.5 text-[11px]">
              <span className="font-semibold text-slate-400">Click to load hackathon prompts:</span>
              <button
                type="button"
                onClick={() =>
                  setSmartPrompt("Need next Monday and Tuesday off for my sister's wedding")
                }
                className="w-full text-left p-1.5 bg-slate-950/80 hover:bg-slate-800 rounded text-teal-300 border border-slate-800"
              >
                • "Need next Monday and Tuesday off for my sister's wedding"
              </button>
              <button
                type="button"
                onClick={() =>
                  setSmartPrompt("Severe migraine and fever, taking 2 days sick leave")
                }
                className="w-full text-left p-1.5 bg-slate-950/80 hover:bg-slate-800 rounded text-teal-300 border border-slate-800"
              >
                • "Severe migraine and fever, taking 2 days sick leave"
              </button>
              <button
                type="button"
                onClick={() =>
                  setSmartPrompt("Agle pir aur mangalwar ko chutti chahiye bhai ki shadi k liye")
                }
                className="w-full text-left p-1.5 bg-slate-950/80 hover:bg-slate-800 rounded text-amber-300 border border-slate-800"
              >
                • "Agle pir aur mangalwar ko chutti chahiye..." (Roman Urdu)
              </button>
            </div>

            <button
              onClick={handleParseSmartLeave}
              disabled={isParsingSmartLeave || !smartPrompt.trim()}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-600 hover:to-emerald-500 text-slate-950 font-bold py-2 rounded-xl text-xs shadow transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isParsingSmartLeave ? 'Analyzing Intent...' : 'Parse & Pre-fill Form'}</span>
            </button>

            {parseMessage && (
              <div className="p-3 bg-teal-950/80 border border-teal-500/40 rounded-xl text-xs text-teal-300 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <span>{parseMessage}</span>
              </div>
            )}
          </div>

          {/* Form Panel (Right 2 Cols) */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-400" /> Confirm Leave Details & Working Days
            </h3>

            <form onSubmit={handleSubmitApplication} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Leave Category
                  </label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 capitalize"
                  >
                    <option value="casual">Casual Leave ({balanceCasual} left)</option>
                    <option value="sick">Sick Leave ({balanceSick} left)</option>
                    <option value="annual">Annual Leave ({balanceAnnual} left)</option>
                    <option value="unpaid">Unpaid Leave (Unlimited)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100"
                  />
                </div>
              </div>

              {/* Working Days calculation review */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Total Calculated Working Days:</span>
                <span className="font-bold text-teal-400 font-mono text-sm">
                  {calculateWorkingDays(startDate, endDate, settings)} Days
                </span>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Reason for Absence
                </label>
                <textarea
                  rows={3}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="State the justification for this leave request..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-600 hover:to-emerald-500 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs shadow-md transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Leave Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* APPROVAL INBOX (HR & ADMIN) */}
      {activeTab === 'inbox' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-teal-400" /> Pending Leave Applications Inbox
            </h3>
            <span className="text-xs text-slate-400">
              {pendingLeavesForApproval.length} pending decisions
            </span>
          </div>

          {pendingLeavesForApproval.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              All leave requests have been reviewed and decided.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingLeavesForApproval.map((req) => (
                <div
                  key={req.id}
                  className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100 text-sm">{req.employeeName}</span>
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded uppercase font-semibold">
                        {req.leaveType}
                      </span>
                      <span className="text-[11px] text-teal-400 font-mono font-semibold">
                        {req.workingDays} Day(s)
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Duration: {req.startDate} to {req.endDate} · Applied on {req.appliedAt}
                    </p>
                    <p className="text-xs text-slate-300 italic">"{req.reason}"</p>
                  </div>

                  {/* Comment & Decision Buttons */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Comment (e.g. Approved as per quota)"
                      value={approvalComments[req.id] || ''}
                      onChange={(e) =>
                        setApprovalComments({ ...approvalComments, [req.id]: e.target.value })
                      }
                      className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 w-56"
                    />

                    <button
                      onClick={() =>
                        onApproveLeave(
                          req.id,
                          approvalComments[req.id] || 'Approved as per quota policy.'
                        )
                      }
                      className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Approve
                    </button>

                    <button
                      onClick={() =>
                        onRejectLeave(
                          req.id,
                          approvalComments[req.id] || 'Rejected due to operational workload.'
                        )
                      }
                      className="flex items-center gap-1 bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MY HISTORY TAB */}
      {activeTab === 'history' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Leave ID</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Dates</th>
                  <th className="py-3 px-4">Working Days</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">HR Comment</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {myLeaves.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      No leave requests logged yet.
                    </td>
                  </tr>
                ) : (
                  myLeaves.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-300">{l.id}</td>
                      <td className="py-3 px-4 capitalize font-medium">{l.leaveType}</td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {l.startDate} to {l.endDate}
                      </td>
                      <td className="py-3 px-4 font-bold text-teal-400">{l.workingDays}d</td>
                      <td className="py-3 px-4 text-slate-300 max-w-xs truncate">{l.reason}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            l.status === 'Approved'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : l.status === 'Pending'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800'
                              : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}
                        >
                          {l.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 italic">{l.hrComment || '—'}</td>
                      <td className="py-3 px-4 text-right">
                        {l.status === 'Pending' && (
                          <button
                            onClick={() => onCancelLeave(l.id)}
                            className="text-rose-400 hover:text-rose-300 text-xs font-semibold"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
