package database

import (
	"encoding/json"
	"fmt"
	"os"
	"time"

	"environment-monitor/models"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Init() error {
	var err error
	DB, err = gorm.Open(sqlite.Open("environment.db"), &gorm.Config{})
	if err != nil {
		return fmt.Errorf("failed to connect database: %w", err)
	}

	err = DB.AutoMigrate(&models.AirQuality{})
	if err != nil {
		return fmt.Errorf("failed to migrate database: %w", err)
	}

	return nil
}

type SeedData struct {
	StationID        string  `json:"stationId"`
	Name             string  `json:"name"`
	Description      string  `json:"description"`
	Longitude        float64 `json:"longitude"`
	Latitude         float64 `json:"latitude"`
	DateObserved     string  `json:"dateObserved"`
	Temperature      float64 `json:"temperature"`
	RelativeHumidity float64 `json:"relativeHumidity"`
	CO               float64 `json:"co"`
	NO2              float64 `json:"no2"`
	SO2              float64 `json:"so2"`
	PM10             float64 `json:"pm10"`
	PM25             float64 `json:"pm25"`
	O3               float64 `json:"o3"`
	AirQualityIndex  int     `json:"airQualityIndex"`
	AirQualityLevel  string  `json:"airQualityLevel"`
	Reliability      float64 `json:"reliability"`
}

func Seed(dataPath string) error {
	// Check if data already exists
	var count int64
	DB.Model(&models.AirQuality{}).Count(&count)
	if count > 0 {
		fmt.Println("Database already seeded, skipping...")
		return nil
	}

	// Read seed data file
	data, err := os.ReadFile(dataPath)
	if err != nil {
		return fmt.Errorf("failed to read seed data: %w", err)
	}

	var seedData []SeedData
	if err := json.Unmarshal(data, &seedData); err != nil {
		return fmt.Errorf("failed to parse seed data: %w", err)
	}

	// Insert seed data
	for _, item := range seedData {
		dateObserved, _ := time.Parse(time.RFC3339, item.DateObserved)
		
		record := models.AirQuality{
			EntityID:         fmt.Sprintf("urn:ngsi-ld:AirQualityObserved:%s", item.StationID),
			EntityType:       "AirQualityObserved",
			Name:             item.Name,
			Description:      item.Description,
			LocationLon:      item.Longitude,
			LocationLat:      item.Latitude,
			DateObserved:     dateObserved,
			Temperature:      item.Temperature,
			RelativeHumidity: item.RelativeHumidity,
			CO:               item.CO,
			NO2:              item.NO2,
			SO2:              item.SO2,
			PM10:             item.PM10,
			PM25:             item.PM25,
			O3:               item.O3,
			AirQualityIndex:  item.AirQualityIndex,
			AirQualityLevel:  item.AirQualityLevel,
			Reliability:      item.Reliability,
		}

		if err := DB.Create(&record).Error; err != nil {
			fmt.Printf("Failed to seed record %s: %v\n", item.StationID, err)
		}
	}

	fmt.Printf("Seeded %d air quality records\n", len(seedData))
	return nil
}
