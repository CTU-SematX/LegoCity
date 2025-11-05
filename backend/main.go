package main

import (
	"log"

	"github.com/CTU-SematX/SmartCity/client"
	"github.com/CTU-SematX/SmartCity/config"
	"github.com/CTU-SematX/SmartCity/handlers"
	"github.com/CTU-SematX/SmartCity/server"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Initialize DBpedia client
	dbpediaClient := client.NewDBpediaClient(cfg.DBpediaEndpoint)

	// Initialize Weather client
	weatherClient := client.NewWeatherClient(cfg.WeatherAPIEndpoint, cfg.WeatherAPIKey)

	// Initialize handlers
	handler := handlers.NewHandler(dbpediaClient, weatherClient)

	// Initialize server
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
