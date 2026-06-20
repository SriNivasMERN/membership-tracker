# Overall Workflow Validation

## Document Control

| Field | Value |
| --- | --- |
| Document | Overall Workflow Validation |
| File Name | `10_overall_workflow.md` |
| Primary Roles Covered | Owner/Admin, Staff |
| Related Areas | Login, Dashboard, Members, Plans, Slots, Pricing Rules, Users, Settings, Audit Trail |

## Purpose

This document validates the end-to-end working flow of the application from initial setup to day-to-day member operations. It is intended to confirm that the product is ready for client walkthrough, UAT, and business use.

## Workflow Stages

1. Owner login and session access
2. Business setup and terminology confirmation
3. Master data creation
4. Member onboarding
5. Payment collection and follow-up
6. Renewal, upgrade, downgrade, reopen, and revert scenarios
7. Staff management and access control
8. Dashboard monitoring
9. Audit verification

## Workflow Validation Scenarios

| TC ID | Scenario | Role | Preconditions | Steps | Expected Result | Priority |
| --- | --- | --- | --- | --- | --- | --- |
| WRK-001 | Owner signs in successfully and lands in the app | Owner/Admin | Valid owner account exists | 1. Open login page 2. Enter valid owner credentials 3. Sign in | Owner session starts successfully and user reaches the dashboard without crash. | Critical |
| WRK-002 | Owner verifies initial configuration area before operations begin | Owner/Admin | Owner is logged in | 1. Open `Settings` 2. Review business profile, expiry alerts, and terminology | Business setup fields are visible and can be reviewed before operational use. | High |
| WRK-003 | Owner saves business settings successfully | Owner/Admin | Settings page is available | 1. Update business profile or expiry-alert values 2. Click `Save Settings` | Settings save successfully and remain visible after save. | Critical |
| WRK-004 | Owner creates at least one plan successfully | Owner/Admin | Owner is logged in | 1. Open `Plans` 2. Click `Add Plan` 3. Enter valid details 4. Save | New plan appears in the plans list and summary cards refresh correctly. | Critical |
| WRK-005 | Owner creates at least one slot successfully | Owner/Admin | Owner is logged in | 1. Open `Slots` 2. Click `Add Slot` 3. Enter valid details 4. Save | New slot appears in the slots list and summary cards refresh correctly. | Critical |
| WRK-006 | Owner creates pricing rule when plan-slot override is needed | Owner/Admin | At least one active plan and slot exist | 1. Open `Pricing Rules` 2. Click `Add Rule` 3. Select plan and slot 4. Enter multiplier 5. Save | Pricing rule is created successfully and final price logic is reflected correctly. | High |
| WRK-007 | Owner adds a new member successfully | Owner/Admin | At least one active plan and slot exist | 1. Open `Members` 2. Click `Add Member` 3. Enter valid personal and membership details 4. Submit | Member is created successfully and appears in the members list. | Critical |
| WRK-008 | Initial payment is reflected correctly during member creation | Owner/Admin | Add Member form is open | 1. Create member with initial payment less than full amount 2. Save member 3. Open member detail | Final price, total paid, and pending amount are calculated and displayed correctly. | Critical |
| WRK-009 | Duplicate mobile protection works during onboarding | Owner/Admin | A member with the same mobile already exists | 1. Attempt to create another member using the same mobile number 2. Submit | Clear duplicate-mobile message appears and user is guided back to the visible error state. | High |
| WRK-010 | Owner records follow-up payment successfully | Owner/Admin | Member has pending amount | 1. Open member detail 2. Click `Record Payment` 3. Enter valid amount and payment method 4. Save | Payment is recorded successfully and payment summary updates correctly. | Critical |
| WRK-011 | Member pending amount never drops below valid business outcome | Owner/Admin | Member has a known pending amount | 1. Try entering more than the payable amount in payment flow 2. Observe validation | System prevents invalid overpayment and shows a proper message. | Critical |
| WRK-012 | Owner renews active membership successfully | Owner/Admin | Member is eligible for renewal or change | 1. Open member detail 2. Click `Change / Renew Plan` 3. Keep or change plan/slot as required 4. Save | New cycle is created correctly and amount calculation remains valid. | Critical |
| WRK-013 | Upgrade flow calculates amount correctly | Owner/Admin | Member is active and has a lower plan than target upgrade | 1. Open `Change / Renew Plan` 2. Select a higher-value plan 3. Review breakdown 4. Save | Credit, used value, amount due, and final summary are calculated correctly. | Critical |
| WRK-014 | Downgrade flow calculates amount correctly | Owner/Admin | Member is active and has a higher plan than target downgrade | 1. Open `Change / Renew Plan` 2. Select a lower-value plan 3. Review breakdown 4. Save | Credit and amount due or remaining balance are handled correctly without corrupting membership data. | Critical |
| WRK-015 | Owner ends membership successfully | Owner/Admin | Member is active | 1. Open member detail 2. Click `End Membership` 3. Confirm action | Member status changes to ended state and closure-related details are preserved correctly. | Critical |
| WRK-016 | Owner reverts an ended membership when it was ended by mistake | Owner/Admin | Membership was ended during the current app lifecycle with reversible state available | 1. Open ended member detail 2. Click `Revert End` 3. Confirm | Previous active membership state is restored without creating a new cycle. | High |
| WRK-017 | Owner reopens an ended membership as a fresh rejoin | Owner/Admin | Member is ended and at least one active plan and slot exist | 1. Open ended member detail 2. Click `Reopen Membership` 3. Choose plan/slot and payment inputs 4. Save | Membership restarts from current date as a new active cycle with correct pricing and payment values. | Critical |
| WRK-018 | Staff account can be created successfully by owner | Owner/Admin | Owner is logged in | 1. Open `Users` 2. Click `Add Staff` 3. Enter valid data 4. Save | Staff user is created successfully and appears in user list. | High |
| WRK-019 | Staff access is limited compared to owner access | Staff | Valid staff account exists | 1. Login as staff 2. Review sidebar and accessible modules | Staff can access allowed operational modules and cannot access owner-only sections such as settings administration and audit trail if restricted. | Critical |
| WRK-020 | Owner can deactivate and reactivate staff account | Owner/Admin | At least one staff account exists | 1. Open `Users` 2. Deactivate a staff user 3. Reactivate the same user | Staff account status updates correctly in both directions. | High |
| WRK-021 | Dashboard reflects operational changes after member and payment actions | Owner/Admin | Members, payments, and renewals exist | 1. Perform member lifecycle actions 2. Return to `Dashboard` 3. Review stat cards and sections | Dashboard metrics update correctly for total members, active, renewal due, expired, collections, and due amounts. | Critical |
| WRK-022 | Owner can review audit history for completed actions | Owner/Admin | At least one business action has been completed | 1. Open `Audit Trail` 2. Search or filter by module/action/user | Audit Trail shows completed actions with module, action, description, actor, and date-time details. | High |
| WRK-023 | Filters and pagination remain usable during day-to-day work | Owner/Admin | Enough data exists to span multiple pages | 1. Use members filters 2. Move between pages 3. Return to default view | Filters and pagination continue to work without misleading counts or broken state. | High |
| WRK-024 | Common owner workflow is usable on laptop viewport | Owner/Admin | Browser width is between 1280px and 1440px | 1. Perform owner workflow from dashboard through member operations 2. Observe layout and controls | Workflow remains visually stable and efficient on a standard laptop viewport. | High |
| WRK-025 | Common operational workflow is usable on mobile viewport | Owner/Admin or Staff | Browser width is between 360px and 480px | 1. Open key operational pages on mobile 2. Review layout, dialogs, buttons, and forms | Core operations remain usable on mobile without broken layout or horizontal page break. | High |

## Recommended UAT Execution Order

1. Login
2. Settings
3. Plans
4. Slots
5. Pricing Rules
6. Members
7. Member Detail Actions
8. Users
9. Dashboard
10. Audit Trail

## Exit Criteria

- All critical workflow scenarios pass.
- Member lifecycle actions remain financially and operationally correct.
- Owner and staff access boundaries work correctly.
- Dashboard and Audit Trail reflect completed business actions reliably.
