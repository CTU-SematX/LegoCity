package interfaces

import (
	"github.com/CTU-SematX/SmartCity/types"
)

type WeatherClient interface {
	GetWeather(query *types.WeatherRequest) (*types.WeatherResponse, error)
}

type AirQualityClient interface {
	GetAirQuality(query *types.AirQualityRequest) (*types.AirQualityResponse, error)
}
