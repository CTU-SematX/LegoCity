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
	log.Println("[NGSI-LD] Query entities request received")

	entityType := r.URL.Query().Get("type")
	q := r.URL.Query().Get("q")
	limit := r.URL.Query().Get("limit")

	log.Printf("[NGSI-LD] Query params - type: %s, q: %s, limit: %s", entityType, q, limit)

	cachedEntities, err := h.fetchFromOrionLD(entityType, q)
	if err != nil {
		log.Printf("[NGSI-LD] Error fetching from Orion-LD: %v", err)
	}

	if len(cachedEntities) > 0 && h.isCacheFresh(cachedEntities) {
		log.Println("[NGSI-LD] Returning fresh cached data")
		h.respondWithEntities(w, cachedEntities)
		return
	}

	log.Println("[NGSI-LD] Cache miss or stale, fetching fresh data")

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
		log.Printf("[NGSI-LD] Error fetching fresh data: %v", err)
		http.Error(w, fmt.Sprintf("Failed to fetch data: %v", err), http.StatusInternalServerError)
		return
	}

	if limit != "" {
		limitInt, _ := strconv.Atoi(limit)
		if limitInt > 0 && limitInt < len(entities) {
			entities = entities[:limitInt]
		}
	}

	log.Printf("[NGSI-LD] Returning %d fresh entities", len(entities))
	h.respondWithEntities(w, entities)
}

func (h *RegistrationHandler) NGSILDGetEntity(w http.ResponseWriter, r *http.Request) {
	entityID := strings.TrimPrefix(r.URL.Path, "/ngsi-ld/v1/entities/")
	log.Printf("[NGSI-LD] Get entity request for ID: %s", entityID)

	entity, err := h.orionClient.GetEntity(entityID)
	if err == nil && h.isEntityFresh(entity) {
		log.Println("[NGSI-LD] Returning fresh cached entity")
		h.respondWithEntity(w, entity)
		return
	}

	entityType := h.extractEntityType(entityID)

	log.Printf("[NGSI-LD] Cache miss or stale for entity %s, fetching fresh data", entityID)

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
		log.Printf("[NGSI-LD] Error fetching fresh entity: %v", err)
		http.Error(w, fmt.Sprintf("Failed to fetch entity: %v", err), http.StatusInternalServerError)
		return
	}

	for _, e := range entities {
		if id, ok := e["id"].(string); ok && id == entityID {
			log.Println("[NGSI-LD] Found and returning fresh entity")
			h.respondWithEntity(w, e)
			return
		}
	}

	http.Error(w, "Entity not found", http.StatusNotFound)
}

func (h *RegistrationHandler) fetchAndCacheAirQuality(query string) ([]client.JSONLD, error) {
	log.Println("[NGSI-LD] Fetching air quality data from external API")

	locality := h.extractLocalityFromQuery(query)
	if locality == "" {
		locality = defaultCity
	}

	resp, err := h.airClient.GetAirQualityLocation(&types.AirQualityLocationRequest{
		ParametersId: defaultParametersID,
		Limit:        defaultLimit,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to fetch air quality: %w", err)
	}

	if len(resp.Results) == 0 {
		return []client.JSONLD{}, nil
	}

	entities := make([]client.JSONLD, 0)
	for _, location := range resp.Results {
		if locality != "" && !strings.EqualFold(location.Locality, locality) {
			continue
		}

		jsonLD, err := client.ConvertLocationToJSONLD(location)
		if err != nil {
			log.Printf("[NGSI-LD] Warning: failed to convert location to JSON-LD: %v", err)
			continue
		}
		entities = append(entities, jsonLD)
	}

	if len(entities) > 0 {
		if err := h.orionClient.BatchUpsertEntities(entities); err != nil {
			log.Printf("[NGSI-LD] Warning: failed to cache entities in Orion-LD: %v", err)
		}
	}

	log.Printf("[NGSI-LD] Cached %d air quality entities in Orion-LD", len(entities))
	return entities, nil
}

func (h *RegistrationHandler) fetchAndCacheCountry(query string) ([]client.JSONLD, error) {
	log.Println("[NGSI-LD] Fetching country data from external API")

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

	log.Printf("[NGSI-LD] Fetching country data for country ID: %d (code: %s)", countryID, countryCode)

	resp, err := h.airClient.GetAirQualityCountry(&types.AirQualityCountryRequest{
		Country: countryID,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to fetch country data: %w", err)
	}

	if len(resp.Results) == 0 {
		log.Println("[NGSI-LD] No country data returned from API")
		return []client.JSONLD{}, nil
	}

	entities := make([]client.JSONLD, 0)
	for _, countryInfo := range resp.Results {
		jsonLD, err := client.ConvertCountryInfoToJSONLD(countryInfo)
		if err != nil {
			log.Printf("[NGSI-LD] Warning: failed to convert country to JSON-LD: %v", err)
			continue
		}
		entities = append(entities, jsonLD)

		if err := h.orionClient.UpsertEntity(jsonLD); err != nil {
			log.Printf("[NGSI-LD] Warning: failed to cache country in Orion-LD: %v", err)
		}
	}

	log.Printf("[NGSI-LD] Cached %d country entities in Orion-LD", len(entities))
	return entities, nil
}

func (h *RegistrationHandler) fetchAndCacheWeather(query string) ([]client.JSONLD, error) {
	log.Println("[NGSI-LD] Fetching weather data from external API")

	city := h.extractLocalityFromQuery(query)
	if city == "" {
		city = defaultCity
	}

	resp, err := h.weatherClient.GetWeatherCity(&types.WeatherCityRequest{
		City:  city,
		Units: "metric",
		Lang:  "en",
	})
	if err != nil {
		return nil, fmt.Errorf("failed to fetch weather: %w", err)
	}

	jsonLD := client.ConvertWeatherCityToJSONLD(resp)

	if err := h.orionClient.UpsertEntity(jsonLD); err != nil {
		log.Printf("[NGSI-LD] Warning: failed to cache weather in Orion-LD: %v", err)
	}

	log.Println("[NGSI-LD] Cached weather entity in Orion-LD")
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
