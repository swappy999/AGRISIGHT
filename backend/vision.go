package main

import (
	"context"
	"fmt"
	"os"

	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
)

func main() {
	ctx := context.Background()

	// Put your Gemini API key here
	apiKey := "AIzaSyCRmPBHrl97mxCPizKgLcFMjFvZNsAukuA"

	client, err := genai.NewClient(ctx, option.WithAPIKey(apiKey))
	if err != nil {
		panic(err)
	}
	defer client.Close()

	// Use Gemini-3 multimodal
	model := client.GenerativeModel("models/gemini-3-flash-preview")

	// Load the image
	img, err := os.ReadFile("leaf.jpeg")
	if err != nil {
		panic("Cannot read leaf.jpeg — make sure it is in the same folder")
	}

	prompt := `
You are an expert plant pathologist.
Analyze this leaf image and return:
1. Disease or pest name
2. Severity (Low, Medium, High)
3. Main symptoms
4. Organic treatment
5. Chemical treatment
6. IPM strategy
`

	// Send text + image to Gemini
	resp, err := model.GenerateContent(ctx,
		genai.Text(prompt),
		genai.Blob{
			MIMEType: "image/jpeg",
			Data:     img,
		},
	)
	if err != nil {
		panic(err)
	}

	fmt.Println("---- AGRISIGHT AI Diagnosis ----")
	fmt.Println(resp.Candidates[0].Content.Parts[0])
}
