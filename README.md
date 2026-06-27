# Membership Tracker

Membership Tracker is a web application for any business that operates through memberships, recurring member relationships, or subscription-style enrolment.

It helps businesses manage memberships, payments, renewals, pricing rules, staff access, and operational follow-up from one workspace, including gyms, fitness studios, coaching centres, training academies, wellness businesses, and other membership-led operations.

It is designed for two practical needs:
- fast day-to-day front desk execution
- clear owner visibility into dues, renewals, collections, and staff activity

## Live Demo

- **Live App** : https://membership-tracker-steel.vercel.app
- **PRD**      : [PRD_Membership_Tracker.md](./PRD_Membership_Tracker.md)

[![Watch Demo](https://img.youtube.com/vi/Z3xCeAU7zas/0.jpg)](https://youtu.be/Z3xCeAU7zas)

## Product Highlights

- Dashboard with live business indicators for members, collections, dues, expiries, and renewals
- Member lifecycle management including registration, payment follow-up, renewal, plan change, membership end, revert, and reopen
- Plan, slot, and pricing rule management for configurable membership pricing
- Owner-managed staff access with role-based visibility
- Settings for business profile, alert timing, and terminology
- Audit Trail for read-only business activity review
- Responsive experience across desktop, tablet, and mobile layouts

## Core Modules

- Dashboard
- Members
- Plans
- Slots
- Pricing Rules
- Users
- Settings
- Audit Trail

## Intended Users

### Owner
- Full access to all modules
- Can manage business configuration, pricing, users, and activity review
- Can oversee member operations and financial follow-up

### Staff
- Access to approved operational workflows
- Can support member registration, updates, payments, and renewal follow-up
- Restricted from sensitive administration areas

## Business Workflows

### Business setup
The owner configures plans, slots, pricing rules, users, and business settings before operations begin.

### Member registration
Staff or owner creates a member record, assigns a plan and slot, reviews the final price, and optionally records an initial payment.

### Payment collection
Payments can be recorded against pending dues, with history preserved in the member profile.

### Renewal and plan changes
Memberships can be renewed or shifted to another plan with recalculated payable amount.

### Membership closure and return
Memberships can be ended, reverted when closed by mistake, or reopened when a member rejoins.

### Business oversight
Owners can review dashboard indicators and Audit Trail records to monitor operations and accountability.

## Tech Stack

### Frontend
- Next.js 14.2.18
- React 18.3.1
- TypeScript 5
- MUI 5.16.7
- Recharts 3.8.1
- React Hook Form 7.53.0
- Zod 3.23.8
- Axios 1.7.7
- Day.js 1.11.13

### Backend
- Node.js
- Express 5.2.1
- TypeScript 6.0.3
- MongoDB
- Mongoose 9.6.1
- JWT via jsonwebtoken 9.0.3
- Zod 4.4.3
- Helmet 8.1.0
- CORS 2.8.6
- Cookie Parser 1.4.7
- BcryptJS 3.0.3

## Repository Structure

```text
backend/    Express + TypeScript API
frontend/   Next.js + React application
```

## Local Setup

Requires Node.js and a running MongoDB instance (local or Atlas).

### Backend

```powershell
Set-Location backend
npm install
copy .env.example .env   # then fill in MONGODB_URI, JWT secrets, etc.
npm run dev
```

### Frontend

```powershell
Set-Location frontend
npm install
copy .env.example .env.local   # then set NEXT_PUBLIC_API_URL
npm run dev
```
