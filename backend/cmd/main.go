func main() {
    r := gin.Default()
    dbClient := database.InitFirestore() // Your existing Firestore client

    r.POST("/api/diagnose", func(c *gin.Context) {
        // 1. Get image from Flutter (multipart form)
        file, _ := c.FormFile("image")
        uploadedFile, _ := file.Open()
        imgBytes, _ := io.ReadAll(uploadedFile)

        // 2. Call Gemini for the "Specialist" report
        diagnosis, err := performDiagnosis(c.Request.Context(), imgBytes)
        
        // 3. Save result to Firestore "scans" collection
        newScan := map[string]interface{}{
            "diagnosis": diagnosis,
            "timestamp": time.Now(),
        }
        dbClient.Collection("scans").Add(c.Request.Context(), newScan)

        // 4. Send the diagnosis back to the Flutter UI
        c.JSON(200, gin.H{"diagnosis": diagnosis})
    })
    defer dbClient.Close()

	r.POST("/api/scan", func(c *gin.Context) {
		var result ScanResult
		if err := c.ShouldBindJSON(&result); err != nil {
			c.JSON(400, gin.H{"error": "Invalid data"})
			return
		}

		// Save to Firestore "scans" collection
		_, _, err := dbClient.Collection("scans").Add(context.Background(), result)
		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to save to database"})
			return
		}

		c.JSON(200, gin.H{"status": "Scan history updated!"})
	})
    r.POST("/api/scan", handlers.HandleLeafScan)

    r.Run(":8080")
}