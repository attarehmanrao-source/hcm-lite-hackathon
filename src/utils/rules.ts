import { OrgSettings, Employee, AttendanceRecord, LeaveRequest, PayrollRecord } from '../types';

// Haversine formula for calculating distance in meters
export function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Radius of Earth in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Calculate working days between two dates, excluding weekends and public holidays
export function calculateWorkingDays(
  startDateStr: string,
  endDateStr: string,
  settings: OrgSettings
): number {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return 0;

  let count = 0;
  const cur = new Date(start);
  const holidayDates = new Set(settings.holidays.map((h) => h.date));
  const weekendSet = new Set(settings.weekendDays.map((d) => d.toLowerCase()));

  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  while (cur <= end) {
    const dayName = dayNames[cur.getDay()];
    const isoDate = cur.toISOString().split('T')[0];

    const isWeekend = weekendSet.has(dayName);
    const isHoliday = holidayDates.has(isoDate);

    if (!isWeekend && !isHoliday) {
      count++;
    }
    cur.setDate(cur.getDate() + 1);
  }

  return count;
}

// Annualized Tax Calculation according to Saylani HCM Lite Brief:
// 0 to 600,000: 0%
// 600,001 to 1,200,000: 5% of excess over 600k
// 1,200,001 to 2,400,000: 30,000 + 15% of excess over 1.2M
// 2,400,001 to 3,600,000: 210,000 + 25% of excess over 2.4M
// Above 3,600,000: 510,000 + 35% of excess over 3.6M
export function calculateAnnualTax(annualGross: number): number {
  if (annualGross <= 600000) {
    return 0;
  } else if (annualGross <= 1200000) {
    return (annualGross - 600000) * 0.05;
  } else if (annualGross <= 2400000) {
    return 30000 + (annualGross - 1200000) * 0.15;
  } else if (annualGross <= 3600000) {
    return 210000 + (annualGross - 2400000) * 0.25;
  } else {
    return 510000 + (annualGross - 3600000) * 0.35;
  }
}

// Payroll calculation for an employee in a given month
export function computeEmployeePayroll(
  emp: Employee,
  attendanceList: AttendanceRecord[],
  leaveList: LeaveRequest[],
  monthStr: string, // "2026-10"
  settings: OrgSettings,
  monthWorkingDays: number = 22
): PayrollRecord {
  const basic = emp.basicSalary;
  const hra = basic * 0.4; // 40%
  const medical = basic * 0.1; // 10%
  const gross = basic + hra + medical; // 1.5 * basic
  const perDayRate = gross / monthWorkingDays;

  // Filter attendance for this employee in this month
  const empAtt = attendanceList.filter(
    (a) => a.employeeId === emp.employeeId && a.date.startsWith(monthStr)
  );

  const halfDaysCount = empAtt.filter((a) => a.status === 'Half Day').length;
  const lateCount = empAtt.filter((a) => a.status === 'Late').length;
  const absentCount = empAtt.filter((a) => a.status === 'Absent').length;

  // Filter approved unpaid leaves
  const unpaidLeaves = leaveList.filter(
    (l) =>
      l.employeeId === emp.employeeId &&
      l.leaveType === 'unpaid' &&
      l.status === 'Approved' &&
      l.startDate.startsWith(monthStr)
  );
  const unpaidDays = unpaidLeaves.reduce((acc, curr) => acc + curr.workingDays, 0);

  // Bonus rule: 3 lates = 0.5 day deduction
  const latePenaltyDays = settings.latePenaltyEnabled ? Math.floor(lateCount / 3) * 0.5 : 0;

  const totalDeductionDays = absentCount + unpaidDays + halfDaysCount * 0.5 + latePenaltyDays;
  const totalDeductions = Math.round(totalDeductionDays * perDayRate);

  const annualizedGross = gross * 12;
  const annualTax = calculateAnnualTax(annualizedGross);
  const monthlyTax = Math.round(annualTax / 12);

  const netSalary = Math.max(0, Math.round(gross - totalDeductions - monthlyTax));

  return {
    id: `PAY-${monthStr}-${emp.employeeId}`,
    employeeId: emp.employeeId,
    employeeName: emp.name,
    department: emp.department,
    designation: emp.designation,
    month: monthStr,
    basicSalary: basic,
    hra,
    medical,
    grossSalary: gross,
    workingDays: monthWorkingDays,
    perDayRate: Math.round(perDayRate),
    absentDays: absentCount,
    unpaidLeaveDays: unpaidDays,
    halfDays: halfDaysCount,
    latePenaltyDays,
    totalDeductions,
    annualizedGross,
    taxDeduction: monthlyTax,
    netSalary,
    status: 'Draft',
  };
}

