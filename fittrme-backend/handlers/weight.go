package handlers

import (
	"database/sql"
	"fittrme-backend/database"
	"fittrme-backend/models"
	"net/http"


	"github.com/gin-gonic/gin"
)

func GetWeight(c *gin.Context){
	userID := c.Param("userId")
	var weight models.Weight
	row:=database.DB.QueryRow(`Select user_id,current_weight,target_weight,height FROM weights where user_id=$1`,userID)
	err:=row.Scan(&weight.UserID,&weight.CurrentWeight,&weight.TargetWeight,&weight.Height)
	if err==sql.ErrNoRows{
		c.JSON(http.StatusNotFound, gin.H{"error": "Weight data not found"})
		return
	}else if err!=nil{
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return 
	}
	c.JSON(http.StatusOK,weight)
	
}

func SaveWeight(c *gin.Context){
	var payload models.Weight
	if err:=c.ShouldBindJSON(&payload);err!=nil{
		c.JSON(http.StatusBadRequest,gin.H{"error":err.Error()})
		return
	}

	_,err:=database.DB.Exec(`INSERT INTO weights (user_id,current_weight,target_weight,height) VALUES ($1,$2,$3,$4) ON CONFLICT (user_id) DO UPDATE SET current_weight=$2,target_weight=$3,height=$4`,payload.UserID,payload.CurrentWeight,payload.TargetWeight,payload.Height)

	if err!=nil{
		c.JSON(http.StatusInternalServerError,gin.H{"error":err.Error()})
		return
	}

	c.JSON(http.StatusOK,gin.H{"message":"Weight data saved successfully","user":payload})

}