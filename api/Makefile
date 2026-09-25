dev:
	./gradlew bootstrap:bootRun

up:
	docker compose up -d

down:
	docker compose down

clear:
	-docker stop $$(docker ps -q)
	-docker rm $$(docker ps -a -q)
	docker network prune -f
	docker volume prune -f
	docker image prune -a -f
	docker builder prune -a -f