package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/CTU-SematX/SmartCity/interfaces"
	"github.com/CTU-SematX/SmartCity/types"
	"github.com/gin-gonic/gin"
)

const (
	MAX_LIMIT = 1
)

type Handler struct {
	weatherClient interfaces.WeatherClient
	airClient     interfaces.AirQualityClient
}

func NewHandler(weatherClient interfaces.WeatherClient, airClient interfaces.AirQualityClient) *Handler {
	return &Handler{
		weatherClient: weatherClient,
		airClient:     airClient,
	}
}

// HealthCheck returns the server status
func (h *Handler) HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, &types.HealthResponse{
		Status: "healthy",
		Time:   time.Now().Format(time.RFC3339),
	})
}

func (h *Handler) GetWeather(c *gin.Context) {
	var req types.WeatherRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request: " + err.Error(),
		})
		return
	}

	if req.Units == "" {
		req.Units = "metric"
	}

	weatherData, err := h.weatherClient.GetWeather(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch weather data: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, weatherData)
}

func (h *Handler) GetWeatherCity(c *gin.Context) {
	var req types.WeatherCityRequest

	if city := c.Query("q"); city != "" {
		req.City = city
	}

	if units := c.Query("units"); units != "" {
		req.Units = units
	}

	if lang := c.Query("lang"); lang != "" {
		req.Lang = lang
	}

	if req.Units == "" {
		req.Units = "metric"
	}

	if req.City == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "City name (q) is required",
		})
		return
	}

	weatherData, err := h.weatherClient.GetWeatherCity(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch weather data: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, weatherData)
}

func (h *Handler) GetAirQualityLocation(c *gin.Context) {
	var req types.AirQualityLocationRequest

	if parametersIdStr := c.Query("parameters_id"); parametersIdStr != "" {
		if parametersId, err := strconv.ParseFloat(parametersIdStr, 64); err == nil {
			req.ParametersId = parametersId
		}
	}

	if limitStr := c.Query("limit"); limitStr != "" {
		if limit, err := strconv.ParseInt(limitStr, 10, 32); err == nil {
			req.Limit = int32(limit)
		}
	}

	if req.Limit == 0 {
		req.Limit = MAX_LIMIT
	}

	airData, err := h.airClient.GetAirQualityLocation(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch air quality data: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, airData)
}

func (h *Handler) GetAirQualityCountry(c *gin.Context) {
	var req types.AirQualityCountryRequest

	if countryStr := c.Query("country"); countryStr != "" {
		if country, err := strconv.ParseInt(countryStr, 10, 32); err == nil {
			req.Country = int64(country)
		}
	}

	airData, err := h.airClient.GetAirQualityCountry(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch air quality data: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, airData)
}
