package handlers

import (
	"dbpedia-server/types"
)

// MockDBpediaClient is a mock implementation of the DBpediaClient interface
type MockDBpediaClient struct {
	QueryFunc func(sparql string) (*types.SPARQLResponse, error)
}

func (m *MockDBpediaClient) Query(sparql string) (*types.SPARQLResponse, error) {
	if m.QueryFunc != nil {
		return m.QueryFunc(sparql)
	}
	return &types.SPARQLResponse{}, nil
}
