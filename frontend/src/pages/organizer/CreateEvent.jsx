import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
import { useAuth } from '../../context/AuthContext';
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

export const CreateEvent = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

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
    bannerUrl: PRESET_BANNERS[0].url,
    registrationDeadline: '',
    contactEmail: user?.email || '',
    contactPhone: user?.phone || '',
    tags: 'Hackathon, Innovation, Campus',
    price: 0,
    status: 'Published',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewTab, setPreviewTab] = useState('split'); // 'split' | 'form' | 'preview'

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

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

      const res = await organizerService.createEvent(payload);
      if (res.success) {
        navigate(`/organizer/events/${res.data._id}`);
      } else {
        throw new Error(res.message || 'Failed to create event');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while creating event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/organizer/events"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to My Events</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Create New Event</h1>
          <p className="mt-1 text-xs text-slate-400">
            Publish a new event, conference, or workshop to the EventHive catalog.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFormData((prev) => ({ ...prev, status: prev.status === 'Published' ? 'Draft' : 'Published' }))}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all border ${
              formData.status === 'Published'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            }`}
          >
            Status: {formData.status}
          </button>
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
        {/* Left Column: Form Fields (7 cols) */}
        <div className="lg:col-span-7">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
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
                  placeholder="e.g. Annual Campus AI & Web Summit 2026"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/70 py-2.5 px-4 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
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
                  placeholder="Provide a comprehensive description of the event, key topics, eligibility, schedule, and guidelines..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/70 py-2.5 px-4 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none"
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
                    placeholder="e.g. Science Auditorium, Hall A or Zoom Link"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/70 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>
            </div>

            {/* Schedule & Capacity */}
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
                    Maximum Capacity (Seats) *
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                    <input
                      type="number"
                      name="maxCapacity"
                      min="1"
                      required
                      value={formData.maxCapacity}
                      onChange={handleChange}
                      placeholder="100"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950/70 py-2.5 pl-10 pr-4 text-sm text-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
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

            {/* Banner & Media */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-xl space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-pink-400 flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                <span>3. Event Banner & Media</span>
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Banner Image URL
                </label>
                <input
                  type="url"
                  name="bannerUrl"
                  value={formData.bannerUrl}
                  onChange={handleChange}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/70 py-2.5 px-4 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <span className="block text-xs font-semibold text-slate-400 mb-2">
                  Or pick a curated banner preset:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {PRESET_BANNERS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, bannerUrl: preset.url }))}
                      className={`group relative overflow-hidden rounded-xl border text-left transition-all ${
                        formData.bannerUrl === preset.url
                          ? 'border-brand-500 ring-2 ring-brand-500/50'
                          : 'border-slate-800 opacity-70 hover:opacity-100 hover:border-slate-700'
                      }`}
                    >
                      <img src={preset.url} alt={preset.name} className="h-16 w-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-1.5 flex items-end">
                        <span className="text-[10px] font-bold text-white truncate">{preset.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Contact & Tags */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-xl space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>4. Contact Details & Tags</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Contact Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                    <input
                      type="email"
                      name="contactEmail"
                      required
                      value={formData.contactEmail}
                      onChange={handleChange}
                      placeholder="organizer@eventhive.com"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950/70 py-2.5 pl-10 pr-4 text-sm text-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Contact Phone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      name="contactPhone"
                      value={formData.contactPhone}
                      onChange={handleChange}
                      placeholder="+1 (555) 000-0000"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950/70 py-2.5 pl-10 pr-4 text-sm text-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tags (comma-separated)
                </label>
                <div className="relative">
                  <Tag className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    placeholder="AI, Hackathon, Networking, React"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/70 py-2.5 pl-10 pr-4 text-sm text-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 py-3.5 text-sm font-bold text-white shadow-xl shadow-brand-600/30 hover:from-brand-500 hover:to-indigo-500 transition-all disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                <span>{loading ? 'Publishing Event...' : 'Create & Publish Event'}</span>
              </button>
              <Link
                to="/organizer/events"
                className="rounded-2xl border border-slate-800 bg-slate-900 px-6 py-3.5 text-sm font-bold text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>

        {/* Right Column: Live Event Card Preview (5 cols) */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 space-y-4">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Eye className="h-4 w-4 text-brand-400" />
                <span>Live Event Preview</span>
              </span>
              <span className="text-[11px] text-slate-500">Updates in real-time</span>
            </div>

            {/* The Live Preview Card */}
            <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur-xl">
              <div className="relative h-48 w-full overflow-hidden bg-slate-950">
                <img
                  src={formData.bannerUrl || PRESET_BANNERS[0].url}
                  alt="Event Banner"
                  className="h-full w-full object-cover transition-all duration-300"
                />
                <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                  <Badge variant="category" type={formData.category}>
                    {formData.category}
                  </Badge>
                  <Badge variant="status" type={formData.status}>
                    {formData.status}
                  </Badge>
                </div>
                <div className="absolute bottom-3 right-3 rounded-lg bg-slate-950/80 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-md border border-slate-700">
                  {formData.locationType}
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-white leading-snug">
                    {formData.title || 'Untitled Event Title'}
                  </h3>
                  <p className="mt-1 text-xs text-slate-400 line-clamp-3">
                    {formData.description || 'Event description will appear here as you type...'}
                  </p>
                </div>

                <div className="space-y-2 border-t border-slate-800/80 pt-3 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-brand-400 shrink-0" />
                    <span>{formData.date || 'YYYY-MM-DD'} &bull; {formData.startTime} - {formData.endTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-indigo-400 shrink-0" />
                    <span className="truncate">{formData.venue || 'Venue address or Online link'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Max Capacity: <strong>{formData.maxCapacity || 0} seats</strong></span>
                  </div>
                </div>

                {formData.tags && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {formData.tags
                      .split(',')
                      .map((t) => t.trim())
                      .filter(Boolean)
                      .map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300 border border-slate-700"
                        >
                          #{tag}
                        </span>
                      ))}
                  </div>
                )}

                <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Host: <strong className="text-slate-200">{user?.name}</strong></span>
                  <span>{user?.organization}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
