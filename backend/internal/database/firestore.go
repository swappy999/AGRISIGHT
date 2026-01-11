// internal/database/firestore.go
package database

import (
	"context"
	"log"
	"cloud.google.com/go/firestore"
	firebase "firebase.google.com/go/v4"
	"google.golang.org/api/option"
)

func InitFirestore() *firestore.Client {
	ctx := context.Background()
	// Using the JSON file you generated
	sa := option.WithCredentialsFile("serviceAccountKey.json")
	app, err := firebase.NewApp(ctx, nil, sa)
	if err != nil {
		log.Fatalf("error initializing firebase app: %v", err)
	}

	client, err := app.Firestore(ctx)
	if err != nil {
		log.Fatalf("error getting firestore client: %v", err)
	}
	return client
}
type ScanResult struct {
	UserID      string    `firestore:"user_id" json:"user_id"`
	DiseaseName string    `firestore:"disease_name" json:"disease_name"`
	Severity    string    `firestore:"severity" json:"severity"`
	Treatment   string    `firestore:"treatment" json:"treatment"`
	Timestamp   time.Time `firestore:"timestamp" json:"timestamp"`
}