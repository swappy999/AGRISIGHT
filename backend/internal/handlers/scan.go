func performDiagnosis(ctx context.Context, imageBytes []byte) (string, error) {
    // 1. Create the Gemini Client with your specific API Key
    client, err := genai.NewClient(ctx, &genai.ClientConfig{
        APIKey:  "AIzaSyDgqZOhwYsUruPWu3tExN4CxyerlG9_2qo",
        Backend: genai.BackendGeminiAPI,
    })
    if err != nil {
        return "", err
    }

    // 2. Prepare the prompt for the "Specialist"
    parts := []*genai.Part{
        {Text: "You are an agricultural specialist. Analyze this leaf and provide: 1. Disease Name, 2. Severity, 3. Organic Treatment, 4. Chemical Treatment."},
        {InlineData: &genai.Blob{Data: imageBytes, MIMEType: "image/jpeg"}},
    }

    // 3. Generate the diagnosis using the Flash model
    result, err := client.Models.GenerateContent(ctx, "gemini-2.0-flash", []*genai.Content{{Parts: parts}}, nil)
    if err != nil {
        return "", err
    }

    return result.Text(), nil
}