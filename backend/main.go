package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"sync"

	"github.com/gin-gonic/gin"
	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
)

/* =====================
   DATA MODELS
===================== */

type WeatherInfo struct {
	Temperature float64
	Humidity    float64
	RainProb    float64
	Summary     string
}

type Prediction struct {
	Next3Days        string `json:"next_3_days"`
	Next7Days        string `json:"next_7_days"`
	RecoveryChance   string `json:"recovery_chance"`
	CriticalWarning  string `json:"critical_warning"`
}

type AnalyzeResult struct {
	Disease         string     `json:"disease"`
	Severity        string     `json:"severity"`
	RiskScore       int        `json:"risk_score"`
	TerrainInsight  string     `json:"terrain_insight"`
	Prediction      Prediction `json:"prediction"`

	FarmerAnswerEN  string `json:"farmer_answer_en"`
	FarmerAnswerBN  string `json:"farmer_answer_bn"`
	FarmerAnswerHI  string `json:"farmer_answer_hi"`
}

type SessionMemory struct {
	Last AnalyzeResult
}

var (
	sessions = map[string]*SessionMemory{}
	lock     sync.Mutex
)

/* =====================
   WEATHER (FREE)
===================== */

func getWeather(lat, lon string) WeatherInfo {
	url := fmt.Sprintf(
		"https://api.open-meteo.com/v1/forecast?latitude=%s&longitude=%s&hourly=temperature_2m,relativehumidity_2m,precipitation_probability&forecast_days=1",
		lat, lon,
	)

	resp, err := http.Get(url)
	if err != nil {
		return WeatherInfo{}
	}
	defer resp.Body.Close()

	var raw map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&raw)

	h := raw["hourly"].(map[string]interface{})
	temp := h["temperature_2m"].([]interface{})[0].(float64)
	hum := h["relativehumidity_2m"].([]interface{})[0].(float64)
	rain := h["precipitation_probability"].([]interface{})[0].(float64)

	summary := "Normal conditions"
	if hum > 75 && rain > 40 {
		summary = "High humidity with rain risk"
	}

	return WeatherInfo{temp, hum, rain, summary}
}

/* =====================
   ALERT ENGINE
===================== */

func generateAlerts(risk int, w WeatherInfo) []string {
	alerts := []string{}
	if risk > 70 {
		alerts = append(alerts, "High risk: immediate action needed")
	}
	if w.Humidity > 80 {
		alerts = append(alerts, "High humidity may increase disease spread")
	}
	if w.RainProb > 50 {
		alerts = append(alerts, "Rain expected – avoid spraying during rain")
	}
	return alerts
}

/* =====================
   MAIN
===================== */

func main() {
	r := gin.Default()

	r.GET("/ping", func(c *gin.Context) {
		c.String(200, "pong")
	})

	r.POST("/analyze", analyze)
	r.POST("/chat", chat)

	r.Static("/ui", "./static")
	r.Run(":8080")
}

/* =====================
   ANALYZE (SCAN)
===================== */

func analyze(c *gin.Context) {
	sessionID := c.DefaultPostForm("session_id", "default")
	question := c.DefaultPostForm("question", "What disease is this?")
	lat := c.DefaultPostForm("lat", "22.57")
	lon := c.DefaultPostForm("lon", "88.36")

	file, _ := c.FormFile("image")
	f, _ := file.Open()
	defer f.Close()
	imgBytes, _ := io.ReadAll(f)

	weather := getWeather(lat, lon)

	ctx := context.Background()
	client, _ := genai.NewClient(ctx, option.WithAPIKey(os.Getenv("GEMINI_API_KEY")))
	model := client.GenerativeModel("models/gemini-3-flash-preview")

	prompt := fmt.Sprintf(`
You are an expert agronomist.

Use leaf image, weather, and farmer question.

Weather:
Temp %.1f°C
Humidity %.1f%%
Rain %.1f%%
Summary: %s

Infer terrain, risk, and predict disease progression.

Return ONLY valid JSON:
{
  "disease":"",
  "severity":"",
  "risk_score":0,
  "terrain_insight":"",
  "prediction":{
    "next_3_days":"",
    "next_7_days":"",
    "recovery_chance":"",
    "critical_warning":""
  },
  "farmer_answer_en":"",
  "farmer_answer_bn":"",
  "farmer_answer_hi":""
}

Farmer question:
"%s"
`,
		weather.Temperature,
		weather.Humidity,
		weather.RainProb,
		weather.Summary,
		question,
	)

	resp, err := model.GenerateContent(
		ctx,
		genai.Blob{MIMEType: "image/jpeg", Data: imgBytes},
		genai.Text(prompt),
	)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	raw := string(resp.Candidates[0].Content.Parts[0].(genai.Text))
	var result AnalyzeResult
	json.Unmarshal([]byte(raw), &result)

	lock.Lock()
	sessions[sessionID] = &SessionMemory{Last: result}
	lock.Unlock()

	alerts := generateAlerts(result.RiskScore, weather)

	c.JSON(200, gin.H{
		"weather_summary": weather.Summary,
		"alerts":          alerts,
		"result":          result,
	})
}

/* =====================
   CHAT
===================== */

func chat(c *gin.Context) {
	var req struct {
		SessionID string `json:"session_id"`
		Message   string `json:"message"`
		Lat       string `json:"lat"`
		Lon       string `json:"lon"`
	}
	c.BindJSON(&req)

	lock.Lock()
	mem := sessions[req.SessionID]
	lock.Unlock()

	ctx := context.Background()
	client, _ := genai.NewClient(ctx, option.WithAPIKey(os.Getenv("GEMINI_API_KEY")))
	model := client.GenerativeModel("models/gemini-3-flash-preview")

	prompt := fmt.Sprintf(`
You are an expert agronomist.

Context:
Disease: %s
Severity: %s
Risk: %d

Answer farmer.

Return ONLY JSON:
{
  "farmer_answer_en":"",
  "farmer_answer_bn":"",
  "farmer_answer_hi":""
}

Question:
"%s"
`,
		mem.Last.Disease,
		mem.Last.Severity,
		mem.Last.RiskScore,
		req.Message,
	)

	resp, _ := model.GenerateContent(ctx, genai.Text(prompt))
	raw := string(resp.Candidates[0].Content.Parts[0].(genai.Text))

	var out map[string]string
	json.Unmarshal([]byte(raw), &out)
	c.JSON(200, out)
}
