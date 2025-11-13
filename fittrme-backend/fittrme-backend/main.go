package main

import (
	"fittrme-backend/database"
	"fittrme-backend/handlers"
	"fittrme-backend/middleware"
	"net/http"

	"github.com/gin-gonic/gin"
)

func main() {
	// Step 1: Connect to PostgreSQL database
	database.ConnectDB()

	// Step 2: Initialize Gin router
	router := gin.Default()

	// Step 3: Handle CORS (for frontend access, like React Native app)
	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	})

	// Step 4: Group all API routes under a common prefix
	api := router.Group("/fittrme-api")

	// Public routes (no authentication required)
	api.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "FittrMe backend is running 🚀"})
	})
	api.POST("/register", handlers.SignupUser)
	api.POST("/login", handlers.LoginUser)

	// Protected routes (authentication required)
	protected := api.Group("/")
	protected.Use(middleware.AuthRequired())
	{
		protected.GET("/weight", handlers.GetWeight)
		protected.POST("/weight", handlers.SaveWeight)
		protected.POST("/logout", handlers.LogoutUser)
	}

	// Step 5: Start the server
	router.Run(":8080")
}
