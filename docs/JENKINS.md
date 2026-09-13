# Jenkins Pipeline

EventHive uses Jenkins for local CI/CD automation.

## Pipeline Stages

The `Jenkinsfile` defines these stages:

1. Checkout - retrieves the EventHive source code.
2. Install Dependencies - runs `npm ci`.
3. Run Tests - runs `npm test`.
4. Build - runs `npm run build --if-present`.

## Jenkins Job Configuration

Create a Pipeline job in Jenkins and configure it to use the `Jenkinsfile` from the GitHub repository.

The pipeline should execute the stages in order and report the build as successful when all stages complete without errors.

## Local Jenkins Verification

The Jenkins pipeline is intended to be demonstrated on the local Jenkins installation during the DevOps viva.

A successful build should show:

- Checkout completed
- Dependencies installed
- Tests passed
- Build stage completed
- Overall build status: SUCCESS
