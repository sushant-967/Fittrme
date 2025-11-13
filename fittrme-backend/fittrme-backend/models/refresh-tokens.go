package models

import "time"

type RefreshToken struct {
	ID        int       `json:"id"`
	UserID    int       `json:"userId"`
	TokenHash string    `json:"tokenHash"`
	ExpiresAt time.Time `json:"expiresAt"`
	Revoked   bool      `json:"revoked"`
	CreatedAt time.Time `json:"createdAt"`
}
