package utils

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"os"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func GenerateAccessToken(userID int) (string, error) {
	// Load the JWT secret from environment variables
	secret := os.Getenv("JWT_ACCESS_SECRET")
	if secret == "" {
		secret = "default-access-secret"
	}

	// Read the access token lifetime (in minutes)
	ttlMin, _ := strconv.Atoi(os.Getenv("ACCESS_TOKEN_TTL_MIN"))
	if ttlMin == 0 {
		ttlMin = 15
	}

	// Define token claims with user ID, issue time, and expiration
	claims := jwt.MapClaims{
		"userId": userID,
		"exp":    time.Now().Add(time.Minute * time.Duration(ttlMin)).Unix(),
		"iat":    time.Now().Unix(),
	}

	// Create a new JWT using the HS256 signing algorithm
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Sign the token using the secret key
	return token.SignedString([]byte(secret))
}

func NewRefreshToken() (rawToken string, hash string, exp time.Time, err error) {
	// Generate a new refresh token and its hashed version.
	// The raw token is returned to the client, while the hash
	// is stored securely in the database for later validation.

	// Allocate a 32-byte slice to hold random bytes for the token.
	b := make([]byte, 32)

	// Fill the slice with cryptographically secure random data.
	// If generation fails, return immediately with an error.
	_, err = rand.Read(b)
	if err != nil {
		return "", "", time.Time{}, err
	}

	// Encode the random bytes into a URL-safe Base64 string
	// so it can be safely sent to the client.
	rawToken = base64.RawURLEncoding.EncodeToString(b)

	// Hash the raw token using SHA-256 so that only the hashed value
	// is stored in the database (similar to how passwords are stored).
	sum := sha256.Sum256([]byte(rawToken))

	// Base64-encode the hash to make it easier to store and compare.
	hash = base64.RawURLEncoding.EncodeToString(sum[:])

	// Read the token lifetime (in days) from the environment variable.
	days, _ := strconv.Atoi(os.Getenv("REFRESH_TOKEN_TTL_DAYS"))

	// If not set, default to 30 days.
	if days == 0 {
		days = 30
	}

	// Calculate the token’s expiry timestamp by adding the TTL to the current time.
	exp = time.Now().Add(time.Hour * 24 * time.Duration(days))

	// Return the raw token for the client, the hashed version for storage,
	// the expiry time, and any potential error.
	return rawToken, hash, exp, nil
}
