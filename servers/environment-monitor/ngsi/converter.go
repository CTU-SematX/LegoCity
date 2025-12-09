/**
 * LegoCity - Smart City Platform
 * @version 1.0
 * @author CTU·SematX
 * @copyright (c) 2025 CTU·SematX. All rights reserved
 * @license MIT License
 * @see https://github.com/CTU-SematX/LegoCity The LegoCity GitHub project
 */

package ngsi

import (
	"environment-monitor/models"
)

var NGSILDContext = []string{
	"https://raw.githubusercontent.com/smart-data-models/dataModel.Environment/master/context.jsonld",
	"https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",
}

type Property struct {
	Type  string      `json:"type"`
	Value interface{} `json:"value"`
}

type GeoProperty struct {
	Type  string   `json:"type"`
	Value GeoValue `json:"value"`
}

type GeoValue struct {
	Type        string    `json:"type"`
	Coordinates []float64 `json:"coordinates"`
}

type NGSILDEntity struct {
	ID               string      `json:"id"`
	Type             string      `json:"type"`
	Name             Property    `json:"name"`
	Description      Property    `json:"description"`
	Location         GeoProperty `json:"location"`
	DateObserved     Property    `json:"dateObserved"`
	Temperature      Property    `json:"temperature"`
	RelativeHumidity Property    `json:"relativeHumidity"`
	CO               Property    `json:"CO"`
	NO2              Property    `json:"NO2"`
	SO2              Property    `json:"SO2"`
	PM10             Property    `json:"PM10"`
	PM25             Property    `json:"PM25"`
	O3               Property    `json:"O3"`
	AirQualityIndex  Property    `json:"airQualityIndex"`
	AirQualityLevel  Property    `json:"airQualityLevel"`
	Reliability      Property    `json:"reliability"`
	Context          []string    `json:"@context"`
}

func ToNGSILD(record *models.AirQuality) NGSILDEntity {
	return NGSILDEntity{
		ID:   record.EntityID,
		Type: record.EntityType,
		Name: Property{
			Type:  "Property",
			Value: record.Name,
		},
		Description: Property{
			Type:  "Property",
			Value: record.Description,
		},
		Location: GeoProperty{
			Type: "GeoProperty",
			Value: GeoValue{
				Type:        "Point",
				Coordinates: []float64{record.LocationLon, record.LocationLat},
			},
		},
		DateObserved: Property{
			Type:  "Property",
			Value: record.DateObserved.Format("2006-01-02T15:04:05Z"),
		},
		Temperature: Property{
			Type:  "Property",
			Value: record.Temperature,
		},
		RelativeHumidity: Property{
			Type:  "Property",
			Value: record.RelativeHumidity,
		},
		CO: Property{
			Type:  "Property",
			Value: record.CO,
		},
		NO2: Property{
			Type:  "Property",
			Value: record.NO2,
		},
		SO2: Property{
			Type:  "Property",
			Value: record.SO2,
		},
		PM10: Property{
			Type:  "Property",
			Value: record.PM10,
		},
		PM25: Property{
			Type:  "Property",
			Value: record.PM25,
		},
		O3: Property{
			Type:  "Property",
			Value: record.O3,
		},
		AirQualityIndex: Property{
			Type:  "Property",
			Value: record.AirQualityIndex,
		},
		AirQualityLevel: Property{
			Type:  "Property",
			Value: record.AirQualityLevel,
		},
		Reliability: Property{
			Type:  "Property",
			Value: record.Reliability,
		},
		Context: NGSILDContext,
	}
}
