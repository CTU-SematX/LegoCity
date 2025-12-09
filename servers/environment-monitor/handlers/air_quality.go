/**
 * LegoCity - Smart City Platform
 * @version 1.0
 * @author CTU·SematX
 * @copyright (c) 2025 CTU·SematX. All rights reserved
 * @license MIT License
 * @see https://github.com/CTU-SematX/LegoCity The LegoCity GitHub project
 */

package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"environment-monitor/database"
	"environment-monitor/models"
	"environment-monitor/ngsi"

	"github.com/gin-gonic/gin"
)

var BrokerURL = "http://localhost:1026"

func SetBrokerURL(url string) {
	BrokerURL = url
}

// ListAirQuality godoc
// @Summary List all air quality records
// @Tags AirQuality
// @Produce json
// @Param skip query int false "Skip records" default(0)
// @Param limit query int false "Limit records" default(100)
// @Success 200 {array} models.AirQuality
// @Router /air-quality [get]
func ListAirQuality(c *gin.Context) {
	skip, _ := strconv.Atoi(c.DefaultQuery("skip", "0"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "100"))

	var records []models.AirQuality
	database.DB.Offset(skip).Limit(limit).Find(&records)

	c.JSON(http.StatusOK, records)
}

// GetAirQuality godoc
// @Summary Get air quality record by ID
// @Tags AirQuality
// @Produce json
// @Param id path int true "Record ID"
// @Success 200 {object} models.AirQuality
// @Failure 404 {object} map[string]string
// @Router /air-quality/{id} [get]
func GetAirQuality(c *gin.Context) {
	id := c.Param("id")
	var record models.AirQuality

	if err := database.DB.First(&record, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Record not found"})
		return
	}

	c.JSON(http.StatusOK, record)
}

// CreateAirQuality godoc
// @Summary Create new air quality record
// @Tags AirQuality
// @Accept json
// @Produce json
// @Param data body models.AirQualityCreate true "Air quality data"
// @Success 201 {object} models.AirQuality
// @Failure 400 {object} map[string]string
// @Router /air-quality [post]
func CreateAirQuality(c *gin.Context) {
	var input models.AirQualityCreate
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	record := models.AirQuality{
		EntityID:         input.EntityID,
		EntityType:       input.EntityType,
		Name:             input.Name,
		Description:      input.Description,
		LocationLon:      input.LocationLon,
		LocationLat:      input.LocationLat,
		DateObserved:     input.DateObserved,
		Temperature:      input.Temperature,
		RelativeHumidity: input.RelativeHumidity,
		CO:               input.CO,
		NO2:              input.NO2,
		SO2:              input.SO2,
		PM10:             input.PM10,
		PM25:             input.PM25,
		O3:               input.O3,
		AirQualityIndex:  input.AirQualityIndex,
		AirQualityLevel:  input.AirQualityLevel,
		Reliability:      input.Reliability,
	}

	if record.EntityType == "" {
		record.EntityType = "AirQualityObserved"
	}

	if err := database.DB.Create(&record).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, record)
}

// UpdateAirQuality godoc
// @Summary Update air quality record
// @Tags AirQuality
// @Accept json
// @Produce json
// @Param id path int true "Record ID"
// @Param data body models.AirQualityUpdate true "Update data"
// @Success 200 {object} models.AirQuality
// @Failure 404 {object} map[string]string
// @Router /air-quality/{id} [put]
func UpdateAirQuality(c *gin.Context) {
	id := c.Param("id")
	var record models.AirQuality

	if err := database.DB.First(&record, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Record not found"})
		return
	}

	var input models.AirQualityUpdate
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	database.DB.Model(&record).Updates(input)
	c.JSON(http.StatusOK, record)
}

// DeleteAirQuality godoc
// @Summary Delete air quality record
// @Tags AirQuality
// @Param id path int true "Record ID"
// @Success 200 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /air-quality/{id} [delete]
func DeleteAirQuality(c *gin.Context) {
	id := c.Param("id")
	var record models.AirQuality

	if err := database.DB.First(&record, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Record not found"})
		return
	}

	database.DB.Delete(&record)
	c.JSON(http.StatusOK, gin.H{"message": "Record deleted successfully"})
}

// PushToBroker godoc
// @Summary Push record to Context Broker
// @Tags Broker
// @Param id path int true "Record ID"
// @Success 200 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /air-quality/{id}/push [post]
func PushToBroker(c *gin.Context) {
	id := c.Param("id")
	var record models.AirQuality

	if err := database.DB.First(&record, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Record not found"})
		return
	}

	ngsiEntity := ngsi.ToNGSILD(&record)
	jsonData, _ := json.Marshal(ngsiEntity)

	resp, err := http.Post(
		fmt.Sprintf("%s/ngsi-ld/v1/entities", BrokerURL),
		"application/ld+json",
		bytes.NewBuffer(jsonData),
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusConflict {
		// Entity exists, try to update
		req, _ := http.NewRequest(
			"PATCH",
			fmt.Sprintf("%s/ngsi-ld/v1/entities/%s/attrs", BrokerURL, record.EntityID),
			bytes.NewBuffer(jsonData),
		)
		req.Header.Set("Content-Type", "application/ld+json")

		client := &http.Client{}
		resp, err = client.Do(req)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer resp.Body.Close()
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "Pushed successfully",
		"entity_id": record.EntityID,
	})
}

// PushAllToBroker godoc
// @Summary Push all records to Context Broker
// @Tags Broker
// @Success 200 {object} map[string]interface{}
// @Router /air-quality/push-all [post]
func PushAllToBroker(c *gin.Context) {
	var records []models.AirQuality
	database.DB.Find(&records)

	results := gin.H{
		"success": 0,
		"failed":  0,
		"errors":  []string{},
	}

	for _, record := range records {
		ngsiEntity := ngsi.ToNGSILD(&record)
		jsonData, _ := json.Marshal(ngsiEntity)

		resp, err := http.Post(
			fmt.Sprintf("%s/ngsi-ld/v1/entities", BrokerURL),
			"application/ld+json",
			bytes.NewBuffer(jsonData),
		)

		if err != nil {
			results["failed"] = results["failed"].(int) + 1
			continue
		}
		resp.Body.Close()

		if resp.StatusCode == http.StatusConflict {
			req, _ := http.NewRequest(
				"PATCH",
				fmt.Sprintf("%s/ngsi-ld/v1/entities/%s/attrs", BrokerURL, record.EntityID),
				bytes.NewBuffer(jsonData),
			)
			req.Header.Set("Content-Type", "application/ld+json")

			client := &http.Client{}
			resp, err = client.Do(req)
			if err != nil {
				results["failed"] = results["failed"].(int) + 1
				continue
			}
			resp.Body.Close()
		}

		results["success"] = results["success"].(int) + 1
	}

	c.JSON(http.StatusOK, results)
}

// GetAsNGSILD godoc
// @Summary Get record as NGSI-LD format
// @Tags NGSI-LD
// @Produce json
// @Param id path int true "Record ID"
// @Success 200 {object} ngsi.NGSILDEntity
// @Failure 404 {object} map[string]string
// @Router /air-quality/{id}/ngsi-ld [get]
func GetAsNGSILD(c *gin.Context) {
	id := c.Param("id")
	var record models.AirQuality

	if err := database.DB.First(&record, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Record not found"})
		return
	}

	c.JSON(http.StatusOK, ngsi.ToNGSILD(&record))
}
