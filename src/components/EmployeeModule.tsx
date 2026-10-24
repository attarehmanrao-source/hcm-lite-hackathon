import React, { useState } from 'react';
import { UserRole, Employee, AttendanceRecord, LeaveRequest } from '../types';
import { validateEmployeeCsv, CsvValidationResult } from '../utils/rules';
import {
  Users,
  Search,
  Plus,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  X,
  Phone,
  Mail,
  Building,
  Calendar,
  Lock,
  Edit2,
  DollarSign,
} from 'lucide-react';

interface EmployeeModuleProps {
  role: UserRole;
  currentUser: Employee;
  employees: Employee[];
  attendance: AttendanceRecord[];
  leaves: LeaveRequest[];
  departments: string[];
  onAddEmployee: (employee: Employee) => void;
  onUpdateEmployee: (employee: Employee) => void;
  onBatchImportEmployees: (employees: Employee[]) => void;
}

export const EmployeeModule: React.FC<EmployeeModuleProps> = ({
  role,
  currentUser,
  employees,
  attendance,
  leaves,
  departments,
  onAddEmployee,
  onUpdateEmployee,
  onBatchImportEmployees,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Drawers and Modals
  const [selected360Employee, setSelected360Employee] = useState<Employee | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);

  // Self-profile edit state for Employee
  const [isEditingSelf, setIsEditingSelf] = useState(false);
  const [editPhone, setEditPhone] = useState(currentUser.phone);
  const [editAddress, setEditAddress] = useState(currentUser.address);

  // CSV Dry Run State
  const [csvText, setCsvText] = useState('');
  const [validationResult, setValidationResult] = useState<CsvValidationResult | null>(null);

  // New Employee Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [empRole, setEmpRole] = useState<UserRole>('Employee');
  const [department, setDepartment] = useState(departments[0] || 'Engineering');
  const [designation, setDesignation] = useState('Software Engineer');
  const [basicSalary, setBasicSalary] = useState(90000);
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split('T')[0]);
  const [phone, setPhone] = useState('+92 300 1234567');
  const [address, setAddress] = useState('Karachi, Pakistan');

  // Filtered employees list
  const filteredEmployees = employees.filter((emp) => {
    // Role guard: Employee can only see own profile unless searching directory
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.designation.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = deptFilter === 'All' || emp.department === deptFilter;
    const matchesStatus = statusFilter === 'All' || emp.status === statusFilter;

    return matchesSearch && matchesDept && matchesStatus;
  });

  // Handle Add Employee Submit
  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `EMP${String(employees.length + 1).padStart(3, '0')}`;
    const newEmp: Employee = {
      employeeId: newId,
      name,
      email,
      role: empRole,
      department,
      designation,
      joiningDate,
      basicSalary,
      phone,
      address,
      status: 'Active',
      firstLogin: true, // Requires password change on first sign-in
    };

    onAddEmployee(newEmp);
    setShowAddModal(false);
    // Reset fields
    setName('');
    setEmail('');
  };

  // CSV Dry Run Test
  const handleRunCsvDryRun = () => {
    const result = validateEmployeeCsv(csvText, employees, departments);
    setValidationResult(result);
  };

  // CSV Commit
  const handleCommitCsv = () => {
    if (!validationResult || !validationResult.valid) return;

    let nextIndex = employees.length + 1;
    const importedEmployees: Employee[] = validationResult.validRows.map((row) => ({
      employeeId: `EMP${String(nextIndex++).padStart(3, '0')}`,
      name: row.name || 'Unnamed',
      email: row.email || 'user@example.com',
      role: 'Employee',
      department: row.department || 'Engineering',
      designation: row.designation || 'Staff',
      joiningDate: row.joiningDate || new Date().toISOString().split('T')[0],
      basicSalary: row.basicSalary || 75000,
      phone: row.phone || '+92 300 0000000',
      address: row.address || 'Karachi',
      status: 'Active',
      firstLogin: true,
    }));

    onBatchImportEmployees(importedEmployees);
    setShowCsvModal(false);
    setCsvText('');
    setValidationResult(null);
  };

  // Export to CSV
  const handleExportCsv = () => {
    const headers = ['employeeId,name,email,role,department,designation,joiningDate,basicSalary,phone,address,status'];
    const rows = filteredEmployees.map(
      (e) =>
        `"${e.employeeId}","${e.name}","${e.email}","${e.role}","${e.department}","${e.designation}","${e.joiningDate}",${e.basicSalary},"${e.phone}","${e.address}","${e.status}"`
    );
    const content = headers.concat(rows).join('\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HCM_Lite_Employees_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Self Profile Update Save
  const handleSaveSelfEdit = () => {
    onUpdateEmployee({
      ...currentUser,
      phone: editPhone,
      address: editAddress,
    });
    setIsEditingSelf(false);
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-400" /> Employee Directory & Profiles (Module 3)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Browse staff profiles, Employee 360 drawer, registration with temporary password, and CSV dry-run validator.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs px-3 py-2 rounded-xl transition-colors font-medium"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>

          {(role === 'Admin' || role === 'HR') && (
            <>
              <button
                onClick={() => setShowCsvModal(true)}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 text-xs px-3 py-2 rounded-xl transition-colors font-medium"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> CSV Dry-Run Import
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-600 hover:to-emerald-500 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-xl shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" /> Register Employee
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, ID, or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <div>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="All">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Probation">Probation</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Employee Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Department & Role</th>
                <th className="py-3 px-4">Joining Date</th>
                {role !== 'Employee' && <th className="py-3 px-4">Basic Salary</th>}
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No employees matched the criteria.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const isSelf = emp.employeeId === currentUser.employeeId;
                  const canViewSalary = role === 'Admin' || role === 'HR' || isSelf;

                  return (
                    <tr key={emp.employeeId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-500/30 to-purple-500/30 border border-slate-700 flex items-center justify-center font-bold text-xs text-teal-300">
                            {emp.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                              {emp.name}
                              {isSelf && (
                                <span className="text-[10px] bg-teal-950 text-teal-400 border border-teal-800 px-1.5 py-0.2 rounded">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1">
                              <span>{emp.employeeId}</span> · <span>{emp.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-200">{emp.designation}</div>
                        <div className="text-[11px] text-slate-400">{emp.department}</div>
                      </td>

                      <td className="py-3 px-4 text-slate-300">{emp.joiningDate}</td>

                      {role !== 'Employee' && (
                        <td className="py-3 px-4 font-mono font-medium text-slate-200">
                          {canViewSalary ? `PKR ${emp.basicSalary.toLocaleString()}` : '••••••••'}
                        </td>
                      )}

                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            emp.status === 'Active'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/80'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {emp.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelected360Employee(emp)}
                          className="bg-slate-800 hover:bg-slate-700 text-teal-300 px-3 py-1 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
                        >
                          Employee 360
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EMPLOYEE 360 PROFILE DRAWER */}
      {selected360Employee && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg h-full max-h-[92vh] flex flex-col p-6 shadow-2xl text-slate-100 overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-400 text-slate-950 font-bold flex items-center justify-center text-sm shadow">
                  {selected360Employee.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                    {selected360Employee.name}
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-normal">
                      {selected360Employee.employeeId}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {selected360Employee.designation} · {selected360Employee.department}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelected360Employee(null)}
                className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-5 flex-1">
              {/* Contact Information & Self Edit */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-teal-400" /> Contact & Residence
                  </h4>
                  {selected360Employee.employeeId === currentUser.employeeId && (
                    <button
                      onClick={() => setIsEditingSelf(!isEditingSelf)}
                      className="text-xs text-teal-400 hover:underline flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" /> {isEditingSelf ? 'Cancel' : 'Edit Contact'}
                    </button>
                  )}
                </div>

                {isEditingSelf ? (
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="text-[11px] text-slate-400">Phone</label>
                      <input
                        type="text"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400">Address</label>
                      <input
                        type="text"
                        value={editAddress}
                        onChange={(e) => setEditAddress(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                      />
                    </div>
                    <button
                      onClick={handleSaveSelfEdit}
                      className="bg-teal-600 hover:bg-teal-500 text-slate-950 font-semibold px-3 py-1.5 rounded-lg text-xs"
                    >
                      Save Profile Changes
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Work Email</span>
                      <span className="text-slate-200 font-medium">
                        {selected360Employee.email}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Phone Number</span>
                      <span className="text-slate-200 font-medium">
                        {selected360Employee.phone}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500 block text-[10px]">Address</span>
                      <span className="text-slate-200 font-medium">
                        {selected360Employee.address}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Salary Structure (Section 3 formula: Gross = 1.5x basic) */}
              {(role === 'Admin' ||
                role === 'HR' ||
                selected360Employee.employeeId === currentUser.employeeId) && (
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Compensation Structure
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Basic Salary</span>
                      <span className="text-slate-200 font-semibold">
                        PKR {selected360Employee.basicSalary.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">House Rent (40%)</span>
                      <span className="text-slate-200 font-semibold">
                        PKR {(selected360Employee.basicSalary * 0.4).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Medical Allowance (10%)</span>
                      <span className="text-slate-200 font-semibold">
                        PKR {(selected360Employee.basicSalary * 0.1).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Total Gross (1.5x)</span>
                      <span className="text-emerald-400 font-bold">
                        PKR {(selected360Employee.basicSalary * 1.5).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Attendance Log for this employee */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" /> Recent Attendance History
                </h4>
                {attendance.filter((a) => a.employeeId === selected360Employee.employeeId).length ===
                0 ? (
                  <p className="text-xs text-slate-500">No attendance records logged.</p>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {attendance
                      .filter((a) => a.employeeId === selected360Employee.employeeId)
                      .slice(0, 5)
                      .map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center justify-between text-xs p-2 bg-slate-900 rounded-lg"
                        >
                          <div>
                            <span className="font-semibold text-slate-200">{att.date}</span>
                            <span className="text-[10px] text-slate-400 ml-2">
                              {att.checkInTime} - {att.checkOutTime || 'Present'}
                            </span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              att.status === 'Present'
                                ? 'bg-emerald-950 text-emerald-400'
                                : att.status === 'Late'
                                ? 'bg-amber-950 text-amber-400'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {att.status}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REGISTER NEW EMPLOYEE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-slate-100 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <Plus className="w-5 h-5 text-teal-400" /> Register Employee & Create Login
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sara Ahmed"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Work Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sara@technova.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    System Role *
                  </label>
                  <select
                    value={empRole}
                    onChange={(e) => setEmpRole(e.target.value as UserRole)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100"
                  >
                    <option value="Employee">Employee (Self-Service)</option>
                    <option value="HR">HR (People Operations)</option>
                    {role === 'Admin' && <option value="Admin">Admin</option>}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Department *
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100"
                  >
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Designation *
                  </label>
                  <input
                    type="text"
                    required
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="e.g. Frontend Engineer"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Basic Salary (PKR) *
                  </label>
                  <input
                    type="number"
                    required
                    min={10000}
                    value={basicSalary}
                    onChange={(e) => setBasicSalary(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Joining Date (ISO) *
                  </label>
                  <input
                    type="date"
                    required
                    value={joiningDate}
                    onChange={(e) => setJoiningDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <p className="font-semibold text-teal-300 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-teal-400" /> Automatic Login Provisioning:
                </p>
                <p>
                  A login will be generated with a temporary password (`TempPass2026!`). The employee is flagged to reset their password on first sign-in.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-600 hover:to-emerald-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow"
                >
                  Confirm & Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV DRY-RUN VALIDATOR MODAL */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl text-slate-100 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-base text-slate-100">
                  CSV Import Dry-Run & Validation Report
                </h3>
              </div>
              <button
                onClick={() => setShowCsvModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 flex-1 overflow-y-auto">
              <p className="text-xs text-slate-400">
                Paste CSV text or load sample data. As required by the Saylani Hackathon brief, the dry run returns{' '}
                <span className="text-slate-200 font-mono">row + field + reason</span> for all failures before committing.
              </p>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-300">CSV Data</label>
                  <button
                    type="button"
                    onClick={() =>
                      setCsvText(
                        `name,email,department,designation,joiningdate,basicsalary\nKashif Raza,kashif.eng@technova.com,Engineering,Fullstack Developer,2025-02-01,95000\nMehwish Qureshi,mehwish.hr@technova.com,Human Resources,Talent Acquisition,2025-03-15,85000\nInvalid Row Example,bad-email,UnknownDept,Tester,not-a-date,-500`
                      )
                    }
                    className="text-[11px] text-teal-400 hover:underline"
                  >
                    Load Sample (with 1 deliberate error row)
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder="name,email,department,designation,joiningdate,basicsalary"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleRunCsvDryRun}
                  className="bg-slate-800 hover:bg-slate-700 text-teal-300 font-semibold px-4 py-2 rounded-xl text-xs border border-teal-500/30 transition-all"
                >
                  ⚡ Execute Dry-Run Validation
                </button>
              </div>

              {/* Dry-run report table */}
              {validationResult && (
                <div className="space-y-3 pt-2">
                  <div
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs font-semibold ${
                      validationResult.valid
                        ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                        : 'bg-rose-950/60 border-rose-900 text-rose-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {validationResult.valid ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-400" />
                      )}
                      <span>
                        {validationResult.valid
                          ? `Validation Passed: ${validationResult.validRows.length} valid rows ready to import.`
                          : `Validation Failed: ${validationResult.errors.length} error(s) found in dataset.`}
                      </span>
                    </div>
                  </div>

                  {validationResult.errors.length > 0 && (
                    <div className="border border-slate-800 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[10px] uppercase">
                          <tr>
                            <th className="p-2">Row #</th>
                            <th className="p-2">Field</th>
                            <th className="p-2">Reason for Failure</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-300">
                          {validationResult.errors.map((err, idx) => (
                            <tr key={idx} className="bg-rose-950/20">
                              <td className="p-2 font-mono font-bold text-rose-400">{err.row}</td>
                              <td className="p-2 font-mono text-slate-300">{err.field}</td>
                              <td className="p-2 text-rose-300">{err.reason}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowCsvModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200"
              >
                Close
              </button>
              {validationResult?.valid && (
                <button
                  type="button"
                  onClick={handleCommitCsv}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow transition-all"
                >
                  Commit {validationResult.validRows.length} Valid Records
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
