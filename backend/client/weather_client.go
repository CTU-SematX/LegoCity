package client

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"

	"github.com/CTU-SematX/SmartCity/interfaces"
	"github.com/CTU-SematX/SmartCity/types/weather"
)

const (
	DefaultEndpoint = "https://api.openweathermap.org/data/3.0/onecall"
	DefaultTimeout  = 30 * time.Second
)

type WeatherClient struct {
	endpoint   string
	apiKey     string
	httpClient *http.Client
}

func NewWeatherClient(endpoint, apiKey string) *WeatherClient {
	if endpoint == "" {
		endpoint = DefaultEndpoint
	}

	return &WeatherClient{
		endpoint: endpoint,
		apiKey:   apiKey,
		httpClient: &http.Client{
			Timeout: DefaultTimeout,
		},
	}
}

func (c *WeatherClient) GetWeather(query interfaces.WeatherQuery) (*weather.WeatherResponse, error) {
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

	requestURL := fmt.Sprintf("%s?%s", c.endpoint, params.Encode())

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

	var weatherResp weather.WeatherResponse
	if err := json.Unmarshal(body, &weatherResp); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return &weatherResp, nil
}
