package config

import (
	"os"
)

type Config struct {
	ServerPort         string
	WeatherAPIKey      string
	WeatherAPIEndpoint string
	ReleaseMode        bool
}

func Load() *Config {
	config := &Config{
		ServerPort:         getEnv("SERVER_PORT", ":8080"),
		WeatherAPIKey:      getEnv("OPENWEATHER_API_KEY", ""),
		WeatherAPIEndpoint: getEnv("WEATHER_API_ENDPOINT", ""),
		ReleaseMode:        getEnv("GIN_MODE", "release") == "release",
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
