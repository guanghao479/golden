package api

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/example/golden/backend/internal/config"
	"github.com/example/golden/backend/internal/models"
	"github.com/example/golden/backend/internal/store"
)

type Crawler interface {
	ExtractEvents(url string) ([]models.EventSchema, error)
	ExtractPlaces(url string) ([]models.PlaceSchema, error)
}

type Dependencies struct {
	Config   config.Config
	Store    store.Store
	Crawler  Crawler
	ClockNow func() time.Time
}

type Handler struct {
	config   config.Config
	store    store.Store
	crawler  Crawler
	clockNow func() time.Time
}

type CrawlRequest struct {
	URL  string `json:"url"`
	Type string `json:"type"`
}

type ApproveRequest struct {
	ID string `json:"id"`
}

type UpdateEventRequest struct {
	ID           string    `json:"id"`
	Title        *string   `json:"title"`
	Description  *string   `json:"description"`
	StartTime    *string   `json:"start_time"`
	EndTime      *string   `json:"end_time"`
	LocationName *string   `json:"location_name"`
	Address      *string   `json:"address"`
	Website      *string   `json:"website"`
	Tags         *[]string `json:"tags"`
	Approved     *bool     `json:"approved"`
}

type UpdatePlaceRequest struct {
	ID             string    `json:"id"`
	Name           *string   `json:"name"`
	Description    *string   `json:"description"`
	Category       *string   `json:"category"`
	Address        *string   `json:"address"`
	Website        *string   `json:"website"`
	FamilyFriendly *bool     `json:"family_friendly"`
	Tags           *[]string `json:"tags"`
	Approved       *bool     `json:"approved"`
}

func NewHandler(deps Dependencies) *Handler {
	return &Handler{
		config:   deps.Config,
		store:    deps.Store,
		crawler:  deps.Crawler,
		clockNow: deps.ClockNow,
	}
}

func (h *Handler) Health(w http.ResponseWriter, _ *http.Request) {
	respondJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) Crawl(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	var request CrawlRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request")
		return
	}

	if request.URL == "" || (request.Type != "events" && request.Type != "places") {
		respondError(w, http.StatusBadRequest, "missing url or invalid type")
		return
	}

	if request.Type == "events" {
		items, err := h.crawler.ExtractEvents(request.URL)
		if err != nil {
			respondError(w, http.StatusBadGateway, err.Error())
			return
		}

		events := make([]models.Event, 0, len(items))
		for _, item := range items {
			events = append(events, models.Event{
				SourceURL:    request.URL,
				Title:        item.Title,
				Description:  item.Description,
				StartTime:    parseTime(item.StartTime),
				EndTime:      parseTime(item.EndTime),
				LocationName: item.LocationName,
				Address:      item.Address,
				Website:      item.Website,
				Tags:         item.Tags,
				Approved:     false,
				CreatedAt:    h.clockNow(),
			})
		}

		if err := h.store.CreateEvents(events); err != nil {
			respondError(w, http.StatusBadGateway, err.Error())
			return
		}
		respondJSON(w, http.StatusOK, events)
		return
	}

	items, err := h.crawler.ExtractPlaces(request.URL)
	if err != nil {
		respondError(w, http.StatusBadGateway, err.Error())
		return
	}

	places := make([]models.Place, 0, len(items))
	for _, item := range items {
		places = append(places, models.Place{
			SourceURL:      request.URL,
			Name:           item.Name,
			Description:    item.Description,
			Category:       item.Category,
			Address:        item.Address,
			Website:        item.Website,
			FamilyFriendly: item.FamilyFriendly,
			Tags:           item.Tags,
			Approved:       false,
			CreatedAt:      h.clockNow(),
		})
	}

	if err := h.store.CreatePlaces(places); err != nil {
		respondError(w, http.StatusBadGateway, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, places)
}

func (h *Handler) Events(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		events, err := h.store.ListApprovedEvents()
		if err != nil {
			respondError(w, http.StatusBadGateway, err.Error())
			return
		}
		respondJSON(w, http.StatusOK, events)
	case http.MethodPatch:
		if err := h.updateEvent(w, r); err != nil {
			respondError(w, http.StatusBadRequest, err.Error())
		}
	default:
		respondError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}

func (h *Handler) Places(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		places, err := h.store.ListApprovedPlaces()
		if err != nil {
			respondError(w, http.StatusBadGateway, err.Error())
			return
		}
		respondJSON(w, http.StatusOK, places)
	case http.MethodPatch:
		if err := h.updatePlace(w, r); err != nil {
			respondError(w, http.StatusBadRequest, err.Error())
		}
	default:
		respondError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}

