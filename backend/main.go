package main

import (
	"log"

	"github.com/CTU-SematX/SmartCity/client"
	"github.com/CTU-SematX/SmartCity/config"
	"github.com/CTU-SematX/SmartCity/handlers"
	"github.com/CTU-SematX/SmartCity/server"
)

func main() {
	cfg := config.Load()

	// Client
	weatherClient := client.NewWeatherClient(cfg.WeatherAPIKey)
	airClient := client.NewAirClient(cfg.AirAPIKey)

	// Handler
	handler := handlers.NewHandler(weatherClient, airClient)

	srv := server.NewServer(handler, server.Config{
		Port:        cfg.ServerPort,
		ReleaseMode: cfg.ReleaseMode,
	})

	// Setup routes
	srv.SetupRoutes()

	// Start server
	log.Printf("Starting SmartCity server on %s", cfg.ServerPort)
	if err := srv.Start(); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
