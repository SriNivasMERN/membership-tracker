# Membership Tracker
## Product Requirements Document

### 1. Executive Summary
Membership Tracker is a web-based operations platform for any business that operates through memberships, recurring member relationships, or subscription-style enrolment. It is designed to manage memberships, payments, renewals, pricing, user access, and day-to-day follow-up in one place.

It helps businesses manage memberships, payments, renewals, pricing rules, staff access, and operational follow-up from one workspace. It is suitable for membership-led businesses such as gyms, fitness studios, coaching centres, training academies, wellness businesses, and similar operations. The product is designed for fast front-desk execution, clear owner oversight, and reliable financial tracking.

The application supports a single business environment with role-based access for owners and staff. It combines membership administration, payment collection, pricing controls, operational reporting, and activity history into a responsive interface suitable for desktop and mobile use.

### 2. Product Goals
- Give owners a clear live view of memberships, collections, dues, and upcoming renewals.
- Help staff complete routine member operations quickly and accurately.
- Reduce manual errors in pricing, payment entry, membership renewal, and plan changes.
- Preserve a reliable activity history for accountability and business review.
- Keep the interface simple enough for daily operations without sacrificing control.

### 3. Intended Users
#### 3.1 Owner
- Full business control
- Access to all modules
- Can configure plans, slots, pricing rules, users, settings, and audit review
- Can oversee member operations and business performance

#### 3.2 Staff
- Operational access only
- Focused access to dashboard and member workflows
- Can support registration, payment collection, renewal follow-up, and member profile updates
- Cannot access restricted configuration and administration areas

### 4. Scope
#### 4.1 In Scope
- Secure sign-in and session-based access
- Dashboard with live membership and payment indicators
- Member registration and lifecycle management
- Payment recording and due tracking
- Plan management
- Slot management
- Pricing rule management
- Renewal, plan change, membership end, mistaken-end revert, and reopen flows
- User management for owner-controlled staff access
- Settings for business profile and terminology
- Audit Trail for business activity review

#### 4.2 Out of Scope
- Public member portal
- Online payment gateway integration
- SMS, email, or WhatsApp automation
- Multi-branch management
- Franchise or multi-tenant setup

### 5. Core Business Workflows
#### 5.1 Sign In and Access
- Users sign in with their assigned credentials.
- The application opens the appropriate workspace based on role.
- Restricted modules remain hidden and inaccessible for staff users.

#### 5.2 Configure the Business
- The owner sets up plans, slots, pricing rules, and settings.
- These configurations define how memberships are priced and assigned.

#### 5.3 Register a Member
- Staff or owner creates a new member record.
- The member is linked to a plan and slot.
- Final price is calculated from the selected setup and can be reviewed before saving.
- An initial payment may be recorded during registration.

#### 5.4 Record Payments
- Payments can be captured against pending dues.
- Payment method is recorded for business tracking.
- Payment history remains visible in the member profile.

#### 5.5 Renew or Change a Membership
- A membership can be renewed at the end of a cycle.
- A live membership can be moved to another plan when required.
- Pricing and payable amount are recalculated during the change process.

#### 5.6 End, Revert, or Reopen Membership
- Membership can be ended when the member stops attending.
- Mistaken closure can be reverted to restore the prior state.
- Reopen allows the member to rejoin on an active membership cycle.

#### 5.7 Monitor Operations
- Owners and staff review dashboard metrics, upcoming renewals, and payment follow-up.
- Owners can review activity records in Audit Trail.

### 6. Module Requirements
#### 6.1 Dashboard
The dashboard must provide a fast business snapshot with:
- Total members
- Active members
- Renewal due members
- Expired members
- Collections summary
- Pending dues summary
- Plan and slot usage indicators
- Monthly collections trend
- Renewal queue for follow-up

The dashboard should help the operator understand what needs attention without opening multiple modules.

#### 6.2 Members
The Members module must support:
- Add new member
- View member profile
- Edit personal details
- Search by name or mobile
- Filter by status, plan, and payment state
- Sort by name, status, or renewal date
- Record follow-up payments
- Renew membership
- Change plan
- End membership
- Revert mistaken end
- Reopen ended membership
- Owner-controlled deletion
- Bulk row selection for owner operations where applicable

Each member profile should clearly show:
- Personal details
- Current plan and slot
- Renewal date
- Payment summary
- Payment history
- Available actions based on the current membership state

#### 6.3 Plans
The Plans module must allow the owner to:
- Create plans
- Edit plan details
- Activate or deactivate plans
- Review duration and base pricing

Plans define membership duration and starting price.

#### 6.4 Slots
The Slots module must allow the owner to:
- Create slots
- Edit slot timing and label
- Activate or deactivate slots
- Review available operating windows

Slots define when a member attends.

#### 6.5 Pricing Rules
The Pricing Rules module must allow the owner to:
- Create plan-slot pricing rules
- Maintain a multiplier for each plan-slot combination
- Review final price outcomes
- Activate or deactivate rule usage where supported

Pricing rules allow the business to charge different prices for the same plan based on slot timing.

#### 6.6 Users
The Users module must allow the owner to:
- Add staff accounts
- Edit staff details
- Activate or deactivate staff access
- Review join date and role

The owner account remains protected from accidental deactivation.

#### 6.7 Settings
The Settings module must allow the owner to manage:
- Business name and profile information
- Expiry alert timing
- Terminology labels used across the app

This module must keep the product adaptable to different business styles while preserving the same workflow.

#### 6.8 Audit Trail
The Audit Trail module must provide a read-only history of business actions, including:
- Date and time
- Module
- Action
- Description
- User who performed the action

It should help the owner understand who performed important operational and financial actions.

### 7. Business Rules
#### 7.1 Status Logic
Membership records can present states such as:
- Active
- Expiring Soon
- Expired
- Ended

These states must reflect the current membership condition clearly in both dashboard and member views.

#### 7.2 Payment Integrity
- Payments must remain part of an auditable history.
- Pending amount must always reflect the difference between membership price and recorded payments.
- Follow-up payment entry must update the member summary immediately after success.

#### 7.3 Pricing Integrity
- Final price should respect the selected plan and slot setup.
- Pricing rules should influence the final price when applicable.
- If no special rule applies, the standard plan price should be used.

#### 7.4 Historical Accuracy
- Member records should preserve the plan and slot context used for that membership period.
- Later changes to plan names, prices, or slots should not make historical records misleading.

#### 7.5 Access Control
- Owners have full access.
- Staff access remains limited to approved operational areas.
- Restricted configuration and administration actions must not be available to staff.

### 8. User Experience Expectations
- The product must be usable on desktop, tablet, and mobile screens.
- Operators should be able to complete common tasks without unnecessary navigation.
- Loading states should appear consistently so slow responses do not feel broken.
- Forms should guide users clearly and surface validation or duplicate-entry issues in place.
- Important actions should provide immediate success or error feedback.

### 9. Reporting and Oversight Expectations
- Owners should be able to review current collections, pending dues, renewals, and expiries easily.
- Activity history should support operational accountability.
- The application should present a realistic day-to-day business picture, not just raw records.
