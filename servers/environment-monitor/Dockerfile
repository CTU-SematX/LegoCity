# LegoCity - Smart City Platform
# @version 1.0
# @author CTU·SematX
# @copyright (c) 2025 CTU·SematX. All rights reserved
# @license MIT License
# @see https://github.com/CTU-SematX/LegoCity The LegoCity GitHub project

FROM golang:1.21-bookworm AS builder

WORKDIR /app

# Install build dependencies for sqlite3
RUN apt-get update && apt-get install -y gcc libc6-dev libsqlite3-dev && rm -rf /var/lib/apt/lists/*

COPY go.mod go.sum* ./
RUN go mod download || true

COPY . .
RUN go mod tidy && CGO_ENABLED=1 GOOS=linux go build -o server .

FROM debian:bookworm-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y ca-certificates libsqlite3-0 && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/server .

EXPOSE 8002

CMD ["./server"]