func (h *Handler) AdminEvents(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		respondError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	events, err := h.store.ListPendingEvents()
	if err != nil {
		respondError(w, http.StatusBadGateway, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, events)
}

func (h *Handler) AdminPlaces(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		respondError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	places, err := h.store.ListPendingPlaces()
	if err != nil {
		respondError(w, http.StatusBadGateway, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, places)
}

func (h *Handler) ApproveEvent(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPatch {
		respondError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	id, err := decodeApproveRequest(r)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	if err := h.store.ApproveEvent(id); err != nil {
		respondError(w, http.StatusBadGateway, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"status": "approved"})
}

func (h *Handler) ApprovePlace(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPatch {
		respondError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	id, err := decodeApproveRequest(r)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	if err := h.store.ApprovePlace(id); err != nil {
		respondError(w, http.StatusBadGateway, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"status": "approved"})
}

func decodeApproveRequest(r *http.Request) (string, error) {
	var request ApproveRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		return "", errors.New("invalid request")
	}
	if request.ID == "" {
		return "", errors.New("missing id")
	}
	return request.ID, nil
}

func parseTime(value string) time.Time {
	if value == "" {
		return time.Time{}
	}

	parsed, err := time.Parse(time.RFC3339, value)
	if err == nil {
		return parsed
	}

	parsed, err = time.Parse("2006-01-02 15:04", value)
	if err == nil {
		return parsed
	}

	return time.Time{}
}

func parseTimeStrict(value string) (time.Time, error) {
	if value == "" {
		return time.Time{}, nil
	}

	if parsed, err := time.Parse(time.RFC3339, value); err == nil {
		return parsed, nil
	}

	if parsed, err := time.Parse("2006-01-02 15:04", value); err == nil {
		return parsed, nil
	}

	return time.Time{}, errors.New("invalid time format")
}

func (h *Handler) updateEvent(w http.ResponseWriter, r *http.Request) error {
	var request UpdateEventRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		return errors.New("invalid request")
	}

	if request.ID == "" {
		return errors.New("missing id")
	}

	updates := make(map[string]interface{})
	if request.Title != nil {
		updates["title"] = *request.Title
	}
	if request.Description != nil {
		updates["description"] = *request.Description
	}
	if request.StartTime != nil {
		if *request.StartTime == "" {
			updates["start_time"] = nil
		} else {
			parsed, err := parseTimeStrict(*request.StartTime)
			if err != nil {
				return err
			}
			updates["start_time"] = parsed
		}
	}
	if request.EndTime != nil {
		if *request.EndTime == "" {
			updates["end_time"] = nil
		} else {
			parsed, err := parseTimeStrict(*request.EndTime)
			if err != nil {
				return err
			}
			updates["end_time"] = parsed
		}
	}
	if request.LocationName != nil {
		updates["location_name"] = *request.LocationName
	}
	if request.Address != nil {
		updates["address"] = *request.Address
	}
	if request.Website != nil {
		updates["website"] = *request.Website
	}
	if request.Tags != nil {
		updates["tags"] = *request.Tags
	}
	if request.Approved != nil {
		updates["approved"] = *request.Approved
	}

	if err := h.store.UpdateEvent(request.ID, updates); err != nil {
		return err
	}

	respondJSON(w, http.StatusOK, map[string]string{"status": "updated"})
	return nil
}

func (h *Handler) updatePlace(w http.ResponseWriter, r *http.Request) error {
	var request UpdatePlaceRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		return errors.New("invalid request")
	}

	if request.ID == "" {
		return errors.New("missing id")
	}

	updates := make(map[string]interface{})
	if request.Name != nil {
		updates["name"] = *request.Name
	}
	if request.Description != nil {
		updates["description"] = *request.Description
	}
	if request.Category != nil {
		updates["category"] = *request.Category
	}
	if request.Address != nil {
		updates["address"] = *request.Address
	}
	if request.Website != nil {
		updates["website"] = *request.Website
	}
	if request.FamilyFriendly != nil {
		updates["family_friendly"] = *request.FamilyFriendly
	}
	if request.Tags != nil {
		updates["tags"] = *request.Tags
	}
	if request.Approved != nil {
		updates["approved"] = *request.Approved
	}

	if err := h.store.UpdatePlace(request.ID, updates); err != nil {
		return err
	}

	respondJSON(w, http.StatusOK, map[string]string{"status": "updated"})
	return nil
}

func respondJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func respondError(w http.ResponseWriter, status int, message string) {
	respondJSON(w, status, map[string]string{"error": message})
}
