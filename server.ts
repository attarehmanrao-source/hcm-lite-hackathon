import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Google GenAI if key is present
const apiKey = process.env.GEMINI_API_KEY || '';
let aiClient: GoogleGenAI | null = null;
if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Haversine Distance in meters
function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
  return R * c;
}

// Download Project ZIP Endpoint
app.get(['/download-zip', '/hcm-lite-saylani-hackathon.zip'], (_req, res) => {
  const zipPath = path.resolve(__dirname, 'public', 'hcm-lite-saylani-hackathon.zip');
  res.download(zipPath, 'hcm-lite-saylani-hackathon.zip', (err) => {
    if (err) {
      console.error('Download error:', err);
      if (!res.headersSent) {
        res.status(500).send('Error downloading ZIP file');
      }
    }
  });
});

// 1. Geofence API endpoint
app.post('/api/attendance/geofence', (req, res) => {
  const { userLat, userLng, officeLat, officeLng, radiusMeters = 150 } = req.body;
  if (
    userLat === undefined ||
    userLng === undefined ||
    officeLat === undefined ||
    officeLng === undefined
  ) {
    return res.status(400).json({ error: 'Missing coordinates for geofence calculation' });
  }

  const distance = Math.round(getHaversineDistance(userLat, userLng, officeLat, officeLng));
  const allowed = distance <= radiusMeters;
  return res.json({
    allowed,
    distanceMeters: distance,
    radiusMeters,
    status: allowed ? 'Inside office perimeter' : `Outside geofence (${distance}m > ${radiusMeters}m limit)`,
  });
});

// 2. AI Chat Endpoint with Role & Data Scope Guard
app.post('/api/ai/chat', async (req, res) => {
  const { message, role, employeeId, employeeName, context } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Guardrail check: Employee asking for colleague salary
  const lowerMsg = message.toLowerCase();
  if (role === 'employee') {
    const isAskingSalary =
      (lowerMsg.includes('salary') || lowerMsg.includes('pay') || lowerMsg.includes('compensation') || lowerMsg.includes('kamata')) &&
      !lowerMsg.includes('my salary') &&
      !lowerMsg.includes('mera salary') &&
      !lowerMsg.includes('my pay');

    if (isAskingSalary && (lowerMsg.includes('who') || lowerMsg.includes('what') || lowerMsg.includes('colleague') || lowerMsg.includes('ali') || lowerMsg.includes('sara') || lowerMsg.includes('khan') || lowerMsg.includes('manager') || lowerMsg.includes('other') || lowerMsg.includes('ka') || lowerMsg.includes('ki'))) {
      return res.json({
        reply: "I cannot disclose colleague salary information or private employee data. You can only view your own compensation records. [AI-generated]",
        roleRefusal: true,
      });
    }
  }

  const systemInstruction = `You are HCM Lite AI, the enterprise Human Capital Management assistant for Saylani Hackathon HCM Lite.
Current User Role: ${role || 'guest'}
Current User Employee ID: ${employeeId || 'N/A'}
Current User Name: ${employeeName || 'N/A'}

Scope and Guardrails:
1. Ground your answers strictly in the provided database context.
2. If the user role is 'employee', strictly refuse any queries about other employees' salaries, disciplinary records, or non-public data.
3. If information is not in the data context, clearly reply that you do not know or that it is not recorded.
4. Support English and Roman Urdu (e.g. "Kitne log chutti par hain", "Mera leave balance kitna hai").
5. Always append '[AI-generated]' at the end of your answer.
6. Keep answers concise, factual, professional, and clear.`;

  const promptContent = `User query: "${message}"

Database context:
${JSON.stringify(context || {}, null, 2)}`;

  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: promptContent,
        config: {
          systemInstruction,
          temperature: 0.2,
        },
      });

      const reply = response.text || 'Unable to formulate response from data. [AI-generated]';
      return res.json({ reply: reply.includes('[AI-generated]') ? reply : `${reply}\n\n[AI-generated]` });
    } catch (err: any) {
      console.error('Gemini Chat error:', err);
    }
  }

  // Deterministic Fallback if Gemini key is unset or error occurs
  let fallbackReply = '';
  if (lowerMsg.includes('who is on leave') || lowerMsg.includes('leave today') || lowerMsg.includes('chutti par')) {
    const leaves = context?.leavesToday || [];
    if (leaves.length === 0) {
      fallbackReply = 'There are no employees on approved leave today.';
    } else {
      const byType: Record<string, number> = {};
      leaves.forEach((l: any) => {
        byType[l.leaveType] = (byType[l.leaveType] || 0) + 1;
      });
      const typesStr = Object.entries(byType).map(([k, v]) => `${v} ${k}`).join(', ');
      fallbackReply = `${leaves.length} employee${leaves.length > 1 ? 's' : ''} on leave today: ${typesStr}.`;
    }
  } else if (lowerMsg.includes('headcount') || lowerMsg.includes('how many active employees')) {
    fallbackReply = `The company currently has ${context?.headcount || 0} active employees across departments.`;
  } else if (lowerMsg.includes('attendance rate') || lowerMsg.includes('attendance percentage')) {
    fallbackReply = `Current attendance rate is ${context?.attendanceRate || '0.0'}% based on recorded check-ins and working days.`;
  } else if (lowerMsg.includes('came late') || lowerMsg.includes('late comers') || lowerMsg.includes('late today')) {
    const lates = context?.lateComers || [];
    if (lates.length === 0) {
      fallbackReply = 'No late-comers recorded today.';
    } else {
      fallbackReply = `Top late comers: ${lates.map((l: any) => `${l.name} (${l.checkInTime || l.count + ' times'})`).join(', ')}.`;
    }
  } else if (lowerMsg.includes('sick leave') || lowerMsg.includes('leave balance') || lowerMsg.includes('leaves do i have')) {
    const balance = context?.myLeaveBalance;
    if (balance) {
      fallbackReply = `Your remaining leave balance: Annual: ${balance.annual ?? 14} days, Sick: ${balance.sick ?? 8} days, Casual: ${balance.casual ?? 10} days.`;
    } else {
      fallbackReply = 'Your standard annual quota is 14 Annual, 8 Sick, 10 Casual, and unlimited unpaid leave.';
    }
  } else {
    fallbackReply = `Based on system records: ${context?.headcount || 0} active employees, ${context?.presentToday || 0} present today, ${context?.leavesToday?.length || 0} on leave. Please ask about attendance, leave balances, headcount, or company policies.`;
  }

  return res.json({ reply: `${fallbackReply} [AI-generated]` });
});

