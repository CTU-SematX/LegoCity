package utils

import (
	"encoding/json"
	"net/http"

	"github.com/smartcity/proxy-service/models"
)

// WriteJSONError writes a JSON error response
func WriteJSONError(w http.ResponseWriter, status int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(models.ErrorResponse{
		Error:   msg,
		Success: false,
	})
}
