local _M = {}

local jwt = require "resty.jwt"

local function get_bearer_token()
    local auth_header = ngx.var.http_authorization
    if not auth_header then
        return nil, "missing Authorization header"
    end

    local m, err = ngx.re.match(auth_header, [[^Bearer\s+(.+)$]], "jo")
    if not m then
        return nil, "invalid Authorization header format"
    end

    return m[1], nil
end

function _M.verify_hs256()
    local secret = os.getenv("JWT_SECRET")
    if not secret or secret == "" then
        return false, "JWT_SECRET not set"
    end

    local token, err = get_bearer_token()
    if not token then
        return false, err
    end

    local jwt_obj = jwt:verify(secret, token)

    if not jwt_obj.verified then
        return false, jwt_obj.reason or "jwt not verified"
    end

    return true, nil
end

return _M
