# LegoCity - Smart City Platform
# @version 1.0
# @author CTU·SematX
# @copyright (c) 2025 CTU·SematX. All rights reserved
# @license MIT License
# @see https://github.com/CTU-SematX/LegoCity The LegoCity GitHub project

FROM openresty/openresty:alpine

RUN apk add --no-cache perl curl openssl git \
    && /usr/local/openresty/bin/opm get SkyLothar/lua-resty-jwt \
    && /usr/local/openresty/bin/opm get jkeys089/lua-resty-hmac

COPY lualib/jwt_verify.lua /usr/local/openresty/site/lualib/jwt_verify.lua
