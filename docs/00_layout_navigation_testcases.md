# Layout and Navigation Test Cases

## Document Control

| Field | Value |
| --- | --- |
| Module | Shared Layout and Navigation |
| File Name | `00_layout_navigation_testcases.md` |
| Primary Roles Covered | Owner/Admin, Staff |
| Related Areas | Sidebar, Top Header, Logout, Navigation Loading, Responsive Navigation |

## Scope

This document validates:

- Sidebar rendering and structure
- Role-based menu visibility
- Active menu highlighting
- Menu navigation between modules
- Header title rendering per module
- Business name display in top header
- Logout behavior
- Navigation loading feedback
- Mobile drawer behavior
- Shared layout responsiveness across core breakpoints

## Test Cases

| TC ID | Scenario | Role | Preconditions | Steps | Expected Result | Priority |
| --- | --- | --- | --- | --- | --- | --- |
| LAY-001 | Render sidebar successfully for owner account | Owner/Admin | Valid owner account is logged in | 1. Login as owner 2. Observe left sidebar | Sidebar renders without clipping or broken layout. Brand section, menu section, and user section are visible. | Critical |
| LAY-002 | Render sidebar successfully for staff account | Staff | Valid staff account is logged in | 1. Login as staff 2. Observe left sidebar | Sidebar renders correctly for staff and shows only permitted menu items. | Critical |
| LAY-003 | Show owner-only menu items for owner | Owner/Admin | Owner account is logged in | 1. Login as owner 2. Observe sidebar items | Owner can see `Dashboard`, `Members`, `Plans`, `Slots`, `Pricing Rules`, `Users`, `Audit Trail`, and `Settings`. | Critical |
| LAY-004 | Hide owner-only menu items from staff | Staff | Staff account is logged in | 1. Login as staff 2. Observe sidebar items | Staff does not see owner-only modules such as `Plans`, `Slots`, `Pricing Rules`, `Users`, `Audit Trail`, and `Settings` if access is restricted by role. | Critical |
| LAY-005 | Highlight current active menu item | Owner/Admin | User is logged in and any module is open | 1. Open each module one by one from sidebar 2. Observe current menu item styling | Only the current module is shown with active visual treatment. Non-active items remain visually distinct. | High |
| LAY-006 | Navigate from sidebar to another module | Owner/Admin | User is logged in and on any module | 1. Click a different sidebar item 2. Observe transition | App navigates to the selected module successfully. No full-page crash or broken intermediate state appears. | Critical |
| LAY-007 | Show navigation loading state while changing modules | Owner/Admin | User is logged in | 1. Click a sidebar module not currently open 2. Observe immediate visual response | Loading experience appears immediately during navigation instead of blank delay. Transition feels smooth and intentional. | High |
| LAY-008 | Do not re-trigger navigation when current menu item is clicked | Owner/Admin | User is already on a given module | 1. Click the currently active sidebar item | Page does not reload unnecessarily and current state remains stable. | Medium |
| LAY-009 | Render module title correctly in top header | Owner/Admin | User is logged in | 1. Open each major module 2. Observe left side of top header | Header title reflects the current module correctly, such as `Dashboard`, `Members`, `Plans`, `Slots`, `Pricing Rules`, `Users`, `Audit Trail`, or `Settings`. | High |
| LAY-010 | Render business name correctly in top header | Owner/Admin | Business settings are configured | 1. Login 2. Observe centered business name in top header | Configured business name is shown clearly in header and remains readable without overflow issues. | High |
| LAY-011 | Keep business name fallback when settings are unavailable | Owner/Admin | Settings request fails or business name is unavailable | 1. Simulate settings load failure 2. Observe header | Header falls back safely without crashing layout. A usable default label is shown. | Medium |
| LAY-012 | Open logout from top header | Owner/Admin | User is logged in | 1. Click logout icon in header | Logout action starts successfully and user is redirected out of the authenticated area. | Critical |
| LAY-013 | Show correct loading message during logout transition | Owner/Admin | User is logged in | 1. Click logout icon 2. Observe loading state if shown | Logout-related loading feedback uses correct wording and does not show unrelated module text. | High |
| LAY-014 | Prevent access to authenticated modules after logout | Owner/Admin | User has just logged out | 1. Logout 2. Try opening protected module URL directly | User is redirected to login or blocked from protected pages until authenticated again. | Critical |
| LAY-015 | Restore session without showing broken layout | Owner/Admin | Valid session cookie exists | 1. Refresh browser on any authenticated module 2. Observe app shell | Session restores cleanly. Sidebar and header appear properly once auth state is ready. | High |
| LAY-016 | Show first-visit module loading smoothly after login | Owner/Admin | User has just logged in | 1. Login 2. Open first module after session starts 3. Observe navigation feel | First visit does not appear broken or blank. Loading treatment appears promptly while content is being prepared. | Critical |
| LAY-017 | Keep sidebar brand section readable | Owner/Admin | User is logged in | 1. Observe brand name and logo area in sidebar | Brand text and logo remain centered, readable, and visually balanced. | Medium |
| LAY-018 | Keep sidebar user section readable | Owner/Admin | User is logged in | 1. Observe bottom sidebar user section | User name, role, and last-login details remain readable with clear spacing and contrast. | Medium |
| LAY-019 | Show previous login time correctly for current user | Owner/Admin | Current user has a previous login timestamp | 1. Login 2. Observe `Last Login` value in sidebar | Previous login timestamp is shown in expected readable date-time format. | Medium |
| LAY-020 | Show first-session fallback when previous login is unavailable | Owner/Admin | User record has no previous login value | 1. Login with account without previous login timestamp 2. Observe user section | Sidebar shows safe fallback text instead of blank or broken timestamp output. | Medium |
| LAY-021 | Open sidebar drawer on mobile | Owner/Admin | Browser width is between 360px and 599px | 1. Open any authenticated module on mobile viewport 2. Tap menu icon in header | Sidebar opens as mobile drawer successfully. | Critical |
| LAY-022 | Close sidebar drawer on mobile after navigation | Owner/Admin | Mobile drawer is open | 1. Tap a menu item in mobile sidebar | Selected module opens and mobile drawer closes automatically. | High |
| LAY-023 | Close sidebar drawer manually on mobile | Owner/Admin | Mobile drawer is open | 1. Tap outside drawer or use close behavior available from device flow | Drawer closes without leaving overlay artifacts. | Medium |
| LAY-024 | Keep sidebar usable on tablet viewport | Owner/Admin | Browser width is between 768px and 1024px | 1. Open app on tablet viewport 2. Observe sidebar and header | Navigation remains usable and visually balanced without clipping, hidden menu text, or broken spacing. | High |
| LAY-025 | Keep sidebar usable on laptop viewport | Owner/Admin | Browser width is between 1280px and 1440px | 1. Open app on laptop viewport 2. Observe sidebar and header | Sidebar and header align cleanly with main content area. | High |
| LAY-026 | Keep sidebar usable on large desktop viewport | Owner/Admin | Browser width is 1920px or above | 1. Open app on large desktop viewport 2. Observe layout proportions | Navigation shell remains visually stable and does not look stretched or incomplete. | Medium |
| LAY-027 | Avoid horizontal page scroll caused by app shell | Owner/Admin | User is logged in | 1. Open each major module on standard breakpoints 2. Observe page width | Shared shell does not introduce unnecessary horizontal page scroll. | Critical |
| LAY-028 | Keep touch targets usable on mobile navigation | Owner/Admin | Browser width is between 360px and 480px | 1. Open sidebar drawer 2. Try tapping menu items and header actions | Interactive targets remain large enough for touch use and do not require precision tapping. | High |
| LAY-029 | Keep sidebar bottom section visible in default windowed view | Owner/Admin | App is opened in a standard non-maximized desktop window | 1. Open app in default window size 2. Observe bottom of sidebar | Sidebar bottom content remains readable without awkward clipping or unnecessary extra blank space. | High |
| LAY-030 | Keep menu section and bottom user section spacing visually balanced | Owner/Admin | App is open on desktop viewport | 1. Observe top brand spacing 2. Observe bottom user-section spacing | Overall sidebar spacing feels balanced, with no odd empty gap or cramped last section. | Medium |
| LAY-031 | Keep header visible while content scrolls | Owner/Admin | Any long-content module is open | 1. Scroll down in a long page 2. Observe top header | Header remains fixed and usable while page content scrolls beneath it. | High |
| LAY-032 | Keep page title, business name, and logout action readable together | Owner/Admin | App is open on desktop viewport | 1. Observe full header layout across modules | Header elements do not overlap, truncate badly, or create confusing alignment issues. | High |

## Execution Notes

- Validate layout behavior for both owner and staff roles.
- Validate standard breakpoints at minimum:
  - `360px`
  - `768px`
  - `1280px`
  - `1920px`
- Validate both maximized and normal desktop window states for sidebar visibility.
- For navigation-loading checks, validate first visit after login and normal repeat navigation.
- For logout checks, validate that user cannot keep accessing protected modules after session ends.

## Entry Criteria

- Frontend and backend are running.
- Valid owner/admin and staff test accounts are available.
- Business settings contain a valid business name for header verification.

## Exit Criteria

- All critical and high-priority shared layout and navigation scenarios pass.
