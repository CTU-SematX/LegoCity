package config

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
)

// Config holds all application configuration
type Config struct {
	Port            string
	UpstreamBaseURL string
	MongoURI        string
	MongoDBName     string
	MongoCollection string
	ReadTimeout     int
	WriteTimeout    int
	IdleTimeout     int
	ShutdownTimeout int
	MongoTimeout    int
	DBQueryTimeout  int
}

// Load reads configuration from environment variables
func Load() (*Config, error) {
	// Load .env file if it exists
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	cfg := &Config{
		Port:            getEnvOrDefault("PORT", "8080"),
		UpstreamBaseURL: os.Getenv("UPSTREAM_BASE_URL"),
		MongoURI:        getEnvOrDefault("MONGO_URI", "mongodb://localhost:27017"),
		MongoDBName:     getEnvOrDefault("MONGO_DB_NAME", "smartcity"),
		MongoCollection: getEnvOrDefault("MONGO_COLLECTION", "users"),
		ReadTimeout:     15,
		WriteTimeout:    60,
		IdleTimeout:     120,
		ShutdownTimeout: 15,
		MongoTimeout:    10,
		DBQueryTimeout:  5,
	}

	// Validate required fields
	if cfg.UpstreamBaseURL == "" {
		return nil, fmt.Errorf("UPSTREAM_BASE_URL environment variable is required")
	}

	return cfg, nil
}

func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
