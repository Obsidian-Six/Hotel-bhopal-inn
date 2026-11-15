#!/bin/sh
# Update 4 - stage 1: apply code, keep rollback images, build, test on an isolated staging copy.
# Live containers are NOT restarted by this script.
set -e
cd /var/www/hotel-bhopal-inn/Hotel-bhopal-inn
REPO=https://github.com/Obsidian-Six/Hotel-bhopal-inn.git
git fetch -q "$REPO" deploy/update-4-test
git show FETCH_HEAD:ops/stg-test3.js > /tmp/stg-test3.js
git fetch -q "$REPO" deploy/update-4
git -c user.name=Aadarsh -c user.email=digitalbyaadarsh@gmail.com cherry-pick FETCH_HEAD
for s in backend frontend; do docker tag $(docker inspect -f '{{.Image}}' hotel-bhopal-$s) hotel-bhopal-$s-rollback:pre-u4; done
docker compose build backend frontend > /tmp/u4-build.log 2>&1 || { tail -20 /tmp/u4-build.log; exit 1; }
NEWIMG=$(docker compose config --images backend 2>/dev/null | head -1)
[ -z "$NEWIMG" ] && NEWIMG=hotel-bhopal-inn-backend
echo "built image: $NEWIMG"
docker rm -f hotel-stg-api hotel-stg-mongo >/dev/null 2>&1 || true
docker network create hotel-stg >/dev/null 2>&1 || true
docker run -d --name hotel-stg-mongo --network hotel-stg mongo:7 >/dev/null
sleep 6
docker run -d --name hotel-stg-api --network hotel-stg --env-file backend/.env \
  -e MONGO_URI=mongodb://hotel-stg-mongo:27017/stg -e JWT_SECRET=stg-only-secret-123456 "$NEWIMG" >/dev/null
sleep 8
docker cp /tmp/stg-test3.js hotel-stg-api:/app/stg-test3.js
docker exec hotel-stg-api node stg-test3.js
docker rm -f hotel-stg-api hotel-stg-mongo >/dev/null; docker network rm hotel-stg >/dev/null
echo STAGE1_DONE
