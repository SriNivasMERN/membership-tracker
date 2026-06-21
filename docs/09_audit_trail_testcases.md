# Audit Trail Test Cases

## Document Control

| Field | Value |
| --- | --- |
| Module | Audit Trail |
| File Name | `09_audit_trail_testcases.md` |
| Primary Roles Covered | Owner/Admin |
| Related Pages | `/audit-trail` |

## Scope

This document validates:

- Audit Trail page rendering
- Initial loading and error handling
- Summary stat cards
- Search and filter behavior
- Clear-filter behavior
- Empty state behavior
- Activity table rendering
- Table alignment and readable audit column spacing
- Pagination behavior
- Role-based visibility
- Responsive behavior on key viewports

## Test Cases

| TC ID | Scenario | Role | Preconditions | Steps | Expected Result | Priority |
| --- | --- | --- | --- | --- | --- | --- |
| AUD-001 | Open audit trail page successfully after login | Owner/Admin | User is logged in with a valid active session | 1. Open `/audit-trail` 2. Observe page load | Audit Trail page loads without crash. Summary cards, filters, and activity table are visible. | Critical |
| AUD-002 | Show audit-trail loading state on first visit | Owner/Admin | User is logged in and audit data is not yet loaded | 1. Open `/audit-trail` from another module or immediately after login 2. Observe first render | Workspace loading experience appears immediately instead of a blank or broken page. | High |
| AUD-002A | Keep audit-trail repeat visit faster within the same session | Owner/Admin | User has already opened audit trail once in the current session | 1. Open `/audit-trail` for the first time 2. Navigate to another module 3. Return to `/audit-trail` | Repeat audit-trail visit feels faster than the first visit and still shows timely loading feedback if required. | High |
| AUD-003 | Show audit-trail error state when page load fails | Owner/Admin | Backend/API is unavailable or audit request fails | 1. Open `/audit-trail` 2. Simulate API failure | Error state appears clearly with retry support. Page does not stay stuck in endless loading. | High |
| AUD-004 | Validate summary cards render with correct labels | Owner/Admin | Audit trail data exists | 1. Open `/audit-trail` 2. Observe top stat cards | Cards display `Total Activities`, `Today`, `Owner Actions`, and `Staff Actions` with count, icon, and helper text. | High |
| AUD-005 | Focus search field on page load | Owner/Admin | Audit Trail page loads successfully | 1. Open `/audit-trail` 2. Observe cursor position | Cursor is placed in the search field automatically after data load completes. | Medium |
| AUD-006 | Search audit trail by module, action, user, or description | Owner/Admin | Audit trail contains multiple records | 1. Enter a valid keyword in search 2. Observe results | Matching records are returned. Non-matching records are removed from the current result set. | Critical |
| AUD-007 | Show inline filtering indicator while audit list updates | Owner/Admin | Audit Trail page is loaded | 1. Change search or any filter value 2. Observe filter area | A subtle loading indicator appears while the list refreshes. Page does not feel frozen. | High |
| AUD-008 | Filter by module successfully | Owner/Admin | Audit trail contains records from multiple modules | 1. Open module filter 2. Select `Members` or another valid module | Table refreshes and shows only matching module records. | High |
| AUD-009 | Filter by action successfully | Owner/Admin | Audit trail contains records with multiple action types | 1. Open action filter 2. Select a value such as `Payment` or `Saved` | Table refreshes and shows only matching action records. | High |
| AUD-010 | Filter by user role successfully | Owner/Admin | Audit trail contains both owner and staff actions | 1. Open role filter 2. Select `Owner` or `Staff` | Table refreshes and shows only matching role records. | High |
| AUD-011 | Combine search and filters successfully | Owner/Admin | Audit trail contains enough mixed records for combination testing | 1. Enter a search term 2. Apply module filter 3. Apply action filter 4. Apply role filter | Results reflect the combined criteria correctly. | High |
| AUD-012 | Clear all active filters successfully | Owner/Admin | One or more filters are active | 1. Click `Clear` | Search and filter fields reset to default values and unfiltered results return. | High |
| AUD-013 | Keep clear action disabled when no filters are active | Owner/Admin | Audit Trail page is loaded with default filter state | 1. Open `/audit-trail` 2. Observe `Clear` button before applying filters | Clear action remains disabled until at least one filter is active. | Medium |
| AUD-014 | Show filtered empty state when no records match criteria | Owner/Admin | Audit trail exists but applied filters produce no result | 1. Apply a search or filter combination with no matches | Empty state appears with filter-specific guidance instead of blank space or broken layout. | High |
| AUD-015 | Show base empty state when no audit records exist | Owner/Admin | No audit trail records exist in the system | 1. Open `/audit-trail` | Empty state appears clearly and indicates that completed business actions will appear here later. | Medium |
| AUD-016 | Render date and time clearly for each activity row | Owner/Admin | Audit trail contains records | 1. Open `/audit-trail` 2. Inspect table rows | Each row shows readable date and time values in the first column. | Medium |
| AUD-017 | Render module chip and entity label correctly | Owner/Admin | Audit trail contains records with entity labels | 1. Inspect module column in multiple rows | Module chip displays the correct module name and entity label appears below it when available. | Medium |
| AUD-018 | Render action chip with meaningful color coding | Owner/Admin | Audit trail contains mixed action types | 1. Inspect action column across multiple rows | Action chip colors remain consistent with the action meaning, such as positive, warning, or destructive actions. | Medium |
| AUD-019 | Render description and reference details correctly | Owner/Admin | Audit trail contains records with descriptions and entity IDs | 1. Inspect description column in multiple rows | Description is readable and reference text appears when entity reference data is available. | Medium |
| AUD-020 | Render actor name and role correctly | Owner/Admin | Audit trail contains owner and staff actions | 1. Inspect `Done By` column in multiple rows | Actor name is visible and role badge reflects `Owner` or `Staff` correctly. | High |
| AUD-021 | Move between audit trail pages successfully | Owner/Admin | Audit trail has more than 20 records | 1. Click `Next` 2. Observe results 3. Click `Previous` | Pagination changes the displayed records correctly without crashing. | High |
| AUD-022 | Prevent invalid previous-page navigation | Owner/Admin | User is on page 1 | 1. Open `/audit-trail` on first page 2. Observe `Previous` button | Previous button is disabled on the first page. | Medium |
| AUD-023 | Prevent invalid next-page navigation | Owner/Admin | User is on the last available page | 1. Navigate to last page 2. Observe `Next` button | Next button is disabled on the last page. | Medium |
| AUD-024 | Keep owner-only access enforced for audit trail | Staff | Staff account is logged in | 1. Login as staff 2. Check sidebar and direct route access for `/audit-trail` | Staff user does not get normal access to Audit Trail if module is owner-only. | Critical |
| AUD-025 | Keep audit table headers aligned with row content | Owner/Admin | Audit trail contains records | 1. Open `/audit-trail` 2. Compare headers and row values for `Date & Time`, `Module`, `Action`, `Description`, and `Done By` | Each header aligns consistently with its data column, including columns that use pills plus supporting text. | High |
| AUD-026 | Keep audit table spacing balanced and scannable on desktop | Owner/Admin | Audit trail contains records | 1. Open `/audit-trail` on normal desktop viewport 2. Observe table spacing across visible columns | Column spacing remains balanced and readable. No important audit field feels detached, cramped, or visually hidden. | High |
| AUD-027 | Audit Trail page is usable on mobile viewport | Owner/Admin | Browser width is between 360px and 480px | 1. Open `/audit-trail` on mobile viewport 2. Observe cards, filters, and table area | Page remains usable without breaking the overall layout. Filters stack cleanly and table stays contained. | Critical |
| AUD-028 | Audit Trail page is usable on tablet viewport | Owner/Admin | Browser width is between 768px and 1024px | 1. Open `/audit-trail` on tablet viewport 2. Observe layout | Layout remains balanced. Cards, filters, and table remain readable and fully usable. | High |
| AUD-029 | Audit Trail page is usable on laptop viewport | Owner/Admin | Browser width is between 1280px and 1440px | 1. Open `/audit-trail` on laptop viewport 2. Observe layout | Layout remains visually balanced and all filters and table columns remain easy to scan. | Medium |
| AUD-030 | Audit Trail page is usable on large desktop viewport | Owner/Admin | Browser width is 1920px or above | 1. Open `/audit-trail` on large desktop viewport 2. Observe spacing and alignment | Layout remains stable without odd stretching, clipping, or overlap. | Medium |

## Execution Notes

- Validate both owner-generated and staff-generated activity where available.
- Prefer testing with records from members, payments, renewals, settings saves, and user actions so action diversity is covered.
- Confirm filtering remains correct when moving between pages.
- Compare first audit-trail visit versus immediate repeat visit in the same authenticated session.

## Entry Criteria

- Frontend and backend services are running.
- Valid owner account is available.
- Audit trail data exists for normal-flow validation, plus optional empty-data condition for empty-state checks.

## Exit Criteria

- All critical and high-priority audit trail scenarios pass.
- Search, filter, pagination, and role-based visibility behave correctly.
- Audit log entries remain read-only and visually stable across key viewports.
