package interfaces

import (
	"github.com/CTU-SematX/SmartCity/client"
	"github.com/CTU-SematX/SmartCity/types"
)

type WeatherClient interface {
	GetWeather(query *types.WeatherRequest) (*types.WeatherResponse, error)
	GetWeatherCity(query *types.WeatherCityRequest) (client.JSONLD, error)
}

type AirQualityClient interface {
	GetAirQualityLocation(query *types.AirQualityLocationRequest) ([]client.JSONLD, error)
	GetAirQualityCountry(query *types.AirQualityCountryRequest) ([]client.JSONLD, error)
}
