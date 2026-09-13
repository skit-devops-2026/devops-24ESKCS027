import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchApi, getAuthToken, setAuthToken } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth from token
  useEffect(() => {
    const initAuth = async () => {
      const token = getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await fetchApi('/auth/me');
        if (data.success && data.user) {
          setUser(data.user);
        } else {
          setAuthToken(null);
          setUser(null);
        }
      } catch (err) {
        console.warn('Auth token validation failed:', err);
        setAuthToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const data = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (data.success) {
        setAuthToken(data.token);
        setUser(data.user);
        return data.user;
      }
      throw new Error(data.message || 'Login failed');
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const demoLogin = async (email = 'alex.organizer@eventhive.com') => {
    setError(null);
    try {
      const data = await fetchApi('/auth/demo-organizer', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      if (data.success) {
        setAuthToken(data.token);
        setUser(data.user);
        return data.user;
      }
      throw new Error(data.message || 'Demo login failed');
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const registerOrganizer = async (userData) => {
    setError(null);
    try {
      const data = await fetchApi('/auth/register-organizer', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      if (data.success) {
        setAuthToken(data.token);
        setUser(data.user);
        return data.user;
      }
      throw new Error(data.message || 'Registration failed');
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateUserProfile = (updatedUser) => {
    setUser((prev) => ({ ...prev, ...updatedUser }));
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        demoLogin,
        registerOrganizer,
        updateUserProfile,
        logout,
        isAuthenticated: !!user,
        isOrganizer: user?.role === 'organizer' || user?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
