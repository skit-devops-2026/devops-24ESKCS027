# EventHive — Organizer / Host Module Documentation

## 1. Overview
The **Organizer / Host Module** enables event organizers to manage their full event lifecycle on the EventHive platform. It provides a dedicated workspace to create events, monitor live attendee registrations, manage event schedules and capacities, check in participants, and update host profile information.

This module is designed strictly following modular architecture guidelines to allow seamless parallel development and integration with Student and Admin modules.

---

## 2. Key Features

### 1. Organizer Dashboard (`/organizer/dashboard`)
- **Key Metrics**: Total Events Created, Upcoming Events, Completed Events, Total Registrations, Attendance Check-in Rate.
- **Quick Action Triggers**: Instant buttons to "Create New Event" and "Manage Events".
- **Upcoming Spotlight**: Live event cards displaying date, time, venue, status badges, and animated capacity utilization progress bars.
- **Real-Time Registration Feed**: Displays the latest registered participants, ticket codes, and confirmation statuses.
- **Category Distribution**: Breakdown of events across technical, cultural, esports, and workshop categories.

### 2. Create Event (`/organizer/events/new`)
- Form inputs for:
  - Event title & detailed description
  - Category selection (*Tech & Coding, Cultural & Arts, Sports & Fitness, Workshops & Training, Seminars & Talks, Gaming & E-Sports, Networking, Other*)
  - Schedule: Date, Start Time, End Time
  - Location: Venue, Location Type (*In-Person, Online, Hybrid*)
  - Capacity: Maximum attendee seats & Registration deadline
  - Media: Custom Banner URL input or 1-click Preset Banner Gallery
  - Contact Details: Contact Email & Phone
  - Price / Free tag & topic keywords
- **Interactive Live Preview Card**: Dynamically updates in real-time as the organizer types form inputs.
- Draft vs. Published toggle.

### 3. Manage Events (`/organizer/events`)
- Multi-filter tab bar: *All, Published, Draft, Ongoing, Completed, Cancelled*.
- Real-time search query matching event title, venue, and keywords.
- Category filtering dropdown.
- Dual layout mode: **Grid Cards View** and **Tabular View**.
- Quick Status Change dropdown per event with immediate database synchronization.
- Actions: View Event Details, Edit Event, Delete Event (with confirmation modal).

### 4. Event Details (`/organizer/events/:id`)
- Hero banner with category/status tags and quick status changer.
- Detailed event description, venue information, and keyword tags.
- Capacity utilization tracker with remaining seat count.
- Direct entry point to manage attendees & registrations for the event.
- One-click "Share Event Link" with clipboard copy confirmation.

### 5. Event Registration & Attendance Management (`/organizer/events/:id/registrations`)
- Participant roster table showing:
  - Participant Name & Email
  - Student ID & Phone number
  - Unique Ticket Code (e.g., `EH-DS26-98101`)
  - Registration Timestamp
  - Status Badge (*Confirmed, Attended, Pending, Cancelled*)
- **Attendance Check-In**: 1-click "Mark Attended" button for on-site registration desks.
- **Participant Search & Status Filters**: Search by student name, email, student ID, or ticket code.
- **CSV Export**: Instant download of formatted `.csv` participant roster for offline verification.

### 6. Organizer Profile (`/organizer/profile`)
- View host details: Name, Email, Organization/Student Chapter, Phone, Bio, Website, Avatar.
- Edit profile form with instant avatar preview and live context update.

---

## 3. Architecture & Data Flow

```
┌────────────────────────────────────────────────────────┐
│               Frontend (React 18 + Vite)               │
│                                                        │
│   AuthContext ──> OrganizerService ──> fetchApi        │
│   Pages: Dashboard, CreateEvent, ManageEvents,         │
│          EventDetails, EventRegistrations, Profile     │
└───────────────────────────┬────────────────────────────┘
                            │ (JSON REST API via JWT)
┌───────────────────────────▼────────────────────────────┐
│              Backend (Express.js Server)               │
│                                                        │
│   Routes:        /api/auth/*     /api/organizer/*      │
│   Middleware:    protect, requireOrganizer             │
│   Controllers:   authController, organizerController   │
│   Storage:       Dual Mode (Mongoose / In-Memory Store)│
└────────────────────────────────────────────────────────┘
```

---

## 4. API Reference

All organizer endpoints require the `Authorization: Bearer <JWT_TOKEN>` header.

### Authentication Endpoints (`/api/auth`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/login` | Authenticate with email & password | Public |
| `POST` | `/api/auth/demo-organizer` | Instant 1-click demo login | Public |
| `POST` | `/api/auth/register-organizer` | Register a new organizer account | Public |
| `GET` | `/api/auth/me` | Retrieve authenticated user profile | Private |

### Organizer Module Endpoints (`/api/organizer`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/organizer/dashboard/stats` | Summary counts, upcoming events, recent activity | Organizer |
| `GET` | `/api/organizer/events` | List organizer's events (with `search`, `status`, `category`) | Organizer |
| `POST` | `/api/organizer/events` | Create and publish a new event | Organizer |
| `GET` | `/api/organizer/events/:id` | Get single event details (with ownership check) | Organizer |
| `PUT` | `/api/organizer/events/:id` | Update event information | Organizer |
| `DELETE` | `/api/organizer/events/:id` | Delete event and its registrations | Organizer |
| `PATCH` | `/api/organizer/events/:id/status` | Quick update of event status | Organizer |
| `GET` | `/api/organizer/events/:id/registrations` | Get participant list with summary stats | Organizer |
| `PATCH` | `/api/organizer/events/:id/registrations/:regId` | Update participant status / check-in | Organizer |
| `GET` | `/api/organizer/profile` | Get organizer profile | Organizer |
| `PUT` | `/api/organizer/profile` | Update organizer profile | Organizer |

---

## 5. Security & Authorization Rules
1. **Role Enforcement**: `requireOrganizer` middleware validates that `req.user.role === 'organizer'` (or `admin`).
2. **Ownership Isolation**: Every event query, update, deletion, and participant lookup validates that `event.organizerId === req.user._id`. One organizer cannot view, edit, or delete another organizer's events or attendees.
3. **Password Security**: Passwords are saved with bcrypt hashing.

---

## 6. How to Run and Test

### Backend
```bash
cd backend
npm install
npm start
```
- Backend runs on `http://localhost:5000`
- To run automated test suite:
  ```bash
  npm test
  ```

### Frontend
```bash
cd frontend
npm install
npm run dev
```
- Frontend runs on `http://localhost:3000`
- Open your browser to `http://localhost:3000`
- Click **"Alex Rivera (Tech Lead)"** or **"Sarah Chen (Arts Host)"** for instant demo login.
