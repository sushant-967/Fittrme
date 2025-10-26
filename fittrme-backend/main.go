package main

import (
	"fittrme-backend/database"
	"fittrme-backend/handlers"

	"github.com/gin-gonic/gin"
)

func main() {
	database.ConnectDB()
	r := gin.Default()

	// Allow CORS for mobile frontend
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Origin, Content-Type")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	api := r.Group("/api")
	{
		api.GET("/weight/:userId", handlers.GetWeight)
		api.POST("/weight", handlers.SaveWeight)
	}
	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "Welcome to FittrMe Backend"})
	})
	r.Run(":5000")
}