// 3. AI Dashboard Summary (3-5 insight bullets strictly from KPI numbers)
app.post('/api/ai/summary', async (req, res) => {
  const { kpis, role } = req.body;

  const systemInstruction = `You are an HR analytics executive assistant.
Given the current KPI JSON, generate exactly 3 to 5 concise, actionable bullet points describing the state of the company.
Strict Rule: Use ONLY the numbers and facts provided in the JSON. Never invent or hallucinate metrics.
Format each bullet with a leading '•'. End with '[AI-generated]'.`;

  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Generate 3-5 KPI insight bullets for role ${role || 'admin'}:\n${JSON.stringify(kpis || {}, null, 2)}`,
        config: {
          systemInstruction,
          temperature: 0.1,
        },
      });
      return res.json({ bullets: response.text });
    } catch (err) {
      console.error('Gemini summary error:', err);
    }
  }

  // Fallback bullets
  const headcount = kpis?.headcount || 0;
  const present = kpis?.presentToday || 0;
  const late = kpis?.lateToday || 0;
  const onLeave = kpis?.onLeaveToday || 0;
  const attendanceRate = kpis?.attendanceRate || '0.0';
  const payrollCost = kpis?.payrollCost ? `PKR ${Number(kpis.payrollCost).toLocaleString()}` : 'PKR 0';

  const bullets = [
    `• Headcount stands at ${headcount} active personnel with ${present} present today (${attendanceRate}% attendance rate).`,
    `• ${late} employee(s) arrived after the 09:15 AM grace cutoff today.`,
    `• ${onLeave} team member(s) are on approved leave today across active departments.`,
    `• Total monthly payroll allocation calculated at ${payrollCost}.`,
  ].join('\n') + '\n\n[AI-generated]';

  return res.json({ bullets });
});

// 4. Smart Leave Parser (Natural Language to structured JSON)
app.post('/api/ai/smart-leave', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Text required' });

  // Today reference
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const systemInstruction = `You are a Smart Leave parser for HCM Lite.
Convert natural language leave requests (in English or Roman Urdu) into structured JSON:
{
  "type": "casual" | "sick" | "annual" | "unpaid",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "reason": "Clear short summary of reason"
}
Reference today's date: ${todayStr}.
Rules:
- If wedding, family function, personal urgent work -> "casual"
- If fever, unwell, medical, doctor, sick -> "sick"
- If vacation, rest, travel, trip -> "annual"
- "Next Monday and Tuesday": calculate dates based on ${todayStr}.
Output ONLY valid JSON.`;

  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Parse this leave request: "${text}"`,
        config: {
          systemInstruction,
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({ success: true, data: parsed, source: 'ai' });
    } catch (err) {
      console.error('Smart leave AI error:', err);
    }
  }

  // Heuristic fallback
  const lower = text.toLowerCase();
  let type = 'casual';
  if (lower.includes('sick') || lower.includes('fever') || lower.includes('doctor') || lower.includes('tabiyat') || lower.includes('bimari')) {
    type = 'sick';
  } else if (lower.includes('vacation') || lower.includes('holiday') || lower.includes('trip') || lower.includes('annual')) {
    type = 'annual';
  }

  // Calculate default next business day
  const start = new Date(now);
  start.setDate(start.getDate() + 1);
  const end = new Date(start);
  if (lower.includes('two days') || lower.includes('2 days') || lower.includes('tuesday') || lower.includes('do din')) {
    end.setDate(end.getDate() + 1);
  }

  return res.json({
    success: true,
    data: {
      type,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      reason: text.slice(0, 100),
    },
    source: 'fallback',
  });
});

