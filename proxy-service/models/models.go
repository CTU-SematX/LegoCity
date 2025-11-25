package models

import "github.com/golang-jwt/jwt/v5"

// ErrorResponse represents a JSON error response
type ErrorResponse struct {
	Error   string `json:"error"`
	Success bool   `json:"success"`
}

// CustomClaims extends JWT claims with user_id
type CustomClaims struct {
	UserID string `json:"user_id"`
	jwt.RegisteredClaims
}

// User represents a user document in MongoDB
type User struct {
	ID    string `bson:"_id"`
	Token string `bson:"token"`
}
