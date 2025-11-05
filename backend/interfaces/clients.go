package interfaces

import (
	"github.com/CTU-SematX/SmartCity/types"
)

type WeatherClient interface {
	GetWeather(query *types.WeatherRequest) (*types.WeatherResponse, error)
}

type AirQualityClient interface {
	GetAirQualityLocation(query *types.AirQualityLocationRequest) (*types.AirQualityLocationResponse, error)
	GetAirQualityCountry(query *types.AirQualityCountryRequest) (*types.AirQualityCountryResponse, error)
}
