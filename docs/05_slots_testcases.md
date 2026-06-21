# Slots Test Cases

## Document Control

| Field | Value |
| --- | --- |
| Module | Slots |
| File Name | `05_slots_testcases.md` |
| Primary Roles Covered | Owner/Admin |
| Related Pages | `/slots` |

## Scope

This document validates:

- Slots list page rendering
- Initial loading and error handling
- Summary stat cards
- Empty state behavior
- Add Slot flow
- Edit Slot flow
- Session derivation and visual differentiation
- Activate / deactivate flow
- Delete Slot flow
- Table alignment and readability for slot, time, session, status, and actions
- Dialog validation, focus, and scroll-to-message behavior
- Inline button loading behavior
- Responsive behavior on key viewports

## Test Cases

| TC ID | Scenario | Role | Preconditions | Steps | Expected Result | Priority |
| --- | --- | --- | --- | --- | --- | --- |
| SLT-001 | Open slots page successfully after login | Owner/Admin | User is logged in with a valid active session | 1. Open `/slots` 2. Observe page load | Slots page loads without crash. Summary cards, add button, and slots table are visible. | Critical |
| SLT-002 | Show slots loading state on first visit | Owner/Admin | User is logged in and slots data is not yet loaded | 1. Open `/slots` from another module or immediately after login 2. Observe first render | Workspace loading experience appears immediately instead of a blank or broken page. | High |
| SLT-003 | Show slots error state when page load fails | Owner/Admin | Backend/API is unavailable or slots request fails | 1. Open `/slots` 2. Simulate API failure | Error state appears with retry option. Page does not stay stuck in endless loading. | High |
| SLT-004 | Validate summary cards render with correct labels | Owner/Admin | Slot data exists | 1. Open `/slots` 2. Observe top stat cards | Cards display `Overall Slots`, `Active`, `Inactive`, and `Morning Slots` with count, icon, and helper text. | High |
| SLT-005 | Show empty state when no slots exist | Owner/Admin | No slot records exist in the system | 1. Open `/slots` | Empty state appears clearly and provides the `Add Slot` action. | High |
| SLT-006 | Open Add Slot dialog successfully | Owner/Admin | Slots page is loaded | 1. Click `Add Slot` | Add Slot dialog opens successfully without broken layout. | High |
| SLT-007 | Focus Slot Label field when Add Slot dialog opens | Owner/Admin | Add Slot dialog is open | 1. Open `Add Slot` dialog 2. Observe cursor position | Cursor is placed in `Slot Label` automatically. | Medium |
| SLT-008 | Validate minimum slot label length | Owner/Admin | Add Slot dialog is open | 1. Enter slot label shorter than 2 characters 2. Submit | Validation appears and form is not submitted. | High |
| SLT-009 | Validate maximum slot label length | Owner/Admin | Add Slot dialog is open | 1. Enter slot label longer than 50 characters 2. Submit | Validation appears and form is not submitted. | Medium |
| SLT-010 | Validate start time format | Owner/Admin | Add Slot dialog is open | 1. Enter invalid start time format 2. Submit | Validation appears requiring `HH:MM` format. | High |
| SLT-011 | Validate end time format | Owner/Admin | Add Slot dialog is open | 1. Enter invalid end time format 2. Submit | Validation appears requiring `HH:MM` format. | High |
| SLT-012 | Validate end time is after start time | Owner/Admin | Add Slot dialog is open | 1. Enter start time equal to or after end time 2. Submit | Validation appears that end time must be after start time. | Critical |
| SLT-013 | Create slot successfully with valid data | Owner/Admin | Slots page is loaded | 1. Open `Add Slot` dialog 2. Enter valid label, start time, and end time 3. Submit | Slot is created successfully. Dialog closes. New slot appears in list and summary cards refresh correctly. | Critical |
| SLT-014 | Show inline loading state during slot creation | Owner/Admin | Add Slot dialog is open | 1. Submit valid slot form 2. Observe action button | Submit button shows inline spinner and prevents repeated submission until request completes. | High |
| SLT-015 | Auto-scroll to API error in slot dialog | Owner/Admin | Add or Edit Slot dialog is open | 1. Trigger an API validation or save failure 2. Observe dialog position | Error alert becomes visible without manual scrolling. | High |
| SLT-016 | Cancel Add Slot dialog | Owner/Admin | Add Slot dialog is open | 1. Click `Cancel` | Dialog closes without creating a new slot. | Medium |
| SLT-017 | Open Edit Slot dialog successfully | Owner/Admin | At least one slot record exists | 1. Click edit action for a slot | Edit Slot dialog opens successfully with existing values prefilled. | High |
| SLT-018 | Save edited slot successfully | Owner/Admin | Editable slot exists | 1. Open `Edit Slot` 2. Change one or more values 3. Submit | Slot updates successfully. Dialog closes and table reflects the saved values. | Critical |
| SLT-019 | Show inline loading state during slot edit | Owner/Admin | Edit Slot dialog is open | 1. Submit valid edit 2. Observe action button | Save button shows inline spinner and prevents duplicate submission until request completes. | High |
| SLT-020 | Derive session as Morning for slots starting before 12:00 | Owner/Admin | At least one slot starts before `12:00` | 1. Open `/slots` 2. Observe `Session` column for that record | Session is shown as `Morning` with the correct visual treatment. | High |
| SLT-021 | Derive session as Afternoon for slots starting from 12:00 until before 17:00 | Owner/Admin | At least one slot starts within the afternoon range | 1. Open `/slots` 2. Observe `Session` column for that record | Session is shown as `Afternoon` with the correct visual treatment. | High |
| SLT-022 | Derive session as Evening for slots starting from 17:00 onward | Owner/Admin | At least one slot starts at or after `17:00` | 1. Open `/slots` 2. Observe `Session` column for that record | Session is shown as `Evening` with the correct visual treatment. | High |
| SLT-023 | Keep session text visually differentiated from other columns | Owner/Admin | Slots list contains morning, afternoon, or evening examples | 1. Open `/slots` 2. Observe `Session` column styling | Session value remains readable and visually distinct without reducing clarity of the row. | Medium |
| SLT-024 | Deactivate active slot successfully | Owner/Admin | At least one active slot exists | 1. Click toggle action on an active slot 2. Confirm action | Slot becomes inactive successfully. Status chip and summary cards refresh correctly. | Critical |
| SLT-025 | Activate inactive slot successfully | Owner/Admin | At least one inactive slot exists | 1. Click toggle action on an inactive slot 2. Confirm action | Slot becomes active successfully. Status chip and summary cards refresh correctly. | Critical |
| SLT-026 | Cancel slot activate or deactivate action | Owner/Admin | Toggle confirmation dialog is open | 1. Open toggle confirmation 2. Cancel action | Dialog closes and slot status remains unchanged. | Medium |
| SLT-027 | Show inline loading state during slot activate or deactivate | Owner/Admin | Toggle confirmation dialog is open | 1. Confirm activate or deactivate action 2. Observe button state | Confirmation button shows inline loading state and prevents repeated submission until request completes. | High |
| SLT-028 | Delete slot successfully | Owner/Admin | Deletable slot exists | 1. Click delete action for a slot 2. Confirm action | Slot is deleted successfully. List refreshes without crash and summary cards update correctly. | Critical |
| SLT-029 | Cancel slot deletion | Owner/Admin | Delete confirmation dialog is open | 1. Open delete confirmation 2. Cancel action | Dialog closes and slot remains unchanged. | Medium |
| SLT-030 | Show inline loading state during slot deletion | Owner/Admin | Delete confirmation dialog is open | 1. Confirm deletion 2. Observe confirmation button | Confirmation button shows inline loading state and blocks repeated submission until request completes. | High |
| SLT-031 | Keep table values readable after create, edit, toggle, and delete actions | Owner/Admin | Slot data exists | 1. Perform create, edit, toggle, and delete flows 2. Observe list and cards after each action | Table and summary cards remain synchronized with the latest saved slot state. | High |
| SLT-032 | Keep slots table column alignment consistent | Owner/Admin | Slots data exists | 1. Open `/slots` 2. Compare headers and row values for `Slot`, `Start Time`, `End Time`, `Session`, `Status`, and `Actions` | Headers align cleanly with their data columns. Time values, session values, status chips, and action icons remain easy to scan. | High |
| SLT-033 | Keep slot time values readable and visually differentiated | Owner/Admin | Slots data exists | 1. Open `/slots` 2. Observe start and end time values across multiple rows | Time values remain clearly visible, consistent, and easy to compare without reducing table clarity. | Medium |
| SLT-034 | Keep important slot columns visible in default desktop view | Owner/Admin | Slots data exists | 1. Open `/slots` on normal desktop viewport 2. Observe the full table width | Slot details, times, session, status, and actions remain visible clearly without unnecessary horizontal scrolling. | High |
| SLT-035 | Slots page is usable on mobile viewport | Owner/Admin | Browser width is between 360px and 480px | 1. Open `/slots` on mobile viewport 2. Observe cards, table, dialogs, and action buttons | Page remains usable without horizontal page break. Dialog opens in a mobile-friendly full-screen style. | Critical |
| SLT-036 | Slots page is usable on tablet viewport | Owner/Admin | Browser width is between 768px and 1024px | 1. Open `/slots` on tablet viewport 2. Observe layout | Layout remains balanced. Cards and table remain readable and fully visible. | High |
| SLT-037 | Slots page is usable on laptop viewport | Owner/Admin | Browser width is between 1280px and 1440px | 1. Open `/slots` on laptop viewport 2. Observe layout | Layout remains visually balanced and action controls remain fully usable. | Medium |
| SLT-038 | Slots page is usable on large desktop viewport | Owner/Admin | Browser width is 1920px or above | 1. Open `/slots` on large desktop viewport 2. Observe spacing and alignment | Layout remains stable without odd stretching, clipping, or overlap. | Medium |

## Execution Notes

- Validate both populated and empty-data conditions where possible.
- Use morning, afternoon, and evening examples when verifying session derivation.
- Use at least one active slot and one inactive slot for toggle checks.
- Validate dialog behavior for create and edit flows on both desktop and mobile-sized viewports.
- For responsive checks, validate at minimum:
  - `360px`
  - `768px`
  - `1280px`
  - `1920px`

## Entry Criteria

- Frontend and backend are running.
- Valid owner/admin test account is available.
- Slots API is reachable for list and save operations.

## Exit Criteria

- All critical and high-priority slots scenarios pass.
