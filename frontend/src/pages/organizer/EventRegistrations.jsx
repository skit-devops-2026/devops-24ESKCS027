import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Users,
  Search,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  ArrowLeft,
  Calendar,
  Ticket,
  Mail,
  Phone,
  Filter,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import { organizerService } from '../../services/organizerService';
import { Badge } from '../../components/common/Badge';

const STATUS_FILTERS = ['All', 'Confirmed', 'Attended', 'Pending', 'Cancelled'];

export const EventRegistrations = () => {
  const { id } = useParams();

  const [registrations, setRegistrations] = useState([]);
  const [eventInfo, setEventInfo] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const res = await organizerService.getEventRegistrations(id, {
        search,
        status: statusFilter,
      });

      if (res.success) {
        setRegistrations(res.data);
        setEventInfo(res.event);
        setStats(res.stats);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch event registrations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [id, search, statusFilter]);

  const handleStatusChange = async (regId, newStatus) => {
    try {
      const res = await organizerService.updateRegistrationStatus(id, regId, newStatus);
      if (res.success) {
        setRegistrations((prev) =>
          prev.map((r) => (r._id === regId ? { ...r, status: newStatus } : r))
        );
        // Refresh summary stats
        fetchRegistrations();
      }
    } catch (err) {
      alert(`Failed to update participant status: ${err.message}`);
    }
  };

  const handleExportCSV = () => {
    if (!registrations || registrations.length === 0) {
      alert('No registrations available to export.');
      return;
    }

    const headers = ['Ticket Code', 'Participant Name', 'Email', 'Phone', 'Student ID', 'Status', 'Registered Date', 'Notes'];
    const rows = registrations.map((r) => [
      `"${r.ticketCode || ''}"`,
      `"${r.participantName || ''}"`,
      `"${r.participantEmail || ''}"`,
      `"${r.participantPhone || ''}"`,
      `"${r.studentId || ''}"`,
      `"${r.status || ''}"`,
      `"${new Date(r.registeredAt).toLocaleDateString()}"`,
      `"${(r.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `eventhive-participants-${eventInfo?.title ? eventInfo.title.replace(/\s+/g, '_') : 'event'}-${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to={`/organizer/events/${id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Event Details</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Registration & Attendance Roster
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            {eventInfo?.title ? (
              <span>Managing attendees for: <strong className="text-brand-300">{eventInfo.title}</strong></span>
            ) : (
              'Manage registered students, track check-ins, and export participant data.'
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            disabled={registrations.length === 0}
            className="flex items-center gap-2 rounded-2xl bg-slate-800 border border-slate-700 px-4 py-2.5 text-xs font-bold text-slate-100 hover:bg-slate-700 transition-all disabled:opacity-50"
          >
            <Download className="h-4 w-4 text-brand-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Stats Overview Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 backdrop-blur-xl">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Registered</p>
          <p className="mt-1 text-2xl font-extrabold text-white">{stats?.total ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 backdrop-blur-xl">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Confirmed</p>
          <p className="mt-1 text-2xl font-extrabold text-emerald-300">{stats?.confirmed ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4 backdrop-blur-xl">
          <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">Attended / Checked In</p>
          <p className="mt-1 text-2xl font-extrabold text-cyan-300">{stats?.attended ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 backdrop-blur-xl">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Pending</p>
          <p className="mt-1 text-2xl font-extrabold text-amber-300">{stats?.pending ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4 backdrop-blur-xl col-span-2 sm:col-span-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">Attendance Rate</p>
          <p className="mt-1 text-2xl font-extrabold text-indigo-300">{stats?.attendanceRate ?? 0}%</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5 backdrop-blur-xl space-y-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none border-b border-slate-800/80">
          {STATUS_FILTERS.map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === tab
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative w-full">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search participants by name, email, student ID, or ticket code..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950/70 py-2 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Participant Roster Table */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-brand-500 border-t-transparent" />
            <p className="text-xs font-semibold text-slate-400">Loading participant roster...</p>
          </div>
        </div>
      ) : registrations.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-slate-600" />
          <h3 className="mt-3 text-base font-bold text-white">No Registrations Found</h3>
          <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
            {search || statusFilter !== 'All'
              ? 'No participant records match your current search and filter criteria.'
              : 'No participants have registered for this event yet.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/60 uppercase tracking-wider text-slate-400 font-bold">
                <tr>
                  <th className="px-5 py-4">Participant</th>
                  <th className="px-5 py-4">Student ID / Phone</th>
                  <th className="px-5 py-4">Ticket Code</th>
                  <th className="px-5 py-4">Registered Date</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Check-in / Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {registrations.map((reg) => (
                  <tr key={reg._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-4">
                      <div>
                        <span className="font-bold text-white block text-sm">{reg.participantName}</span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Mail className="h-3 w-3 text-slate-500" />
                          {reg.participantEmail}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-200">{reg.studentId || 'N/A'}</div>
                      <div className="text-[11px] text-slate-500">{reg.participantPhone || '-'}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-950 px-2 py-1 font-mono text-[11px] text-brand-300 border border-slate-800">
                        <Ticket className="h-3 w-3 text-brand-400" />
                        {reg.ticketCode}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-400">
                      {new Date(reg.registeredAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant="status" type={reg.status} size="xs">
                        {reg.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {reg.status !== 'Attended' ? (
                          <button
                            onClick={() => handleStatusChange(reg._id, 'Attended')}
                            className="inline-flex items-center gap-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30 px-2.5 py-1 text-[11px] font-bold text-cyan-300 hover:bg-cyan-500/30 transition-colors"
                          >
                            <UserCheck className="h-3.5 w-3.5" />
                            <span>Mark Attended</span>
                          </button>
                        ) : (
                          <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span>Checked In</span>
                          </span>
                        )}

                        <select
                          value={reg.status}
                          onChange={(e) => handleStatusChange(reg._id, e.target.value)}
                          className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-[10px] font-bold text-slate-300 focus:border-brand-500 focus:outline-none"
                        >
                          <option value="Confirmed">Confirmed</option>
                          <option value="Attended">Attended</option>
                          <option value="Pending">Pending</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
