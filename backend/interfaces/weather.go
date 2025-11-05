package interfaces

import (
	"github.com/smartcity/backend/types/weather"
)

type WeatherQuery struct {
	Lat     float64
	Lon     float64
	Exclude []string
	Units   string
	Lang    string
}

type WeatherClient interface {
	GetWeather(query WeatherQuery) (*weather.WeatherResponse, error)
}
