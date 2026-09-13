import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  Users,
  Image as ImageIcon,
  Mail,
  Phone,
  Tag,
  ArrowLeft,
  Eye,
  Check,
  AlertCircle,
} from 'lucide-react';
import { organizerService } from '../../services/organizerService';
import { Badge } from '../../components/common/Badge';

const CATEGORIES = [
  'Tech & Coding',
  'Cultural & Arts',
  'Sports & Fitness',
  'Workshops & Training',
  'Seminars & Talks',
  'Gaming & E-Sports',
  'Networking',
  'Other',
];

const PRESET_BANNERS = [
  { name: 'AI & Hackathon', url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&h=600&fit=crop' },
  { name: 'Cultural & Music Fest', url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&h=600&fit=crop' },
  { name: 'Coding & Workshop', url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&h=600&fit=crop' },
  { name: 'Gaming & Esports', url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&h=600&fit=crop' },
  { name: 'Tech Symposium', url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&h=600&fit=crop' },
  { name: 'Sports & Marathon', url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&h=600&fit=crop' },
];

export const EditEvent = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Tech & Coding',
    date: '',
    startTime: '09:00',
    endTime: '17:00',
    venue: '',
    locationType: 'In-Person',
    maxCapacity: 100,
    bannerUrl: '',
    registrationDeadline: '',
    contactEmail: '',
    contactPhone: '',
    tags: '',
    price: 0,
    status: 'Published',
  });

  const [initialLoading, setInitialLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setInitialLoading(true);
        const res = await organizerService.getEventById(id);
        if (res.success && res.data) {
          const ev = res.data;
          setFormData({
            title: ev.title || '',
            description: ev.description || '',
            category: ev.category || 'Tech & Coding',
            date: ev.date || '',
            startTime: ev.startTime || '09:00',
            endTime: ev.endTime || '17:00',
            venue: ev.venue || '',
            locationType: ev.locationType || 'In-Person',
            maxCapacity: ev.maxCapacity || 100,
            bannerUrl: ev.bannerUrl || '',
            registrationDeadline: ev.registrationDeadline || '',
            contactEmail: ev.contactEmail || '',
            contactPhone: ev.contactPhone || '',
            tags: Array.isArray(ev.tags) ? ev.tags.join(', ') : ev.tags || '',
            price: ev.price || 0,
            status: ev.status || 'Published',
          });
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch event details');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        maxCapacity: Number(formData.maxCapacity),
        price: Number(formData.price),
        tags: formData.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      };

      const res = await organizerService.updateEvent(id, payload);
      if (res.success) {
        navigate(`/organizer/events/${id}`);
      } else {
        throw new Error(res.message || 'Failed to update event');
      }
    } catch (err) {
      setError(err.message || 'Failed to save changes');
    } finally {
      setSubmitting(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          <p className="text-xs font-semibold text-slate-400">Loading Event Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Edit Event</h1>
          <p className="mt-1 text-xs text-slate-400">
            Modify event schedule, location, capacity, status, or details.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-white focus:border-brand-500 focus:outline-none"
          >
            <option value="Draft">Draft</option>
            <option value="Published">Published</option>
            <option value="Ongoing">Ongoing</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-2xl bg-rose-500/10 border border-rose-500/30 p-4 text-xs font-medium text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Layout: Form + Live Card Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-xl space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-brand-400 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span>1. Event Information</span>
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Event Title *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/70 py-2.5 px-4 text-sm text-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/70 py-2.5 px-4 text-sm text-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Location Type
                  </label>
                  <select
                    name="locationType"
                    value={formData.locationType}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/70 py-2.5 px-4 text-sm text-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="In-Person">In-Person</option>
                    <option value="Online">Online / Virtual</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Event Description *
                </label>
                <textarea
                  name="description"
                  required
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/70 py-2.5 px-4 text-sm text-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Venue / Location / Platform Link *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    name="venue"
                    required
                    value={formData.venue}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/70 py-2.5 pl-10 pr-4 text-sm text-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-xl space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>2. Schedule & Capacity</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Event Date *
                  </label>
                  <input
                    type="date"
                    name="date"
                    required
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/70 py-2.5 px-4 text-sm text-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    name="startTime"
                    required
                    value={formData.startTime}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/70 py-2.5 px-4 text-sm text-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    End Time *
                  </label>
                  <input
                    type="time"
                    name="endTime"
                    required
                    value={formData.endTime}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/70 py-2.5 px-4 text-sm text-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Maximum Capacity *
                  </label>
                  <input
                    type="number"
                    name="maxCapacity"
                    min="1"
                    required
                    value={formData.maxCapacity}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/70 py-2.5 px-4 text-sm text-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Registration Deadline *
                  </label>
                  <input
                    type="datetime-local"
                    name="registrationDeadline"
                    required
                    value={formData.registrationDeadline}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/70 py-2.5 px-4 text-sm text-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-xl space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-pink-400 flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                <span>3. Banner Image</span>
              </h2>

              <div>
                <input
                  type="url"
                  name="bannerUrl"
                  value={formData.bannerUrl}
                  onChange={handleChange}
                  placeholder="Banner image URL..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/70 py-2.5 px-4 text-sm text-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                {PRESET_BANNERS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, bannerUrl: preset.url }))}
                    className={`relative overflow-hidden rounded-xl border ${
                      formData.bannerUrl === preset.url ? 'border-brand-500 ring-2 ring-brand-500/50' : 'border-slate-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={preset.url} alt={preset.name} className="h-14 w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-xl space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>4. Contact & Tags</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    name="contactEmail"
                    required
                    value={formData.contactEmail}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/70 py-2.5 px-4 text-sm text-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/70 py-2.5 px-4 text-sm text-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tags
                </label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/70 py-2.5 px-4 text-sm text-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 py-3.5 text-sm font-bold text-white shadow-xl shadow-brand-600/30 hover:from-brand-500 hover:to-indigo-500 transition-all disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                <span>{submitting ? 'Saving Changes...' : 'Save & Update Event'}</span>
              </button>
              <Link
                to={`/organizer/events/${id}`}
                className="rounded-2xl border border-slate-800 bg-slate-900 px-6 py-3.5 text-sm font-bold text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>

        {/* Right Column: Live Preview */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 px-1">
              <Eye className="h-4 w-4 text-brand-400" />
              <span>Live Updated Preview</span>
            </span>

            <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur-xl">
              <div className="relative h-48 w-full overflow-hidden bg-slate-950">
                <img
                  src={formData.bannerUrl || PRESET_BANNERS[0].url}
                  alt="Event Banner"
                  className="h-full w-full object-cover"
                />
                <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                  <Badge variant="category" type={formData.category}>
                    {formData.category}
                  </Badge>
                  <Badge variant="status" type={formData.status}>
                    {formData.status}
                  </Badge>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <h3 className="text-lg font-bold text-white leading-snug">
                  {formData.title || 'Untitled Event'}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-3">{formData.description}</p>
                <div className="space-y-2 border-t border-slate-800 pt-3 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-brand-400 shrink-0" />
                    <span>{formData.date} &bull; {formData.startTime} - {formData.endTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-indigo-400 shrink-0" />
                    <span className="truncate">{formData.venue}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Capacity: <strong>{formData.maxCapacity} seats</strong></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
