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

func (c *WeatherClient) GetWeatherCity(query *types.WeatherCityRequest) (*types.WeatherCityResponse, error) {
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

	return &weatherResp, nil
}
