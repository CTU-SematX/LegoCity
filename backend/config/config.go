package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	ServerPort    string
	WeatherAPIKey string
	AirAPIKey     string
	ReleaseMode   bool
}

func Load() *Config {
	// Load .env file if it exists
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	config := &Config{
		ServerPort:    getEnv("SERVER_PORT", ":8080"),
		WeatherAPIKey: getEnv("OPENWEATHER_API_KEY", ""),
		AirAPIKey:     getEnv("OPENAIR_API_KEY", ""),
		ReleaseMode:   getEnv("GIN_MODE", "release") == "release",
	}

	return config
}

func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
