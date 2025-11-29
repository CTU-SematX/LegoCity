FROM openresty/openresty:alpine

RUN apk add --no-cache perl curl openssl git \
    && /usr/local/openresty/bin/opm get SkyLothar/lua-resty-jwt \
    && /usr/local/openresty/bin/opm get jkeys089/lua-resty-hmac

COPY lualib/jwt_verify.lua /usr/local/openresty/site/lualib/jwt_verify.lua
