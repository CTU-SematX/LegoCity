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

func (c *AirClient) GetAirQualityLocation(query *types.AirQualityLocationRequest) (*types.AirQualityLocationResponse, error) {
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

	var airResp types.AirQualityLocationResponse
	if err := json.Unmarshal(body, &airResp); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return &airResp, nil
}

func (c *AirClient) GetAirQualityCountry(query *types.AirQualityCountryRequest) (*types.AirQualityCountryResponse, error) {
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

	return &airResp, nil
}
