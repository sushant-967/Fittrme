package handlers

import (
	"database/sql"
	"errors"
	"fittrme-backend/database"
	"fittrme-backend/models"
	"fittrme-backend/utils"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

func SignupUser(c *gin.Context) {
	// 1) Parse + validate JSON
	var input models.SignupInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	//trim the email address(space before and after ) and then changing to lowercase because mails are case insensitive
	email := strings.ToLower(strings.TrimSpace(input.Email))

	//check where email already exists
	var exists bool
	err := database.DB.QueryRow(`select Exists(select 1 from users where email=$1)`, email).Scan(&exists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	if exists {
		c.JSON(http.StatusConflict, gin.H{"error": "Email already registered"})
		return
	}

	// 4) bcrypt hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// 5️⃣ Insert user into DB
	var newUser models.User
	err = database.DB.QueryRow(`
	INSERT INTO users (username, email, password_hash)
	VALUES ($1, $2, $3)
	RETURNING user_id, username, email, password_hash, created_at
`, input.Username, email, string(hashedPassword)).Scan(
		&newUser.UserID,
		&newUser.Username,
		&newUser.Email,
		&newUser.PasswordHash,
		&newUser.CreatedAt,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error creating user"})
		return
	}

	//return response
	c.JSON(http.StatusCreated, gin.H{
		"message": "user registered successfully",
		"user":    newUser,
	})

}

func LoginUser(c *gin.Context) {
	var input models.LoginInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var user models.User
	row := database.DB.QueryRow(`select user_id, username, email, password_hash, created_at from users where username=$1`, input.Username)
	err := row.Scan(&user.UserID, &user.Username, &user.Email, &user.PasswordHash, &user.CreatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Username doesn't exist"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	//compare password
	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.Password))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid password"})
		return
	}

	// Generate a short-lived access token (JWT) for this user.
	// If token signing fails, return 500 with a generic error.
	accessToken, err := utils.GenerateAccessToken(user.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate access token"})
		return
	}

	// Create a long-lived refresh token:
	// - generate a random raw token for the client
	// - compute its SHA-256 hash for storage in the database
	// - compute its expiry timestamp based on env config
	// If generation fails, return 500.
	rawRefreshToken, refreshTokenHash, refreshTokenExp, err := utils.NewRefreshToken()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate refresh token"})
		return
	}

	// Persist the hashed refresh token in the database so we can validate future refresh requests.
	// (We only store the hash, never the raw token.)
	// If the insert fails, return 500.
	_, err = database.DB.Exec(`
	INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
	VALUES ($1, $2, $3)
`, user.UserID, refreshTokenHash, refreshTokenExp)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to store refresh token"})
		return
	}

	// Build the login response:
	// - include the access token (JWT)
	// - include the raw refresh token (client must store this securely)
	// - include minimal user info needed by the client (id/username/email)
	// Return 200 OK with the JSON payload.
	c.JSON(http.StatusOK, gin.H{
		"message":      "Login successful",
		"accessToken":  accessToken,
		"refreshToken": rawRefreshToken,
		"user": gin.H{
			"userId":   user.UserID,
			"username": user.Username,
			"email":    user.Email,
		},
	})

}

// LogoutUser invalidates all refresh tokens for a logged-in user.
// This ensures that they must log in again to get new tokens.
func LogoutUser(c *gin.Context) {
	// Step 1: Extract userId from JWT context
	userId, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Step 2: Delete all refresh tokens for this user
	_, err := database.DB.Exec(`DELETE FROM refresh_tokens WHERE user_id = $1`, userId.(int))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to logout user"})
		return
	}

	// Step 3: Return success message
	c.JSON(http.StatusOK, gin.H{
		"message": "Logout successful",
	})
}
