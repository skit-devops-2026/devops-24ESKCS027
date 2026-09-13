import { fetchApi } from './api';

export const organizerService = {
  // 1. Dashboard metrics
  getDashboardStats: async () => {
    return await fetchApi('/organizer/dashboard/stats');
  },

  // 2. Events CRUD & Filter
  getEvents: async ({ search = '', status = 'All', category = 'All', page = 1, limit = 12 } = {}) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    if (category) params.append('category', category);
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());

    return await fetchApi(`/organizer/events?${params.toString()}`);
  },

  getEventById: async (id) => {
    return await fetchApi(`/organizer/events/${id}`);
  },

  createEvent: async (eventData) => {
    return await fetchApi('/organizer/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  },

  updateEvent: async (id, eventData) => {
    return await fetchApi(`/organizer/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    });
  },

  deleteEvent: async (id) => {
    return await fetchApi(`/organizer/events/${id}`, {
      method: 'DELETE',
    });
  },

  updateEventStatus: async (id, status) => {
    return await fetchApi(`/organizer/events/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  // 3. Registrations
  getEventRegistrations: async (eventId, { search = '', status = 'All' } = {}) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status) params.append('status', status);

    return await fetchApi(`/organizer/events/${eventId}/registrations?${params.toString()}`);
  },

  updateRegistrationStatus: async (eventId, registrationId, status) => {
    return await fetchApi(`/organizer/events/${eventId}/registrations/${registrationId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  // 4. Profile
  getProfile: async () => {
    return await fetchApi('/organizer/profile');
  },

  updateProfile: async (profileData) => {
    return await fetchApi('/organizer/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },
};
