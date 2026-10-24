import React, { useState } from 'react';
import { UserRole, AuditLogEntry, Announcement, AppNotification } from '../types';
import {
  ShieldAlert,
  Bell,
  Megaphone,
  Plus,
  Clock,
  Eye,
  CheckCircle,
  X,
  FileCode,
} from 'lucide-react';

interface AuditAndCommsModuleProps {
  role: UserRole;
  auditLogs: AuditLogEntry[];
  announcements: Announcement[];
  notifications: AppNotification[];
  onPostAnnouncement: (ann: Announcement) => void;
  onClearNotification: (id: string) => void;
}

export const AuditAndCommsModule: React.FC<AuditAndCommsModuleProps> = ({
  role,
  auditLogs,
  announcements,
  notifications,
  onPostAnnouncement,
  onClearNotification,
}) => {
  const [activeTab, setActiveTab] = useState<'audit' | 'announcements' | 'notifications'>(
    role === 'Admin' ? 'audit' : 'announcements'
  );

  const [selectedAuditEntry, setSelectedAuditEntry] = useState<AuditLogEntry | null>(null);

  // New Announcement form
  const [showAddAnnModal, setShowAddAnnModal] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annPriority, setAnnPriority] = useState<'Normal' | 'Important' | 'Urgent'>('Normal');

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    const newAnn: Announcement = {
      id: `ANN-${Date.now()}`,
      title: annTitle,
      date: new Date().toISOString().split('T')[0],
      author: `${role} Department`,
      content: annContent,
      priority: annPriority,
    };

    onPostAnnouncement(newAnn);
    setShowAddAnnModal(false);
    setAnnTitle('');
    setAnnContent('');
  };

  return (
    <div className="space-y-6">
      {/* Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-teal-400" /> Communications & Audit Trail (Module 9)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Company-wide announcements, in-app notifications, and tamper-proof audit log with actor, action, and JSON payloads.
          </p>
        </div>

        {/* Tab selection */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {role === 'Admin' && (
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'audit' ? 'bg-slate-800 text-teal-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Master Audit Log ({auditLogs.length})
            </button>
          )}
          <button
            onClick={() => setActiveTab('announcements')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'announcements'
                ? 'bg-slate-800 text-teal-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Announcements ({announcements.length})
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'notifications'
                ? 'bg-slate-800 text-teal-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Notifications ({notifications.length})
          </button>
        </div>
      </div>

      {/* MASTER AUDIT LOG (ADMIN ONLY) */}
      {activeTab === 'audit' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-purple-400" />
              <h3 className="font-bold text-sm text-slate-100">Immutable Audit Trail</h3>
            </div>
            <span className="text-[11px] text-slate-400">Section 3: Entries cannot be deleted or modified</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4 text-right">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400">{log.timestamp}</td>
                    <td className="py-3 px-4 font-semibold text-slate-200">{log.actor}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.action === 'CREATE'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : log.action === 'APPROVE' || log.action === 'FINALIZE'
                            ? 'bg-purple-950 text-purple-400 border border-purple-800'
                            : log.action === 'RESET'
                            ? 'bg-rose-950 text-rose-400 border border-rose-800'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-300">{log.entity}</td>
                    <td className="py-3 px-4 text-slate-300 max-w-sm truncate">{log.details}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedAuditEntry(log)}
                        className="bg-slate-800 hover:bg-slate-700 text-teal-300 px-2 py-1 rounded text-[11px] font-mono border border-slate-700 transition-colors"
                      >
                        <FileCode className="w-3.5 h-3.5 inline mr-1" />
                        JSON
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ANNOUNCEMENTS TAB */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          {(role === 'Admin' || role === 'HR') && (
            <div className="flex justify-end">
              <button
                onClick={() => setShowAddAnnModal(true)}
                className="flex items-center gap-1.5 bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-600 hover:to-emerald-500 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs shadow-sm"
              >
                <Plus className="w-4 h-4" /> Broadcast Announcement
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      ann.priority === 'Urgent'
                        ? 'bg-rose-950 text-rose-400 border border-rose-800'
                        : ann.priority === 'Important'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : 'bg-teal-950 text-teal-400 border border-teal-800'
                    }`}
                  >
                    {ann.priority}
                  </span>
                  <span className="text-[11px] text-slate-500">{ann.date}</span>
                </div>

                <h3 className="font-bold text-sm text-slate-100">{ann.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{ann.content}</p>

                <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Author: {ann.author}</span>
                  <Megaphone className="w-3.5 h-3.5 text-slate-500" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NOTIFICATIONS TAB */}
      {activeTab === 'notifications' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm p-5 space-y-3">
          <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2 mb-2">
            <Bell className="w-4 h-4 text-teal-400" /> In-App Notification Center
          </h3>

          {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No new alerts or notifications.
            </div>
          ) : (
            <div className="space-y-2.5">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-xs text-slate-100 flex items-center gap-2">
                      <span>{n.title}</span>
                      <span className="text-[10px] text-slate-500 font-normal">({n.time})</span>
                    </div>
                    <p className="text-xs text-slate-300">{n.message}</p>
                  </div>
                  <button
                    onClick={() => onClearNotification(n.id)}
                    className="text-xs text-slate-400 hover:text-slate-200"
                  >
                    Dismiss
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* JSON PAYLOAD MODAL */}
      {selectedAuditEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <h3 className="font-bold text-sm text-slate-100">
                Audit Record Payload #{selectedAuditEntry.id}
              </h3>
              <button
                onClick={() => setSelectedAuditEntry(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <pre className="p-3 bg-slate-950 rounded-xl font-mono text-[11px] text-teal-300 overflow-x-auto max-h-72">
              {JSON.stringify(selectedAuditEntry, null, 2)}
            </pre>

            <div className="flex justify-end pt-3">
              <button
                onClick={() => setSelectedAuditEntry(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD ANNOUNCEMENT MODAL */}
      {showAddAnnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-100">
            <h3 className="font-bold text-base text-slate-100 mb-4">Post Company Announcement</h3>
            <form onSubmit={handleCreateAnnouncement} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder="e.g. Monthly All-Hands Meeting"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Priority</label>
                <select
                  value={annPriority}
                  onChange={(e) => setAnnPriority(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100"
                >
                  <option value="Normal">Normal</option>
                  <option value="Important">Important</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Message</label>
                <textarea
                  rows={4}
                  required
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  placeholder="Write the company-wide broadcast message..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddAnnModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold px-4 py-1.5 rounded-xl text-xs"
                >
                  Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
