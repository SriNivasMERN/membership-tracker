# Plans Test Cases

## Document Control

| Field | Value |
| --- | --- |
| Module | Plans |
| File Name | `04_plans_testcases.md` |
| Primary Roles Covered | Owner/Admin |
| Related Pages | `/plans` |

## Scope

This document validates:

- Plans list page rendering
- Initial loading and error handling
- Summary stat cards
- Empty state behavior
- Add Plan flow
- Edit Plan flow
- Activate / deactivate flow
- Delete Plan flow
- Table header-to-data alignment and readable column spacing
- Dialog validation, focus, and scroll-to-message behavior
- Inline button loading behavior
- Responsive behavior on key viewports

## Test Cases

| TC ID | Scenario | Role | Preconditions | Steps | Expected Result | Priority |
| --- | --- | --- | --- | --- | --- | --- |
| PLN-001 | Open plans page successfully after login | Owner/Admin | User is logged in with a valid active session | 1. Open `/plans` 2. Observe page load | Plans page loads without crash. Summary cards, add button, and plans table are visible. | Critical |
| PLN-002 | Show plans loading state on first visit | Owner/Admin | User is logged in and plans data is not yet loaded | 1. Open `/plans` from another module or immediately after login 2. Observe first render | Workspace loading experience appears immediately instead of a blank or broken page. | High |
| PLN-002A | Keep plans repeat visit faster within the same session | Owner/Admin | User has already opened plans once in the current session | 1. Open `/plans` for the first time 2. Navigate to another module 3. Return to `/plans` | Repeat plans visit feels faster than the first visit and still shows timely loading feedback if required. | High |
| PLN-003 | Show plans error state when page load fails | Owner/Admin | Backend/API is unavailable or plans request fails | 1. Open `/plans` 2. Simulate API failure | Error state appears with retry option. Page does not stay stuck in endless loading. | High |
| PLN-004 | Validate summary cards render with correct labels | Owner/Admin | Plan data exists | 1. Open `/plans` 2. Observe top stat cards | Cards display `Overall Plans`, `Active`, `Inactive`, and `Priced Plans` with count, icon, and helper text. | High |
| PLN-005 | Show empty state when no plans exist | Owner/Admin | No plan records exist in the system | 1. Open `/plans` | Empty state appears clearly and provides the `Add Plan` action. | High |
| PLN-006 | Open Add Plan dialog successfully | Owner/Admin | Plans page is loaded | 1. Click `Add Plan` | Add Plan dialog opens successfully without broken layout. | High |
| PLN-007 | Focus Plan Name field when Add Plan dialog opens | Owner/Admin | Add Plan dialog is open | 1. Open `Add Plan` dialog 2. Observe cursor position | Cursor is placed in `Plan Name` automatically. | Medium |
| PLN-008 | Validate required plan name | Owner/Admin | Add Plan dialog is open | 1. Leave `Plan Name` blank 2. Enter other valid values 3. Submit | Validation appears for missing plan name and form is not submitted. | High |
| PLN-009 | Validate plan name maximum length | Owner/Admin | Add Plan dialog is open | 1. Enter a plan name longer than 100 characters 2. Submit | Validation appears and plan is not submitted until the name is corrected. | Medium |
| PLN-010 | Validate minimum duration | Owner/Admin | Add Plan dialog is open | 1. Enter duration less than `1` day 2. Submit | Validation appears that duration must be at least 1 day. | High |
| PLN-011 | Validate maximum duration | Owner/Admin | Add Plan dialog is open | 1. Enter duration above `365` days 2. Submit | Validation appears that duration cannot exceed 365 days. | Medium |
| PLN-012 | Validate non-negative base price | Owner/Admin | Add Plan dialog is open | 1. Enter negative base price 2. Submit | Validation appears that price cannot be negative. | High |
| PLN-013 | Keep number fields protected from accidental mouse-wheel changes | Owner/Admin | Duration or Base Price field is focused | 1. Focus numeric field 2. Scroll mouse wheel | Value does not accidentally change due to mouse-wheel input. | Medium |
| PLN-014 | Create plan successfully with valid data | Owner/Admin | Plans page is loaded | 1. Open `Add Plan` dialog 2. Enter valid name, duration, base price, and optional description 3. Submit | Plan is created successfully. Dialog closes. New plan appears in list and summary cards refresh correctly. | Critical |
| PLN-015 | Show inline loading state during plan creation | Owner/Admin | Add Plan dialog is open | 1. Submit valid plan form 2. Observe action button | Submit button shows inline spinner and prevents repeated submission until request completes. | High |
| PLN-016 | Auto-scroll to API error in plan dialog | Owner/Admin | Add or Edit Plan dialog is open | 1. Trigger an API validation or save failure 2. Observe dialog position | Error alert becomes visible without manual scrolling. | High |
| PLN-017 | Cancel Add Plan dialog | Owner/Admin | Add Plan dialog is open | 1. Click `Cancel` | Dialog closes without creating a new plan. | Medium |
| PLN-018 | Open Edit Plan dialog successfully | Owner/Admin | At least one plan record exists | 1. Click edit action for a plan | Edit Plan dialog opens successfully with existing values prefilled. | High |
| PLN-019 | Save edited plan successfully | Owner/Admin | Editable plan exists | 1. Open `Edit Plan` 2. Change one or more values 3. Submit | Plan updates successfully. Dialog closes and table reflects the saved values. | Critical |
| PLN-020 | Show inline loading state during plan edit | Owner/Admin | Edit Plan dialog is open | 1. Submit valid edit 2. Observe action button | Save button shows inline spinner and prevents duplicate submission until request completes. | High |
| PLN-021 | Deactivate active plan successfully | Owner/Admin | At least one active plan exists | 1. Click toggle action on an active plan 2. Confirm action | Plan becomes inactive successfully. Status chip and summary cards refresh correctly. | Critical |
| PLN-022 | Activate inactive plan successfully | Owner/Admin | At least one inactive plan exists | 1. Click toggle action on an inactive plan 2. Confirm action | Plan becomes active successfully. Status chip and summary cards refresh correctly. | Critical |
| PLN-023 | Cancel plan activate or deactivate action | Owner/Admin | Toggle confirmation dialog is open | 1. Open toggle confirmation 2. Cancel action | Dialog closes and plan status remains unchanged. | Medium |
| PLN-024 | Show inline loading state during plan activate or deactivate | Owner/Admin | Toggle confirmation dialog is open | 1. Confirm activate or deactivate action 2. Observe button state | Confirmation button shows inline loading state and prevents repeated submission until request completes. | High |
| PLN-025 | Delete plan successfully | Owner/Admin | Deletable plan exists | 1. Click delete action for a plan 2. Confirm action | Plan is deleted successfully. List refreshes without crash and summary cards update correctly. | Critical |
| PLN-026 | Cancel plan deletion | Owner/Admin | Delete confirmation dialog is open | 1. Open delete confirmation 2. Cancel action | Dialog closes and plan remains unchanged. | Medium |
| PLN-027 | Show inline loading state during plan deletion | Owner/Admin | Delete confirmation dialog is open | 1. Confirm deletion 2. Observe confirmation button | Confirmation button shows inline loading state and blocks repeated submission until request completes. | High |
| PLN-028 | Keep table values readable after create, edit, toggle, and delete actions | Owner/Admin | Plans data exists | 1. Perform create, edit, toggle, and delete flows 2. Observe list and cards after each action | Table and summary cards remain synchronized with the latest saved plan state. | High |
| PLN-029 | Keep plan table columns visually balanced on desktop | Owner/Admin | Plans data exists | 1. Open `/plans` on normal desktop viewport 2. Observe `Plan`, `Duration`, `Base Price`, `Status`, and `Actions` columns | Column spacing looks balanced from left to right. No column feels excessively wide, cramped, or detached from its data. | High |
| PLN-030 | Keep plans table header alignment consistent with data alignment | Owner/Admin | Plans data exists | 1. Open `/plans` 2. Compare each table header with its row values | Each header visually aligns with its column content. Centered columns look centered to their data, and left-aligned columns start at the same readable margin as their values. | High |
| PLN-031 | Keep important plan values clearly visible in default desktop view | Owner/Admin | Plans data exists | 1. Open `/plans` on normal desktop viewport 2. Observe `Base Price`, `Status`, and `Actions` columns | Important values and actions are visible clearly without needing unnecessary horizontal scrolling. | High |
| PLN-032 | Plans page is usable on mobile viewport | Owner/Admin | Browser width is between 360px and 480px | 1. Open `/plans` on mobile viewport 2. Observe cards, table, dialogs, and action buttons | Page remains usable without horizontal page break. Dialog opens in a mobile-friendly full-screen style. | Critical |
| PLN-033 | Plans page is usable on tablet viewport | Owner/Admin | Browser width is between 768px and 1024px | 1. Open `/plans` on tablet viewport 2. Observe layout | Layout remains balanced. Cards and table remain readable and fully visible. | High |
| PLN-034 | Plans page is usable on laptop viewport | Owner/Admin | Browser width is between 1280px and 1440px | 1. Open `/plans` on laptop viewport 2. Observe layout | Layout remains visually balanced and action controls remain fully usable. | Medium |
| PLN-035 | Plans page is usable on large desktop viewport | Owner/Admin | Browser width is 1920px or above | 1. Open `/plans` on large desktop viewport 2. Observe spacing and alignment | Layout remains stable without odd stretching, clipping, or overlap. | Medium |

## Execution Notes

- Validate both populated and empty-data conditions where possible.
- Use at least one active plan and one inactive plan for toggle checks.
- Use one priced plan and one zero-price plan when validating summary-card counts.
- Compare first plans visit versus immediate repeat visit in the same authenticated session.
- Validate dialog behavior for create and edit flows on both desktop and mobile-sized viewports.
- For responsive checks, validate at minimum:
  - `360px`
  - `768px`
  - `1280px`
  - `1920px`

## Entry Criteria

- Frontend and backend are running.
- Valid owner/admin test account is available.
- Plans API is reachable for list and save operations.

## Exit Criteria

- All critical and high-priority plans scenarios pass.
