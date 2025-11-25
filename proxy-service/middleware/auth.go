package middleware

import (
	"context"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/smartcity/proxy-service/auth"
	"github.com/smartcity/proxy-service/database"
	"github.com/smartcity/proxy-service/utils"
)

// AuthMiddleware handles JWT authentication for POST requests
type AuthMiddleware struct {
	jwtValidator *auth.JWTValidator
	db           *database.MongoDB
	queryTimeout time.Duration
}

// NewAuthMiddleware creates a new authentication middleware
func NewAuthMiddleware(jwtValidator *auth.JWTValidator, db *database.MongoDB, queryTimeout time.Duration) *AuthMiddleware {
	return &AuthMiddleware{
		jwtValidator: jwtValidator,
		db:           db,
		queryTimeout: queryTimeout,
	}
}

// Validate validates the request and returns true if it should proceed
func (m *AuthMiddleware) Validate(w http.ResponseWriter, r *http.Request) bool {
	// Only validate POST requests
	if r.Method != http.MethodPost {
		r.Header.Set("X-Token-Validated", "false")
		return true
	}

	// Extract token from Authorization header
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		log.Printf("POST request without Authorization header: path=%s", r.URL.Path)
		utils.WriteJSONError(w, http.StatusUnauthorized, "Missing authorization header")
		return false
	}

	// Parse "Bearer <token>" format
	parts := strings.Fields(authHeader)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		log.Printf("Invalid Authorization header format: path=%s", r.URL.Path)
		utils.WriteJSONError(w, http.StatusUnauthorized, "Invalid authorization header format")
		return false
	}

	tokenString := parts[1]

	// Verify JWT token (signature + expiration)
	claims, err := m.jwtValidator.ValidateToken(tokenString)
	if err != nil {
		log.Printf("Token validation failed: path=%s error=%v", r.URL.Path, err)
		utils.WriteJSONError(w, http.StatusUnauthorized, "Invalid or expired token")
		return false
	}

	// Check if token exists in MongoDB
	dbCtx, dbCancel := context.WithTimeout(r.Context(), m.queryTimeout)
	defer dbCancel()

	if err := m.db.CheckTokenForUser(dbCtx, tokenString, claims.UserID); err != nil {
		log.Printf("Database token validation failed: path=%s user=%s error=%v", r.URL.Path, claims.UserID, err)
		utils.WriteJSONError(w, http.StatusUnauthorized, "Token not found or does not match")
		return false
	}

	// Token is valid and exists in database
	log.Printf("Token validated successfully: path=%s user=%s", r.URL.Path, claims.UserID)
	r.Header.Set("X-Token-Validated", "true")
	return true
}
