# Dashboard Test Cases

## Document Control

| Field | Value |
| --- | --- |
| Module | Dashboard |
| File Name | `02_dashboard_testcases.md` |
| Primary Roles Covered | Owner/Admin, Staff |
| Related Pages | `/dashboard` |

## Scope

This document validates:

- Dashboard page rendering
- Initial loading and error handling
- Summary stat cards
- Stat-card drilldown dialogs
- Business Pulse section
- Collections Trend section
- Utilization section
- Renewal Queue section
- Section jump navigation
- Responsive behavior on key viewports

## Test Cases

| TC ID | Scenario | Role | Preconditions | Steps | Expected Result | Priority |
| --- | --- | --- | --- | --- | --- | --- |
| DSH-001 | Open dashboard successfully after login | Owner/Admin | User is logged in with a valid active session | 1. Open `/dashboard` 2. Observe page load | Dashboard loads without crash. Summary cards, main sections, and top navigation are visible. | Critical |
| DSH-002 | Show dashboard loading state on first visit | Owner/Admin | User is logged in and dashboard data is not yet loaded | 1. Open `/dashboard` from another module or immediately after login 2. Observe first render | Dashboard shows the workspace loading experience immediately, without a blank broken state. | High |
| DSH-003 | Show dashboard error state when summary load fails | Owner/Admin | Backend/API is unavailable or dashboard request fails | 1. Open `/dashboard` 2. Simulate dashboard API failure | Error state appears with retry option. Page does not stay stuck in an endless loading state. | High |
| DSH-004 | Validate summary cards render with correct labels | Owner/Admin | Dashboard data exists | 1. Open `/dashboard` 2. Observe top cards | Cards display `Total Members`, `Active`, `Renewal Due`, and `Expired` with count, icon, and helper text. | High |
| DSH-005 | Open Total Members drilldown from stat card | Owner/Admin | Dashboard has member records | 1. Click `Total Members` card | Drilldown dialog opens and lists all available members for that segment. | High |
| DSH-006 | Open Active Members drilldown from stat card | Owner/Admin | Dashboard has active members | 1. Click `Active` card | Drilldown dialog opens and lists active members only. | High |
| DSH-007 | Open Renewal Due drilldown from stat card | Owner/Admin | Dashboard has members inside renewal alert window | 1. Click `Renewal Due` card | Drilldown dialog opens and lists only members due for renewal follow-up. | High |
| DSH-008 | Open Expired Members drilldown from stat card | Owner/Admin | Dashboard has expired members | 1. Click `Expired` card | Drilldown dialog opens and lists only expired members. | High |
| DSH-009 | Show empty state in stat-card drilldown when no records exist | Owner/Admin | Selected dashboard segment has zero records | 1. Click any summary card with value `0` | Dialog opens with a clear empty state message instead of a broken or blank list. | Medium |
| DSH-010 | Close drilldown dialog successfully | Owner/Admin | Any dashboard drilldown dialog is open | 1. Click dialog close icon or outside area if supported | Dialog closes cleanly and dashboard remains usable. | Medium |
| DSH-011 | Validate Business Pulse section renders | Owner/Admin | Dashboard data exists | 1. Open `/dashboard` 2. Observe `Business Pulse` section | `Business Pulse` section appears with collections, payment due, renewals due, and top plan metrics. | High |
| DSH-012 | Validate Business Pulse action items render | Owner/Admin | Dashboard data exists | 1. Open `/dashboard` 2. Observe action cards below key metrics | `Pending collections`, `Renewals to call`, and `Expired memberships` appear with count/value and helper text. | High |
| DSH-013 | Validate Revenue Context metrics render | Owner/Admin | Monthly payment data exists | 1. Open `/dashboard` 2. Observe `Revenue context` area | `Latest Month`, `Best Month`, and `Monthly Average` appear with values and helper text. | High |
| DSH-014 | Jump from Business Pulse to Collections Trend | Owner/Admin | Dashboard page is fully loaded | 1. Click `Collections Trend` jump link inside `Business Pulse` | Page scrolls to the `Collections Trend` section and shows the section from its top boundary. | High |
| DSH-015 | Jump back from Collections Trend to Business Pulse | Owner/Admin | Dashboard page is fully loaded | 1. Scroll to `Collections Trend` 2. Click `Business Pulse` jump link | Page scrolls back to the dashboard overview/business pulse area and aligns the section cleanly from the top. | High |
| DSH-016 | Validate Collections Trend section renders with trend metrics | Owner/Admin | Monthly payment data exists | 1. Open `/dashboard` 2. Observe `Collections Trend` | Latest month, best month, lowest month, trend signal, and the revenue chart render correctly. | High |
| DSH-017 | Validate chart handles no payment data | Owner/Admin | No monthly payment data exists | 1. Open `/dashboard` with empty monthly revenue dataset | Collections Trend shows a proper empty state instead of broken chart content. | Medium |
| DSH-018 | Validate upward trend indicator | Owner/Admin | Latest month collection is greater than previous month | 1. Open `/dashboard` 2. Observe trend chip and chart context | Trend displays a positive percentage with upward treatment. | Medium |
| DSH-019 | Validate downward trend indicator | Owner/Admin | Latest month collection is less than previous month | 1. Open `/dashboard` 2. Observe trend chip and chart context | Trend displays a negative percentage with downward treatment. | Medium |
| DSH-020 | Validate Utilization section renders plan distribution | Owner/Admin | Plan distribution data exists | 1. Open `/dashboard` 2. Observe `Utilization` section | Plan utilization bars display plan name, member count, and percentage. | High |
| DSH-021 | Validate Utilization section renders slot distribution | Owner/Admin | Slot activity data exists | 1. Open `/dashboard` 2. Observe slot area inside `Utilization` | Slot utilization bars display slot label, member count, and percentage. | High |
| DSH-022 | Validate Utilization empty state | Owner/Admin | No plan and no slot usage data exists | 1. Open `/dashboard` with empty distribution data | Utilization shows a clear empty state message. | Medium |
| DSH-023 | Validate Renewal Queue section renders | Owner/Admin | Dashboard has renewal-alert members | 1. Open `/dashboard` 2. Observe `Renewal Queue` | Queue lists members approaching renewal, including name, plan/slot, contact number, renewal date, and payment state. | High |
| DSH-024 | Validate Renewal Queue empty state | Owner/Admin | No members are in renewal alert window | 1. Open `/dashboard` | Renewal Queue shows a proper empty state instead of blank space. | Medium |
| DSH-025 | Validate loading skeletons match dashboard layout | Owner/Admin | Dashboard is opened on a slower connection or delayed API response | 1. Open `/dashboard` 2. Observe loading stage | Skeletons appear in places matching stat cards and main dashboard sections, with no major layout shift after data appears. | High |
| DSH-026 | Dashboard is usable on mobile viewport | Owner/Admin | Browser width is between 360px and 480px | 1. Open `/dashboard` on mobile viewport 2. Observe cards, sections, chart, and queue | Dashboard reflows into a mobile-friendly layout. No horizontal page scroll appears. Tap targets remain usable. | Critical |
| DSH-027 | Dashboard is usable on tablet viewport | Owner/Admin | Browser width is between 768px and 1024px | 1. Open `/dashboard` on tablet viewport 2. Observe layout | Sections reflow cleanly, cards remain readable, and content is not cut off. | High |
| DSH-028 | Dashboard is usable on laptop viewport | Owner/Admin | Browser width is between 1280px and 1440px | 1. Open `/dashboard` on laptop viewport 2. Observe section balance and chart area | Layout remains balanced, sections align properly, and there is no clipped content. | Medium |
| DSH-029 | Dashboard is usable on large desktop viewport | Owner/Admin | Browser width is 1920px or above | 1. Open `/dashboard` on large desktop viewport 2. Observe spacing and section alignment | Layout remains visually balanced without excessive breakage, truncation, or overlap. | Medium |
| DSH-030 | Dashboard supports staff access | Staff | Staff user has valid access to dashboard | 1. Login with valid staff account 2. Open `/dashboard` | Dashboard loads successfully for staff according to access rules. | High |

## Execution Notes

- Validate dashboard with both populated data and low-data/empty-data conditions where possible.
- For drilldown checks, verify that the dialog content matches the selected summary card type.
- For chart validation, use at least one dataset with growth and one dataset with decline.
- For responsive checks, validate at minimum:
  - `360px`
  - `768px`
  - `1280px`
  - `1920px`

## Entry Criteria

- Frontend and backend are running.
- Valid owner/admin and staff test accounts are available.
- Dashboard summary, member, plan, slot, and payment data are available for validation.

## Exit Criteria

- All critical and high-priority dashboard scenarios pass.
