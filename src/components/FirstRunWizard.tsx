import React, { useState } from 'react';
import { OrgSettings, Employee } from '../types';
import { Building2, ShieldCheck, Clock, MapPin, CheckCircle2 } from 'lucide-react';

interface FirstRunWizardProps {
  onComplete: (settings: OrgSettings, adminUser: Employee) => void;
  onCancel?: () => void;
}

export const FirstRunWizard: React.FC<FirstRunWizardProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState<number>(1);
  const [companyName, setCompanyName] = useState('TechNova Solutions');
  const [adminName, setAdminName] = useState('Muhammad Asad');
  const [adminEmail, setAdminEmail] = useState('admin@technova.com');
  const [adminPassword, setAdminPassword] = useState('Admin@2026');
  const [officeStart, setOfficeStart] = useState('09:00');
  const [graceMinutes, setGraceMinutes] = useState(15);
  const [halfDayHours, setHalfDayHours] = useState(5);
  const [officeLat, setOfficeLat] = useState(24.8607);
  const [officeLng, setOfficeLng] = useState(67.0011);
  const [officeRadius, setOfficeRadius] = useState(150);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newSettings: OrgSettings = {
      companyName,
      officeStart,
      graceMinutes,
      halfDayHours,
      weekendDays: ['Saturday', 'Sunday'],
      officeLat,
      officeLng,
      officeRadiusMeters: officeRadius,
      leaveQuotas: {
        annual: 14,
        sick: 8,
        casual: 10,
        unpaid: 999,
      },
      holidays: [
        { date: '2026-03-23', name: 'Pakistan Day' },
        { date: '2026-05-01', name: 'Labor Day' },
        { date: '2026-08-14', name: 'Independence Day' },
      ],
      latePenaltyEnabled: true,
    };

    const adminEmployee: Employee = {
      employeeId: 'EMP001',
      name: adminName,
      email: adminEmail,
      role: 'Admin',
      department: 'Executive Administration',
      designation: 'Managing Director / Chief Executive',
      joiningDate: new Date().toISOString().split('T')[0],
      basicSalary: 250000,
      phone: '+92 300 0000001',
      address: 'Zaitoon Ashraf IT Park, Karachi',
      status: 'Active',
      firstLogin: false,
    };

    onComplete(newSettings, adminEmployee);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl text-slate-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-teal-500/20 p-2.5 rounded-xl border border-teal-500/30">
            <Building2 className="w-6 h-6 text-teal-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">HCM Lite: First-Run Setup</h2>
            <p className="text-xs text-slate-400">
              Module 1 & 2: Initialize company profile, organization parameters & Admin master credentials.
            </p>
          </div>
        </div>

        {/* Step Tabs */}
        <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-3 text-xs">
          <button
            onClick={() => setStep(1)}
            className={`font-semibold pb-1 flex items-center gap-1.5 transition-colors ${
              step === 1 ? 'text-teal-400 border-b-2 border-teal-400' : 'text-slate-400'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> 1. Company & Admin
          </button>
          <button
            onClick={() => setStep(2)}
            className={`font-semibold pb-1 flex items-center gap-1.5 transition-colors ${
              step === 2 ? 'text-teal-400 border-b-2 border-teal-400' : 'text-slate-400'
            }`}
          >
            <Clock className="w-4 h-4" /> 2. Working Rules & Hours
          </button>
          <button
            onClick={() => setStep(3)}
            className={`font-semibold pb-1 flex items-center gap-1.5 transition-colors ${
              step === 3 ? 'text-teal-400 border-b-2 border-teal-400' : 'text-slate-400'
            }`}
          >
            <MapPin className="w-4 h-4" /> 3. Office Geofence
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  placeholder="e.g. Saylani Enterprises"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Admin Full Name</label>
                  <input
                    type="text"
                    required
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Admin Email</label>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Master Password</label>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Saved with bcrypt hashing logic. Admin can reset employee logins later.
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="bg-teal-600 hover:bg-teal-500 text-slate-950 font-semibold px-4 py-2 rounded-lg text-xs"
                >
                  Continue to Rules →
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Office Start</label>
                  <input
                    type="time"
                    value={officeStart}
                    onChange={(e) => setOfficeStart(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Default: 09:00 AM</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Grace Period</label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      value={graceMinutes}
                      onChange={(e) => setGraceMinutes(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100"
                    />
                    <span className="text-xs text-slate-400 ml-2">min</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Late marked after 09:15</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Half Day Limit</label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      value={halfDayHours}
                      onChange={(e) => setHalfDayHours(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100"
                    />
                    <span className="text-xs text-slate-400 ml-2">hrs</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Under 5h = half day</p>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
                <p className="font-semibold text-slate-200">Pre-configured Policy Standards:</p>
                <p>• Weekend: Saturday & Sunday</p>
                <p>• Yearly Quotas: Annual (14), Sick (8), Casual (10), Unpaid (Unlimited)</p>
                <p>• Attendance Penalty: 3 lates = 0.5 day deduction</p>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="bg-teal-600 hover:bg-teal-500 text-slate-950 font-semibold px-4 py-2 rounded-lg text-xs"
                >
                  Continue to Geofence →
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Office Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={officeLat}
                    onChange={(e) => setOfficeLat(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Office Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={officeLng}
                    onChange={(e) => setOfficeLng(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Allowed Perimeter Radius (meters)
                </label>
                <input
                  type="number"
                  value={officeRadius}
                  onChange={(e) => setOfficeRadius(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Camera and web check-ins must be within this perimeter (calculated via Haversine equation).
                </p>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-600 hover:to-emerald-500 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs shadow-md transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Finish Setup & Launch HCM
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
