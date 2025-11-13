package models

type Weight struct {
	UserID        int     `json:"userId"`
	CurrentWeight float64 `json:"currentWeight"`
	TargetWeight  float64 `json:"targetWeight"`
	Height        float64 `json:"height"`
}
