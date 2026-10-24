import React from 'react';
import { UserRole, Employee } from '../types';
import {
  Shield,
  Briefcase,
  User,
  Sparkles,
  RotateCcw,
  BookOpen,
  Code2,
  Bell,
  Building2,
  Download,
  LogOut,
} from 'lucide-react';

interface NavbarProps {
  companyName: string;
  activeRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  currentUser: Employee | null;
  employees: Employee[];
  onUserChange: (user: Employee) => void;
  onOpenAiChat: () => void;
  onOpenDemoGuide: () => void;
  onOpenStreamlitSuite: () => void;
  onResetInstall: () => void;
  unreadNotificationsCount: number;
  onOpenNotifications: () => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  companyName,
  activeRole,
  onRoleChange,
  currentUser,
  employees,
  onUserChange,
  onOpenAiChat,
  onOpenDemoGuide,
  onOpenStreamlitSuite,
  onResetInstall,
  unreadNotificationsCount,
  onOpenNotifications,
  onLogout,
}) => {
  const eligibleUsers = employees.filter((e) => e.role === activeRole);

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Company */}
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-tr from-teal-500 to-emerald-400 p-2 rounded-lg shadow-sm text-slate-950 font-black text-lg flex items-center justify-center">
              HCM
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-slate-100 tracking-tight">HCM Lite</span>
                <span className="bg-emerald-950 text-emerald-400 border border-emerald-800/80 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase">
                  Saylani 2026
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-slate-500" />
                {companyName || 'Setup Required'}
              </p>
            </div>
          </div>

          {/* Center Action: Role Badges */}
          <div className="hidden md:flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => onRoleChange('Admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeRole === 'Admin'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Admin
            </button>
            <button
              onClick={() => onRoleChange('HR')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeRole === 'HR'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              HR Ops
            </button>
            <button
              onClick={() => onRoleChange('Employee')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeRole === 'Employee'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Employee
            </button>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* User Account Switcher */}
            {eligibleUsers.length > 0 && (
              <div className="hidden lg:flex items-center gap-2">
                <select
                  value={currentUser?.employeeId || ''}
                  onChange={(e) => {
                    const found = employees.find((emp) => emp.employeeId === e.target.value);
                    if (found) onUserChange(found);
                  }}
                  className="bg-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  {eligibleUsers.map((u) => (
                    <option key={u.employeeId} value={u.employeeId}>
                      {u.name} ({u.employeeId})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Python / Streamlit Suite Button */}
            <button
              onClick={onOpenStreamlitSuite}
              title="View Python Streamlit + Pandas Source Code and Export"
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs px-2.5 py-1.5 rounded-lg transition-colors font-medium"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Streamlit + Pandas</span>
            </button>

            {/* GitHub ZIP Download Button */}
            <a
              href="/hcm-lite-saylani-hackathon.zip"
              download="hcm-lite-saylani-hackathon.zip"
              title="Download Full Project ZIP to upload to GitHub"
              className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs px-2.5 py-1.5 rounded-lg shadow transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">GitHub ZIP</span>
            </a>

            {/* 5-Min Judge Demo Guide */}
            <button
              onClick={onOpenDemoGuide}
              title="5-Minute Hackathon Demo Script Guide for Judges"
              className="flex items-center gap-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 text-xs px-2.5 py-1.5 rounded-lg transition-colors font-semibold"
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Demo Script</span>
            </button>

            {/* Notifications Button */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
              )}
            </button>

            {/* AI Assistant Button */}
            <button
              onClick={onOpenAiChat}
              className="flex items-center gap-1.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-slate-950 font-semibold text-xs px-3 py-1.5 rounded-lg shadow-sm transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
              <span>Ask AI</span>
            </button>

            {/* Reset to Fresh Install (Crucial for hackathon grading) */}
            <button
              onClick={onResetInstall}
              title="Reset Database to Fresh Install (Empty state for judging)"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Logout / Switch Role */}
            {onLogout && (
              <button
                onClick={onLogout}
                title="Sign Out / Switch Role (Back to Login Screen)"
                className="flex items-center gap-1 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 text-xs px-2.5 py-1.5 rounded-lg transition-colors font-medium ml-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
