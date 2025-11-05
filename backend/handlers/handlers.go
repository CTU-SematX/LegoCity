package handlers

import (
	"net/http"
	"time"

	"github.com/CTU-SematX/SmartCity/interfaces"
	weather "github.com/CTU-SematX/SmartCity/types"
	"github.com/gin-gonic/gin"
)

type Handler struct {
	weatherClient interfaces.WeatherClient
}

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
