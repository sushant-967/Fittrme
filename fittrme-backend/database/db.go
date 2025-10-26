package database

import (
	"database/sql"
	"fmt"
	"log"	

	_ "github.com/lib/pq" // PostgreSQL driver
)
var DB *sql.DB

func ConnectDB(){
	connStr:="postgres://postgres:Sushant24@localhost:5432/fittrme?sslmode=disable"
	var err error
	DB,err=sql.Open("postgres",connStr)
	if err!=nil{
		log.Fatal("Error connecting to the database: ", err)
	}
	err=DB.Ping()
	if err!=nil{
		log.Fatal("Error pinging the database: ", err)
	}
	fmt.Println("Successfully connected to the database!")
	
}