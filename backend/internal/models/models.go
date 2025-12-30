package models

import "time"

type CrawlSource struct {
	ID        string    `json:"id"`
	URL       string    `json:"url"`
	Type      string    `json:"type"`
	CreatedAt time.Time `json:"created_at"`
}

type Event struct {
	ID           string    `json:"id"`
	SourceURL    string    `json:"source_url"`
	Title        string    `json:"title"`
	Description  string    `json:"description"`
	StartTime    time.Time `json:"start_time"`
	EndTime      time.Time `json:"end_time"`
	LocationName string    `json:"location_name"`
	Address      string    `json:"address"`
	Website      string    `json:"website"`
	Tags         []string  `json:"tags"`
	Approved     bool      `json:"approved"`
	CreatedAt    time.Time `json:"created_at"`
}

type Place struct {
	ID             string    `json:"id"`
	SourceURL      string    `json:"source_url"`
	Name           string    `json:"name"`
	Description    string    `json:"description"`
	Category       string    `json:"category"`
	Address        string    `json:"address"`
	Website        string    `json:"website"`
	FamilyFriendly bool      `json:"family_friendly"`
	Tags           []string  `json:"tags"`
	Approved       bool      `json:"approved"`
	CreatedAt      time.Time `json:"created_at"`
}

// Firecrawl schemas

type EventSchema struct {
	Title        string   `json:"title"`
	Description  string   `json:"description"`
	StartTime    string   `json:"start_time"`
	EndTime      string   `json:"end_time"`
	LocationName string   `json:"location_name"`
	Address      string   `json:"address"`
	Website      string   `json:"website"`
	Tags         []string `json:"tags"`
}

type PlaceSchema struct {
	Name           string   `json:"name"`
	Description    string   `json:"description"`
	Category       string   `json:"category"`
	Address        string   `json:"address"`
	Website        string   `json:"website"`
	FamilyFriendly bool     `json:"family_friendly"`
	Tags           []string `json:"tags"`
}
