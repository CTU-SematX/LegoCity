## Build for the first time
# docker compose build gateway
docker compose up -d mongo
sleep 2

docker exec -it mongo mongosh --eval 'rs.initiate({
  "_id": "rs",
  "members": [
    {"_id": 0, "host": "mongo:27017"}
  ]
})'


docker compose up -d orion-ld
sleep 2
docker compose up -d gateway