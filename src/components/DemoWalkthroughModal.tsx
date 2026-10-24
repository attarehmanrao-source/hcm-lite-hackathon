import React, { useState } from 'react';
import { UserRole } from '../types';
import {
  CheckCircle,
  ArrowRight,
  Shield,
  Briefcase,
  User,
  X,
  Play,
  RotateCcw,
} from 'lucide-react';

interface DemoWalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJumpToStep: (step: number, role: UserRole, targetTab: string) => void;
  onResetInstall: () => void;
  onLoadSampleData: () => void;
}

export const DemoWalkthroughModal: React.FC<DemoWalkthroughModalProps> = ({
  isOpen,
  onClose,
  onJumpToStep,
  onResetInstall,
  onLoadSampleData,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  if (!isOpen) return null;

  const demoSteps = [
    {
      title: 'Step 1: Admin Organization & Rules Setup',
      role: 'Admin' as UserRole,
      tab: 'setup',
      badge: 'Admin',
      description:
        'Admin configures company profile, office start (09:00 AM, 15-min grace), half-day threshold (5h), and office GPS lat/lng with 150m radius.',
      judgeAction: 'Verify Company Setup in M2 and Admin master account.',
    },
    {
      title: 'Step 2: HR Registers Employees & Logins',
      role: 'HR' as UserRole,
      tab: 'employees',
      badge: 'HR',
      description:
        'HR registers employees with job details, department, and basic salary. Generates temporary login with first-time password reset flag. CSV dry-run validator also available.',
      judgeAction: 'Check Employee Directory and try adding a staff member or dry-running a CSV.',
    },
    {
      title: 'Step 3: Employee Attendance & Biometric Geofence',
      role: 'Employee' as UserRole,
      tab: 'attendance',
      badge: 'Employee',
      description:
        'Employee performs Web or Camera check-in. The system evaluates real device GPS against the office perimeter via Haversine distance and checks timestamp against 09:15 cutoff.',
      judgeAction: 'Click Camera Attendance to test live camera feed and geofence check.',
    },
    {
      title: 'Step 4: Smart Leave Application (AI NLP)',
      role: 'Employee' as UserRole,
      tab: 'leave',
      badge: 'Employee',
      description:
        'Employee types in plain English or Roman Urdu: "Need next Monday and Tuesday off for sister\'s wedding" -> AI automatically pre-fills a casual leave form with working days calculated.',
      judgeAction: 'Click "Try Sample Prompt" and observe the instant form pre-fill.',
    },
    {
      title: 'Step 5: HR Approvals & AI Dashboard Summary',
      role: 'HR' as UserRole,
      tab: 'dashboard',
      badge: 'HR',
      description:
        'HR reviews pending leave requests in the inbox, approves with comment, and clicks "Summarize with AI" on the HR Dashboard to view 3-5 factual insight bullets.',
      judgeAction: 'Approve the leave and click the AI Summarize button on the HR dashboard.',
    },
    {
      title: 'Step 6: Payroll Lite Engine & Tax Slabs',
      role: 'HR' as UserRole,
      tab: 'payroll',
      badge: 'HR & Admin',
      description:
        'HR generates the monthly payroll draft: Gross = 1.5x Basic (40% HRA, 10% Medical), absent/half-day/late penalties deducted, and 5-tier tax slabs computed. Admin locks and finalizes the run.',
      judgeAction: 'Switch to Admin to click "Finalize & Lock Payroll Run".',
    },
    {
      title: 'Step 7: Colleague Salary Refusal Guardrail Test',
      role: 'Employee' as UserRole,
      tab: 'ai',
      badge: 'Employee',
      description:
        'Employee opens the AI Assistant and asks: "What is Bilal\'s salary?". The AI strictly refuses, upholding RBAC security guardrails. Then ask: "How many sick leaves do I have left?" for personal data.',
      judgeAction: 'Test the colleague salary prompt to observe graceful refusal.',
    },
    {
      title: 'Step 8: Master Audit Log & Announcements',
      role: 'Admin' as UserRole,
      tab: 'audit',
      badge: 'Admin',
      description:
        'Admin inspects the immutable audit log verifying actor, action, timestamp, entity, and JSON change payload. Posts company announcements.',
      judgeAction: 'Review the audit feed to confirm complete traceability.',
    },
  ];

  const current = demoSteps[currentStepIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="bg-emerald-500/20 text-emerald-400 p-2 rounded-xl border border-emerald-500/30">
              <Play className="w-5 h-5 fill-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Saylani Hackathon: 5-Minute Demo Script</h2>
              <p className="text-xs text-slate-400">
                Step {currentStepIndex + 1} of {demoSteps.length}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Indicator */}
        <div className="grid grid-cols-8 gap-1.5 my-4">
          {demoSteps.map((s, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentStepIndex(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === currentStepIndex
                  ? 'bg-emerald-400 shadow-sm'
                  : idx < currentStepIndex
                  ? 'bg-teal-700'
                  : 'bg-slate-800'
              }`}
              title={s.title}
            />
          ))}
        </div>

        {/* Current Step Body */}
        <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              {current.badge} Context
            </span>
            <span className="text-[11px] bg-slate-800 px-2.5 py-0.5 rounded-full text-slate-300">
              Module: {current.tab.toUpperCase()}
            </span>
          </div>

          <h3 className="text-base font-bold text-slate-100">{current.title}</h3>
          <p className="text-xs text-slate-300 leading-relaxed">{current.description}</p>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs space-y-1">
            <span className="font-semibold text-teal-300 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-teal-400" /> What to test in this step:
            </span>
            <p className="text-slate-300 pl-5">{current.judgeAction}</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800 mt-4">
          <div className="flex items-center gap-2">
            <button
              onClick={onResetInstall}
              title="Reset to clean start"
              className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Fresh
            </button>
            <span className="text-slate-700">|</span>
            <button
              onClick={onLoadSampleData}
              title="Load full test dataset"
              className="text-xs text-slate-400 hover:text-teal-400"
            >
              Load Sample Data
            </button>
          </div>

          <div className="flex items-center gap-2">
            {currentStepIndex > 0 && (
              <button
                onClick={() => setCurrentStepIndex((prev) => prev - 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300 hover:bg-slate-800"
              >
                Previous
              </button>
            )}

            <button
              onClick={() => {
                onJumpToStep(currentStepIndex, current.role, current.tab);
                onClose();
              }}
              className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-1.5 rounded-lg text-xs shadow-md transition-all"
            >
              <span>Jump to this Screen</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {currentStepIndex < demoSteps.length - 1 && (
              <button
                onClick={() => setCurrentStepIndex((prev) => prev + 1)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
