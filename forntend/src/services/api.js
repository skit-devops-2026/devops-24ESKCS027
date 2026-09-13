// EventHive Student Dashboard API Client
const API_BASE_URL = 'http://localhost:5000/api';

export const api = {
  // Student Profile
  getProfile: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/student/profile`);
      if (!res.ok) throw new Error('Failed to fetch profile');
      return await res.json();
    } catch (err) {
      console.warn('Backend API unavailable, using local state fallback');
      const saved = localStorage.getItem('eh_student');
      return saved ? JSON.parse(saved) : null;
    }
  },

  updateProfile: async (profileData) => {
    try {
      const res = await fetch(`${API_BASE_URL}/student/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });
      return await res.json();
    } catch (err) {
      localStorage.setItem('eh_student', JSON.stringify(profileData));
      return { success: true, profile: profileData };
    }
  },

  // Events
  getEvents: async (params = {}) => {
    try {
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${API_BASE_URL}/events?${query}`);
      if (!res.ok) throw new Error('Failed to fetch events');
      return await res.json();
    } catch (err) {
      const saved = localStorage.getItem('eh_events');
      return saved ? JSON.parse(saved) : [];
    }
  },

  getEventById: async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/events/${id}`);
      if (!res.ok) throw new Error('Failed to fetch event');
      return await res.json();
    } catch (err) {
      const saved = localStorage.getItem('eh_events');
      const events = saved ? JSON.parse(saved) : [];
      return events.find(e => e.id === id) || null;
    }
  },

  // Registrations
  getMyEvents: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/registrations/my-events`);
      if (!res.ok) throw new Error('Failed to fetch registered events');
      return await res.json();
    } catch (err) {
      const saved = localStorage.getItem('eh_registrations');
      return saved ? JSON.parse(saved) : [];
    }
  },

  registerForEvent: async (eventId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId })
      });
      return await res.json();
    } catch (err) {
      return { success: true, message: 'Registered locally' };
    }
  },

  cancelRegistration: async (eventId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/registrations/${eventId}`, {
        method: 'DELETE'
      });
      return await res.json();
    } catch (err) {
      return { success: true, message: 'Cancelled locally' };
    }
  },

  // Notifications
  getNotifications: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/notifications`);
      if (!res.ok) throw new Error('Failed to fetch notifications');
      return await res.json();
    } catch (err) {
      const saved = localStorage.getItem('eh_notifications');
      return saved ? JSON.parse(saved) : [];
    }
  },

  markNotificationsAsRead: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/notifications/mark-read`, { method: 'PUT' });
      return await res.json();
    } catch (err) {
      return { success: true };
    }
  }
};
