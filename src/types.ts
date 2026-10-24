export type UserRole = 'Admin' | 'HR' | 'Employee';

export type LeaveType = 'annual' | 'sick' | 'casual' | 'unpaid';

export interface OrgSettings {
  companyName: string;
  officeStart: string; // "09:00"
  graceMinutes: number; // 15
  halfDayHours: number; // 5
  weekendDays: string[]; // ["Saturday", "Sunday"]
  officeLat: number; // 24.8607
  officeLng: number; // 67.0011
  officeRadiusMeters: number; // 150
  leaveQuotas: {
    annual: number; // 14
    sick: number; // 8
    casual: number; // 10
    unpaid: number; // unlimited
  };
  holidays: { date: string; name: string }[];
  latePenaltyEnabled: boolean; // 3 lates = 0.5 day
}

export interface Employee {
  employeeId: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  designation: string;
  joiningDate: string;
  basicSalary: number;
  phone: string;
  address: string;
  status: 'Active' | 'Inactive' | 'Probation';
  firstLogin: boolean;
  avatarUrl?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string; // YYYY-MM-DD
  checkInTime: string; // HH:mm
  checkOutTime?: string; // HH:mm
  hoursWorked: number;
  status: 'Present' | 'Late' | 'Half Day' | 'Missing Checkout' | 'Absent';
  method: 'Web' | 'Camera' | 'Correction';
  verifiedLocation?: boolean;
  distanceMeters?: number;
  correctionRequested?: boolean;
  correctionReason?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  workingDays: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  appliedAt: string;
  hrComment?: string;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  month: string; // e.g. "2026-10"
  basicSalary: number;
  hra: number; // 40%
  medical: number; // 10%
  grossSalary: number; // 1.5 * basic
  workingDays: number;
  perDayRate: number;
  absentDays: number;
  unpaidLeaveDays: number;
  halfDays: number;
  latePenaltyDays: number;
  totalDeductions: number;
  annualizedGross: number;
  taxDeduction: number;
  netSalary: number;
  status: 'Draft' | 'Finalized';
  finalizedAt?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'FINALIZE' | 'LOGIN' | 'LOGOUT' | 'RESET';
  entity: string;
  details: string;
  beforeJson?: any;
  afterJson?: any;
}

export interface Announcement {
  id: string;
  title: string;
  date: string;
  author: string;
  content: string;
  priority: 'Normal' | 'Important' | 'Urgent';
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'leave' | 'payroll' | 'attendance' | 'system';
}
