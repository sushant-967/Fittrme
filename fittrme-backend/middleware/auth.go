package middleware

import (
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func AuthRequired() gin.HandlerFunc {
	// AuthRequired is a middleware that protects private routes.
	// It ensures that the incoming request includes a valid access token (JWT).

	return func(c *gin.Context) {
		// Step 1: Extract the "Authorization" header from the request.
		// Expected format: "Bearer <access-token>".
		// If the header is missing or doesn't start with "Bearer ", return 401 Unauthorized.
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Missing or invalid Authorization header"})
			return
		}

		// Step 2: Remove the "Bearer " prefix to isolate the actual JWT string.
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")

		// Step 3: Parse and validate the token using the JWT_ACCESS_SECRET from environment variables.
		// If the token signature is invalid or the token has expired, return 401 Unauthorized.
		secret := os.Getenv("JWT_ACCESS_SECRET")
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			// Make sure the signing method used is HMAC (HS256)
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method")
			}
			return []byte(secret), nil
		})
		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			return
		}

		// Step 4: Extract claims (payload) from the token after validation.
		// The claims should contain the userId that was added during login.
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			return
		}

		// Step 5: Retrieve the "userId" field from the claims map.
		// If it doesn't exist or is invalid, return 401 Unauthorized.
		userId, ok := claims["userId"].(float64)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Missing user ID in token"})
			return
		}

		// Step 6: Store the userId in the Gin context so that downstream handlers can access it
		// using c.Get("userId") — for example, to fetch the user's data from the database.
		c.Set("userId", int(userId))

		// Step 7: Allow the request to continue to the next handler in the middleware chain.
		c.Next()
	}
}