// Attendance Rate calculation metric from Brief:
// (present + late + missing_checkout + 0.5 * half_day) ÷ (working_day_records - on_leave)
export function computeAttendanceRate(
  records: AttendanceRecord[],
  onLeaveCount: number,
  expectedCount: number
): number {
  if (expectedCount <= 0) return 0;
  const effectiveExpected = Math.max(1, expectedCount - onLeaveCount);

  let score = 0;
  records.forEach((r) => {
    if (r.status === 'Present') score += 1;
    else if (r.status === 'Late') score += 1;
    else if (r.status === 'Missing Checkout') score += 1;
    else if (r.status === 'Half Day') score += 0.5;
  });

  return Math.min(100, Math.round((score / effectiveExpected) * 1000) / 10);
}

// CSV Dry-Run Validator for Module 3
export interface CsvValidationResult {
  valid: boolean;
  errors: { row: number; field: string; reason: string }[];
  validRows: Partial<Employee>[];
}

export function validateEmployeeCsv(
  csvText: string,
  existingEmployees: Employee[],
  departments: string[]
): CsvValidationResult {
  const lines = csvText.trim().split('\n');
  if (lines.length <= 1) {
    return {
      valid: false,
      errors: [{ row: 0, field: 'file', reason: 'CSV file is empty or missing data rows' }],
      validRows: [],
    };
  }

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const requiredFields = ['name', 'email', 'department', 'designation', 'joiningdate', 'basicsalary'];
  const missingHeaders = requiredFields.filter((rf) => !headers.includes(rf));

  if (missingHeaders.length > 0) {
    return {
      valid: false,
      errors: [
        {
          row: 1,
          field: 'headers',
          reason: `Missing required header columns: ${missingHeaders.join(', ')}`,
        },
      ],
      validRows: [],
    };
  }

  const errors: { row: number; field: string; reason: string }[] = [];
  const validRows: Partial<Employee>[] = [];
  const seenEmails = new Set(existingEmployees.map((e) => e.email.toLowerCase()));

  for (let i = 1; i < lines.length; i++) {
    const rowNum = i + 1;
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(',').map((v) => v.trim());
    const rowData: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rowData[h] = values[idx] || '';
    });

    const name = rowData['name'];
    const email = rowData['email'];
    const department = rowData['department'];
    const designation = rowData['designation'];
    const joiningDate = rowData['joiningdate'];
    const basicSalaryStr = rowData['basicsalary'];

    if (!name) errors.push({ row: rowNum, field: 'name', reason: 'Name is required' });
    if (!email || !email.includes('@') || !email.includes('.')) {
      errors.push({ row: rowNum, field: 'email', reason: 'Invalid email address format' });
    } else if (seenEmails.has(email.toLowerCase())) {
      errors.push({ row: rowNum, field: 'email', reason: 'Email already registered in system' });
    } else {
      seenEmails.add(email.toLowerCase());
    }

    if (!department || !departments.includes(department)) {
      errors.push({
        row: rowNum,
        field: 'department',
        reason: `Department '${department}' not recognized in company setup`,
      });
    }

    if (!designation) errors.push({ row: rowNum, field: 'designation', reason: 'Designation is required' });

    // Check ISO Date YYYY-MM-DD
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!joiningDate || !isoDateRegex.test(joiningDate)) {
      errors.push({ row: rowNum, field: 'joiningDate', reason: 'Date must be ISO format (YYYY-MM-DD)' });
    }

    const salary = Number(basicSalaryStr);
    if (isNaN(salary) || salary <= 0) {
      errors.push({ row: rowNum, field: 'basicSalary', reason: 'Basic salary must be a positive number' });
    }

    if (!errors.some((e) => e.row === rowNum)) {
      validRows.push({
        name,
        email,
        department,
        designation,
        joiningDate,
        basicSalary: salary,
        role: 'Employee',
        status: 'Active',
        firstLogin: true,
        phone: rowData['phone'] || '+92 300 0000000',
        address: rowData['address'] || 'Karachi, Pakistan',
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    validRows,
  };
}

// Initial Sample Dataset for Saylani Hackathon Testing
export const INITIAL_SETTINGS: OrgSettings = {
  companyName: 'TechNova Solutions',
  officeStart: '09:00',
  graceMinutes: 15,
  halfDayHours: 5,
  weekendDays: ['Saturday', 'Sunday'],
  officeLat: 24.8607, // Karachi Tech Hub
  officeLng: 67.0011,
  officeRadiusMeters: 150,
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
    { date: '2026-11-09', name: 'Iqbal Day' },
    { date: '2026-12-25', name: 'Quaid-e-Azam Day' },
  ],
  latePenaltyEnabled: true,
};

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    employeeId: 'EMP001',
    name: 'Muhammad Asad',
    email: 'asad.admin@technova.com',
    role: 'Admin',
    department: 'Engineering',
    designation: 'Chief Technology Officer',
    joiningDate: '2023-01-15',
    basicSalary: 220000,
    phone: '+92 300 1234567',
    address: 'Gulshan-e-Iqbal Block 13, Karachi',
    status: 'Active',
    firstLogin: false,
  },
  {
    employeeId: 'EMP002',
    name: 'Fatima Zahra',
    email: 'fatima.hr@technova.com',
    role: 'HR',
    department: 'Human Resources',
    designation: 'HR Lead & People Ops',
    joiningDate: '2023-06-01',
    basicSalary: 140000,
    phone: '+92 321 7654321',
    address: 'PECHS Block 2, Karachi',
    status: 'Active',
    firstLogin: false,
  },
  {
    employeeId: 'EMP003',
    name: 'Bilal Tariq',
    email: 'bilal.dev@technova.com',
    role: 'Employee',
    department: 'Engineering',
    designation: 'Senior Frontend Engineer',
    joiningDate: '2024-02-15',
    basicSalary: 110000,
    phone: '+92 333 9988776',
    address: 'North Nazimabad Block H, Karachi',
    status: 'Active',
    firstLogin: false,
  },
  {
    employeeId: 'EMP004',
    name: 'Ayesha Siddiqui',
    email: 'ayesha.sales@technova.com',
    role: 'Employee',
    department: 'Sales & Marketing',
    designation: 'Enterprise Account Executive',
    joiningDate: '2024-08-01',
    basicSalary: 95000,
    phone: '+92 345 5544332',
    address: 'Clifton Block 5, Karachi',
    status: 'Active',
    firstLogin: true,
  },
  {
    employeeId: 'EMP005',
    name: 'Zayn Ul Abidin',
    email: 'zayn.ops@technova.com',
    role: 'Employee',
    department: 'Operations',
    designation: 'Operations Specialist',
    joiningDate: '2025-01-10',
    basicSalary: 85000,
    phone: '+92 312 8877665',
    address: 'Bahadurabad, Karachi',
    status: 'Active',
    firstLogin: false,
  },
];

