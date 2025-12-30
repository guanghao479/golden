package store

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/example/golden/backend/internal/config"
	"github.com/example/golden/backend/internal/models"
)

type SupabaseClient struct {
	baseURL string
	apiKey  string
	client  *http.Client
}

type Store interface {
	CreateEvents(events []models.Event) error
	CreatePlaces(places []models.Place) error
	ListApprovedEvents() ([]models.Event, error)
	ListApprovedPlaces() ([]models.Place, error)
	ListPendingEvents() ([]models.Event, error)
	ListPendingPlaces() ([]models.Place, error)
	UpdateEvent(id string, updates map[string]interface{}) error
	UpdatePlace(id string, updates map[string]interface{}) error
	ApproveEvent(id string) error
	ApprovePlace(id string) error
}

func NewSupabaseClient(cfg config.Config) *SupabaseClient {
	return &SupabaseClient{
		baseURL: cfg.SupabaseURL,
		apiKey:  cfg.SupabaseAnonKey,
		client:  &http.Client{Timeout: 15 * time.Second},
	}
}

func (s *SupabaseClient) CreateEvents(events []models.Event) error {
	return s.insert("events", events)
}

func (s *SupabaseClient) CreatePlaces(places []models.Place) error {
	return s.insert("places", places)
}

func (s *SupabaseClient) ListApprovedEvents() ([]models.Event, error) {
	var events []models.Event
	if err := s.selectWithFilter("events", "approved=eq.true", &events); err != nil {
		return nil, err
	}
	return events, nil
}

func (s *SupabaseClient) ListApprovedPlaces() ([]models.Place, error) {
	var places []models.Place
	if err := s.selectWithFilter("places", "approved=eq.true", &places); err != nil {
		return nil, err
	}
	return places, nil
}

func (s *SupabaseClient) ListPendingEvents() ([]models.Event, error) {
	var events []models.Event
	if err := s.selectWithFilter("events", "approved=eq.false", &events); err != nil {
		return nil, err
	}
	return events, nil
}

func (s *SupabaseClient) ListPendingPlaces() ([]models.Place, error) {
	var places []models.Place
	if err := s.selectWithFilter("places", "approved=eq.false", &places); err != nil {
		return nil, err
	}
	return places, nil
}

func (s *SupabaseClient) UpdateEvent(id string, updates map[string]interface{}) error {
	return s.updateRecord("events", id, updates)
}

func (s *SupabaseClient) UpdatePlace(id string, updates map[string]interface{}) error {
	return s.updateRecord("places", id, updates)
}

func (s *SupabaseClient) ApproveEvent(id string) error {
	return s.updateApproval("events", id)
}

func (s *SupabaseClient) ApprovePlace(id string) error {
	return s.updateApproval("places", id)
}

func (s *SupabaseClient) insert(table string, payload interface{}) error {
	if err := s.ensureConfigured(); err != nil {
		return err
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	url := fmt.Sprintf("%s/rest/v1/%s", s.baseURL, table)
	req, err := http.NewRequest(http.MethodPost, url, bytes.NewBuffer(body))
	if err != nil {
		return err
	}
	setHeaders(req, s.apiKey)
	req.Header.Set("Prefer", "return=representation")

	resp, err := s.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return errors.New("supabase insert failed")
	}

	return nil
}

func (s *SupabaseClient) selectWithFilter(table, filter string, target interface{}) error {
	if err := s.ensureConfigured(); err != nil {
		return err
	}

	url := fmt.Sprintf("%s/rest/v1/%s?%s", s.baseURL, table, filter)
	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return err
	}
	setHeaders(req, s.apiKey)

	resp, err := s.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return errors.New("supabase select failed")
	}

	return json.NewDecoder(resp.Body).Decode(target)
}

func (s *SupabaseClient) updateApproval(table, id string) error {
	return s.updateRecord(table, id, map[string]interface{}{"approved": true})
}

func (s *SupabaseClient) updateRecord(table, id string, updates map[string]interface{}) error {
	if err := s.ensureConfigured(); err != nil {
		return err
	}

	if len(updates) == 0 {
		return errors.New("no updates provided")
	}

	body, err := json.Marshal(updates)
	if err != nil {
		return err
	}

	url := fmt.Sprintf("%s/rest/v1/%s?id=eq.%s", s.baseURL, table, id)
	req, err := http.NewRequest(http.MethodPatch, url, bytes.NewBuffer(body))
	if err != nil {
		return err
	}
	setHeaders(req, s.apiKey)
	req.Header.Set("Prefer", "return=representation")

	resp, err := s.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return errors.New("supabase update failed")
	}

	return nil
}

func (s *SupabaseClient) ensureConfigured() error {
	if s.baseURL == "" || s.apiKey == "" {
		return errors.New("supabase configuration missing")
	}
	return nil
}

func setHeaders(req *http.Request, apiKey string) {
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("apikey", apiKey)
	req.Header.Set("Authorization", "Bearer "+apiKey)
}
