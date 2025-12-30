package config

import (
	"os"
	"strings"
	"time"
)

type Config struct {
	ServerAddress   string
	SupabaseURL     string
	SupabaseAnonKey string
	FirecrawlAPIKey string
	AllowedOrigins  []string
}

func Load() Config {
	allowedOrigins := strings.Split(getEnv("ALLOWED_ORIGINS", "http://localhost:5173"), ",")
	return Config{
		ServerAddress:   getEnv("SERVER_ADDRESS", ":8080"),
		SupabaseURL:     getEnv("SUPABASE_URL", ""),
		SupabaseAnonKey: getEnv("SUPABASE_ANON_KEY", ""),
		FirecrawlAPIKey: getEnv("FIRECRAWL_API_KEY", ""),
		AllowedOrigins:  allowedOrigins,
	}
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func NowUTC() time.Time {
	return time.Now().UTC()
}
