.PHONY: install test build run docker-build docker-up docker-down k8s-validate

install:
	npm ci

test:
	npm test

build:
	npm run build --if-present

run:
	npm start

docker-build:
	docker build -t eventhive .

docker-up:
	docker compose up --build

docker-down:
	docker compose down

k8s-validate:
	kubectl kustomize k8s/