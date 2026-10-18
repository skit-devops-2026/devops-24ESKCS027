pipeline {
    agent any

    environment {
        APP_NAME = 'eventhive'
        IMAGE_TAG = "${BUILD_NUMBER}"
        PORT = '5000'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Environment Setup') {
            steps {
                script {
                    echo "Starting EventHive CI/CD Pipeline Build #${env.BUILD_NUMBER}"
                    if (isUnix()) {
                        sh 'node --version || true'
                        sh 'npm --version || true'
                    } else {
                        bat 'node --version'
                        bat 'npm --version'
                    }
                }
            }
        }

        stage('Install Dependencies') {
            steps {
                script {
                    if (isUnix()) {
                        sh 'npm ci'
                    } else {
                        bat 'npm ci'
                    }
                }
            }
        }

        stage('Run Tests') {
            steps {
                script {
                    if (isUnix()) {
                        sh 'npm test'
                    } else {
                        bat 'npm test'
                    }
                }
            }
        }

        stage('Build') {
            steps {
                script {
                    if (isUnix()) {
                        sh 'npm run build --if-present'
                    } else {
                        bat 'npm run build --if-present'
                    }
                }
            }
        }

        stage('Docker Build') {
            steps {
                script {
                    echo "Building Docker image ${env.APP_NAME}:${env.IMAGE_TAG}..."
                    if (isUnix()) {
                        sh "docker build -t ${env.APP_NAME}:${env.IMAGE_TAG} -t ${env.APP_NAME}:latest ."
                    } else {
                        bat "docker build -t %APP_NAME%:%IMAGE_TAG% -t %APP_NAME%:latest ."
                    }
                }
            }
        }

        stage('Docker Smoke Test') {
            steps {
                script {
                    echo "Verifying Docker container health..."
                    if (isUnix()) {
                        sh """
                            docker run -d --name eventhive-ci-test -p 5098:5000 ${env.APP_NAME}:${env.IMAGE_TAG}
                            sleep 5
                            curl -s -f http://localhost:5098/health || (docker logs eventhive-ci-test && exit 1)
                            docker stop eventhive-ci-test && docker rm eventhive-ci-test
                        """
                    } else {
                        bat """
                            docker run -d --name eventhive-ci-test -p 5098:5000 %APP_NAME%:%IMAGE_TAG%
                            timeout /t 5 /nobreak
                            curl -s -f http://localhost:5098/health
                            docker stop eventhive-ci-test
                            docker rm eventhive-ci-test
                        """
                    }
                }
            }
        }

        stage('Kubernetes Validation') {
            steps {
                script {
                    echo "Validating Kubernetes manifests..."
                    if (isUnix()) {
                        sh 'kubectl kustomize k8s/'
                    } else {
                        bat 'kubectl kustomize k8s/'
                    }
                }
            }
        }

        stage('Verification') {
            steps {
                echo 'EventHive build, tests, containerization, and deployment validation succeeded.'
            }
        }
    }

    post {
        always {
            script {
                // Ensure no dangling test containers remain
                if (isUnix()) {
                    sh 'docker rm -f eventhive-ci-test 2>/dev/null || true'
                } else {
                    bat 'docker rm -f eventhive-ci-test 2>nul || ver >nul'
                }
            }
        }
        success {
            echo '============================================================'
            echo " EventHive Jenkins Pipeline #${env.BUILD_NUMBER} Completed Successfully!"
            echo '============================================================'
        }
        failure {
            echo '============================================================'
            echo " EventHive Jenkins Pipeline #${env.BUILD_NUMBER} Failed."
            echo '============================================================'
        }
    }
}