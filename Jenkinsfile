pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                bat 'npm ci'
            }
        }

        stage('Run Tests') {
            steps {
                bat 'npm test'
            }
        }

        stage('Build') {
            steps {
                bat 'npm run build --if-present'
            }
        }
    }

    post {
        success {
            echo 'EventHive Jenkins pipeline completed successfully.'
        }
        failure {
            echo 'EventHive Jenkins pipeline failed.'
        }
    }
}