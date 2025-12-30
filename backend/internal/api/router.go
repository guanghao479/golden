package api

import "net/http"

func NewRouter(handler *Handler) http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/health", handler.Health)
	mux.HandleFunc("/api/crawl", handler.Crawl)
	mux.HandleFunc("/api/events", handler.Events)
	mux.HandleFunc("/api/places", handler.Places)
	mux.HandleFunc("/api/admin/events", handler.AdminEvents)
	mux.HandleFunc("/api/admin/places", handler.AdminPlaces)
	mux.HandleFunc("/api/events/approve", handler.ApproveEvent)
	mux.HandleFunc("/api/places/approve", handler.ApprovePlace)
	return mux
}
