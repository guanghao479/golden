# Core Principles

* Explicit is better than implicit and magic. Everything understandable by reading code/config.
* Simple is better than complex
* Optimize for ease of operation, reliable engineering
* Fewer platforms/3rd party dependencies is better, simpler
* Fast MVP

# Technical stack choices

## Operation

### Code hosting

* Github

### CI/CD

* Github actions

## Frontend

### Language

* Typescript

### Bundler / UI framework

* Vite + React + TanStack Router

### Styling / UI components

* Tailwind + shadcn/ui

### State/data fetching & Forms

* Tanstack Query
* Tanstack Form

### Hosting

* Github Pages

## Backend

### Language

* Typescript (locked by Supabase Edge Function)

### Auth

* Supabase Auth

### Server Hosting

* Supabase Edge Function
