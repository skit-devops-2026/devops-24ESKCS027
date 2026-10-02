# EVENTHIVE

## Author

| Roll No. | Name | GitHub username |
|---|---|---|
| 24ESKCS027 | Ajay Bairwa | AJAYlodhy |

## About

EventHive is a comprehensive college event management platform designed to streamline campus events, registration, and governance. It provides dedicated workflows for students to discover and register for activities, faculty coordinators to propose and manage events, and department heads (HOD) to review schedules and prevent venue conflicts.

### Key Capabilities
- **Event Discovery & Registration:** Single-college access control with registration tracking.
- **Multi-Level Approval Pipeline:** Coordinator submission -> Faculty review -> HOD approval.
- **Conflict Detection:** Automated schedule and venue conflict warnings.
- **Role-Based Portals:** Admin / HOD dashboard, student views, and organizer controls.

## Tech Stack

- **Backend:** Node.js, Express.js
- **Templating & Frontend:** EJS, HTML5, Vanilla CSS, React (Organizer Portal)
- **Data Persistence:** In-memory & JSON-backed data store with MongoDB integration support
- **Testing:** Node.js built-in test runner (`node --test`)
- **DevOps & Containers:** Docker, GitHub Actions CI, Jenkins

## Project Structure

```text
├── backend/            # Express API server, routes, and data models
├── frontend/           # React + Vite organizer portal
├── src/                # Admin controllers, middleware, and EJS views
│   ├── controllers/    # Request handlers for admin and approvals
│   ├── middleware/     # Authentication and session handling
│   ├── routes/         # Admin routing definitions
│   └── views/          # EJS templates for the administrative panel
├── public/             # Static assets (CSS stylesheets, client JS)
├── test/               # Health check and integration test suites
├── scripts/            # Repository hygiene and verification scripts
├── docs/               # Architecture and pipeline documentation
├── Dockerfile          # Production container specification
└── Makefile            # Common build and execution targets
```

## Getting Started

### Prerequisites
- Node.js (v20 or higher recommended)
- npm (v9 or higher)

### Installation

Install root and backend dependencies:
```bash
npm install
# or using Makefile
make install
```

### Running Locally

Start the EventHive server:
```bash
npm start
# or using Makefile
make run
```
Access the application at `http://localhost:5000` (Admin panel at `/admin/dashboard`).

### Running Tests

Execute the automated test suite:
```bash
npm test
# or using Makefile
make test
```

## DevOps Workflow

EventHive uses automated CI/CD pipelines:
- **GitHub Actions:** Automatically runs repository hygiene checks, dependency installation, tests, and Docker image builds on pushes and pull requests.
- **Jenkins:** Supports local automation via the included `Jenkinsfile`.