package main

import (
	"context"
	"fmt"

	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
)

func main() {
	ctx := context.Background()

	API_KEY := ""

	client, err := genai.NewClient(ctx, option.WithAPIKey(API_KEY))
	if err != nil {
		panic(err)
	}
	defer client.Close()

	it := client.ListModels(ctx)
	for {
		model, err := it.Next()
		if err != nil {
			break
		}
		fmt.Println(model.Name, " → ", model.SupportedGenerationMethods)
	}
}
