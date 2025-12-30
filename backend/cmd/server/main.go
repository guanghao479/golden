package main

import (
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"
	"github.com/rs/cors"

	"github.com/example/golden/backend/internal/api"
	"github.com/example/golden/backend/internal/config"
	"github.com/example/golden/backend/internal/crawler"
	"github.com/example/golden/backend/internal/store"
)

func main() {
	_ = godotenv.Load()

	cfg := config.Load()

	supabaseClient := store.NewSupabaseClient(cfg)
	crawlerClient := crawler.NewFirecrawlClient(cfg)

	handlers := api.NewHandler(api.Dependencies{
		Config:   cfg,
		Store:    supabaseClient,
		Crawler:  crawlerClient,
		ClockNow: config.NowUTC,
	})

	router := api.NewRouter(handlers)

	corsHandler := cors.New(cors.Options{
		AllowedOrigins:   cfg.AllowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PATCH", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization", "apikey"},
		AllowCredentials: true,
	}).Handler(router)

	addr := cfg.ServerAddress
	log.Printf("listening on %s", addr)
	if err := http.ListenAndServe(addr, corsHandler); err != nil {
		log.Printf("server stopped: %v", err)
		os.Exit(1)
	}
}
