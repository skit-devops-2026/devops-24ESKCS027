import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Plus,
  Filter,
  Calendar,
  MapPin,
  Users,
  Eye,
  Edit3,
  Trash2,
  AlertTriangle,
  ChevronRight,
  MoreVertical,
  LayoutGrid,
  List,
} from 'lucide-react';
import { organizerService } from '../../services/organizerService';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';

const STATUS_TABS = ['All', 'Published', 'Draft', 'Ongoing', 'Completed', 'Cancelled'];

const CATEGORIES = [
  'All',
  'Tech & Coding',
  'Cultural & Arts',
  'Sports & Fitness',
  'Workshops & Training',
  'Seminars & Talks',
  'Gaming & E-Sports',
  'Networking',
];

export const ManageEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Modal State for Delete Confirmation
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await organizerService.getEvents({
        search,
        status: statusFilter,
        category: categoryFilter,
        limit: 50,
      });
      if (res.success) {
        setEvents(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [search, statusFilter, categoryFilter]);

  const handleStatusChange = async (eventId, newStatus) => {
    try {
      const res = await organizerService.updateEventStatus(eventId, newStatus);
      if (res.success) {
        setEvents((prev) =>
          prev.map((e) => (e._id === eventId ? { ...e, status: newStatus } : e))
        );
      }
    } catch (err) {
      alert(`Error updating status: ${err.message}`);
    }
  };

  const confirmDelete = (event) => {
    setEventToDelete(event);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!eventToDelete) return;
    try {
      setDeleting(true);
      const res = await organizerService.deleteEvent(eventToDelete._id);
      if (res.success) {
        setEvents((prev) => prev.filter((e) => e._id !== eventToDelete._id));
        setDeleteModalOpen(false);
        setEventToDelete(null);
      }
    } catch (err) {
      alert(`Failed to delete event: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Manage Events</h1>
          <p className="mt-1 text-xs text-slate-400">
            View, edit, filter, and monitor all events hosted under your organizer account.
          </p>
        </div>

        <Link
          to="/organizer/events/new"
          className="flex items-center justify-center gap-2 rounded-2xl bg-brand-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-brand-600/30 hover:bg-brand-500 transition-all transform active:scale-95 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Create New Event</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5 backdrop-blur-xl space-y-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none border-b border-slate-800/80">
          {STATUS_TABS.map((tab) => (
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

        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by event title, venue, keywords..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950/70 py-2 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-white focus:border-brand-500 focus:outline-none w-full sm:w-auto"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? 'All Categories' : cat}
                </option>
              ))}
            </select>

            <div className="flex items-center rounded-xl border border-slate-800 bg-slate-950/70 p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`rounded-lg p-1.5 transition-colors ${
                  viewMode === 'grid' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`rounded-lg p-1.5 transition-colors ${
                  viewMode === 'table' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Table View"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Events Listing */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-brand-500 border-t-transparent" />
            <p className="text-xs font-semibold text-slate-400">Loading events...</p>
          </div>
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center">
          <Calendar className="mx-auto h-12 w-12 text-slate-600" />
          <h3 className="mt-3 text-base font-bold text-white">No Events Found</h3>
          <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
            {search || statusFilter !== 'All' || categoryFilter !== 'All'
              ? 'No events match your current search and filter criteria.'
              : 'You have not created any events yet. Get started by clicking the button below!'}
          </p>
          <Link
            to="/organizer/events/new"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-brand-500 shadow-md shadow-brand-600/30"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Event</span>
          </Link>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((evt) => {
            const fillRate = Math.min(
              Math.round(((evt.registeredCount || 0) / (evt.maxCapacity || 1)) * 100),
              100
            );

            return (
              <div
                key={evt._id}
                className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 shadow-xl transition-all duration-200 hover:border-brand-500/40 hover:shadow-brand-500/5 backdrop-blur-xl"
              >
                <div>
                  {/* Card Banner */}
                  <div className="relative h-44 w-full overflow-hidden bg-slate-950">
                    <img
                      src={evt.bannerUrl || 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&fit=crop'}
                      alt={evt.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      <Badge variant="category" type={evt.category} size="xs">
                        {evt.category}
                      </Badge>
                      <Badge variant="status" type={evt.status} size="xs">
                        {evt.status}
                      </Badge>
                    </div>

                    <div className="absolute bottom-3 right-3 rounded-lg bg-slate-950/80 px-2 py-0.5 text-[11px] font-bold text-slate-300 border border-slate-700">
                      {evt.locationType || 'In-Person'}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3">
                    <h3 className="text-base font-bold text-white line-clamp-1 group-hover:text-brand-300 transition-colors">
                      {evt.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2">{evt.description}</p>

                    <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-xs text-slate-300">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-brand-400 shrink-0" />
                        <span>{evt.date} &bull; {evt.startTime}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                        <span className="truncate">{evt.venue}</span>
                      </div>
                    </div>

                    {/* Capacity Indicator */}
                    <div className="pt-2">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Registrations</span>
                        <span className="font-bold text-slate-200">
                          {evt.registeredCount || 0} / {evt.maxCapacity} ({fillRate}%)
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-indigo-500"
                          style={{ width: `${fillRate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="border-t border-slate-800 bg-slate-950/50 p-4 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <select
                      value={evt.status}
                      onChange={(e) => handleStatusChange(evt._id, e.target.value)}
                      className="rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-[11px] font-bold text-slate-300 focus:border-brand-500 focus:outline-none"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Published">Published</option>
                      <option value="Ongoing">Ongoing</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1">
                    <Link
                      to={`/organizer/events/${evt._id}`}
                      title="View Details"
                      className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    <Link
                      to={`/organizer/events/${evt._id}/edit`}
                      title="Edit Event"
                      className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-brand-400 transition-colors"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => confirmDelete(evt)}
                      title="Delete Event"
                      className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/60 uppercase tracking-wider text-slate-400 font-bold">
                <tr>
                  <th className="px-5 py-4">Event</th>
                  <th className="px-5 py-4">Category</th>
                  <th className="px-5 py-4">Date & Time</th>
                  <th className="px-5 py-4">Venue</th>
                  <th className="px-5 py-4">Registrations</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {events.map((evt) => (
                  <tr key={evt._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={evt.bannerUrl || 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=100&fit=crop'}
                          alt={evt.title}
                          className="h-10 w-14 rounded-lg object-cover ring-1 ring-slate-800"
                        />
                        <div>
                          <Link
                            to={`/organizer/events/${evt._id}`}
                            className="font-bold text-white hover:text-brand-400 transition-colors"
                          >
                            {evt.title}
                          </Link>
                          <span className="block text-[11px] text-slate-500">{evt.locationType}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant="category" type={evt.category} size="xs">
                        {evt.category}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-200">{evt.date}</div>
                      <div className="text-[11px] text-slate-500">{evt.startTime} - {evt.endTime}</div>
                    </td>
                    <td className="px-5 py-4 max-w-[180px] truncate">{evt.venue}</td>
                    <td className="px-5 py-4 font-bold text-white">
                      {evt.registeredCount || 0} / {evt.maxCapacity}
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant="status" type={evt.status} size="xs">
                        {evt.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/organizer/events/${evt._id}`}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          to={`/organizer/events/${evt._id}/edit`}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-brand-400"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => confirmDelete(evt)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Event"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-rose-400">
            <AlertTriangle className="h-8 w-8 shrink-0" />
            <div>
              <p className="text-sm font-bold text-white">
                Are you sure you want to delete "{eventToDelete?.title}"?
              </p>
              <p className="mt-1 text-xs text-slate-400">
                This action cannot be undone. All participant registration records for this event will also be removed.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              onClick={() => setDeleteModalOpen(false)}
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 shadow-md shadow-rose-600/30 disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Yes, Delete Event'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