const today = new Date().toISOString().split('T')[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'ATT-101',
    employeeId: 'EMP001',
    employeeName: 'Muhammad Asad',
    date: today,
    checkInTime: '08:52',
    checkOutTime: '17:30',
    hoursWorked: 8.6,
    status: 'Present',
    method: 'Web',
    verifiedLocation: true,
    distanceMeters: 42,
  },
  {
    id: 'ATT-102',
    employeeId: 'EMP002',
    employeeName: 'Fatima Zahra',
    date: today,
    checkInTime: '09:24',
    checkOutTime: '18:15',
    hoursWorked: 8.8,
    status: 'Late', // Late after 09:15
    method: 'Camera',
    verifiedLocation: true,
    distanceMeters: 65,
  },
  {
    id: 'ATT-103',
    employeeId: 'EMP003',
    employeeName: 'Bilal Tariq',
    date: today,
    checkInTime: '09:05',
    checkOutTime: '17:40',
    hoursWorked: 8.6,
    status: 'Present',
    method: 'Web',
    verifiedLocation: true,
    distanceMeters: 38,
  },
  {
    id: 'ATT-104',
    employeeId: 'EMP005',
    employeeName: 'Zayn Ul Abidin',
    date: today,
    checkInTime: '09:32',
    hoursWorked: 0,
    status: 'Late',
    method: 'Camera',
    verifiedLocation: true,
    distanceMeters: 80,
  },
  {
    id: 'ATT-090',
    employeeId: 'EMP002',
    employeeName: 'Fatima Zahra',
    date: yesterday,
    checkInTime: '09:20',
    checkOutTime: '18:00',
    hoursWorked: 8.7,
    status: 'Late',
    method: 'Camera',
    verifiedLocation: true,
    distanceMeters: 70,
  },
  {
    id: 'ATT-091',
    employeeId: 'EMP004',
    employeeName: 'Ayesha Siddiqui',
    date: yesterday,
    checkInTime: '09:00',
    checkOutTime: '13:30',
    hoursWorked: 4.5,
    status: 'Half Day', // Under 5 hours
    method: 'Web',
    verifiedLocation: true,
    distanceMeters: 55,
  },
];

