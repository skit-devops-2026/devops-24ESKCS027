# EVENTHIVE

## Author

| Roll No. | Name | GitHub username |
|---|---|---|
| 24ESKCS027 | Ajay Bairwa | AJAYlodhy |

## About

EventHive is a college event management platform that helps students discover and register for events. It also provides organizer and admin modules for managing events, students, registrations, and related activities.

## Tech stack

- Frontend: EJS / HTML / CSS / JavaScript
- Backend: Node.js / Express.js
- Database: Mock data / TBD

## Running locally

```bash
make install
make run

## DevOps Workflow

EventHive uses GitHub Actions for automated build and test validation.

The CI workflow runs on pushes and pull requests and performs:
- Repository hygiene checks
- Dependency installation
- Automated tests
- Project build validation

Docker image builds are also automated through the CI workflow.