/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  UserRole,
  OrgSettings,
  Employee,
  AttendanceRecord,
  LeaveRequest,
  PayrollRecord,
  AuditLogEntry,
  Announcement,
  AppNotification,
} from './types';
import {
  INITIAL_SETTINGS,
  INITIAL_EMPLOYEES,
  INITIAL_ATTENDANCE,
  INITIAL_LEAVES,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_NOTIFICATIONS,
} from './utils/rules';
import { Navbar } from './components/Navbar';
import { FirstRunWizard } from './components/FirstRunWizard';
import { DemoWalkthroughModal } from './components/DemoWalkthroughModal';
import { Dashboards } from './components/Dashboards';
import { EmployeeModule } from './components/EmployeeModule';
import { AttendanceModule } from './components/AttendanceModule';
import { LeaveModule } from './components/LeaveModule';
import { PayrollModule } from './components/PayrollModule';
import { AuditAndCommsModule } from './components/AuditAndCommsModule';
import { AiAssistantDrawer } from './components/AiAssistantDrawer';
import { StreamlitViewer } from './components/StreamlitViewer';
import { LoginScreen } from './components/LoginScreen';
import {
  LayoutDashboard,
  Users,
  Clock,
  Calendar,
  DollarSign,
  ShieldAlert,
  Settings,
  Code2,
  Download,
  Lock,
  X,
  Building2,
} from 'lucide-react';