export const INITIAL_LEAVES: LeaveRequest[] = [
  {
    id: 'LV-101',
    employeeId: 'EMP004',
    employeeName: 'Ayesha Siddiqui',
    leaveType: 'casual',
    startDate: today,
    endDate: today,
    workingDays: 1,
    reason: 'Family engagement ceremony',
    status: 'Approved',
    appliedAt: yesterday,
    hrComment: 'Approved as per casual quota entitlement.',
  },
];

export const INITIAL_ANNOUNCEMENTS = [
  {
    id: 'ANN-1',
    title: 'Saylani Hackathon 2026 - HCM Lite Live',
    date: today,
    author: 'HR Lead (Fatima Zahra)',
    content:
      'Welcome to HCM Lite! All company modules (Attendance, Leave, Payroll Lite, AI Assistant) are active. Please check in before 09:15 AM to maintain punctuality rating.',
    priority: 'Important' as const,
  },
  {
    id: 'ANN-2',
    title: 'Biometric Camera Attendance & Geofencing Active',
    date: yesterday,
    author: 'Admin (Muhammad Asad)',
    content:
      'Camera check-in now supports face verification within the 150m office perimeter. Ensure location services are permitted on your device.',
    priority: 'Normal' as const,
  },
];

export const INITIAL_NOTIFICATIONS = [
  {
    id: 'NOTIF-1',
    userId: 'EMP004',
    title: 'Leave Approved',
    message: 'Your casual leave request for today has been approved by HR.',
    time: '2 hours ago',
    read: false,
    type: 'leave' as const,
  },
  {
    id: 'NOTIF-2',
    userId: 'EMP001',
    title: 'Monthly Payroll Draft Ready',
    message: 'HR has prepared the October 2026 payroll run draft. Awaiting Admin lock.',
    time: 'Yesterday',
    read: false,
    type: 'payroll' as const,
  },
];
