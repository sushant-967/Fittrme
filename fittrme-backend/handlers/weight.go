package handlers

import (
	"database/sql"
	"fittrme-backend/database"
	"fittrme-backend/models"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func extractUserID(c *gin.Context) (int, bool) {
	uidI, exists := c.Get("userId")
	if !exists {
		return 0, false
	}
	switch v := uidI.(type) {
	case int:
		return v, true
	case int64:
		return int(v), true
	case float64:
		return int(v), true
	case string:
		if n, err := strconv.Atoi(v); err == nil {
			return n, true
		}
	}
	return 0, false
}
func GetWeight(c *gin.Context) {
	userId, ok := extractUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized - user id missing"})
		return
	}

	// Query using your REAL column: dm_lstupddt
	row := database.DB.QueryRow(`
        SELECT user_id, current_weight, target_weight, height,
               COALESCE(dm_lstupddt, NOW())
        FROM weights
        WHERE user_id = $1
        ORDER BY dm_lstupddt DESC
        LIMIT 1
    `, userId)

	var uid sql.NullInt64
	var current sql.NullFloat64
	var target sql.NullFloat64
	var height sql.NullFloat64
	var measuredAt sql.NullString

	err := row.Scan(&uid, &current, &target, &height, &measuredAt)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"message": "No weight record found for this user"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":  "Database error",
			"detail": err.Error(),
		})
		return
	}

	weight := models.Weight{
		UserID:        int(uid.Int64),
		CurrentWeight: current.Float64,
		TargetWeight:  target.Float64,
		Height:        height.Float64,
	}

	c.JSON(http.StatusOK, gin.H{
		"userId": userId,
		"weight": gin.H{
			"userId":        weight.UserID,
			"currentWeight": weight.CurrentWeight,
			"targetWeight":  weight.TargetWeight,
			"height":        weight.Height,
			"measured_at":   measuredAt.String, // returning dm_lstupddt as measured_at
		},
	})
}

func SaveWeight(c *gin.Context) {
	userId, ok := extractUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized - user id missing"})
		return
	}

	var payload models.Weight
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if payload.CurrentWeight <= 0 || payload.TargetWeight <= 0 || payload.Height <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input values"})
		return
	}
	_, err := database.DB.Exec(`
    INSERT INTO weights (user_id, current_weight, target_weight, height, dm_lstupddt)
    VALUES ($1, $2, $3, $4, NOW())
    ON CONFLICT (user_id)
    DO UPDATE SET 
        current_weight = EXCLUDED.current_weight,
        target_weight = EXCLUDED.target_weight,
        height = EXCLUDED.height,
        dm_lstupddt = NOW()
`, userId, payload.CurrentWeight, payload.TargetWeight, payload.Height)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save weight data", "detail": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Weight data saved successfully",
		"weight": gin.H{
			"userId":        userId,
			"currentWeight": payload.CurrentWeight,
			"targetWeight":  payload.TargetWeight,
			"height":        payload.Height,
		},
	})
}
