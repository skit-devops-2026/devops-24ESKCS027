/**
 * EventHive Unified API Client (Student, Coordinator, Host, Admin, External)
 */
const API_BASE_URL = '/api';

export const getAuthToken = () => {
  return localStorage.getItem('eventhive_token') || null;
};

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('eventhive_token', token);
  } else {
    localStorage.removeItem('eventhive_token');
  }
};

export const fetchApi = async (endpoint, options = {}) => {
  const token = getAuthToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  let res;
  try {
    res = await fetch(url, {
      ...options,
      headers,
    });
  } catch (networkError) {
    console.error(`Network Connection Error [${endpoint}]:`, networkError);
    throw new Error(
      'Unable to connect to EventHive backend API. Please make sure the backend server is running on http://localhost:5000.'
    );
  }

  // Safely parse JSON or text response to avoid "Unexpected end of JSON input"
  let data;
  const rawText = await res.text();

  if (rawText && rawText.trim()) {
    try {
      data = JSON.parse(rawText);
    } catch (parseError) {
      console.warn(`Non-JSON response from [${endpoint}]:`, rawText);
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}: ${res.statusText || 'Unknown Error'}`);
      }
      throw new Error('Received non-JSON response from server.');
    }
  } else {
    if (!res.ok) {
      if (res.status === 504 || res.status === 502 || res.status === 503) {
        throw new Error(
          'Backend server is offline or unreachable on port 5000. Please start the backend server with: cd backend && npm start'
        );
      }
      throw new Error(`Request failed with status ${res.status}`);
    }
    data = { success: true };
  }

  if (!res.ok || data.success === false) {
    const errorMsg = data?.message || data?.error || `Request failed with HTTP status ${res.status}`;
    throw new Error(errorMsg);
  }

  return data;
};

// --- Unified API Service Object ---
export const api = {
  // Authentication & Directory
  login: async (email, password) => {
    return await fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  demoLogin: async (role) => {
    return await fetchApi('/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({ role })
    });
  },

  getHosts: async () => {
    return await fetchApi('/hosts');
  },

  // Student Profile
  getProfile: async () => {
    return await fetchApi('/student/profile');
  },

  updateProfile: async (profileData) => {
    return await fetchApi('/student/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  },

  // Student & Coordinator Event Proposals Workflow
  submitEventRequest: async (requestData) => {
    return await fetchApi('/student/event-requests', {
      method: 'POST',
      body: JSON.stringify(requestData)
    });
  },

  getMyEventRequests: async () => {
    return await fetchApi('/student/event-requests');
  },

  // Event Discovery (Public + College-Only)
  getEvents: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return await fetchApi(`/events${query ? `?${query}` : ''}`);
  },

  getEventById: async (id) => {
    return await fetchApi(`/events/${id}`);
  },

  // Registrations (Verified College Student)
  getMyEvents: async () => {
    return await fetchApi('/registrations/my-events');
  },

  registerForEvent: async (eventId) => {
    return await fetchApi('/registrations', {
      method: 'POST',
      body: JSON.stringify({ eventId })
    });
  },

  // External Visitor Registration (Public Events Only)
  externalRegister: async (eventId, { name, email, phone }) => {
    return await fetchApi('/registrations/external', {
      method: 'POST',
      body: JSON.stringify({ eventId, name, email, phone })
    });
  },

  cancelRegistration: async (eventId) => {
    return await fetchApi(`/registrations/${eventId}`, {
      method: 'DELETE'
    });
  },

  // Notifications
  getNotifications: async () => {
    return await fetchApi('/notifications');
  },

  markNotificationsAsRead: async () => {
    return await fetchApi('/notifications/mark-read', {
      method: 'PUT'
    });
  },

  // Coordinator Actions
  getCoordinatorRequests: async () => {
    return await fetchApi('/coordinator/requests');
  },

  createCoordinatorEvent: async (eventData) => {
    return await fetchApi('/coordinator/events', {
      method: 'POST',
      body: JSON.stringify(eventData)
    });
  },

  resubmitCoordinatorEvent: async (eventId, eventData) => {
    return await fetchApi(`/coordinator/events/${eventId}/resubmit`, {
      method: 'POST',
      body: JSON.stringify(eventData)
    });
  },

  assignHostToEvent: async (eventId, hostId, remarks) => {
    return await fetchApi(`/coordinator/events/${eventId}/assign-host`, {
      method: 'POST',
      body: JSON.stringify({ hostId, remarks })
    });
  },

  // Faculty Host Actions
  getHostDashboard: async () => {
    return await fetchApi('/host/dashboard');
  },

  getHostAssignedEvents: async () => {
    return await fetchApi('/host/events');
  },

  checkScheduleConflict: async (conflictPayload) => {
    return await fetchApi('/host/check-conflict', {
      method: 'POST',
      body: JSON.stringify(conflictPayload)
    });
  },

  hostApproveEvent: async (eventId, remarks, overrideConflict = false) => {
    return await fetchApi(`/host/events/${eventId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ remarks, overrideConflict })
    });
  },

  hostRejectEvent: async (eventId, remarks) => {
    return await fetchApi(`/host/events/${eventId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ remarks })
    });
  },

  hostRequestChanges: async (eventId, remarks) => {
    return await fetchApi(`/host/events/${eventId}/request-changes`, {
      method: 'POST',
      body: JSON.stringify({ remarks })
    });
  }
};
