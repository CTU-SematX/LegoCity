# LegoCity - Smart City Platform
# @version 1.0
# @author CTU·SematX
# @copyright (c) 2025 CTU·SematX. All rights reserved
# @license MIT License
# @see https://github.com/CTU-SematX/LegoCity The LegoCity GitHub project

FROM oven/bun:1 AS base
WORKDIR /app

FROM base AS install
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile || bun install

FROM base AS release
COPY --from=install /app/node_modules node_modules
COPY . .

EXPOSE 8003
CMD ["bun", "run", "src/index.ts"]
