const store = require('../models/store');

// @desc    Get organizer dashboard overview metrics
// @route   GET /api/organizer/dashboard/stats
// @access  Private (Organizer)
const getDashboardStats = async (req, res) => {
  try {
    const organizerId = req.user._id;
    const stats = store.getDashboardStats(organizerId);

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message,
    });
  }
};

// @desc    Get all events created by logged-in organizer
// @route   GET /api/organizer/events
// @access  Private (Organizer)
const getOrganizerEvents = async (req, res) => {
  try {
    const organizerId = req.user._id;
    const { search, status, category, page = 1, limit = 10 } = req.query;

    const result = store.getEventsByOrganizer(organizerId, {
      search,
      status,
      category,
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      data: result.events,
      pagination: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        limit: Number(limit),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch organizer events',
      error: error.message,
    });
  }
};

// @desc    Get single event by ID (must belong to organizer)
// @route   GET /api/organizer/events/:id
// @access  Private (Organizer)
const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const event = store.getEventById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.',
      });
    }

    if (event.organizerId !== req.user._id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to view this event.',
      });
    }

    // Attach registration preview info
    const registrations = store.getRegistrationsForEvent(id);
    const enrichedEvent = {
      ...event,
      registrationsSummary: {
        total: registrations.length,
        attended: registrations.filter(r => r.status === 'Attended').length,
        confirmed: registrations.filter(r => r.status === 'Confirmed').length,
        pending: registrations.filter(r => r.status === 'Pending').length,
      },
    };

    return res.status(200).json({
      success: true,
      data: enrichedEvent,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch event details',
      error: error.message,
    });
  }
};

// @desc    Create a new event
// @route   POST /api/organizer/events
// @access  Private (Organizer)
const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      date,
      startTime,
      endTime,
      venue,
      locationType = 'In-Person',
      maxCapacity,
      bannerUrl,
      registrationDeadline,
      contactEmail,
      contactPhone,
      status = 'Published',
      tags = [],
      price = 0,
    } = req.body;

    // Validation
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Event title is required.' });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, message: 'Event description is required.' });
    }
    if (!date) {
      return res.status(400).json({ success: false, message: 'Event date is required.' });
    }
    if (!startTime || !endTime) {
      return res.status(400).json({ success: false, message: 'Start and End times are required.' });
    }
    if (!venue || !venue.trim()) {
      return res.status(400).json({ success: false, message: 'Venue / Location is required.' });
    }
    if (!maxCapacity || Number(maxCapacity) <= 0) {
      return res.status(400).json({ success: false, message: 'Maximum capacity must be greater than 0.' });
    }
    if (!registrationDeadline) {
      return res.status(400).json({ success: false, message: 'Registration deadline is required.' });
    }
    if (!contactEmail || !contactEmail.includes('@')) {
      return res.status(400).json({ success: false, message: 'Valid contact email is required.' });
    }

    // Default banners based on category
    const defaultBanners = {
      'Tech & Coding': 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&h=600&fit=crop',
      'Cultural & Arts': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&h=600&fit=crop',
      'Sports & Fitness': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&h=600&fit=crop',
      'Workshops & Training': 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&h=600&fit=crop',
      'Seminars & Talks': 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&h=600&fit=crop',
      'Gaming & E-Sports': 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&h=600&fit=crop',
      'Networking': 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&h=600&fit=crop',
    };

    const finalBanner = bannerUrl && bannerUrl.trim() ? bannerUrl : (defaultBanners[category] || defaultBanners['Tech & Coding']);

    const newEvent = store.createEvent(req.user, {
      title: title.trim(),
      description: description.trim(),
      category: category || 'Tech & Coding',
      date,
      startTime,
      endTime,
      venue: venue.trim(),
      locationType,
      maxCapacity: Number(maxCapacity),
      bannerUrl: finalBanner,
      registrationDeadline,
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone ? contactPhone.trim() : req.user.phone || '',
      status: ['Draft', 'Published', 'Ongoing', 'Completed', 'Cancelled'].includes(status) ? status : 'Published',
      tags: Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      price: Number(price) || 0,
    });

    return res.status(201).json({
      success: true,
      message: 'Event created successfully!',
      data: newEvent,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create event',
      error: error.message,
    });
  }
};

// @desc    Update an existing event
// @route   PUT /api/organizer/events/:id
// @access  Private (Organizer)
const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = store.getEventById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.',
      });
    }

    if (event.organizerId !== req.user._id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot modify an event created by another organizer.',
      });
    }

    const {
      title,
      description,
      category,
      date,
      startTime,
      endTime,
      venue,
      locationType,
      maxCapacity,
      bannerUrl,
      registrationDeadline,
      contactEmail,
      contactPhone,
      status,
      tags,
      price,
    } = req.body;

    const updates = {};
    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description.trim();
    if (category !== undefined) updates.category = category;
    if (date !== undefined) updates.date = date;
    if (startTime !== undefined) updates.startTime = startTime;
    if (endTime !== undefined) updates.endTime = endTime;
    if (venue !== undefined) updates.venue = venue.trim();
    if (locationType !== undefined) updates.locationType = locationType;
    if (maxCapacity !== undefined) updates.maxCapacity = Number(maxCapacity);
    if (bannerUrl !== undefined) updates.bannerUrl = bannerUrl;
    if (registrationDeadline !== undefined) updates.registrationDeadline = registrationDeadline;
    if (contactEmail !== undefined) updates.contactEmail = contactEmail.trim();
    if (contactPhone !== undefined) updates.contactPhone = contactPhone.trim();
    if (status !== undefined) updates.status = status;
    if (price !== undefined) updates.price = Number(price);
    if (tags !== undefined) {
      updates.tags = Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    }

    const updated = store.updateEvent(id, req.user._id, updates);

    return res.status(200).json({
      success: true,
      message: 'Event updated successfully!',
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update event',
      error: error.message,
    });
  }
};

