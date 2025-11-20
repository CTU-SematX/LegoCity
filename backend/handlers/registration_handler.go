package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/CTU-SematX/SmartCity/client"
	"github.com/CTU-SematX/SmartCity/config"
	"github.com/CTU-SematX/SmartCity/interfaces"
	"github.com/CTU-SematX/SmartCity/types"
)

const (
	cacheTTL            = 30 * time.Minute
	defaultParametersID = 2
	defaultLimit        = 10
	defaultCity         = "Ho Chi Minh City"
	defaultCountry      = "VN"
	defaultCountryID    = 56 // Vietnam
)

// Map of country codes to OpenAQ country IDs
var countryCodeToID = map[string]int64{
	"VN": 56,  // Vietnam
	"TH": 218, // Thailand
	"US": 229, // United States
	"CN": 46,  // China
	// Add more country mappings as needed
}

type RegistrationHandler struct {
	cfg           *config.Config
	orionClient   *client.OrionClient
	airClient     interfaces.AirQualityClient
	weatherClient interfaces.WeatherClient
}

func NewRegistrationHandler(
	cfg *config.Config,
	orionClient *client.OrionClient,
	airClient interfaces.AirQualityClient,
	weatherClient interfaces.WeatherClient,
) *RegistrationHandler {
	return &RegistrationHandler{
		cfg:           cfg,
		orionClient:   orionClient,
		airClient:     airClient,
		weatherClient: weatherClient,
	}
}

func (h *RegistrationHandler) NGSILDQueryEntities(w http.ResponseWriter, r *http.Request) {
	entityType := r.URL.Query().Get("type")
	q := r.URL.Query().Get("q")
	limit := r.URL.Query().Get("limit")

	cachedEntities, err := h.fetchFromOrionLD(entityType, q)
	if err != nil {
		log.Printf("[NGSI-LD] Error fetching from Orion-LD: %v", err)
	}

	if len(cachedEntities) > 0 && h.isCacheFresh(cachedEntities) {
		log.Println("[NGSI-LD] Returning fresh cached data")
		h.respondWithEntities(w, cachedEntities)
		return
	}

	var entities []client.JSONLD

	switch entityType {
	case "AirQualityObserved":
		entities, err = h.fetchAndCacheAirQuality(q)
	case "Country":
		entities, err = h.fetchAndCacheCountry(q)
	case "WeatherObserved":
		entities, err = h.fetchAndCacheWeather(q)
	default:
		http.Error(w, fmt.Sprintf("Unknown entity type: %s", entityType), http.StatusBadRequest)
		return
	}

	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to fetch data: %v", err), http.StatusInternalServerError)
		return
	}

	if limit != "" {
		limitInt, _ := strconv.Atoi(limit)
		if limitInt > 0 && limitInt < len(entities) {
			entities = entities[:limitInt]
		}
	}

	h.respondWithEntities(w, entities)
}

func (h *RegistrationHandler) NGSILDGetEntity(w http.ResponseWriter, r *http.Request) {
	entityID := strings.TrimPrefix(r.URL.Path, "/ngsi-ld/v1/entities/")

	entity, err := h.orionClient.GetEntity(entityID)
	if err == nil && h.isEntityFresh(entity) {
		h.respondWithEntity(w, entity)
		return
	}

	entityType := h.extractEntityType(entityID)

	var entities []client.JSONLD

	switch entityType {
	case "AirQualityObserved":
		locality := h.extractLocalityFromEntityID(entityID)
		entities, err = h.fetchAndCacheAirQuality(fmt.Sprintf("address.addressLocality==%s", locality))
	case "Country":
		countryCode := h.extractCountryCodeFromEntityID(entityID)
		entities, err = h.fetchAndCacheCountry(fmt.Sprintf("countryCode==%s", countryCode))
	case "WeatherObserved":
		locality := h.extractLocalityFromEntityID(entityID)
		entities, err = h.fetchAndCacheWeather(fmt.Sprintf("address.addressLocality==%s", locality))
	default:
		http.Error(w, fmt.Sprintf("Unknown entity type: %s", entityType), http.StatusBadRequest)
		return
	}

	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to fetch entity: %v", err), http.StatusInternalServerError)
		return
	}

	for _, e := range entities {
		if id, ok := e["id"].(string); ok && id == entityID {
			h.respondWithEntity(w, e)
			return
		}
	}

	http.Error(w, "Entity not found", http.StatusNotFound)
}

