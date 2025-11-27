package main

import (
	"context"
	"log"
	"net/url"
	"time"

	"github.com/smartcity/proxy-service/config"
	"github.com/smartcity/proxy-service/database"
	"github.com/smartcity/proxy-service/middleware"
	"github.com/smartcity/proxy-service/proxy"
	"github.com/smartcity/proxy-service/server"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("ERROR: Failed to load configuration: %v", err)
	}

	// Parse upstream URL
	upstreamURL, err := url.Parse(cfg.UpstreamBaseURL)
	if err != nil {
		log.Fatalf("ERROR: Invalid UPSTREAM_BASE_URL: %v", err)
	}

	// Connect to MongoDB
	log.Printf("Connecting to MongoDB: %s", cfg.MongoURI)
	ctx, cancel := context.WithTimeout(context.Background(), time.Duration(cfg.MongoTimeout)*time.Second)
	defer cancel()

	db, err := database.NewMongoDB(ctx, cfg.MongoURI, cfg.MongoDBName, cfg.MongoCollection)
	if err != nil {
		log.Fatalf("ERROR: %v", err)
	}
	defer func() {
		if err := db.Close(); err != nil {
			log.Printf("Error disconnecting from MongoDB: %v", err)
		}
	}()

	log.Printf("Connected to MongoDB: %s (database: %s, collection: %s)",
		cfg.MongoURI, cfg.MongoDBName, cfg.MongoCollection)

	corsMiddleware := middleware.NewCORSMiddleware(cfg.DashboardOrigin)
	authMiddleware := middleware.NewAuthMiddleware(
		db,
		time.Duration(cfg.DBQueryTimeout)*time.Second,
	)
	reverseProxy := proxy.NewReverseProxy(upstreamURL)

	// Create and start server
	srv := server.New(cfg, reverseProxy, corsMiddleware, authMiddleware)
	if err := srv.Start(); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}