// @desc    Delete an event
// @route   DELETE /api/organizer/events/:id
// @access  Private (Organizer)
const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = store.getEventById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.',
      });
    }

    if (event.organizerId !== req.user._id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot delete an event created by another organizer.',
      });
    }

    const success = store.deleteEvent(id, req.user._id);

    return res.status(200).json({
      success,
      message: 'Event deleted successfully along with associated registration records.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete event',
      error: error.message,
    });
  }
};

// @desc    Change event status (Quick update)
// @route   PATCH /api/organizer/events/:id/status
// @access  Private (Organizer)
const updateEventStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Draft', 'Published', 'Ongoing', 'Completed', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const event = store.getEventById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    if (event.organizerId !== req.user._id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot update status of an event created by another organizer.',
      });
    }

    const updated = store.updateEventStatus(id, req.user._id, status);

    return res.status(200).json({
      success: true,
      message: `Event status updated to ${status}`,
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update event status',
      error: error.message,
    });
  }
};

// @desc    Get registrations for a specific event
// @route   GET /api/organizer/events/:id/registrations
// @access  Private (Organizer)
const getEventRegistrations = async (req, res) => {
  try {
    const { id } = req.params;
    const { search, status } = req.query;

    const event = store.getEventById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    if (event.organizerId !== req.user._id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot view registrations for another organizer’s event.',
      });
    }

    const registrations = store.getRegistrationsForEvent(id, { search, status });

    const total = registrations.length;
    const attended = registrations.filter(r => r.status === 'Attended').length;
    const confirmed = registrations.filter(r => r.status === 'Confirmed').length;
    const pending = registrations.filter(r => r.status === 'Pending').length;
    const cancelled = registrations.filter(r => r.status === 'Cancelled').length;

    return res.status(200).json({
      success: true,
      event: {
        _id: event._id,
        title: event.title,
        date: event.date,
        maxCapacity: event.maxCapacity,
        registeredCount: event.registeredCount,
      },
      data: registrations,
      stats: {
        total,
        attended,
        confirmed,
        pending,
        cancelled,
        attendanceRate: total > 0 ? Math.round((attended / total) * 100) : 0,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch event registrations',
      error: error.message,
    });
  }
};

// @desc    Update a participant registration status
// @route   PATCH /api/organizer/events/:id/registrations/:regId
// @access  Private (Organizer)
const updateRegistrationStatus = async (req, res) => {
  try {
    const { id, regId } = req.params;
    const { status } = req.body;

    const validStatuses = ['Confirmed', 'Pending', 'Attended', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid registration status. Allowed: ${validStatuses.join(', ')}`,
      });
    }

    const event = store.getEventById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    if (event.organizerId !== req.user._id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot modify registrations for another organizer’s event.',
      });
    }

    const updated = store.updateRegistrationStatus(regId, status);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Registration record not found.' });
    }

    return res.status(200).json({
      success: true,
      message: `Registration marked as ${status}`,
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update registration status',
      error: error.message,
    });
  }
};

// @desc    Get organizer profile
// @route   GET /api/organizer/profile
// @access  Private (Organizer)
const getProfile = async (req, res) => {
  try {
    const user = store.findUserById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Organizer profile not found.' });
    }

    return res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization,
        phone: user.phone,
        bio: user.bio,
        avatar: user.avatar,
        website: user.website,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch organizer profile',
      error: error.message,
    });
  }
};

// @desc    Update organizer profile
// @route   PUT /api/organizer/profile
// @access  Private (Organizer)
const updateProfile = async (req, res) => {
  try {
    const { name, organization, phone, bio, avatar, website } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (organization !== undefined) updates.organization = organization.trim();
    if (phone !== undefined) updates.phone = phone.trim();
    if (bio !== undefined) updates.bio = bio.trim();
    if (avatar !== undefined) updates.avatar = avatar.trim();
    if (website !== undefined) updates.website = website.trim();

    const updatedUser = store.updateUser(req.user._id, updates);

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      data: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        organization: updatedUser.organization,
        phone: updatedUser.phone,
        bio: updatedUser.bio,
        avatar: updatedUser.avatar,
        website: updatedUser.website,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update organizer profile',
      error: error.message,
    });
  }
};

module.exports = {
  getDashboardStats,
  getOrganizerEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  updateEventStatus,
  getEventRegistrations,
  updateRegistrationStatus,
  getProfile,
  updateProfile,
};
