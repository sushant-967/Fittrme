package models

import "time"

type User struct {
	UserID       int       `json:"userId" db:"user_id"`
	Username     string    `json:"username" db:"username"`
	Email        string    `json:"email" db:"email"`
	PasswordHash string    `json:"-" db:"password_hash"` // never exposed in API
	CreatedAt    time.Time `json:"createdAt" db:"created_at"`
}
