package auth

import (
	"errors"
	"fmt"

	"github.com/golang-jwt/jwt/v5"
	"github.com/smartcity/proxy-service/models"
)

// JWTValidator handles JWT token validation
type JWTValidator struct {
	secret []byte
}

// NewJWTValidator creates a new JWT validator
func NewJWTValidator(secret []byte) *JWTValidator {
	return &JWTValidator{
		secret: secret,
	}
}

// ValidateToken validates a JWT token signed with HMAC-SHA256
// It verifies the signature and checks the expiration claim
func (v *JWTValidator) ValidateToken(tokenStr string) (*models.CustomClaims, error) {
	if tokenStr == "" {
		return nil, errors.New("empty token")
	}

	// Parse token with custom claims
	claims := &models.CustomClaims{}
	token, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
		// Verify signing method is HMAC
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Method.Alg())
		}
		return v.secret, nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to parse token: %w", err)
	}

	if !token.Valid {
		return nil, errors.New("invalid token")
	}

	return claims, nil
}
