package server

import (
	"fmt"

	"github.com/CTU-SematX/SmartCity/handlers"
	"github.com/gin-gonic/gin"
)

type Server struct {
	router  *gin.Engine
	handler *handlers.Handler
	port    string
}

type Config struct {
	Port        string
	ReleaseMode bool
}

func NewServer(handler *handlers.Handler, config Config) *Server {
	if config.ReleaseMode {
		gin.SetMode(gin.ReleaseMode)
	} else {
		gin.SetMode(gin.DebugMode)
	}

	router := gin.Default()

	router.Use(corsMiddleware())

	return &Server{
		router:  router,
		handler: handler,
		port:    config.Port,
	}
}

func (s *Server) SetupRoutes() {

	s.router.GET("/health", s.handler.HealthCheck)

	weather := s.router.Group("/api/weather")
	{
		weather.POST("/get", s.handler.GetWeather)
	}

	air := s.router.Group("/api/air")
	{
		air.GET("/locations", s.handler.GetAirQualityLocation)
		air.GET("/countries", s.handler.GetAirQualityCountry)
	}
}

func (s *Server) Start() error {
	fmt.Printf("Server starting on http://localhost%s\n", s.port)
	fmt.Printf("API endpoints:\n")
	fmt.Printf("  - GET  /health\n")
	fmt.Printf("  - POST /api/weather/get\n")
	fmt.Printf("  - GET  /api/air/locations\n")
	fmt.Printf("  - GET  /api/air/countries\n")

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
