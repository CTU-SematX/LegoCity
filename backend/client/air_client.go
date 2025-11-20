package client

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"

	"github.com/CTU-SematX/SmartCity/types"
)

const (
	DefaultAirEndpoint = "https://api.openaq.org/v3"
)

// NGSI-LD contexts and types
const (
	NGSILDContext          = "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"
	SmartDataModelsContext = "https://smartdatamodels.org/context.jsonld"
	AirQualityObservedType = "AirQualityObserved"
	CountryType            = "Country"
)

// JSONLD represents a JSON-LD entity
type JSONLD map[string]interface{}

type AirClient struct {
	endpoint   string
	apiKey     string
	httpClient *http.Client
}

func NewAirClient(apiKey string) *AirClient {
	return &AirClient{
		endpoint: DefaultAirEndpoint,
		apiKey:   apiKey,
		httpClient: &http.Client{
			Timeout: DefaultTimeout,
		},
	}
}

func (c *AirClient) GetAirQualityLocation(query *types.AirQualityLocationRequest) ([]JSONLD, error) {
	if c.apiKey == "" {
		return nil, fmt.Errorf("API key is required")
	}

	params := url.Values{}
	params.Add("parameters_id", fmt.Sprintf("%.0f", query.ParametersId))
	params.Add("limit", fmt.Sprintf("%d", query.Limit))

	requestURL := fmt.Sprintf("%s/locations?%s", c.endpoint, params.Encode())

	req, err := http.NewRequest("GET", requestURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Add API key header
	req.Header.Set("X-API-Key", c.apiKey)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to execute request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("air quality API returned status %d: %s", resp.StatusCode, string(body))
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	// First unmarshal into the raw response to handle datetime objects
	var rawResp LocationResponseRaw
	if err := json.Unmarshal(body, &rawResp); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	// Convert to the expected type
	airResp := &types.AirQualityLocationResponse{
		Meta:    rawResp.Meta,
		Results: make([]*types.Location, len(rawResp.Results)),
	}

	for i, rawLoc := range rawResp.Results {
		loc := &types.Location{
			Id:          rawLoc.Id,
			Name:        rawLoc.Name,
			Locality:    rawLoc.Locality,
			Timezone:    rawLoc.Timezone,
			Country:     rawLoc.Country,
			Owner:       rawLoc.Owner,
			Provider:    rawLoc.Provider,
			IsMobile:    rawLoc.IsMobile,
			IsMonitor:   rawLoc.IsMonitor,
			Instruments: rawLoc.Instruments,
			Sensors:     rawLoc.Sensors,
			Coordinates: rawLoc.Coordinates,
			Licenses:    rawLoc.Licenses,
			Bounds:      rawLoc.Bounds,
			Distance:    rawLoc.Distance,
		}

		// Extract UTC timestamp from datetime objects
		if rawLoc.DatetimeFirst != nil && rawLoc.DatetimeFirst.UTC != "" {
			loc.DatetimeFirst = rawLoc.DatetimeFirst.UTC
		}
		if rawLoc.DatetimeLast != nil && rawLoc.DatetimeLast.UTC != "" {
			loc.DatetimeLast = rawLoc.DatetimeLast.UTC
		}

		airResp.Results[i] = loc
	}

	// Convert to JSON-LD format before returning
	return c.ConvertLocationResponseToJSONLD(airResp)
}

// ConvertLocationResponseToJSONLD converts an AirQualityLocationResponse to a JSON-LD array
func (c *AirClient) ConvertLocationResponseToJSONLD(resp *types.AirQualityLocationResponse) ([]JSONLD, error) {
	if resp == nil || resp.Results == nil {
		return nil, fmt.Errorf("response is nil or empty")
	}

	jsonldEntities := make([]JSONLD, 0, len(resp.Results))

	for _, location := range resp.Results {
		jsonld, err := ConvertLocationToJSONLD(location)
		if err != nil {
			return nil, fmt.Errorf("failed to convert location %d: %w", location.Id, err)
		}
		jsonldEntities = append(jsonldEntities, jsonld)
	}

	return jsonldEntities, nil
}

// ConvertLocationToJSONLD converts a single Location to NGSI-LD JSON-LD format
func ConvertLocationToJSONLD(location *types.Location) (JSONLD, error) {
	if location == nil {
		return nil, fmt.Errorf("location is nil")
	}

	// Create the NGSI-LD entity
	entity := JSONLD{
		"@context": []string{
			NGSILDContext,
			SmartDataModelsContext,
		},
		"id":   fmt.Sprintf("urn:ngsi-ld:AirQualityObserved:Location:%d", location.Id),
		"type": AirQualityObservedType,
		"name": map[string]interface{}{
			"type":  "Property",
			"value": location.Name,
		},
	}

	// Add location if coordinates exist
	if location.Coordinates != nil {
		entity["location"] = map[string]interface{}{
			"type": "GeoProperty",
			"value": map[string]interface{}{
				"type":        "Point",
				"coordinates": []float64{location.Coordinates.Longitude, location.Coordinates.Latitude},
			},
		}
	}

	// Add locality
	if location.Locality != "" {
		entity["address"] = map[string]interface{}{
			"type": "Property",
			"value": map[string]interface{}{
				"addressLocality": location.Locality,
			},
		}
	}

	// Add country information
	if location.Country != nil {
		entity["refCountry"] = map[string]interface{}{
			"type":   "Relationship",
			"object": fmt.Sprintf("urn:ngsi-ld:Country:%d", location.Country.Id),
		}
		entity["countryCode"] = map[string]interface{}{
			"type":  "Property",
			"value": location.Country.Code,
		}
	}

	// Add sensors information
	if len(location.Sensors) > 0 {
		sensors := make([]map[string]interface{}, 0, len(location.Sensors))
		for _, sensor := range location.Sensors {
			if sensor.Parameter != nil {
				sensorData := map[string]interface{}{
					"parameterId":          sensor.Parameter.Id,
					"parameterName":        sensor.Parameter.Name,
					"parameterDisplayName": sensor.Parameter.DisplayName,
					"parameterUnits":       sensor.Parameter.Units,
				}
				sensors = append(sensors, sensorData)
			}
		}
		entity["sensors"] = map[string]interface{}{
			"type":  "Property",
			"value": sensors,
		}
	}

	// Add metadata
	entity["isMobile"] = map[string]interface{}{
		"type":  "Property",
		"value": location.IsMobile,
	}
	entity["isMonitor"] = map[string]interface{}{
		"type":  "Property",
		"value": location.IsMonitor,
	}

	// Only add dates if they have values (not empty strings)
	if location.DatetimeFirst != "" {
		entity["dateCreated"] = map[string]interface{}{
			"type":  "Property",
			"value": location.DatetimeFirst,
		}
	}
	if location.DatetimeLast != "" {
		entity["dateModified"] = map[string]interface{}{
			"type":  "Property",
			"value": location.DatetimeLast,
		}
		entity["dateObserved"] = map[string]interface{}{
			"type":  "Property",
			"value": location.DatetimeLast,
		}
	}

	return entity, nil
}

func (c *AirClient) GetAirQualityCountry(query *types.AirQualityCountryRequest) ([]JSONLD, error) {
	if c.apiKey == "" {
		return nil, fmt.Errorf("API key is required")
	}

	requestURL := fmt.Sprintf("%s/countries/%d", c.endpoint, query.Country)

	req, err := http.NewRequest("GET", requestURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Add API key header
	req.Header.Set("X-API-Key", c.apiKey)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to execute request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("air quality API returned status %d: %s", resp.StatusCode, string(body))
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	var airResp types.AirQualityCountryResponse
	if err := json.Unmarshal(body, &airResp); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	// Convert to JSON-LD format before returning
	return c.ConvertCountryResponseToJSONLD(&airResp)
}

// ConvertCountryResponseToJSONLD converts an AirQualityCountryResponse to a JSON-LD array
func (c *AirClient) ConvertCountryResponseToJSONLD(resp *types.AirQualityCountryResponse) ([]JSONLD, error) {
	if resp == nil || resp.Results == nil {
		return nil, fmt.Errorf("response is nil or empty")
	}

	jsonldEntities := make([]JSONLD, 0, len(resp.Results))

	for _, country := range resp.Results {
		jsonld, err := ConvertCountryInfoToJSONLD(country)
		if err != nil {
			return nil, fmt.Errorf("failed to convert country %d: %w", country.Id, err)
		}
		jsonldEntities = append(jsonldEntities, jsonld)
	}

	return jsonldEntities, nil
}

// ConvertCountryInfoToJSONLD converts a single CountryInfo to NGSI-LD JSON-LD format
func ConvertCountryInfoToJSONLD(country *types.CountryInfo) (JSONLD, error) {
	if country == nil {
		return nil, fmt.Errorf("country is nil")
	}

	// Create the NGSI-LD entity
	entity := JSONLD{
		"@context": []string{
			NGSILDContext,
			SmartDataModelsContext,
		},
		"id":   fmt.Sprintf("urn:ngsi-ld:Country:%d", country.Id),
		"type": CountryType,
		"name": map[string]interface{}{
			"type":  "Property",
			"value": country.Name,
		},
		"code": map[string]interface{}{
			"type":  "Property",
			"value": country.Code,
		},
	}

	// Add date information
	if country.DatetimeFirst != "" {
		entity["dateCreated"] = map[string]interface{}{
			"type":  "Property",
			"value": country.DatetimeFirst,
		}
	}

	if country.DatetimeLast != "" {
		entity["dateModified"] = map[string]interface{}{
			"type":  "Property",
			"value": country.DatetimeLast,
		}
	}

	// Add parameters information
	if len(country.Parameters) > 0 {
		parameters := make([]map[string]interface{}, 0, len(country.Parameters))
		for _, param := range country.Parameters {
			paramData := map[string]interface{}{
				"id":          param.Id,
				"name":        param.Name,
				"displayName": param.DisplayName,
				"units":       param.Units,
			}
			parameters = append(parameters, paramData)
		}
		entity["availableParameters"] = map[string]interface{}{
			"type":  "Property",
			"value": parameters,
		}
	}

	return entity, nil
}

// DateTimeValue represents the datetime object from OpenAQ API v3
type DateTimeValue struct {
	UTC   string `json:"utc"`
	Local string `json:"local"`
}

// LocationResponseRaw is used for custom unmarshaling to handle datetime objects
type LocationResponseRaw struct {
	Meta    *types.Meta `json:"meta"`
	Results []struct {
		Id            int64               `json:"id"`
		Name          string              `json:"name"`
		Locality      string              `json:"locality"`
		Timezone      string              `json:"timezone"`
		Country       *types.Country      `json:"country"`
		Owner         *types.Owner        `json:"owner"`
		Provider      *types.Provider     `json:"provider"`
		IsMobile      bool                `json:"isMobile"`
		IsMonitor     bool                `json:"isMonitor"`
		Instruments   []*types.Instrument `json:"instruments"`
		Sensors       []*types.Sensor     `json:"sensors"`
		Coordinates   *types.Coordinates  `json:"coordinates"`
		Licenses      []*types.License    `json:"licenses"`
		Bounds        []float64           `json:"bounds"`
		Distance      float64             `json:"distance"`
		DatetimeFirst *DateTimeValue      `json:"datetimeFirst"`
		DatetimeLast  *DateTimeValue      `json:"datetimeLast"`
	} `json:"results"`
}
