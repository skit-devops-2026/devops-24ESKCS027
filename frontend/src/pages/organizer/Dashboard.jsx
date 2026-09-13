import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Users,
  CheckCircle,
  Clock,
  Plus,
  ArrowRight,
  TrendingUp,
  MapPin,
  ExternalLink,
  Sparkles,
  Ticket,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { organizerService } from '../../services/organizerService';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';

export const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await organizerService.getDashboardStats();
      if (res.success) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
      setError('Unable to load dashboard data. Please make sure the backend is connected.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          <p className="text-xs font-semibold text-slate-400">Loading Organizer Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-900/60 via-indigo-900/40 to-slate-900 border border-brand-500/20 p-6 sm:p-8 backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-brand-300 uppercase tracking-widest mb-2">
              <Sparkles className="h-4 w-4" />
              <span>Organizer Command Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {user?.name || 'Organizer'}! 👋
            </h1>
            <p className="mt-1 text-sm text-slate-300 max-w-xl">
              Here is an overview of your events, live registrations, and participant attendance across your portfolio.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/organizer/events/new"
              className="flex items-center gap-2 rounded-2xl bg-brand-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-brand-600/30 hover:bg-brand-500 transition-all transform active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>Create New Event</span>
            </Link>
            <Link
              to="/organizer/events"
              className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-800/80 px-5 py-3 text-sm font-bold text-slate-200 hover:bg-slate-700 transition-all"
            >
              <span>Manage Events</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Events Created"
          value={stats?.totalEvents ?? 0}
          icon={Calendar}
          color="indigo"
          subtitle={`${stats?.draftEvents ?? 0} Draft, ${stats?.completedEvents ?? 0} Completed`}
        />
        <StatCard
          title="Upcoming Events"
          value={stats?.upcomingEvents ?? 0}
          icon={Clock}
          color="emerald"
          subtitle="Scheduled & active"
        />
        <StatCard
          title="Total Registrations"
          value={stats?.totalRegistrations ?? 0}
          icon={Users}
          color="purple"
          subtitle="Participants registered"
        />
        <StatCard
          title="Completed Events"
          value={stats?.completedEvents ?? 0}
          icon={CheckCircle}
          color="amber"
          subtitle={`${stats?.attendedCount ?? 0} confirmed check-ins`}
        />
      </div>

      {/* Main Grid: Upcoming Events & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Events Portfolio */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Your Recent Events</h2>
              <p className="text-xs text-slate-400">Quick access to monitor and manage your events</p>
            </div>
            <Link
              to="/organizer/events"
              className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1"
            >
              <span>View all ({stats?.totalEvents ?? 0})</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-4">
            {stats?.recentEvents && stats.recentEvents.length > 0 ? (
              stats.recentEvents.map((evt) => {
                const fillPercent = Math.min(
                  Math.round(((evt.registeredCount || 0) / (evt.maxCapacity || 1)) * 100),
                  100
                );

                return (
                  <div
                    key={evt._id}
                    className="glass-panel glass-panel-hover rounded-2xl p-5 border border-slate-800/80 bg-slate-900/60"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <img
                          src={evt.bannerUrl || 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=200&fit=crop'}
                          alt={evt.title}
                          className="h-16 w-20 rounded-xl object-cover ring-1 ring-slate-700 shrink-0"
                        />
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <Badge variant="status" type={evt.status}>
                              {evt.status}
                            </Badge>
                            <Badge variant="category" type={evt.category}>
                              {evt.category}
                            </Badge>
                          </div>
                          <h3 className="text-base font-bold text-white leading-snug">{evt.title}</h3>
                          <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-brand-400" />
                              {evt.date}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-indigo-400" />
                              {evt.venue}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 sm:min-w-[140px] border-t sm:border-t-0 border-slate-800/60 pt-3 sm:pt-0">
                        <div className="w-full sm:text-right">
                          <div className="flex items-center justify-between sm:justify-end gap-2 text-xs">
                            <span className="text-slate-400">Capacity:</span>
                            <span className="font-bold text-slate-200">
                              {evt.registeredCount || 0} / {evt.maxCapacity} ({fillPercent}%)
                            </span>
                          </div>
                          <div className="mt-1.5 h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-indigo-500 transition-all duration-500"
                              style={{ width: `${fillPercent}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                          <Link
                            to={`/organizer/events/${evt._id}`}
                            className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
                          >
                            Details
                          </Link>
                          <Link
                            to={`/organizer/events/${evt._id}/registrations`}
                            className="rounded-lg bg-brand-600/20 border border-brand-500/30 px-3 py-1.5 text-xs font-semibold text-brand-300 hover:bg-brand-600/40 transition-colors"
                          >
                            Participants
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center bg-slate-900/30">
                <Calendar className="mx-auto h-8 w-8 text-slate-600" />
                <p className="mt-2 text-sm font-semibold text-slate-400">No events created yet.</p>
                <Link
                  to="/organizer/events/new"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white hover:bg-brand-500"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Your First Event</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Recent Registrations & Categories */}
        <div className="space-y-6">
          {/* Recent Registrations Card */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Ticket className="h-5 w-5 text-brand-400" />
                <h3 className="font-bold text-white">Recent Registrations</h3>
              </div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Live</span>
            </div>

            <div className="space-y-3.5">
              {stats?.recentRegistrations && stats.recentRegistrations.length > 0 ? (
                stats.recentRegistrations.map((reg) => (
                  <div
                    key={reg._id}
                    className="flex items-start justify-between gap-3 rounded-xl bg-slate-950/60 p-3 border border-slate-800/80"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-white">{reg.participantName}</p>
                      <p className="truncate text-[11px] text-slate-400">{reg.participantEmail}</p>
                      <p className="truncate text-[10px] text-brand-400/90 mt-0.5">{reg.eventTitle}</p>
                    </div>
                    <Badge variant="status" type={reg.status} size="xs">
                      {reg.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="py-6 text-center text-xs text-slate-500">No recent registrations.</p>
              )}
            </div>
          </div>

          {/* Category Distribution */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-xl">
            <h3 className="font-bold text-white mb-4">Event Categories</h3>
            <div className="space-y-3">
              {stats?.categoryDistribution && stats.categoryDistribution.length > 0 ? (
                stats.categoryDistribution.map((cat) => (
                  <div key={cat.name} className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">{cat.name}</span>
                    <span className="rounded-md bg-slate-800 px-2 py-0.5 font-bold text-brand-300 border border-slate-700">
                      {cat.count} {cat.count === 1 ? 'event' : 'events'}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500">No categories active.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
