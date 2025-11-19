package server

import (
	"fmt"

	"github.com/CTU-SematX/SmartCity/handlers"
	"github.com/gin-gonic/gin"
)

type Server struct {
	router              *gin.Engine
	handler             *handlers.Handler
	registrationHandler *handlers.RegistrationHandler
	port                string
}

type Config struct {
	Port        string
	ReleaseMode bool
}

func NewServer(handler *handlers.Handler, registrationHandler *handlers.RegistrationHandler, config Config) *Server {
	if config.ReleaseMode {
		gin.SetMode(gin.ReleaseMode)
	} else {
		gin.SetMode(gin.DebugMode)
	}

	router := gin.Default()

	router.Use(corsMiddleware())

	return &Server{
		router:              router,
		handler:             handler,
		registrationHandler: registrationHandler,
		port:                config.Port,
	}
}

func (s *Server) SetupRoutes() {

	s.router.GET("/health", s.handler.HealthCheck)

	weather := s.router.Group("/api/weather")
	{
		weather.POST("/get", s.handler.GetWeather)
		weather.GET("/city", s.handler.GetWeatherCity)
	}

	air := s.router.Group("/api/air")
	{
		air.GET("/locations", s.handler.GetAirQualityLocation)
		air.GET("/countries", s.handler.GetAirQualityCountry)
	}

	// Orion-LD Context Broker endpoints
	orion := s.router.Group("/api/orion")
	{
		// Query weather by city (specific route before generic :id route)
		orion.GET("/weather/city", s.handler.QueryWeatherByCity)

		// Query entities from Orion-LD
		orion.GET("/entities", s.handler.QueryOrionEntities)
		orion.GET("/entities/:id", s.handler.GetOrionEntity)

		// Sync data to Orion-LD
		orion.POST("/sync/air", s.handler.SyncAirQualityToOrion)
		orion.POST("/sync/country", s.handler.SyncCountryToOrion)
		orion.POST("/sync/weather", s.handler.SyncWeatherToOrion)

		// Context Provider Registration endpoints (for manual registration management)
		// TODO: Implement these if manual registration management is needed
		// orion.POST("/register", s.handler.RegisterContextProvider)
		// orion.GET("/registrations", s.handler.ListRegistrations)
		// orion.DELETE("/registrations/:id", s.handler.DeleteRegistration)
	}

	s.router.GET("/ngsi-ld/v1/entities", gin.WrapF(s.registrationHandler.NGSILDQueryEntities))
	s.router.GET("/ngsi-ld/v1/entities/:entityId", gin.WrapF(s.registrationHandler.NGSILDGetEntity))
}

func (s *Server) Start() error {
	fmt.Printf("Server starting on http://localhost%s\n", s.port)
	fmt.Printf("API endpoints:\n")
	fmt.Printf("  - GET  /health\n")
	fmt.Printf("  - POST /api/weather/get\n")
	fmt.Printf("  - GET  /api/weather/city\n")
	fmt.Printf("  - GET  /api/air/locations\n")
	fmt.Printf("  - GET  /api/air/countries\n")
	fmt.Printf("\nOrion-LD Context Broker endpoints:\n")
	fmt.Printf("  - GET  /api/orion/entities (query entities by type)\n")
	fmt.Printf("  - GET  /api/orion/entities/:id (get entity by ID)\n")
	fmt.Printf("  - GET  /api/orion/weather/city (query weather by city name)\n")
	fmt.Printf("  - POST /api/orion/sync/air (sync air quality data to Orion-LD)\n")
	fmt.Printf("  - POST /api/orion/sync/country (sync country data to Orion-LD)\n")
	fmt.Printf("  - POST /api/orion/sync/weather (sync weather data to Orion-LD)\n")
	fmt.Printf("  - POST /api/orion/register (register context provider)\n")
	fmt.Printf("  - GET  /api/orion/registrations (list registrations)\n")
	fmt.Printf("  - DELETE /api/orion/registrations/:id (delete registration by ID)\n")

	return s.router.Run(s.port)
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}
