package handlers

import (
	"net/http"
	"time"

	"github.com/CTU-SematX/SmartCity/interfaces"
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

type HealthResponse struct {
	Status string `json:"status"`
	Time   string `json:"time"`
}

func (h *Handler) HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, HealthResponse{
		Status: "healthy",
		Time:   time.Now().Format(time.RFC3339),
	})
}

type WeatherRequest struct {
	Lat     float64  `json:"lat" binding:"required"`
	Lon     float64  `json:"lon" binding:"required"`
	Exclude []string `json:"exclude,omitempty"`
	Units   string   `json:"units,omitempty"`
	Lang    string   `json:"lang,omitempty"`
}

func (h *Handler) GetWeather(c *gin.Context) {
	var req WeatherRequest
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
