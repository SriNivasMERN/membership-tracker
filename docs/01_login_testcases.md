# Login Test Cases

## Document Control

| Field | Value |
| --- | --- |
| Module | Login / Authentication |
| File Name | `01_login_testcases.md` |
| Primary Roles Covered | Owner/Admin, Staff, Unauthorized User |
| Related Pages | `/login` |

## Scope

This document validates:

- Login page rendering
- Field validation
- Password visibility behavior
- Successful login for valid roles
- Error handling for invalid credentials
- Loading state during login
- Session/redirect behavior from the login entry point

## Test Cases

| TC ID | Scenario | Role | Preconditions | Steps | Expected Result | Priority |
| --- | --- | --- | --- | --- | --- | --- |
| LGN-001 | Open login page successfully | Unauthorized User | App is running and user is logged out | 1. Open `/login` 2. Observe page load | Login page loads without crash. Email field is visible. Password field is visible. Sign In button is visible. | High |
| LGN-002 | Email field gets initial focus | Unauthorized User | App is running and user is logged out | 1. Open `/login` 2. Observe cursor position | Cursor is placed in the Email address field automatically. | Medium |
| LGN-003 | Validate required email field | Unauthorized User | User is on login page | 1. Leave email blank 2. Enter valid password 3. Click `Sign In` | Inline validation appears for email with clear required-field message. Login request is not submitted. | High |
| LGN-004 | Validate required password field | Unauthorized User | User is on login page | 1. Enter valid email 2. Leave password blank 3. Click `Sign In` | Inline validation appears for password with clear required-field message. Login request is not submitted. | High |
| LGN-005 | Validate invalid email format | Unauthorized User | User is on login page | 1. Enter `invalid-email` 2. Enter any password 3. Click `Sign In` | Email field shows invalid format error. Login request is not submitted. | High |
| LGN-006 | Toggle password visibility on | Unauthorized User | User is on login page | 1. Enter password in Password field 2. Click visibility icon | Password becomes readable text. Field value remains unchanged. | Medium |
| LGN-007 | Toggle password visibility off | Unauthorized User | Password is currently visible | 1. Click visibility icon again | Password is hidden again. Field value remains unchanged. | Medium |
| LGN-008 | Successful login with valid owner account | Owner/Admin | Valid owner test account exists and is active | 1. Open `/login` 2. Enter valid owner email 3. Enter valid owner password 4. Click `Sign In` | Login succeeds. User is redirected to `/dashboard`. Owner session is established successfully. | Critical |
| LGN-009 | Successful login with valid staff account | Staff | Valid staff test account exists and is active | 1. Open `/login` 2. Enter valid staff email 3. Enter valid staff password 4. Click `Sign In` | Login succeeds. User is redirected to `/dashboard`. Staff session is established successfully. | Critical |
| LGN-010 | Reject invalid password for valid email | Unauthorized User | Valid test user email exists | 1. Enter valid test email 2. Enter invalid password 3. Click `Sign In` | Login fails with generic authentication error. App must not reveal whether email or password is incorrect separately. | Critical |
| LGN-011 | Reject unknown email | Unauthorized User | User is on login page | 1. Enter `invalid.user@example.com` 2. Enter any password 3. Click `Sign In` | Login fails with generic authentication error. App does not reveal whether account exists. | Critical |
| LGN-012 | Reject deactivated account | Unauthorized User | Deactivated user account exists in test environment | 1. Enter deactivated user email 2. Enter correct password 3. Click `Sign In` | Login fails with account deactivated message. User remains on login page. | High |
| LGN-013 | Show inline loading state during login submission | Owner/Admin | Valid owner test account exists | 1. Enter valid owner credentials 2. Click `Sign In` | Sign In button becomes disabled during request. Button shows loading spinner until response completes. | High |
| LGN-014 | Prevent repeated multiple submissions during loading | Owner/Admin | Valid owner test account exists | 1. Enter valid owner credentials 2. Rapidly click `Sign In` multiple times | Only one effective login submission is processed while the button is disabled. | High |
| LGN-015 | Show API error at top of form after failed login | Unauthorized User | User is on login page | 1. Submit invalid credentials 2. Observe form | Error alert is displayed clearly above form fields. | High |
| LGN-016 | Auto-scroll to error message after failed login | Unauthorized User | Viewport is small enough that alert may be above current view | 1. Enter invalid credentials 2. Submit login 3. Observe page position | Page scrolls to the top error alert automatically so the failure reason is visible without manual scrolling. | High |
| LGN-017 | Keep entered values after failed login | Unauthorized User | User is on login page | 1. Enter invalid credentials 2. Click `Sign In` | Entered email remains available for correction. Password field behavior remains consistent with app security design. | Medium |
| LGN-018 | Redirect authenticated user away from login page | Owner/Admin | User already has a valid authenticated session | 1. Login successfully 2. Attempt to revisit `/login` | Authenticated user is not allowed to continue normal login flow and is redirected appropriately by the app. | High |
| LGN-019 | Login page is usable on mobile viewport | Unauthorized User | Browser width is between 360px and 480px | 1. Open `/login` on mobile viewport 2. Observe card, fields, button, and icon sizes | Form fits screen without horizontal scroll. Fields are readable. Tap targets remain usable. | High |
| LGN-020 | Login page is usable on tablet viewport | Unauthorized User | Browser width is between 768px and 1024px | 1. Open `/login` on tablet viewport 2. Observe layout | Layout remains centered, balanced, and fully usable without broken alignment. | Medium |
| LGN-021 | Loading screen appears on first authenticated app entry | Owner/Admin | User is not logged in | 1. Login with valid credentials 2. Observe first post-login transition | User sees the app loading experience while the workspace initializes, without broken or blank intermediate state. | High |

## Execution Notes

- Use separate runs for owner and staff validation.
- Perform failed-login scenarios after clearing any prior authenticated session.
- For responsive checks, validate at minimum:
  - `360px`
  - `768px`
  - `1280px`
  - `1920px`

## Entry Criteria

- Frontend and backend are running.
- Test accounts required for owner, staff, and deactivated-user scenarios are available in the test environment.

## Exit Criteria

- All critical and high-priority login scenarios pass.
