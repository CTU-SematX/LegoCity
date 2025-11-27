package middleware

import (
	"log"
	"net/http"
	"strings"
)

// CORSMiddleware handles Cross-Origin Resource Sharing
type CORSMiddleware struct {
	dashboardOrigin string
}

// NewCORSMiddleware creates a new CORS middleware
func NewCORSMiddleware(dashboardOrigin string) *CORSMiddleware {
	return &CORSMiddleware{
		dashboardOrigin: dashboardOrigin,
	}
}

// Handler wraps an http.Handler with CORS support
func (c *CORSMiddleware) Handler(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")

		// --- Dashboard Rules (Allow Everything) ---
		if origin == c.dashboardOrigin {
			log.Printf("CORS: Dashboard origin detected - allowing all methods: %s %s", r.Method, r.URL.Path)
			w.Header().Set("Access-Control-Allow-Origin", c.dashboardOrigin)
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			w.Header().Set("Access-Control-Allow-Credentials", "true")

			// Preflight
			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}

			next.ServeHTTP(w, r)
			return
		}

		// --- All Other Origins (Only PUT & PATCH) ---
		if origin != "" {
			log.Printf("CORS: External origin detected - only PUT/PATCH allowed: %s %s from %s", r.Method, r.URL.Path, origin)
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Methods", "PUT, PATCH, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, Link")

			// Block disallowed methods early
			if !c.isAllowedMethod(r.Method) {
				log.Printf("CORS: Method %s not allowed for external origin %s", r.Method, origin)
				http.Error(w, "Method not allowed by CORS for this origin", http.StatusForbidden)
				return
			}

			// Preflight
			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}
		}

		next.ServeHTTP(w, r)
	})
}

// isAllowedMethod checks if the HTTP method is allowed for non-dashboard origins
// Only PUT and PATCH allowed for non-dashboard origins
func (c *CORSMiddleware) isAllowedMethod(method string) bool {
	allowed := []string{"PUT", "PATCH", "OPTIONS"}
	method = strings.ToUpper(method)
	for _, m := range allowed {
		if method == m {
			return true
		}
	}
	return false
}
