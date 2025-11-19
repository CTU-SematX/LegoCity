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

	// Initialize clients
	weatherClient := client.NewWeatherClient(cfg.WeatherAPIKey)
	airClient := client.NewAirClient(cfg.AirAPIKey)
	orionClient := client.NewOrionClient(cfg.OrionEndpoint)

	// Check Orion-LD connection
	log.Printf("Connecting to Orion-LD at %s", cfg.OrionEndpoint)
	if err := orionClient.HealthCheck(); err != nil {
		log.Printf("Warning: Orion-LD is not reachable: %v", err)
		log.Printf("Continuing without Orion-LD sync...")
	} else {
		log.Println("Successfully connected to Orion-LD")
	}

	// Initialize handlers
	handler := handlers.NewHandler(weatherClient, airClient, orionClient)
	registrationHandler := handlers.NewRegistrationHandler(cfg, orionClient, airClient, weatherClient)

	log.Println("Using on-demand data fetching pattern (no periodic sync)")
	log.Println("Data will be fetched and cached when requested via NGSI-LD endpoints")

	// Initialize server
	srv := server.NewServer(handler, registrationHandler, server.Config{
		Port:        cfg.ServerPort,
		ReleaseMode: cfg.ReleaseMode,
	})

	// Setup routes
	srv.SetupRoutes()

	// Start server
	log.Printf("Starting SmartCity Context Provider server on %s", cfg.ServerPort)
	if err := srv.Start(); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
