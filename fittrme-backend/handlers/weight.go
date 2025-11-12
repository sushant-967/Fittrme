package handlers

import (
	"fittrme-backend/database"
	"fittrme-backend/models"
	"net/http"
	"database/sql" 
	"github.com/gin-gonic/gin"
)

func GetWeight(c *gin.Context) {
	// Step 1: Extract userId from context (added by AuthRequired middleware)
	userId, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Step 2: Query for this user's weight record (no ID or recorded_at)
	row := database.DB.QueryRow(`
		SELECT user_id, current_weight, target_weight, height
		FROM weights
		WHERE user_id = $1
	`, userId.(int))

	// Step 3: Scan into your struct
	var weight models.Weight
	err := row.Scan(&weight.UserID, &weight.CurrentWeight, &weight.TargetWeight, &weight.Height)

	// Step 4: Handle possible errors
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"message": "No weight record found for this user"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	// Step 5: Return the record
	c.JSON(http.StatusOK, gin.H{
		"userId": userId,
		"weight": weight,
	})
}

func SaveWeight(c *gin.Context) {
	// Step 1: Extract userId from JWT context
	userId, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Step 2: Parse input JSON
	var payload models.Weight
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Step 3: Basic validation
	if payload.CurrentWeight <= 0 || payload.TargetWeight <= 0 || payload.Height <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input values"})
		return
	}

	// Step 4: Insert or update record
	_, err := database.DB.Exec(`
		INSERT INTO weights (user_id, current_weight, target_weight, height)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (user_id)
		DO UPDATE SET current_weight = EXCLUDED.current_weight,
					  target_weight = EXCLUDED.target_weight,
					  height = EXCLUDED.height
	`, userId.(int), payload.CurrentWeight, payload.TargetWeight, payload.Height)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save weight data"})
		return
	}

	// Step 5: Return success response
	c.JSON(http.StatusOK, gin.H{
		"message": "Weight data saved successfully",
		"data": gin.H{
			"userId":        userId,
			"currentWeight": payload.CurrentWeight,
			"targetWeight":  payload.TargetWeight,
			"height":        payload.Height,
		},
	})
}