export default function App() {
  // Authentication gate state - user must log in first with role
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  // App initialization state
  const [settings, setSettings] = useState<OrgSettings>(INITIAL_SETTINGS);
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(INITIAL_ATTENDANCE);
  const [leaves, setLeaves] = useState<LeaveRequest[]>(INITIAL_LEAVES);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRecord[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>(INITIAL_ANNOUNCEMENTS);
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([
    {
      id: 'AUDIT-001',
      timestamp: new Date().toLocaleString(),
      actor: 'Admin (EMP001)',
      action: 'CREATE',
      entity: 'CompanySetup',
      details: 'Initialized HCM Lite parameters and department structures.',
    },
  ]);

  // Current User & Role Context
  const [activeRole, setActiveRole] = useState<UserRole>('Admin');
  const [currentUser, setCurrentUser] = useState<Employee>(INITIAL_EMPLOYEES[0]);

  // Navigation tab
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // Modals & Drawers
  const [showFirstRunModal, setShowFirstRunModal] = useState<boolean>(false);
  const [showDemoModal, setShowDemoModal] = useState<boolean>(false);
  const [showAiDrawer, setShowAiDrawer] = useState<boolean>(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState<boolean>(false);
  const [aiInitialPrompt, setAiInitialPrompt] = useState<string>('');

  // Password reset on first sign-in
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState<boolean>(false);
  const [newPassword, setNewPassword] = useState<string>('');

  // Audit helper
  const addAuditEntry = (
    action: AuditLogEntry['action'],
    entity: string,
    details: string,
    payload?: any
  ) => {
    const newLog: AuditLogEntry = {
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      actor: `${currentUser.name} (${activeRole})`,
      action,
      entity,
      details,
      afterJson: payload,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Switch role handler: update active role and pick an appropriate employee
  const handleRoleChange = (newRole: UserRole) => {
    setActiveRole(newRole);
    const candidate = employees.find((e) => e.role === newRole) || employees[0];
    if (candidate) {
      setCurrentUser(candidate);
      if (candidate.firstLogin) {
        setShowPasswordChangeModal(true);
      }
    }
  };

  // Switch active user
  const handleUserChange = (user: Employee) => {
    setCurrentUser(user);
    if (user.firstLogin) {
      setShowPasswordChangeModal(true);
    }
  };

  // Reset to fresh install
  const handleResetToFreshInstall = () => {
    if (
      window.confirm(
        'Reset to Fresh Install? This will clear all employees, attendance, and leaves to start completely empty for hackathon judging.'
      )
    ) {
      setEmployees([]);
      setAttendance([]);
      setLeaves([]);
      setPayrollRuns([]);
      setAuditLogs([]);
      setShowFirstRunModal(true);
    }
  };

  // Load sample dataset
  const handleLoadSampleDataset = () => {
    setSettings(INITIAL_SETTINGS);
    setEmployees(INITIAL_EMPLOYEES);
    setAttendance(INITIAL_ATTENDANCE);
    setLeaves(INITIAL_LEAVES);
    setAnnouncements(INITIAL_ANNOUNCEMENTS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setCurrentUser(INITIAL_EMPLOYEES[0]);
    setActiveRole('Admin');
    addAuditEntry('RESET', 'System', 'Loaded initial sample dataset.');
  };

  // Jump to step from 5-Minute Demo Walkthrough
  const handleJumpToStep = (stepIndex: number, targetRole: UserRole, targetTab: string) => {
    setActiveRole(targetRole);
    const candidate = employees.find((e) => e.role === targetRole) || employees[0];
    if (candidate) setCurrentUser(candidate);

    if (targetTab === 'ai') {
      setShowAiDrawer(true);
      if (targetRole === 'Employee') {
        setAiInitialPrompt("What is Bilal's salary?");
      }
    } else {
      setCurrentTab(targetTab);
    }
  };

  // Add Employee
  const handleAddEmployee = (newEmp: Employee) => {
    setEmployees((prev) => [...prev, newEmp]);
    addAuditEntry('CREATE', 'Employee', `Registered employee ${newEmp.name} (${newEmp.employeeId})`, newEmp);
  };

  // Batch CSV Import
  const handleBatchImport = (imported: Employee[]) => {
    setEmployees((prev) => [...prev, ...imported]);
    addAuditEntry('CREATE', 'EmployeesBatch', `Imported ${imported.length} employees via CSV dry-run`);
  };

  // Update Employee (Self edit)
  const handleUpdateEmployee = (updated: Employee) => {
    setEmployees((prev) => prev.map((e) => (e.employeeId === updated.employeeId ? updated : e)));
    if (currentUser.employeeId === updated.employeeId) {
      setCurrentUser(updated);
    }
    addAuditEntry('UPDATE', 'EmployeeProfile', `Updated contact info for ${updated.name}`);
  };

  // Check in
  const handleCheckIn = (record: AttendanceRecord) => {
    setAttendance((prev) => [record, ...prev]);
    addAuditEntry('CREATE', 'Attendance', `Checked in: ${record.status} via ${record.method}`);
  };

  // Check out
  const handleCheckOut = (recordId: string, checkOutTime: string, hours: number) => {
    setAttendance((prev) =>
      prev.map((a) =>
        a.id === recordId
          ? {
              ...a,
              checkOutTime,
              hoursWorked: hours,
              status: hours < settings.halfDayHours ? 'Half Day' : a.status,
            }
          : a
      )
    );
    addAuditEntry('UPDATE', 'Attendance', `Checked out at ${checkOutTime} (${hours} hrs)`);
  };

  // Request Attendance Correction
  const handleRequestCorrection = (recordId: string, reason: string) => {
    setAttendance((prev) =>
      prev.map((a) =>
        a.id === recordId ? { ...a, correctionRequested: true, correctionReason: reason } : a
      )
    );
    addAuditEntry('UPDATE', 'AttendanceCorrection', `Correction requested: ${reason}`);
  };

  // Approve Attendance Correction (HR)
  const handleApproveCorrection = (recordId: string) => {
    setAttendance((prev) =>
      prev.map((a) =>
        a.id === recordId
          ? {
              ...a,
              status: 'Present',
              correctionRequested: false,
              method: 'Correction',
            }
          : a
      )
    );
    addAuditEntry('APPROVE', 'AttendanceCorrection', `Approved correction for attendance record ${recordId}`);
  };

  // Apply Leave
  const handleApplyLeave = (leave: LeaveRequest) => {
    setLeaves((prev) => [leave, ...prev]);
    addAuditEntry('CREATE', 'LeaveRequest', `Applied for ${leave.workingDays}d ${leave.leaveType} leave`);
  };

  // Approve Leave
  const handleApproveLeave = (leaveId: string, comment: string) => {
    setLeaves((prev) =>
      prev.map((l) => (l.id === leaveId ? { ...l, status: 'Approved', hrComment: comment } : l))
    );
    addAuditEntry('APPROVE', 'Leave', `Approved leave request ${leaveId}: ${comment}`);
  };

  // Reject Leave
  const handleRejectLeave = (leaveId: string, comment: string) => {
    setLeaves((prev) =>
      prev.map((l) => (l.id === leaveId ? { ...l, status: 'Rejected', hrComment: comment } : l))
    );
    addAuditEntry('REJECT', 'Leave', `Rejected leave request ${leaveId}: ${comment}`);
  };

  // Cancel Leave
  const handleCancelLeave = (leaveId: string) => {
    setLeaves((prev) => prev.filter((l) => l.id !== leaveId));
    addAuditEntry('DELETE', 'Leave', `Cancelled leave request ${leaveId}`);
  };

  // Finalize Payroll Run (Admin)
  const handleFinalizePayroll = (finalizedList: PayrollRecord[]) => {
    setPayrollRuns(finalizedList);
    addAuditEntry('FINALIZE', 'Payroll', `Finalized and locked monthly payroll (${finalizedList.length} slips)`);
  };

  // Post Announcement
  const handlePostAnnouncement = (ann: Announcement) => {
    setAnnouncements((prev) => [ann, ...prev]);
    addAuditEntry('CREATE', 'Announcement', `Posted announcement: ${ann.title}`);
  };

  // Dismiss notification
  const handleClearNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Password reset submit
  const handlePasswordResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }
    setEmployees((prev) =>
      prev.map((emp) =>
        emp.employeeId === currentUser.employeeId ? { ...emp, firstLogin: false } : emp
      )
    );
    setCurrentUser((prev) => ({ ...prev, firstLogin: false }));
    setShowPasswordChangeModal(false);
    setNewPassword('');
    addAuditEntry('UPDATE', 'Auth', `Completed mandatory first-sign-in password change`);
  };

  const departmentsList = Array.from(new Set(employees.map((e) => e.department)));
  const unreadNotifs = notifications.filter((n) => !n.read).length;

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

  // Render initial Login Screen if not authenticated
  if (!isLoggedIn) {
    return (
      <LoginScreen
        employees={employees}
        companyName={settings.companyName}
        onLogin={(role, user) => {
          setActiveRole(role);
          setCurrentUser(user);
          setIsLoggedIn(true);
          setCurrentTab('dashboard');
          addAuditEntry('LOGIN', 'Auth', `Logged in as ${user.name} (${role})`);
        }}
        onOpenStreamlit={() => {
          setIsLoggedIn(true);
          setCurrentTab('streamlit');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        companyName={settings.companyName}
        activeRole={activeRole}
        onRoleChange={handleRoleChange}
        currentUser={currentUser}
        employees={employees}
        onUserChange={handleUserChange}
        onOpenAiChat={() => {
          setAiInitialPrompt('');
          setShowAiDrawer(true);
        }}
        onOpenDemoGuide={() => setShowDemoModal(true)}
        onOpenStreamlitSuite={() => setCurrentTab('streamlit')}
        onResetInstall={handleResetToFreshInstall}
        unreadNotificationsCount={unreadNotifs}
        onOpenNotifications={() => setShowNotificationsModal(true)}
        onLogout={() => {
          setIsLoggedIn(false);
          addAuditEntry('LOGOUT', 'Auth', `Signed out to login screen`);
        }}
      />

      {/* Developer Credit Bar */}
      <div className="w-full text-center py-1.5 bg-slate-900 border-b border-slate-800 text-[11px] text-teal-400 font-medium tracking-wide">
        Developed by M Atta ur Rehman Khan | Roll No: 777760
      </div>

      {/* GitHub ZIP Download Notice Banner */}
      <div className="bg-gradient-to-r from-blue-900/60 via-indigo-950/70 to-slate-900 border-b border-indigo-500/30 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="bg-blue-500/20 text-blue-400 p-1 rounded-md border border-blue-500/30">
              <Download className="w-3.5 h-3.5" />
            </span>
            <span className="text-slate-200">
              <strong className="text-white">Saylani Hackathon Submission:</strong> Complete source code (Python Streamlit, Pandas, React, Node Server & README) ready for GitHub!
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDirectZipDownload}
              className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold px-3 py-1 rounded-lg shadow-sm transition-all text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Project ZIP (118 KB)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container & Module Navigation Bar */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 flex-1 flex flex-col space-y-5">
        {/* Module Sub-tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-800 text-xs">
          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold transition-all shrink-0 ${
              currentTab === 'dashboard'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setCurrentTab('employees')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold transition-all shrink-0 ${
              currentTab === 'employees'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Employees (M3)</span>
          </button>

          <button
            onClick={() => setCurrentTab('attendance')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold transition-all shrink-0 ${
              currentTab === 'attendance'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Attendance & Camera (M4)</span>
          </button>

          <button
            onClick={() => setCurrentTab('leave')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold transition-all shrink-0 ${
              currentTab === 'leave'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Leave & Smart NLP (M5)</span>
          </button>

          <button
            onClick={() => setCurrentTab('payroll')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold transition-all shrink-0 ${
              currentTab === 'payroll'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Payroll Lite (M6)</span>
          </button>

          <button
            onClick={() => setCurrentTab('audit')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold transition-all shrink-0 ${
              currentTab === 'audit'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Audit & Comms (M9)</span>
          </button>

          <button
            onClick={() => setCurrentTab('streamlit')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold transition-all shrink-0 ${
              currentTab === 'streamlit'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-amber-400/80 hover:text-amber-300 hover:bg-slate-900'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Python & Streamlit Suite</span>
          </button>

          {activeRole === 'Admin' && (
            <button
              onClick={() => setCurrentTab('setup')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold transition-all shrink-0 ${
                currentTab === 'setup'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Org Setup (M2)</span>
            </button>
          )}
        </div>

        {/* Tab Content Rendering */}
        <div className="flex-1">
          {currentTab === 'dashboard' && (
            <Dashboards
              role={activeRole}
              currentUser={currentUser}
              settings={settings}
              employees={employees}
              attendance={attendance}
              leaves={leaves}
              payrolls={payrollRuns}
              auditLogs={auditLogs}
              announcements={announcements}
              onOpenCheckIn={() => setCurrentTab('attendance')}
              onOpenLeaveApply={() => setCurrentTab('leave')}
              onOpenAiWithPrompt={(prompt) => {
                setAiInitialPrompt(prompt);
                setShowAiDrawer(true);
              }}
              onNavigateTab={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'employees' && (
            <EmployeeModule
              role={activeRole}
              currentUser={currentUser}
              employees={employees}
              attendance={attendance}
              leaves={leaves}
              departments={departmentsList}
              onAddEmployee={handleAddEmployee}
              onUpdateEmployee={handleUpdateEmployee}
              onBatchImportEmployees={handleBatchImport}
            />
          )}

          {currentTab === 'attendance' && (
            <AttendanceModule
              role={activeRole}
              currentUser={currentUser}
              settings={settings}
              attendance={attendance}
              onCheckIn={handleCheckIn}
              onCheckOut={handleCheckOut}
              onRequestCorrection={handleRequestCorrection}
              onApproveCorrection={handleApproveCorrection}
            />
          )}

          {currentTab === 'leave' && (
            <LeaveModule
              role={activeRole}
              currentUser={currentUser}
              settings={settings}
              leaves={leaves}
              onApplyLeave={handleApplyLeave}
              onApproveLeave={handleApproveLeave}
              onRejectLeave={handleRejectLeave}
              onCancelLeave={handleCancelLeave}
            />
          )}

          {currentTab === 'payroll' && (
            <PayrollModule
              role={activeRole}
              currentUser={currentUser}
              settings={settings}
              employees={employees}
              attendance={attendance}
              leaves={leaves}
              payrollRuns={payrollRuns}
              onFinalizePayroll={handleFinalizePayroll}
            />
          )}

          {currentTab === 'audit' && (
            <AuditAndCommsModule
              role={activeRole}
              auditLogs={auditLogs}
              announcements={announcements}
              notifications={notifications}
              onPostAnnouncement={handlePostAnnouncement}
              onClearNotification={handleClearNotification}
            />
          )}

          {currentTab === 'streamlit' && <StreamlitViewer />}

          {currentTab === 'setup' && (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-purple-400" /> Organization Parameters (M2)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Applied to all attendance checks, leave calculations, and payroll rules.
                  </p>
                </div>
                <button
                  onClick={() => setShowFirstRunModal(true)}
                  className="bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs px-3 py-1.5 rounded-lg border border-slate-700"
                >
                  Rerun Setup Wizard
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <span className="font-bold text-slate-200">Office Working Hours & Cutoffs</span>
                  <p className="text-slate-400">Office Start Time: {settings.officeStart} AM</p>
                  <p className="text-slate-400">
                    Grace Threshold: {settings.graceMinutes} minutes (late marked after 09:15)
                  </p>
                  <p className="text-slate-400">
                    Half-Day Duration: Under {settings.halfDayHours} hours
                  </p>
                  <p className="text-slate-400">
                    Official Weekend: {settings.weekendDays.join(', ')}
                  </p>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <span className="font-bold text-slate-200">Office GPS Geofencing</span>
                  <p className="text-slate-400">
                    Office Coordinates: {settings.officeLat}, {settings.officeLng}
                  </p>
                  <p className="text-slate-400">
                    Allowed Perimeter Radius: {settings.officeRadiusMeters} meters
                  </p>
                  <p className="text-slate-400">
                    Formula: Haversine distance calculated by server
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-5 text-center text-xs text-slate-500 flex flex-col gap-2">
        <p>
          Saylani IT Training Hackathon 2026 · HCM Lite · Zaitoon Ashraf IT Park · Submission on{' '}
          <a
            href="https://lms.saylaniit.com"
            target="_blank"
            rel="noreferrer"
            className="text-teal-400 hover:underline"
          >
            lms.saylaniit.com
          </a>
        </p>
        <p className="text-amber-400 font-semibold text-sm mt-1">
          Ma apne teacher Sir Azeem and idare SMIT ka teh dil se mashkoor hon.
        </p>
      </footer>

      {/* AI Assistant Drawer */}
      <AiAssistantDrawer
        isOpen={showAiDrawer}
        onClose={() => setShowAiDrawer(false)}
        role={activeRole}
        currentUser={currentUser}
        settings={settings}
        employees={employees}
        attendance={attendance}
        leaves={leaves}
        initialPrompt={aiInitialPrompt}
      />

      {/* 5-Minute Demo Script Guide for Judges */}
      <DemoWalkthroughModal
        isOpen={showDemoModal}
        onClose={() => setShowDemoModal(false)}
        onJumpToStep={handleJumpToStep}
        onResetInstall={handleResetToFreshInstall}
        onLoadSampleData={handleLoadSampleDataset}
      />

      {/* First-Run Setup Wizard */}
      {showFirstRunModal && (
        <FirstRunWizard
          onComplete={(newSettings, adminEmp) => {
            setSettings(newSettings);
            setEmployees([adminEmp]);
            setCurrentUser(adminEmp);
            setActiveRole('Admin');
            setShowFirstRunModal(false);
            addAuditEntry('CREATE', 'FirstRunSetup', `Completed fresh install setup for ${newSettings.companyName}`);
          }}
          onCancel={() => setShowFirstRunModal(false)}
        />
      )}

      {/* Password Reset on First Sign-in Modal */}
      {showPasswordChangeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl text-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <Lock className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-base text-slate-100">
                First Sign-in Password Reset
              </h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Welcome, {currentUser.name}! As required by HCM Lite security policy, you must change your temporary password before accessing your account.
            </p>

            <form onSubmit={handlePasswordResetSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Choose New Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-600 hover:to-emerald-500 text-slate-950 font-bold py-2 rounded-xl text-xs shadow transition-all"
              >
                Update Password & Enter
              </button>
            </form>
          </div>
        </div>
      )}

      {/* In-App Notifications Modal */}
      {showNotificationsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="font-bold text-sm text-slate-100">In-App Notifications</h3>
              <button
                onClick={() => setShowNotificationsModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No notifications.</p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-slate-200">{n.title}</p>
                      <p className="text-slate-400 text-[11px]">{n.message}</p>
                      <span className="text-[10px] text-slate-500">{n.time}</span>
                    </div>
                    <button
                      onClick={() => handleClearNotification(n.id)}
                      className="text-xs text-slate-500 hover:text-slate-300"
                    >
                      Clear
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800 mt-4">
              <button
                onClick={() => setShowNotificationsModal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}