func (h *RegistrationHandler) fetchAndCacheAirQuality(query string) ([]client.JSONLD, error) {

	locality := h.extractLocalityFromQuery(query)
	if locality == "" {
		locality = defaultCity
	}

	// GetAirQualityLocation now returns JSON-LD directly
	entities, err := h.airClient.GetAirQualityLocation(&types.AirQualityLocationRequest{
		ParametersId: defaultParametersID,
		Limit:        defaultLimit,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to fetch air quality: %w", err)
	}

	if len(entities) == 0 {
		log.Println("[NGSI-LD] No air quality data returned from API")
		return []client.JSONLD{}, nil
	}

	// Cache entities in Orion-LD
	if len(entities) > 0 {
		if err := h.orionClient.BatchUpsertEntities(entities); err != nil {
			log.Printf("[NGSI-LD] Warning: failed to cache entities in Orion-LD: %v", err)
		}
	}

	return entities, nil
}

func (h *RegistrationHandler) fetchAndCacheCountry(query string) ([]client.JSONLD, error) {

	// Extract country code from query or use default
	countryCode := h.extractCountryCodeFromQuery(query)
	if countryCode == "" {
		countryCode = defaultCountry
	}

	// Map country code to OpenAQ country ID
	countryID, ok := countryCodeToID[countryCode]
	if !ok {
		log.Printf("[NGSI-LD] Unknown country code '%s', using default country ID %d", countryCode, defaultCountryID)
		countryID = defaultCountryID
	}

	// GetAirQualityCountry now returns JSON-LD directly
	entities, err := h.airClient.GetAirQualityCountry(&types.AirQualityCountryRequest{
		Country: countryID,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to fetch country data: %w", err)
	}

	if len(entities) == 0 {
		log.Println("[NGSI-LD] No country data returned from API")
		return []client.JSONLD{}, nil
	}

	// Cache entities in Orion-LD
	for _, jsonLD := range entities {
		if err := h.orionClient.UpsertEntity(jsonLD); err != nil {
			log.Printf("[NGSI-LD] Warning: failed to cache country in Orion-LD: %v", err)
		}
	}

	return entities, nil
}

func (h *RegistrationHandler) fetchAndCacheWeather(query string) ([]client.JSONLD, error) {

	city := h.extractLocalityFromQuery(query)
	if city == "" {
		city = defaultCity
	}

	// GetWeatherCity now returns JSON-LD directly
	jsonLD, err := h.weatherClient.GetWeatherCity(&types.WeatherCityRequest{
		City:  city,
		Units: "metric",
		Lang:  "en",
	})
	if err != nil {
		return nil, fmt.Errorf("failed to fetch weather: %w", err)
	}

	// Cache entity in Orion-LD
	if err := h.orionClient.UpsertEntity(jsonLD); err != nil {
		log.Printf("[NGSI-LD] Warning: failed to cache weather in Orion-LD: %v", err)
	}

	return []client.JSONLD{jsonLD}, nil
}

func (h *RegistrationHandler) fetchFromOrionLD(entityType, query string) ([]client.JSONLD, error) {
	url := fmt.Sprintf("%s/ngsi-ld/v1/entities?type=%s", h.cfg.OrionEndpoint, entityType)
	if query != "" {
		url += "&q=" + query
	}

	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Orion-LD returned status %d", resp.StatusCode)
	}

	var entities []client.JSONLD
	if err := json.NewDecoder(resp.Body).Decode(&entities); err != nil {
		return nil, err
	}

	return entities, nil
}

func (h *RegistrationHandler) isCacheFresh(entities []client.JSONLD) bool {
	if len(entities) == 0 {
		return false
	}
	return h.isEntityFresh(entities[0])
}

func (h *RegistrationHandler) isEntityFresh(entity client.JSONLD) bool {
	var timestamp time.Time

	if dateObserved, ok := entity["dateObserved"]; ok {
		if dateMap, ok := dateObserved.(map[string]interface{}); ok {
			if value, ok := dateMap["value"].(string); ok {
				timestamp, _ = time.Parse(time.RFC3339, value)
			}
		}
	}

	if timestamp.IsZero() {
		if observedAt, ok := entity["observedAt"]; ok {
			if observedAtStr, ok := observedAt.(string); ok {
				timestamp, _ = time.Parse(time.RFC3339, observedAtStr)
			}
		}
	}

	if timestamp.IsZero() {
		return false
	}

	return time.Since(timestamp) < cacheTTL
}

func (h *RegistrationHandler) extractLocalityFromQuery(query string) string {
	if strings.Contains(query, "address.addressLocality==") {
		parts := strings.Split(query, "==")
		if len(parts) == 2 {
			return strings.TrimSpace(parts[1])
		}
	}
	return ""
}

func (h *RegistrationHandler) extractCountryCodeFromQuery(query string) string {
	if strings.Contains(query, "countryCode==") {
		parts := strings.Split(query, "==")
		if len(parts) == 2 {
			return strings.TrimSpace(parts[1])
		}
	}
	return ""
}

func (h *RegistrationHandler) extractEntityType(entityID string) string {
	parts := strings.Split(entityID, ":")
	if len(parts) >= 3 {
		return parts[2]
	}
	return ""
}

func (h *RegistrationHandler) extractLocalityFromEntityID(entityID string) string {
	parts := strings.Split(entityID, ":")
	if len(parts) >= 4 {
		return parts[3]
	}
	return ""
}

func (h *RegistrationHandler) extractCountryCodeFromEntityID(entityID string) string {
	parts := strings.Split(entityID, ":")
	if len(parts) >= 4 {
		return parts[3]
	}
	return ""
}

func (h *RegistrationHandler) respondWithEntities(w http.ResponseWriter, entities []client.JSONLD) {
	w.Header().Set("Content-Type", "application/ld+json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(entities)
}

func (h *RegistrationHandler) respondWithEntity(w http.ResponseWriter, entity client.JSONLD) {
	w.Header().Set("Content-Type", "application/ld+json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(entity)
}
