# Settings Test Cases

## Document Control

| Field | Value |
| --- | --- |
| Module | Settings |
| File Name | `08_settings_testcases.md` |
| Primary Roles Covered | Owner/Admin |
| Related Pages | `/settings` |

## Scope

This document validates:

- Settings page rendering
- Initial loading and error handling
- Summary stat cards
- Business Profile section
- Expiry Alerts section
- Terminology section
- Save Settings behavior
- Last saved indicator behavior
- Field validation, focus, and scroll-to-message behavior
- Inline button loading behavior
- Responsive behavior on key viewports

## Test Cases

| TC ID | Scenario | Role | Preconditions | Steps | Expected Result | Priority |
| --- | --- | --- | --- | --- | --- | --- |
| SET-001 | Open settings page successfully after login | Owner/Admin | User is logged in with a valid active session | 1. Open `/settings` 2. Observe page load | Settings page loads without crash. Summary cards, profile form, expiry-alert form, terminology form, and save area are visible. | Critical |
| SET-002 | Show settings loading state on first visit | Owner/Admin | User is logged in and settings data is not yet loaded | 1. Open `/settings` from another module or immediately after login 2. Observe first render | Loading skeletons appear immediately instead of a blank or broken page. | High |
| SET-003 | Show settings error state when page load fails | Owner/Admin | Backend/API is unavailable or settings request fails | 1. Open `/settings` 2. Simulate API failure | Error state appears clearly. Page does not stay stuck in endless loading. | High |
| SET-004 | Validate summary cards render with correct labels | Owner/Admin | Settings data exists | 1. Open `/settings` 2. Observe top stat cards | Cards display `Business Type`, `Expiry Alert`, `Custom Labels`, and `Configured` with value, icon, and helper text. | High |
| SET-005 | Focus Business Name field on first settings load | Owner/Admin | Settings page loads successfully | 1. Open `/settings` 2. Observe cursor position | Cursor is placed in `Business Name` automatically. | Medium |
| SET-006 | Render Business Profile section successfully | Owner/Admin | Settings page is loaded | 1. Open `/settings` 2. Observe `Business Profile` section | Business profile fields render correctly for name, type, email, phone, and address. | High |
| SET-007 | Validate business name minimum length | Owner/Admin | Settings page is loaded | 1. Enter business name shorter than 2 characters 2. Click `Save Settings` | Validation appears and save is not submitted. | High |
| SET-008 | Validate business type is required | Owner/Admin | Settings page is loaded | 1. Clear or unset business type through test path 2. Save | Validation appears and save is not submitted. | Medium |
| SET-009 | Save business profile changes successfully | Owner/Admin | Settings page is loaded | 1. Update one or more business profile fields 2. Click `Save Settings` | Settings save successfully and updated values remain visible after save completes. | Critical |
| SET-010 | Render Expiry Alerts section successfully | Owner/Admin | Settings page is loaded | 1. Open `/settings` 2. Observe `Expiry Alerts` section | Alert-days field and explanatory panel render correctly. | High |
| SET-011 | Validate minimum expiry alert days | Owner/Admin | Settings page is loaded | 1. Enter value below `1` in alert days 2. Save | Validation appears that value must be between `1` and `90` days. | High |
| SET-012 | Validate maximum expiry alert days | Owner/Admin | Settings page is loaded | 1. Enter value above `90` in alert days 2. Save | Validation appears that value must be between `1` and `90` days. | High |
| SET-013 | Keep alert-days field protected from accidental mouse-wheel changes | Owner/Admin | Alert-days numeric field is focused | 1. Focus alert-days field 2. Scroll mouse wheel | Value does not accidentally change due to mouse-wheel input. | Medium |
| SET-014 | Update expiry-alert days successfully | Owner/Admin | Settings page is loaded | 1. Change alert-days value 2. Click `Save Settings` | Settings save successfully and the updated alert window remains visible after save. | High |
| SET-015 | Render Terminology section successfully | Owner/Admin | Settings page is loaded | 1. Open `/settings` 2. Observe `Terminology` section | Plan, slot, and member label fields render correctly with current values and default helper text. | High |
| SET-016 | Validate terminology plan label is required | Owner/Admin | Settings page is loaded | 1. Clear `Plan Label` 2. Save | Validation appears and save is not submitted. | High |
| SET-017 | Validate terminology slot label is required | Owner/Admin | Settings page is loaded | 1. Clear `Slot Label` 2. Save | Validation appears and save is not submitted. | High |
| SET-018 | Validate terminology member label is required | Owner/Admin | Settings page is loaded | 1. Clear `Member Label` 2. Save | Validation appears and save is not submitted. | High |
| SET-019 | Save custom terminology successfully | Owner/Admin | Settings page is loaded | 1. Change one or more terminology labels 2. Click `Save Settings` | Settings save successfully and the updated labels remain visible after save. | High |
| SET-020 | Save all sections together with one Save Settings action | Owner/Admin | Settings page is loaded | 1. Change values in Business Profile, Expiry Alerts, and Terminology 2. Click `Save Settings` once | All changed settings are saved together successfully through the shared save action. | Critical |
| SET-021 | Show inline loading state during settings save | Owner/Admin | Settings page is loaded | 1. Click `Save Settings` after making valid changes 2. Observe button | Save button shows inline spinner and prevents repeated submission until request completes. | High |
| SET-022 | Auto-scroll to visible error when settings save fails | Owner/Admin | Settings page is loaded | 1. Trigger a save failure 2. Observe page position | Error message is brought into view automatically so the failure reason is not missed. | High |
| SET-023 | Update last-saved value after successful save | Owner/Admin | Settings page is loaded | 1. Save valid settings 2. Observe `Last saved` area | Last-saved timestamp updates after successful save and is displayed in readable date-time format. | High |
| SET-024 | Show fallback text when settings have not been saved yet | Owner/Admin | Test condition where no prior last-saved timestamp exists | 1. Open `/settings` 2. Observe `Last saved` area | Fallback text such as `Not saved yet` appears instead of blank or broken output. | Medium |
| SET-025 | Reflect configured state correctly after first successful save | Owner/Admin | Settings are initially unconfigured in test condition | 1. Open `/settings` with unconfigured data 2. Save valid settings 3. Observe summary cards | `Configured` state changes appropriately after successful save. | High |
| SET-026 | Settings page is usable on mobile viewport | Owner/Admin | Browser width is between 360px and 480px | 1. Open `/settings` on mobile viewport 2. Observe cards, form sections, save area, and field readability | Page remains usable without horizontal page break. Form fields stack cleanly and save action stays usable. | Critical |
| SET-027 | Settings page is usable on tablet viewport | Owner/Admin | Browser width is between 768px and 1024px | 1. Open `/settings` on tablet viewport 2. Observe layout | Layout remains balanced. Sections and save area remain fully visible and readable. | High |
| SET-028 | Settings page is usable on laptop viewport | Owner/Admin | Browser width is between 1280px and 1440px | 1. Open `/settings` on laptop viewport 2. Observe layout | Layout remains visually balanced and save controls remain easy to find and use. | Medium |
| SET-029 | Settings page is usable on large desktop viewport | Owner/Admin | Browser width is 1920px or above | 1. Open `/settings` on large desktop viewport 2. Observe spacing and alignment | Layout remains stable without odd stretching, clipping, or overlap. | Medium |

## Execution Notes

- Validate both configured and first-time setup conditions where possible.
- Save Settings is a shared action for multiple sections, so test cross-section updates in one pass.
- Validate that the last-saved area updates only after successful save.
- For responsive checks, validate at minimum:
  - `360px`
  - `768px`
  - `1280px`
  - `1920px`

## Entry Criteria

- Frontend and backend are running.
- Valid owner/admin test account is available.
- Settings API is reachable for load and save operations.

## Exit Criteria

- All critical and high-priority settings scenarios pass.
