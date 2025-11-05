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
	DefaultAirEndpoint = "https://api.openaq.org/v3/locations"
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

func (c *AirClient) GetAirQuality(query *types.AirQualityRequest) (*types.AirQualityResponse, error) {
	if c.apiKey == "" {
		return nil, fmt.Errorf("API key is required")
	}

	fmt.Println("query:", query)
	params := url.Values{}
	params.Add("parameters_id", fmt.Sprintf("%f", query.ParametersId))
	params.Add("limit", fmt.Sprintf("%d", query.Limit))

	requestURL := fmt.Sprintf("%s?%s", c.endpoint, params.Encode())

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
	fmt.Println(string(body))

	var airResp types.AirQualityResponse
	if err := json.Unmarshal(body, &airResp); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return &airResp, nil
}
