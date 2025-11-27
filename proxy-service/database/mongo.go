package database

import (
	"context"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// MongoDB handles MongoDB connections and operations
type MongoDB struct {
	client     *mongo.Client
	collection *mongo.Collection
}

// NewMongoDB creates a new MongoDB connection
func NewMongoDB(ctx context.Context, uri, dbName, collectionName string) (*MongoDB, error) {
	// Configure client options with direct connection to avoid replica set discovery
	clientOpts := options.Client().
		ApplyURI(uri).
		SetDirect(true)

	client, err := mongo.Connect(ctx, clientOpts)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to MongoDB: %w", err)
	}

	// Ping to verify connection
	if err := client.Ping(ctx, nil); err != nil {
		client.Disconnect(ctx)
		return nil, fmt.Errorf("failed to ping MongoDB: %w", err)
	}

	return &MongoDB{
		client:     client,
		collection: client.Database(dbName).Collection(collectionName),
	}, nil
}

// verify both token and id
func (db *MongoDB) ValidateTokenAndEntity(ctx context.Context, tokenStr string, entityID string) error {
	count, err := db.collection.CountDocuments(ctx, bson.M{
		"token":      tokenStr,
		"entity_ids": entityID,
	})

	if err != nil {
		return fmt.Errorf("database query error: %w", err)
	}

	if count == 0 {
		return fmt.Errorf("unauthorized")
	}

	return nil
}

// Close disconnects from MongoDB
func (db *MongoDB) Close() error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	return db.client.Disconnect(ctx)
}

// Collection returns the underlying MongoDB collection
func (db *MongoDB) Collection() *mongo.Collection {
	return db.collection
}
