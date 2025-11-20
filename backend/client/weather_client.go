package client

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"

	"github.com/CTU-SematX/SmartCity/types"
)

const (
	DefaultWeatherEndpoint = "https://api.openweathermap.org"
	DefaultTimeout         = 30 * time.Second
	WeatherObservedType    = "WeatherObserved"
)

type WeatherClient struct {
	endpoint   string
	apiKey     string
	httpClient *http.Client
}

func NewWeatherClient(apiKey string) *WeatherClient {
	return &WeatherClient{
		endpoint: DefaultWeatherEndpoint,
		apiKey:   apiKey,
		httpClient: &http.Client{
			Timeout: DefaultTimeout,
		},
	}
}

// not good for now :>
func (c *WeatherClient) GetWeather(query *types.WeatherRequest) (*types.WeatherResponse, error) {
	if c.apiKey == "" {
		return nil, fmt.Errorf("API key is required")
	}

	params := url.Values{}
	params.Add("lat", fmt.Sprintf("%.6f", query.Lat))
	params.Add("lon", fmt.Sprintf("%.6f", query.Lon))
	params.Add("appid", c.apiKey)

	if len(query.Exclude) > 0 {
		exclude := ""
		for i, part := range query.Exclude {
			if i > 0 {
				exclude += ","
			}
			exclude += part
		}
		params.Add("exclude", exclude)
	}

	if query.Units != "" {
		params.Add("units", query.Units)
	}

	if query.Lang != "" {
		params.Add("lang", query.Lang)
	}

	requestURL := fmt.Sprintf("%s/data/3.0/onecall?%s", c.endpoint, params.Encode())

	req, err := http.NewRequest("GET", requestURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to execute request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("weather API returned status %d: %s", resp.StatusCode, string(body))
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	var weatherResp types.WeatherResponse
	if err := json.Unmarshal(body, &weatherResp); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return &weatherResp, nil
}

func (c *WeatherClient) GetWeatherCity(query *types.WeatherCityRequest) (JSONLD, error) {
	if c.apiKey == "" {
		return nil, fmt.Errorf("API key is required")
	}

	fmt.Println("Fetching weather for city:", query.City)
	params := url.Values{}
	params.Add("q", query.City)
	params.Add("appid", c.apiKey)

	requestURL := fmt.Sprintf("%s/data/2.5/weather?%s", c.endpoint, params.Encode())

	req, err := http.NewRequest("GET", requestURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to execute request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("weather API returned status %d: %s", resp.StatusCode, string(body))
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	var weatherResp types.WeatherCityResponse
	if err := json.Unmarshal(body, &weatherResp); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	// Convert to JSON-LD format before returning
	return ConvertWeatherCityToJSONLD(&weatherResp), nil
}

// ConvertWeatherCityResponseToJSONLD converts a WeatherCityResponse to NGSI-LD JSON-LD format
func (c *WeatherClient) ConvertWeatherCityResponseToJSONLD(resp *types.WeatherCityResponse) (JSONLD, error) {
	if resp == nil {
		return nil, fmt.Errorf("response is nil")
	}

	return ConvertWeatherCityToJSONLD(resp), nil
}

// ConvertWeatherCityToJSONLD converts weather city data to NGSI-LD JSON-LD format
func ConvertWeatherCityToJSONLD(weather *types.WeatherCityResponse) JSONLD {
	cityNameForURI := url.QueryEscape(weather.Name)

	// Create the NGSI-LD entity
	entity := JSONLD{
		"@context": []string{
			NGSILDContext,
			SmartDataModelsContext,
		},
		"id":   fmt.Sprintf("urn:ngsi-ld:WeatherObserved:%s", cityNameForURI),
		"type": WeatherObservedType,
		"name": map[string]interface{}{
			"type":  "Property",
			"value": weather.Name,
		},
		"dateObserved": map[string]interface{}{
			"type":  "Property",
			"value": time.Unix(int64(weather.Dt), 0).UTC().Format(time.RFC3339),
		},
	}

	// Add location
	if weather.Coord != nil {
		entity["location"] = map[string]interface{}{
			"type": "GeoProperty",
			"value": map[string]interface{}{
				"type":        "Point",
				"coordinates": []float64{weather.Coord.Lon, weather.Coord.Lat},
			},
		}
	}

	// Add address information
	if weather.Sys != nil {
		entity["address"] = map[string]interface{}{
			"type": "Property",
			"value": map[string]interface{}{
				"addressLocality": weather.Name,
				"addressCountry":  weather.Sys.Country,
			},
		}
	}

	// Add weather conditions
	if len(weather.Weather) > 0 {
		entity["weatherType"] = map[string]interface{}{
			"type":  "Property",
			"value": weather.Weather[0].Main,
		}
		entity["weatherDescription"] = map[string]interface{}{
			"type":  "Property",
			"value": weather.Weather[0].Description,
		}
	}

	// Add temperature data
	if weather.Main != nil {
		entity["temperature"] = map[string]interface{}{
			"type":     "Property",
			"value":    weather.Main.Temp,
			"unitCode": "KEL", // Kelvin
		}
		entity["feelsLike"] = map[string]interface{}{
			"type":     "Property",
			"value":    weather.Main.FeelsLike,
			"unitCode": "KEL",
		}
		entity["temperatureMin"] = map[string]interface{}{
			"type":     "Property",
			"value":    weather.Main.TempMin,
			"unitCode": "KEL",
		}
		entity["temperatureMax"] = map[string]interface{}{
			"type":     "Property",
			"value":    weather.Main.TempMax,
			"unitCode": "KEL",
		}
		entity["relativeHumidity"] = map[string]interface{}{
			"type":     "Property",
			"value":    weather.Main.Humidity,
			"unitCode": "P1", // Percentage
		}
		entity["atmosphericPressure"] = map[string]interface{}{
			"type":     "Property",
			"value":    weather.Main.Pressure,
			"unitCode": "HPA", // Hectopascal
		}
	}

	// Add wind data
	if weather.Wind != nil {
		entity["windSpeed"] = map[string]interface{}{
			"type":     "Property",
			"value":    weather.Wind.Speed,
			"unitCode": "MTS", // Meters per second
		}
		if weather.Wind.Deg != 0 {
			entity["windDirection"] = map[string]interface{}{
				"type":     "Property",
				"value":    weather.Wind.Deg,
				"unitCode": "DD", // Decimal degrees
			}
		}
	}

	// Add visibility
	if weather.Visibility != 0 {
		entity["visibility"] = map[string]interface{}{
			"type":     "Property",
			"value":    weather.Visibility,
			"unitCode": "MTR", // Meters
		}
	}

	// Add clouds
	if weather.Clouds != nil {
		entity["cloudCover"] = map[string]interface{}{
			"type":     "Property",
			"value":    weather.Clouds.All,
			"unitCode": "P1", // Percentage
		}
	}

	// Add additional metadata
	entity["source"] = map[string]interface{}{
		"type":  "Property",
		"value": "OpenWeatherMap API",
	}

	if weather.Sys != nil {
		if weather.Sys.Sunrise != 0 {
			entity["sunriseTime"] = map[string]interface{}{
				"type":  "Property",
				"value": time.Unix(weather.Sys.Sunrise, 0).UTC().Format(time.RFC3339),
			}
		}
		if weather.Sys.Sunset != 0 {
			entity["sunsetTime"] = map[string]interface{}{
				"type":  "Property",
				"value": time.Unix(weather.Sys.Sunset, 0).UTC().Format(time.RFC3339),
			}
		}
	}

	return entity
}
