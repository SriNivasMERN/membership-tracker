# Users Test Cases

## Document Control

| Field | Value |
| --- | --- |
| Module | Users |
| File Name | `07_users_testcases.md` |
| Primary Roles Covered | Owner/Admin |
| Related Pages | `/users` |

## Scope

This document validates:

- Users page rendering
- Initial loading and error handling
- Summary stat cards
- Empty state behavior
- Add Staff flow
- Edit User flow
- Owner-account edit restrictions
- Activate / deactivate staff flow
- Inline button loading behavior
- Dialog validation, focus, and scroll-to-message behavior
- Responsive behavior on key viewports

## Test Cases

| TC ID | Scenario | Role | Preconditions | Steps | Expected Result | Priority |
| --- | --- | --- | --- | --- | --- | --- |
| USR-001 | Open users page successfully after login | Owner/Admin | User is logged in with a valid active session | 1. Open `/users` 2. Observe page load | Users page loads without crash. Summary cards, add button, and users table are visible. | Critical |
| USR-002 | Show users loading state on first visit | Owner/Admin | User is logged in and users data is not yet loaded | 1. Open `/users` from another module or immediately after login 2. Observe first render | Workspace loading experience appears immediately instead of a blank or broken page. | High |
| USR-003 | Show users error state when page load fails | Owner/Admin | Backend/API is unavailable or users request fails | 1. Open `/users` 2. Simulate API failure | Error state appears with retry option. Page does not stay stuck in endless loading. | High |
| USR-004 | Validate summary cards render with correct labels | Owner/Admin | User data exists | 1. Open `/users` 2. Observe top stat cards | Cards display `Overall Users`, `Active`, `Staff`, and `Owners` with count, icon, and helper text. | High |
| USR-005 | Show empty state when no staff accounts exist | Owner/Admin | No user records exist beyond required baseline or list is empty in test condition | 1. Open `/users` | Empty state appears clearly and provides the `Add Staff` action. | Medium |
| USR-006 | Open Add Staff dialog successfully | Owner/Admin | Users page is loaded | 1. Click `Add Staff` | Add Staff dialog opens successfully without broken layout. | High |
| USR-007 | Focus Full Name field when Add Staff dialog opens | Owner/Admin | Add Staff dialog is open | 1. Open `Add Staff` dialog 2. Observe cursor position | Cursor is placed in `Full Name` automatically. | Medium |
| USR-008 | Validate minimum staff name length | Owner/Admin | Add Staff dialog is open | 1. Enter name shorter than 2 characters 2. Submit | Validation appears and form is not submitted. | High |
| USR-009 | Validate required staff email | Owner/Admin | Add Staff dialog is open | 1. Leave email blank 2. Submit | Validation appears and form is not submitted. | High |
| USR-010 | Validate email format during staff creation | Owner/Admin | Add Staff dialog is open | 1. Enter invalid email format 2. Submit | Validation appears and form is not submitted. | High |
| USR-011 | Validate minimum password length during staff creation | Owner/Admin | Add Staff dialog is open | 1. Enter password shorter than 8 characters 2. Submit | Validation appears and form is not submitted. | High |
| USR-012 | Create staff account successfully | Owner/Admin | Users page is loaded | 1. Open `Add Staff` 2. Enter valid name, email, and password 3. Submit | Staff account is created successfully. Dialog closes. Table and summary cards refresh correctly. | Critical |
| USR-013 | Show inline loading state during staff creation | Owner/Admin | Add Staff dialog is open | 1. Submit valid staff form 2. Observe action button | Submit button shows inline spinner and prevents repeated submission until request completes. | High |
| USR-014 | Auto-scroll to API error in Add Staff dialog | Owner/Admin | Add Staff dialog is open | 1. Trigger an API validation or save failure 2. Observe dialog position | Error alert becomes visible without manual scrolling. | High |
| USR-015 | Cancel Add Staff dialog | Owner/Admin | Add Staff dialog is open | 1. Click `Cancel` | Dialog closes without creating a new account. | Medium |
| USR-016 | Open Edit User dialog successfully for staff account | Owner/Admin | At least one staff account exists | 1. Click edit action for a staff account | Edit User dialog opens successfully with existing values prefilled. | High |
| USR-017 | Update staff profile name successfully | Owner/Admin | Editable staff account exists | 1. Open `Edit User` for staff 2. Change name 3. Submit | Staff user name updates successfully and table reflects the saved value. | High |
| USR-018 | Update staff email successfully | Owner/Admin | Editable staff account exists | 1. Open `Edit User` for staff 2. Change email to a valid new value 3. Submit | Staff email updates successfully and table reflects the saved value. | High |
| USR-019 | Update staff password successfully | Owner/Admin | Editable staff account exists | 1. Open `Edit User` for staff 2. Enter a valid new password 3. Submit | Staff password update succeeds without breaking the account record. | High |
| USR-020 | Keep staff password unchanged when New Password is blank | Owner/Admin | Editable staff account exists | 1. Open `Edit User` for staff 2. Leave `New Password` blank 3. Submit other valid changes | Staff account saves successfully without forcing a password change. | Medium |
| USR-021 | Validate email format during staff edit | Owner/Admin | Edit User dialog is open for staff | 1. Enter invalid email format 2. Submit | Validation appears and changes are not submitted. | High |
| USR-022 | Validate minimum new-password length during staff edit | Owner/Admin | Edit User dialog is open for staff | 1. Enter new password shorter than 8 characters 2. Submit | Validation appears and changes are not submitted. | High |
| USR-023 | Open Edit User dialog for owner account | Owner/Admin | Owner row is visible in the table | 1. Click edit action for owner row | Edit dialog opens successfully for owner account. | High |
| USR-024 | Restrict owner edit to name only | Owner/Admin | Edit User dialog is open for owner | 1. Open owner edit dialog 2. Observe available fields | Owner edit flow allows name update only. Owner email and password changes are not offered in this screen. | Critical |
| USR-025 | Update owner name successfully | Owner/Admin | Owner edit dialog is open | 1. Change owner name 2. Submit | Owner name updates successfully and table reflects the saved value. | High |
| USR-026 | Show inline loading state during user edit | Owner/Admin | Edit User dialog is open | 1. Submit valid edit 2. Observe action button | Save button shows inline spinner and prevents duplicate submission until request completes. | High |
| USR-027 | Auto-scroll to API error in Edit User dialog | Owner/Admin | Edit User dialog is open | 1. Trigger an API validation or save failure 2. Observe dialog position | Error alert becomes visible without manual scrolling. | High |
| USR-028 | Deactivate staff account successfully | Owner/Admin | At least one active staff account exists and it is not the current logged-in user | 1. Click deactivate action for staff row 2. Confirm action | Staff account becomes inactive successfully. Status chip and summary cards refresh correctly. | Critical |
| USR-029 | Activate inactive staff account successfully | Owner/Admin | At least one inactive staff account exists | 1. Click activate action for staff row 2. Confirm action | Staff account becomes active successfully. Status chip and summary cards refresh correctly. | Critical |
| USR-030 | Do not show activate or deactivate action for owner row | Owner/Admin | Owner row is visible in the table | 1. Open `/users` 2. Observe actions for owner row | Owner row does not expose activate or deactivate control. | High |
| USR-031 | Do not show activate or deactivate action for current logged-in user row | Owner/Admin | Current logged-in owner row is visible | 1. Open `/users` 2. Observe actions for the current user row | Current logged-in user is not given self-deactivation control in the table. | High |
| USR-032 | Cancel staff activate or deactivate action | Owner/Admin | Toggle confirmation dialog is open | 1. Open toggle confirmation 2. Cancel action | Dialog closes and user status remains unchanged. | Medium |
| USR-033 | Show inline loading state during staff activate or deactivate | Owner/Admin | Toggle confirmation dialog is open | 1. Confirm activate or deactivate action 2. Observe button state | Confirmation button shows inline loading state and prevents repeated submission until request completes. | High |
| USR-034 | Keep table values readable after add, edit, and toggle actions | Owner/Admin | User data exists | 1. Perform add, edit, and toggle flows 2. Observe table and cards after each action | Table and summary cards remain synchronized with the latest saved user state. | High |
| USR-035 | Users page is usable on mobile viewport | Owner/Admin | Browser width is between 360px and 480px | 1. Open `/users` on mobile viewport 2. Observe cards, table, dialogs, and action buttons | Page remains usable without horizontal page break. Dialog opens in a mobile-friendly full-screen style. | Critical |
| USR-036 | Users page is usable on tablet viewport | Owner/Admin | Browser width is between 768px and 1024px | 1. Open `/users` on tablet viewport 2. Observe layout | Layout remains balanced. Cards and table remain readable and fully visible. | High |
| USR-037 | Users page is usable on laptop viewport | Owner/Admin | Browser width is between 1280px and 1440px | 1. Open `/users` on laptop viewport 2. Observe layout | Layout remains visually balanced and action controls remain fully usable. | Medium |
| USR-038 | Users page is usable on large desktop viewport | Owner/Admin | Browser width is 1920px or above | 1. Open `/users` on large desktop viewport 2. Observe spacing and alignment | Layout remains stable without odd stretching, clipping, or overlap. | Medium |

## Execution Notes

- Validate owner and staff rows separately because their available actions differ.
- Use at least one active staff account and one inactive staff account for toggle checks.
- Validate edit coverage for both staff and owner because owner edit restrictions are different.
- For responsive checks, validate at minimum:
  - `360px`
  - `768px`
  - `1280px`
  - `1920px`

## Entry Criteria

- Frontend and backend are running.
- Valid owner/admin test account is available.
- At least one owner account exists and one staff account is available or can be created.

## Exit Criteria

- All critical and high-priority users scenarios pass.
