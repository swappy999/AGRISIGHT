// Sample code to add "Crop Stats" mentioned in your PDF
func saveCropStats(client *firestore.Client) {
    _, _, err := client.Collection("crops").Add(context.Background(), map[string]interface{}{
        "crop_type":    "Tomato",
        "health_status": "Healthy",
        "soil_moisture": "45%",
        "timestamp":    time.Now(),
    })
    if err != nil {
        log.Fatalf("Failed adding crop stats: %v", err)
    }
    fmt.Println("Crop data saved successfully!")
}