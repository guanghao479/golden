package crawler

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/example/golden/backend/internal/config"
	"github.com/example/golden/backend/internal/models"
)

type FirecrawlClient struct {
	apiKey string
	client *http.Client
}

type FirecrawlRequest struct {
	URL    string      `json:"url"`
	Schema interface{} `json:"schema"`
}

type FirecrawlResponse struct {
	Data json.RawMessage `json:"data"`
}

func NewFirecrawlClient(cfg config.Config) *FirecrawlClient {
	return &FirecrawlClient{
		apiKey: cfg.FirecrawlAPIKey,
		client: &http.Client{Timeout: 30 * time.Second},
	}
}

func (f *FirecrawlClient) ExtractEvents(url string) ([]models.EventSchema, error) {
	if f.apiKey == "" {
		return nil, errors.New("missing FIRECRAWL_API_KEY")
	}

	payload := FirecrawlRequest{
		URL: url,
		Schema: map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"events": map[string]interface{}{
					"type": "array",
					"items": map[string]interface{}{
						"type": "object",
						"properties": map[string]interface{}{
							"title":         map[string]string{"type": "string"},
							"description":   map[string]string{"type": "string"},
							"start_time":    map[string]string{"type": "string"},
							"end_time":      map[string]string{"type": "string"},
							"location_name": map[string]string{"type": "string"},
							"address":       map[string]string{"type": "string"},
							"website":       map[string]string{"type": "string"},
							"tags":          map[string]interface{}{"type": "array", "items": map[string]string{"type": "string"}},
						},
					},
				},
			},
		},
	}

	var response struct {
		Events []models.EventSchema `json:"events"`
	}

	if err := f.doRequest(payload, &response); err != nil {
		return nil, err
	}

	return response.Events, nil
}

func (f *FirecrawlClient) ExtractPlaces(url string) ([]models.PlaceSchema, error) {
	if f.apiKey == "" {
		return nil, errors.New("missing FIRECRAWL_API_KEY")
	}

	payload := FirecrawlRequest{
		URL: url,
		Schema: map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"places": map[string]interface{}{
					"type": "array",
					"items": map[string]interface{}{
						"type": "object",
						"properties": map[string]interface{}{
							"name":            map[string]string{"type": "string"},
							"description":     map[string]string{"type": "string"},
							"category":        map[string]string{"type": "string"},
							"address":         map[string]string{"type": "string"},
							"website":         map[string]string{"type": "string"},
							"family_friendly": map[string]string{"type": "boolean"},
							"tags":            map[string]interface{}{"type": "array", "items": map[string]string{"type": "string"}},
						},
					},
				},
			},
		},
	}

	var response struct {
		Places []models.PlaceSchema `json:"places"`
	}

	if err := f.doRequest(payload, &response); err != nil {
		return nil, err
	}

	return response.Places, nil
}

func (f *FirecrawlClient) doRequest(payload FirecrawlRequest, target interface{}) error {
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	req, err := http.NewRequest(http.MethodPost, "https://api.firecrawl.dev/v1/extract", bytes.NewBuffer(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+f.apiKey)

	resp, err := f.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return errors.New("firecrawl request failed")
	}

	var fcResponse FirecrawlResponse
	if err := json.NewDecoder(resp.Body).Decode(&fcResponse); err != nil {
		return err
	}

	if len(fcResponse.Data) == 0 {
		return errors.New("empty firecrawl response")
	}

	return json.Unmarshal(fcResponse.Data, target)
}
