package middleware

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/smartcity/proxy-service/database"
	"github.com/smartcity/proxy-service/models"
	"github.com/smartcity/proxy-service/utils"
)

// AuthMiddleware handles token authentication for POST requests
type AuthMiddleware struct {
	db           *database.MongoDB
	queryTimeout time.Duration
}

// NewAuthMiddleware creates a new authentication middleware
func NewAuthMiddleware(db *database.MongoDB, queryTimeout time.Duration) *AuthMiddleware {
	return &AuthMiddleware{
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
		// log.Printf("POST request without Authorization header: path=%s", r.URL.Path)
		utils.WriteJSONError(w, http.StatusUnauthorized, "Missing authorization header")
		return false
	}

	// Parse "Bearer <token>" format
	parts := strings.Fields(authHeader)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		// log.Printf("Invalid Authorization header format: path=%s", r.URL.Path)
		utils.WriteJSONError(w, http.StatusUnauthorized, "Invalid authorization header format")
		return false
	}

	tokenString := parts[1]

	// Read and validate entity ID from request body
	body, err := io.ReadAll(r.Body)
	if err != nil {
		// log.Printf("Failed to read request body: path=%s error=%v", r.URL.Path, err)
		utils.WriteJSONError(w, http.StatusBadRequest, "Failed to read request body")
		return false
	}
	r.Body = io.NopCloser(bytes.NewBuffer(body))

	// Parse the NGSI-LD entity to extract the ID
	var entity models.NGSILDEntity
	if err := json.Unmarshal(body, &entity); err != nil {
		// log.Printf("Failed to parse NGSI-LD entity: path=%s error=%v", r.URL.Path, err)
		utils.WriteJSONError(w, http.StatusBadRequest, "Invalid NGSI-LD entity format")
		return false
	}

	if entity.ID == "" {
		// log.Printf("Missing entity ID in request: path=%s", r.URL.Path)
		utils.WriteJSONError(w, http.StatusBadRequest, "Entity ID is required")
		return false
	}

	// Validate token AND entity_id in a single DB query (count > 0 means both match)
	dbCtx2, dbCancel2 := context.WithTimeout(r.Context(), m.queryTimeout)
	defer dbCancel2()

	// log.Printf("Validating token and entity access: entity_id=%s", entity.ID)
	if err := m.db.ValidateTokenAndEntity(dbCtx2, tokenString, entity.ID); err != nil {
		// log.Printf("Validation failed: path=%s entity=%s error=%v", r.URL.Path, entity.ID, err)
		utils.WriteJSONError(w, http.StatusForbidden, "Access denied: Invalid token or unauthorized entity")
		return false
	}

	// Token and entity are valid
	// log.Printf("✓ Validation successful: path=%s entity=%s", r.URL.Path, entity.ID)
	r.Header.Set("X-Token-Validated", "true")
	return true
}
