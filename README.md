# Membership Management Tracker

Internal membership management system for gyms, studios,
and coaching centers.

## Status
Backend complete. Frontend in development.

## Tech Stack
Node.js · Express · TypeScript · MongoDB · Mongoose · JWT · Zod

## Backend Modules
- Authentication - JWT with refresh token rotation
- Business Settings - single config per business
- Plans - membership plan management
- Slots - time slot management
- Pricing Rules - plan/slot price multipliers
- Members - full lifecycle with snapshot storage
- Dashboard - real-time analytics

## Local Setup
### Backend
1. cd backend
2. npm install
3. Create .env from .env.example
4. npm run dev

## Environment Variables
See .env.example for required variables