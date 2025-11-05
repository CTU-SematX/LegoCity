package handlers

import (
	"net/http"
	"time"

	"github.com/CTU-SematX/SmartCity/interfaces"
	"github.com/CTU-SematX/SmartCity/types/api"
	"github.com/CTU-SematX/SmartCity/types/weather"
	"github.com/gin-gonic/gin"
)

// Handler contains all HTTP handlers
type Handler struct {
	weatherClient interfaces.WeatherClient
}

// NewHandler creates a new handler instance
func NewHandler(weatherClient interfaces.WeatherClient) *Handler {
	return &Handler{
		weatherClient: weatherClient,
	}
}

// HealthCheck returns the server status
func (h *Handler) HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, &api.HealthResponse{
		Status: "healthy",
		Time:   time.Now().Format(time.RFC3339),
	})
}

func (h *Handler) GetWeather(c *gin.Context) {
	var req weather.WeatherRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request: " + err.Error(),
		})
		return
	}

	if req.Units == "" {
		req.Units = "metric"
	}

	query := interfaces.WeatherQuery{
		Lat:     req.Lat,
		Lon:     req.Lon,
		Exclude: req.Exclude,
		Units:   req.Units,
		Lang:    req.Lang,
	}

	weatherData, err := h.weatherClient.GetWeather(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch weather data: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, weatherData)
}
