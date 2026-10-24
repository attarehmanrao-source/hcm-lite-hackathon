import React, { useState } from 'react';
import { UserRole, Employee, AttendanceRecord, LeaveRequest, PayrollRecord, OrgSettings } from '../types';
import { computeEmployeePayroll } from '../utils/rules';
import {
  DollarSign,
  Lock,
  Download,
  FileText,
  Printer,
  CheckCircle,
  AlertCircle,
  Building2,
  Calendar,
} from 'lucide-react';

interface PayrollModuleProps {
  role: UserRole;
  currentUser: Employee;
  settings: OrgSettings;
  employees: Employee[];
  attendance: AttendanceRecord[];
  leaves: LeaveRequest[];
  payrollRuns: PayrollRecord[];
  onFinalizePayroll: (records: PayrollRecord[]) => void;
}

export const PayrollModule: React.FC<PayrollModuleProps> = ({
  role,
  currentUser,
  settings,
  employees,
  attendance,
  leaves,
  payrollRuns,
  onFinalizePayroll,
}) => {
  const [selectedMonth, setSelectedMonth] = useState('2026-10');
  const [activePayslip, setActivePayslip] = useState<PayrollRecord | null>(null);

  const monthWorkingDays = 22;

  // Compute live draft for the selected month for all active employees
  const currentMonthDrafts: PayrollRecord[] = employees.map((emp) => {
    // Check if finalized version exists
    const existingFinal = payrollRuns.find(
      (p) => p.employeeId === emp.employeeId && p.month === selectedMonth && p.status === 'Finalized'
    );
    if (existingFinal) return existingFinal;

    return computeEmployeePayroll(
      emp,
      attendance,
      leaves,
      selectedMonth,
      settings,
      monthWorkingDays
    );
  });

  const isMonthFinalized = payrollRuns.some(
    (p) => p.month === selectedMonth && p.status === 'Finalized'
  );

  const totalGrossPayroll = currentMonthDrafts.reduce((sum, p) => sum + p.grossSalary, 0);
  const totalDeductions = currentMonthDrafts.reduce((sum, p) => sum + p.totalDeductions, 0);
  const totalTaxWithheld = currentMonthDrafts.reduce((sum, p) => sum + p.taxDeduction, 0);
  const totalNetDisbursement = currentMonthDrafts.reduce((sum, p) => sum + p.netSalary, 0);

  // Finalize payroll handler (Admin only)
  const handleFinalize = () => {
    if (role !== 'Admin') {
      alert('Unauthorized: Only Admin has authority to lock and finalize monthly payroll.');
      return;
    }

    const finalizedRecords = currentMonthDrafts.map((rec) => ({
      ...rec,
      status: 'Finalized' as const,
      finalizedAt: new Date().toISOString(),
    }));

    onFinalizePayroll(finalizedRecords);
    alert(`Success: Payroll for ${selectedMonth} has been locked and finalized! Official payslips issued.`);
  };

  // Printable Payslip Trigger
  const handlePrintPayslip = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" /> Payroll Lite & Tax Engine (Module 6)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Gross = 1.5× Basic (HRA 40%, Medical 10%). Deductions for absent, unpaid leave, half-days & late penalty. Progressive 5-tier tax slabs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none"
            >
              <option value="2026-10">October 2026</option>
              <option value="2026-09">September 2026</option>
              <option value="2026-08">August 2026</option>
            </select>
          </div>

          {role === 'Admin' && !isMonthFinalized && (
            <button
              onClick={handleFinalize}
              className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow-md transition-all"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Finalize & Lock Payroll</span>
            </button>
          )}

          {isMonthFinalized && (
            <span className="flex items-center gap-1 bg-emerald-950 text-emerald-400 border border-emerald-800 px-3 py-1.5 rounded-xl text-xs font-bold">
              <CheckCircle className="w-3.5 h-3.5" />
              Locked & Finalized
            </span>
          )}
        </div>
      </div>

      {/* Aggregate KPI Cards */}
      {(role === 'Admin' || role === 'HR') && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Total Gross Payroll
            </span>
            <div className="text-2xl font-bold text-slate-100 mt-1">
              PKR {totalGrossPayroll.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">
              Base + Allowances (40% HRA, 10% Med)
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Attendance Deductions
            </span>
            <div className="text-2xl font-bold text-rose-400 mt-1">
              - PKR {totalDeductions.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">
              Absent, Unpaid & Half-days
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Income Tax Withheld
            </span>
            <div className="text-2xl font-bold text-amber-400 mt-1">
              - PKR {totalTaxWithheld.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">
              Computed via 5 Annual Tax Slabs
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Net Disbursement
            </span>
            <div className="text-2xl font-bold text-emerald-400 mt-1">
              PKR {totalNetDisbursement.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">
              For {currentMonthDrafts.length} Employees
            </span>
          </div>
        </div>
      )}

      {/* Payroll Register Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-teal-400" />
            <h3 className="font-bold text-sm text-slate-100">
              {role === 'Employee'
                ? 'My Monthly Payslip Record'
                : `Payroll Register for ${selectedMonth} (${isMonthFinalized ? 'Finalized' : 'Draft'})`}
            </h3>
          </div>
          {role === 'HR' && !isMonthFinalized && (
            <span className="text-[11px] text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
              Draft mode: Awaiting Admin final lock
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Basic</th>
                <th className="py-3 px-4">Gross (1.5x)</th>
                <th className="py-3 px-4">Deductions</th>
                <th className="py-3 px-4">Tax (Slab)</th>
                <th className="py-3 px-4">Net Salary</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Payslip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {currentMonthDrafts
                .filter((p) => role !== 'Employee' || p.employeeId === currentUser.employeeId)
                .map((row) => (
                  <tr key={row.employeeId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-100">{row.employeeName}</div>
                      <div className="text-[11px] text-slate-400">
                        {row.employeeId} · {row.department}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono">PKR {row.basicSalary.toLocaleString()}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-100">
                      PKR {row.grossSalary.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono text-rose-400">
                      {row.totalDeductions > 0
                        ? `- PKR ${row.totalDeductions.toLocaleString()}`
                        : '0'}
                    </td>
                    <td className="py-3 px-4 font-mono text-amber-400">
                      {row.taxDeduction > 0
                        ? `- PKR ${row.taxDeduction.toLocaleString()}`
                        : 'Exempt (0%)'}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400 text-sm">
                      PKR {row.netSalary.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          row.status === 'Finalized'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setActivePayslip(row)}
                        className="bg-slate-800 hover:bg-slate-700 text-teal-300 px-2.5 py-1 rounded text-xs font-medium border border-slate-700 transition-colors"
                      >
                        View Slip
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* OFFICIAL PAYSLIP MODAL / RECEIPT VIEW */}
      {activePayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 sm:p-7 shadow-2xl text-slate-100">
            {/* Header / Brand */}
            <div className="border-b border-slate-800 pb-4 mb-4 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-teal-400" />
                  <h3 className="font-bold text-lg text-slate-100">{settings.companyName}</h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Official Pay Statement for {activePayslip.month}
                </p>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  activePayslip.status === 'Finalized'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-amber-950 text-amber-400 border border-amber-800'
                }`}
              >
                {activePayslip.status}
              </span>
            </div>

            {/* Employee Meta */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs mb-4">
              <div>
                <span className="text-slate-500 block text-[10px]">Employee Name</span>
                <span className="font-bold text-slate-100">{activePayslip.employeeName}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Employee ID</span>
                <span className="font-mono text-slate-200">{activePayslip.employeeId}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Department & Title</span>
                <span className="text-slate-300">
                  {activePayslip.department} ({activePayslip.designation})
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Monthly Working Days</span>
                <span className="text-slate-300">{activePayslip.workingDays} days</span>
              </div>
            </div>

            {/* Salary Breakdown Table */}
            <div className="space-y-2 text-xs border border-slate-800 rounded-xl p-4 bg-slate-950">
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Basic Salary</span>
                <span className="font-mono text-slate-200">
                  PKR {activePayslip.basicSalary.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">House Rent Allowance (HRA 40%)</span>
                <span className="font-mono text-slate-200">
                  PKR {activePayslip.hra.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Medical Allowance (10%)</span>
                <span className="font-mono text-slate-200">
                  PKR {activePayslip.medical.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-1.5 font-bold text-slate-100 border-b border-slate-700">
                <span>Total Gross Earnings (1.5× Basic)</span>
                <span className="font-mono text-teal-300">
                  PKR {activePayslip.grossSalary.toLocaleString()}
                </span>
              </div>

              {/* Deductions breakdown */}
              <div className="flex justify-between py-1 text-rose-400">
                <span>Attendance / Late Deductions</span>
                <span className="font-mono">- PKR {activePayslip.totalDeductions.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 text-amber-400 border-b border-slate-700">
                <span>Income Tax (Annualized Slab)</span>
                <span className="font-mono">- PKR {activePayslip.taxDeduction.toLocaleString()}</span>
              </div>

              {/* Net Pay */}
              <div className="flex justify-between py-2 text-sm font-bold text-emerald-400">
                <span>Net Disbursed Take-Home</span>
                <span className="font-mono text-base">
                  PKR {activePayslip.netSalary.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-4 mt-2">
              <button
                onClick={handlePrintPayslip}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-2 rounded-xl transition-colors font-medium border border-slate-700"
              >
                <Printer className="w-3.5 h-3.5" /> Print Payslip
              </button>

              <button
                onClick={() => setActivePayslip(null)}
                className="bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
