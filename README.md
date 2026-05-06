# Membership Management Tracker

A configuration-driven management system for businesses and organizations that manage memberships, members, plans, payments, renewals, and internal operations. Built to replace spreadsheet tracking with a structured, role-scoped internal tool.

---

## What it does

- Manages members with plan-based pricing and slot assignments
- Freezes plan and pricing details at the time of member creation — config changes never affect existing records
- Tracks full payment history per member, not just a running balance
- Surfaces active members, expiring memberships, revenue, and pending payments through a real-time dashboard
- Enforces role-based access — owners configure the system, staff handle daily operations

## Tech stack

**Frontend** — Next.js 14, TypeScript, Material UI, React Hook Form, Zod, Recharts  
**Backend** — Node.js, Express, TypeScript, MongoDB, Mongoose, JWT  
**Database** — MongoDB Atlas  
**Hosting** — Vercel (frontend), Render (backend)