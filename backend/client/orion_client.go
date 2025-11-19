package client

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

const (
	DefaultOrionEndpoint = "http://localhost:1026"
)

// OrionClient handles interactions with Orion-LD Context Broker
type OrionClient struct {
	endpoint   string
	httpClient *http.Client
}

func NewOrionClient(endpoint string) *OrionClient {
	if endpoint == "" {
		endpoint = DefaultOrionEndpoint
	}
	return &OrionClient{
		endpoint: endpoint,
		httpClient: &http.Client{
			Timeout: DefaultTimeout,
		},
	}
}

// CreateEntity creates a new NGSI-LD entity in Orion-LD
func (c *OrionClient) CreateEntity(entity JSONLD) error {
	url := fmt.Sprintf("%s/ngsi-ld/v1/entities", c.endpoint)

	jsonData, err := json.Marshal(entity)
	if err != nil {
		return fmt.Errorf("failed to marshal entity: %w", err)
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/ld+json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to execute request: %w", err)
	}
	defer resp.Body.Close()

	// 201 Created or 204 No Content means success
	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusNoContent {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("orion-ld returned status %d: %s", resp.StatusCode, string(body))
	}

	return nil
}

// UpsertEntity creates or updates an NGSI-LD entity in Orion-LD
func (c *OrionClient) UpsertEntity(entity JSONLD) error {
	entityID, ok := entity["id"].(string)
	if !ok {
		return fmt.Errorf("entity must have an 'id' field")
	}

	url := fmt.Sprintf("%s/ngsi-ld/v1/entities/%s/attrs", c.endpoint, entityID)

	// Remove @context and id from the entity for update
	updateEntity := make(JSONLD)
	for k, v := range entity {
		if k != "@context" && k != "id" && k != "type" {
			updateEntity[k] = v
		}
	}

	jsonData, err := json.Marshal(updateEntity)
	if err != nil {
		return fmt.Errorf("failed to marshal entity: %w", err)
	}

	req, err := http.NewRequest("PATCH", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to execute request: %w", err)
	}
	defer resp.Body.Close()

	// If entity doesn't exist (404), create it
	if resp.StatusCode == http.StatusNotFound {
		return c.CreateEntity(entity)
	}

	if resp.StatusCode != http.StatusNoContent && resp.StatusCode != http.StatusMultiStatus {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("orion-ld returned status %d: %s", resp.StatusCode, string(body))
	}

	return nil
}

// BatchUpsertEntities creates or updates multiple entities in a single batch operation
func (c *OrionClient) BatchUpsertEntities(entities []JSONLD) error {
	if len(entities) == 0 {
		return nil
	}

	url := fmt.Sprintf("%s/ngsi-ld/v1/entityOperations/upsert", c.endpoint)

	jsonData, err := json.Marshal(entities)
	if err != nil {
		return fmt.Errorf("failed to marshal entities: %w", err)
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/ld+json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to execute request: %w", err)
	}
	defer resp.Body.Close()

	// 200 OK, 201 Created or 204 No Content means success
	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusNoContent {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("orion-ld batch operation returned status %d: %s", resp.StatusCode, string(body))
	}

	return nil
}

// GetEntity retrieves an entity by ID from Orion-LD
func (c *OrionClient) GetEntity(entityID string) (JSONLD, error) {
	url := fmt.Sprintf("%s/ngsi-ld/v1/entities/%s", c.endpoint, entityID)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Accept", "application/ld+json")
	req.Header.Set("Link", `<https://smartdatamodels.org/context.jsonld>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"`)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to execute request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("orion-ld returned status %d: %s", resp.StatusCode, string(body))
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	var entity JSONLD
	if err := json.Unmarshal(body, &entity); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return entity, nil
}

// DeleteEntity deletes an entity by ID from Orion-LD
func (c *OrionClient) DeleteEntity(entityID string) error {
	url := fmt.Sprintf("%s/ngsi-ld/v1/entities/%s", c.endpoint, entityID)

	req, err := http.NewRequest("DELETE", url, nil)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to execute request: %w", err)
	}
	defer resp.Body.Close()

	// 204 No Content means success
	if resp.StatusCode != http.StatusNoContent {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("orion-ld returned status %d: %s", resp.StatusCode, string(body))
	}

	return nil
}

// QueryEntities queries entities from Orion-LD based on type
func (c *OrionClient) QueryEntities(entityType string, limit int) ([]JSONLD, error) {
	url := fmt.Sprintf("%s/ngsi-ld/v1/entities?type=%s", c.endpoint, entityType)
	if limit > 0 {
		url = fmt.Sprintf("%s&limit=%d", url, limit)
	}

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Accept", "application/ld+json")
	req.Header.Set("Link", `<https://smartdatamodels.org/context.jsonld>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"`)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to execute request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("orion-ld returned status %d: %s", resp.StatusCode, string(body))
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	var entities []JSONLD
	if err := json.Unmarshal(body, &entities); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return entities, nil
}

// HealthCheck checks if Orion-LD is reachable
func (c *OrionClient) HealthCheck() error {
	url := fmt.Sprintf("%s/version", c.endpoint)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("orion-ld not reachable: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("orion-ld health check failed with status %d", resp.StatusCode)
	}

	return nil
}

// RegisterContextProvider registers this backend as a context provider
func (c *OrionClient) RegisterContextProvider(registration map[string]interface{}) error {
	url := fmt.Sprintf("%s/ngsi-ld/v1/csourceRegistrations", c.endpoint)

	jsonData, err := json.Marshal(registration)
	if err != nil {
		return fmt.Errorf("failed to marshal registration: %w", err)
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/ld+json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to execute request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("registration failed (status %d): %s", resp.StatusCode, string(body))
	}

	return nil
}

// ListRegistrations lists all context source registrations
func (c *OrionClient) ListRegistrations() ([]JSONLD, error) {
	url := fmt.Sprintf("%s/ngsi-ld/v1/csourceRegistrations", c.endpoint)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Accept", "application/ld+json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to execute request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("failed to list registrations (status %d): %s", resp.StatusCode, string(body))
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	var registrations []JSONLD
	if err := json.Unmarshal(body, &registrations); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return registrations, nil
}

// DeleteRegistration deletes a context source registration
func (c *OrionClient) DeleteRegistration(registrationID string) error {
	url := fmt.Sprintf("%s/ngsi-ld/v1/csourceRegistrations/%s", c.endpoint, registrationID)

	req, err := http.NewRequest("DELETE", url, nil)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to execute request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusNoContent && resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("failed to delete registration (status %d): %s", resp.StatusCode, string(body))
	}

	return nil
}
