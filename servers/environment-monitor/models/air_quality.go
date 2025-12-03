package models

import (
	"time"

	"gorm.io/gorm"
)

type AirQuality struct {
	gorm.Model
	EntityID         string    `json:"entity_id" gorm:"uniqueIndex"`
	EntityType       string    `json:"entity_type" gorm:"default:AirQualityObserved"`
	Name             string    `json:"name"`
	Description      string    `json:"description"`
	LocationLon      float64   `json:"location_lon"`
	LocationLat      float64   `json:"location_lat"`
	DateObserved     time.Time `json:"date_observed"`
	Temperature      float64   `json:"temperature"`
	RelativeHumidity float64   `json:"relative_humidity"`
	CO               float64   `json:"co"`
	NO2              float64   `json:"no2"`
	SO2              float64   `json:"so2"`
	PM10             float64   `json:"pm10"`
	PM25             float64   `json:"pm25"`
	O3               float64   `json:"o3"`
	AirQualityIndex  int       `json:"air_quality_index"`
	AirQualityLevel  string    `json:"air_quality_level"`
	Reliability      float64   `json:"reliability"`
}

type AirQualityCreate struct {
	EntityID         string    `json:"entity_id" binding:"required"`
	EntityType       string    `json:"entity_type"`
	Name             string    `json:"name" binding:"required"`
	Description      string    `json:"description"`
	LocationLon      float64   `json:"location_lon" binding:"required"`
	LocationLat      float64   `json:"location_lat" binding:"required"`
	DateObserved     time.Time `json:"date_observed" binding:"required"`
	Temperature      float64   `json:"temperature"`
	RelativeHumidity float64   `json:"relative_humidity"`
	CO               float64   `json:"co"`
	NO2              float64   `json:"no2"`
	SO2              float64   `json:"so2"`
	PM10             float64   `json:"pm10"`
	PM25             float64   `json:"pm25"`
	O3               float64   `json:"o3"`
	AirQualityIndex  int       `json:"air_quality_index"`
	AirQualityLevel  string    `json:"air_quality_level"`
	Reliability      float64   `json:"reliability"`
}

type AirQualityUpdate struct {
	Name             *string    `json:"name"`
	Description      *string    `json:"description"`
	LocationLon      *float64   `json:"location_lon"`
	LocationLat      *float64   `json:"location_lat"`
	DateObserved     *time.Time `json:"date_observed"`
	Temperature      *float64   `json:"temperature"`
	RelativeHumidity *float64   `json:"relative_humidity"`
	CO               *float64   `json:"co"`
	NO2              *float64   `json:"no2"`
	SO2              *float64   `json:"so2"`
	PM10             *float64   `json:"pm10"`
	PM25             *float64   `json:"pm25"`
	O3               *float64   `json:"o3"`
	AirQualityIndex  *int       `json:"air_quality_index"`
	AirQualityLevel  *string    `json:"air_quality_level"`
	Reliability      *float64   `json:"reliability"`
}
