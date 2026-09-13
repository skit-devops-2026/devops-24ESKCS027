.PHONY: install test build run docker-build docker-up

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