import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Mail,
  Phone,
  Tag,
  ArrowLeft,
  Edit3,
  Trash2,
  Share2,
  Ticket,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { organizerService } from '../../services/organizerService';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';

export const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await organizerService.getEventById(id);
      if (res.success) {
        setEvent(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch event details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    try {
      const res = await organizerService.updateEventStatus(id, newStatus);
      if (res.success) {
        setEvent((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      alert(`Error updating status: ${err.message}`);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const res = await organizerService.deleteEvent(id);
      if (res.success) {
        navigate('/organizer/events');
      }
    } catch (err) {
      alert(`Failed to delete event: ${err.message}`);
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          <p className="text-xs font-semibold text-slate-400">Loading Event Details...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-8 text-center max-w-lg mx-auto mt-12">
        <AlertCircle className="mx-auto h-12 w-12 text-rose-400" />
        <h3 className="mt-3 text-base font-bold text-white">Event Not Accessible</h3>
        <p className="mt-1 text-xs text-rose-200">{error || 'This event could not be found or you do not have permission to view it.'}</p>
        <Link
          to="/organizer/events"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to My Events</span>
        </Link>
      </div>
    );
  }

  const fillPercent = Math.min(
    Math.round(((event.registeredCount || 0) / (event.maxCapacity || 1)) * 100),
    100
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/organizer/events"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Events List</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Copy Share Link */}
          <button
            onClick={copyShareLink}
            className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Share2 className="h-4 w-4" />}
            <span>{copied ? 'Link Copied!' : 'Share Event'}</span>
          </button>

          {/* Edit Event Button */}
          <Link
            to={`/organizer/events/${event._id}/edit`}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-100 hover:bg-slate-700 transition-colors shadow-sm"
          >
            <Edit3 className="h-4 w-4 text-brand-400" />
            <span>Edit Event</span>
          </Link>

          {/* Delete Button */}
          <button
            onClick={() => setDeleteModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/20 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Main Banner Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl backdrop-blur-xl">
        <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-slate-950">
          <img
            src={event.bannerUrl || 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1400&fit=crop'}
            alt={event.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

          {/* Banner Badges */}
          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
            <Badge variant="category" type={event.category} size="md">
              {event.category}
            </Badge>
            <Badge variant="status" type={event.status} size="md">
              {event.status}
            </Badge>
          </div>

          <div className="absolute top-4 right-4">
            <select
              value={event.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md focus:border-brand-500 focus:outline-none"
            >
              <option value="Draft">Draft</option>
              <option value="Published">Published</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Bottom Title inside Hero */}
          <div className="absolute bottom-6 left-6 right-6">
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              {event.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-6 text-xs sm:text-sm text-slate-300 font-medium">
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-brand-400" />
                {event.date} &bull; {event.startTime} - {event.endTime}
              </span>
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-indigo-400" />
                {event.venue} ({event.locationType})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Details & Registration Roster Access */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (8 cols): Description & Details */}
        <div className="lg:col-span-8 space-y-6">
          {/* About Event */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 backdrop-blur-xl space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-brand-400" />
              <span>About this Event</span>
            </h2>
            <div className="prose prose-invert max-w-none text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {event.description}
            </div>

            {/* Tags */}
            {event.tags && event.tags.length > 0 && (
              <div className="pt-4 border-t border-slate-800/80">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Event Tags & Topics
                </h4>
                <div className="flex flex-wrap gap-2">
                  {event.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-xl bg-slate-800/80 px-3 py-1 text-xs font-medium text-slate-200 border border-slate-700"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Schedule & Contact Details */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 backdrop-blur-xl">
            <h3 className="text-base font-bold text-white mb-4">Logistics & Contact Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
              <div className="rounded-2xl bg-slate-950/60 p-4 border border-slate-800 space-y-2">
                <p className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Host / Organizer</p>
                <p className="font-bold text-sm text-white">{event.organizerName}</p>
                <div className="flex items-center gap-2 text-slate-400">
                  <Mail className="h-3.5 w-3.5 text-brand-400" />
                  <span>{event.contactEmail}</span>
                </div>
                {event.contactPhone && (
                  <div className="flex items-center gap-2 text-slate-400">
                    <Phone className="h-3.5 w-3.5 text-indigo-400" />
                    <span>{event.contactPhone}</span>
                  </div>
                )}
              </div>

              <div className="rounded-2xl bg-slate-950/60 p-4 border border-slate-800 space-y-2">
                <p className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Registration Deadline</p>
                <p className="font-bold text-sm text-white">
                  {event.registrationDeadline ? new Date(event.registrationDeadline).toLocaleString() : 'Open until capacity'}
                </p>
                <p className="text-slate-500 font-bold uppercase tracking-wider text-[10px] pt-1">Location Format</p>
                <p className="text-slate-300 font-semibold">{event.locationType} &bull; {event.venue}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Live Registration Stats Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 backdrop-blur-xl shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Ticket className="h-5 w-5 text-brand-400" />
                <h3 className="font-bold text-white">Registration Status</h3>
              </div>
              <Badge variant="status" type={event.status} size="xs">
                {event.status}
              </Badge>
            </div>

            {/* Capacity Fill */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-400 font-medium">Capacity Utilization</span>
                <span className="font-bold text-white">
                  {event.registeredCount || 0} / {event.maxCapacity} ({fillPercent}%)
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-500 via-indigo-500 to-emerald-500 transition-all duration-500"
                  style={{ width: `${fillPercent}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] text-slate-400">
                {Math.max(0, event.maxCapacity - (event.registeredCount || 0))} seats remaining
              </p>
            </div>

            {/* Registration Summary Sub-counts */}
            {event.registrationsSummary && (
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Confirmed</span>
                  <span className="text-base font-extrabold text-emerald-400">
                    {event.registrationsSummary.confirmed}
                  </span>
                </div>
                <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Attended</span>
                  <span className="text-base font-extrabold text-cyan-400">
                    {event.registrationsSummary.attended}
                  </span>
                </div>
              </div>
            )}

            {/* Primary Action Button */}
            <Link
              to={`/organizer/events/${event._id}/registrations`}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 py-3.5 text-xs font-bold text-white shadow-xl shadow-brand-600/30 hover:from-brand-500 hover:to-indigo-500 transition-all transform active:scale-95"
            >
              <Users className="h-4 w-4" />
              <span>Manage Participant Roster</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Event"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-300">
            Are you sure you want to permanently delete this event? This action will also delete all registered participant records associated with this event.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setDeleteModalOpen(false)}
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete Event'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
