package main

import (
	"fmt"
	"os"
	"time"

	"environment-monitor/database"
	"environment-monitor/handlers"

	"github.com/gin-gonic/gin"
)

// @title Environment Monitor API
// @version 1.0
// @description API quản lý dữ liệu chất lượng không khí (NGSI-LD AirQualityObserved)
// @host localhost:8002
// @BasePath /
func main() {
	// Get config from environment
	port := os.Getenv("PORT")
	if port == "" {
		port = "8002"
	}

	brokerURL := os.Getenv("BROKER_URL")
	if brokerURL == "" {
		brokerURL = "http://localhost:1026"
	}
	handlers.SetBrokerURL(brokerURL)

	dataPath := os.Getenv("DATA_PATH")
	if dataPath == "" {
		dataPath = "/opendata/environment.json"
	}

	// Initialize database
	if err := database.Init(); err != nil {
		fmt.Printf("Failed to initialize database: %v\n", err)
		os.Exit(1)
	}

	// Seed data
	if err := database.Seed(dataPath); err != nil {
		fmt.Printf("Warning: Failed to seed data: %v\n", err)
	}

	// Setup Gin router
	r := gin.Default()

	// Health check
	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":    "ok",
			"service":   "environment-monitor",
			"timestamp": time.Now().UTC().Format(time.RFC3339),
		})
	})

	// Air Quality routes
	r.GET("/air-quality", handlers.ListAirQuality)
	r.GET("/air-quality/:id", handlers.GetAirQuality)
	r.POST("/air-quality", handlers.CreateAirQuality)
	r.PUT("/air-quality/:id", handlers.UpdateAirQuality)
	r.DELETE("/air-quality/:id", handlers.DeleteAirQuality)

	// Broker routes
	r.POST("/air-quality/:id/push", handlers.PushToBroker)
	r.POST("/air-quality/push-all", handlers.PushAllToBroker)

	// NGSI-LD routes
	r.GET("/air-quality/:id/ngsi-ld", handlers.GetAsNGSILD)

	fmt.Printf("Server starting on port %s...\n", port)
	r.Run(":" + port)
}