// 5. Policy Q&A endpoint
app.post('/api/ai/policy', async (req, res) => {
  const { question } = req.body;
  const policyRules = `
Saylani Hackathon HCM Lite Official Policy Rules:
1. Working Hours: Office start is 09:00 AM. Grace period is 15 minutes (late recorded after 09:15 AM).
2. Half Day: Any working day with under 5 hours duration counts as half-day.
3. Weekend: Saturday and Sunday are official non-working weekend days.
4. Leave Quotas: Annual = 14 days, Sick = 8 days, Casual = 10 days, Unpaid = Unlimited.
5. Leave Rules: Working days only (skip weekends and public holidays). Overlapping requests or exceeding quota balances are rejected with 422.
6. Attendance Penalty: 3 late arrivals result in 0.5 day salary deduction.
7. Payroll Formulas:
   - Gross = 1.5 * Basic Salary (HRA = 40% of basic, Medical = 10% of basic).
   - Per Day Rate = Gross / Total Working Days in Month.
   - Deductions = (Absent Days + Unpaid Leave Days + 0.5 * Half Days) * Per Day Rate.
   - Tax Slabs (Annualized Gross):
     0 to 600,000 PKR: 0%
     600,001 to 1,200,000 PKR: 5% of amount over 600k
     1,200,001 to 2,400,000 PKR: 30,000 + 15% of amount over 1.2M
     2,400,001 to 3,600,000 PKR: 210,000 + 25% of amount over 2.4M
     Above 3,600,000 PKR: 510,000 + 35% of amount over 3.6M
8. Payroll Workflow: HR drafts and reviews the monthly payroll. Only Admin can lock and finalize it. Finalized payroll is immutable.
9. Geofence & Camera: Web/camera check-in checks office location (Haversine formula <= 150m radius) and requires single detected face.
`;

  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Question: "${question}"\n\nPolicy Knowledge Base:\n${policyRules}`,
        config: {
          systemInstruction: 'Answer strictly using the provided policy rules. If not covered, state you do not know. Tag answer with [AI-generated].',
          temperature: 0.1,
        },
      });
      return res.json({ answer: response.text });
    } catch (err) {
      console.error('Policy AI error:', err);
    }
  }

  return res.json({
    answer: `According to HCM Lite Policy: Office starts at 09:00 with 15-min grace (late after 09:15). Working under 5h is a half-day. Leave quotas: 14 Annual, 8 Sick, 10 Casual. Gross salary = 1.5x Basic (40% HRA, 10% Medical). [AI-generated]`,
  });
});

// Dev server or Production static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HCM Lite Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
