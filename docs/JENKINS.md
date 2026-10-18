# Jenkins Pipeline

EventHive uses Jenkins for local CI/CD automation and pipeline verification.

## Prerequisites & Agent Requirements

Before configuring the pipeline job on your Jenkins controller or node:
- **Node.js:** Node.js v20+ installed and available on `PATH`.
- **npm:** npm v9+ installed.
- **Git:** Git client installed to allow SCM checkouts.

## Pipeline Stages

The `Jenkinsfile` defines these sequential declarative stages:

1. **Checkout:** Retrieves the EventHive source code from the repository.
2. **Install Dependencies:** Runs clean dependency installation via `npm ci`.
3. **Run Tests:** Executes automated test suite via `npm test`.
4. **Build:** Runs `npm run build --if-present` to build frontend and production bundles.

> **Note on Agent Environment:**
> The default `Jenkinsfile` uses Windows batch steps (`bat 'npm ...'`). For Linux or macOS build agents, replace `bat` with `sh`.

## Jenkins Job Configuration

1. Create a **Pipeline** job in the Jenkins Dashboard.
2. Under **Pipeline Definition**, select **Pipeline script from SCM**.
3. Choose **Git** as the SCM and supply the repository URL.
4. Set the script path to `Jenkinsfile` and save the configuration.

## Local Jenkins Verification

The Jenkins pipeline is intended to be demonstrated on the local Jenkins installation during the DevOps assessment.

A successful build verifies:
- [x] SCM checkout succeeded
- [x] Node dependencies installed cleanly without conflicts
- [x] Automated test suites passed (API and College Workflow checks)
- [x] Build validation completed
- [x] Overall build status: **SUCCESS**

