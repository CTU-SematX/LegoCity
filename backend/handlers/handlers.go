package handlers

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/CTU-SematX/SmartCity/client"
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
	orionClient   *client.OrionClient
}

func NewHandler(weatherClient interfaces.WeatherClient, airClient interfaces.AirQualityClient, orionClient *client.OrionClient) *Handler {
	return &Handler{
		weatherClient: weatherClient,
		airClient:     airClient,
		orionClient:   orionClient,
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

// GetOrionEntity retrieves an entity from Orion-LD by ID
func (h *Handler) GetOrionEntity(c *gin.Context) {
	entityID := c.Param("id")
	if entityID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Entity ID is required",
		})
		return
	}

	entity, err := h.orionClient.GetEntity(entityID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve entity: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, entity)
}

// QueryOrionEntities queries entities from Orion-LD by type
func (h *Handler) QueryOrionEntities(c *gin.Context) {
	entityType := c.Query("type")
	if entityType == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Entity type is required",
		})
		return
	}

	limit := 100
	if limitStr := c.Query("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil {
			limit = l
		}
	}

	entities, err := h.orionClient.QueryEntities(entityType, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to query entities: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, entities)
}

// QueryWeatherByCity queries weather entities from Orion-LD filtered by city name
func (h *Handler) QueryWeatherByCity(c *gin.Context) {
	city := c.Query("city")
	if city == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "City name is required",
		})
		return
	}

	// Query all weather entities
	entities, err := h.orionClient.QueryEntities("WeatherObserved", 100)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to query weather entities: " + err.Error(),
		})
		return
	}

	// Filter by city name
	filtered := make([]map[string]interface{}, 0)
	for _, entity := range entities {
		// Check both compact and expanded name properties
		if nameObj, ok := entity["name"]; ok {
			if nameProp, ok := nameObj.(map[string]interface{}); ok {
				if value, ok := nameProp["value"].(string); ok && value == city {
					filtered = append(filtered, entity)
				}
			}
		}
		if nameObj, ok := entity["https://uri.etsi.org/ngsi-ld/name"]; ok {
			if nameProp, ok := nameObj.(map[string]interface{}); ok {
				if value, ok := nameProp["value"].(string); ok && value == city {
					filtered = append(filtered, entity)
				}
			}
		}
	}

	if len(filtered) == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"error": fmt.Sprintf("No weather data found for city: %s", city),
			"hint":  fmt.Sprintf("Sync weather data first: curl -X POST 'http://localhost:8080/api/orion/sync/weather?city=%s'", city),
		})
		return
	}

	c.JSON(http.StatusOK, filtered)
}

// SyncAirQualityToOrion fetches air quality data and syncs it to Orion-LD
func (h *Handler) SyncAirQualityToOrion(c *gin.Context) {
	var req types.AirQualityLocationRequest

	if parametersIdStr := c.Query("parameters_id"); parametersIdStr != "" {
		if parametersId, err := strconv.ParseFloat(parametersIdStr, 64); err == nil {
			req.ParametersId = parametersId
		}
	} else {
		req.ParametersId = 2 // Default to PM2.5
	}

	if limitStr := c.Query("limit"); limitStr != "" {
		if limit, err := strconv.ParseInt(limitStr, 10, 32); err == nil {
			req.Limit = int32(limit)
		}
	} else {
		req.Limit = 100
	}

	// Fetch air quality data
	airData, err := h.airClient.GetAirQualityLocation(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch air quality data: " + err.Error(),
		})
		return
	}

	// Convert to JSON-LD
	airClientImpl, ok := h.airClient.(*client.AirClient)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Invalid air client type",
		})
		return
	}

	entities, err := airClientImpl.ConvertLocationResponseToJSONLD(airData)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to convert to JSON-LD: " + err.Error(),
		})
		return
	}

	// Sync to Orion-LD
	if err := h.orionClient.BatchUpsertEntities(entities); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to sync to Orion-LD: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":        "Successfully synced to Orion-LD",
		"entities_count": len(entities),
	})
}

// SyncCountryToOrion fetches country air quality data and syncs it to Orion-LD
func (h *Handler) SyncCountryToOrion(c *gin.Context) {
	var req types.AirQualityCountryRequest

	if countryStr := c.Query("country"); countryStr != "" {
		if country, err := strconv.ParseInt(countryStr, 10, 64); err == nil {
			req.Country = country
		}
	} else {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Country ID is required",
		})
		return
	}

	// Fetch country data
	countryData, err := h.airClient.GetAirQualityCountry(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch country data: " + err.Error(),
		})
		return
	}

	// Convert to JSON-LD
	airClientImpl, ok := h.airClient.(*client.AirClient)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Invalid air client type",
		})
		return
	}

	entities, err := airClientImpl.ConvertCountryResponseToJSONLD(countryData)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to convert to JSON-LD: " + err.Error(),
		})
		return
	}

	// Sync to Orion-LD
	if err := h.orionClient.BatchUpsertEntities(entities); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to sync to Orion-LD: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":        "Successfully synced country to Orion-LD",
		"entities_count": len(entities),
	})
}

// SyncWeatherToOrion fetches weather data and syncs it to Orion-LD
func (h *Handler) SyncWeatherToOrion(c *gin.Context) {
	var req types.WeatherCityRequest

	if city := c.Query("city"); city != "" {
		req.City = city
	} else {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "City name is required",
		})
		return
	}

	if units := c.Query("units"); units != "" {
		req.Units = units
	} else {
		req.Units = "metric"
	}

	// Fetch weather data
	weatherData, err := h.weatherClient.GetWeatherCity(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch weather data: " + err.Error(),
		})
		return
	}

	// Convert to JSON-LD
	weatherClientImpl, ok := h.weatherClient.(*client.WeatherClient)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Invalid weather client type",
		})
		return
	}

	entity, err := weatherClientImpl.ConvertWeatherCityResponseToJSONLD(weatherData)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to convert to JSON-LD: " + err.Error(),
		})
		return
	}

	// Sync to Orion-LD
	entities := []client.JSONLD{entity}
	if err := h.orionClient.BatchUpsertEntities(entities); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to sync to Orion-LD: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":     "Successfully synced weather to Orion-LD",
		"entity_id":   entity["id"],
		"entity_type": entity["type"],
	})
}
