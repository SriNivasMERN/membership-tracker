# Members Test Cases

## Document Control

| Field | Value |
| --- | --- |
| Module | Members |
| File Name | `03_members_testcases.md` |
| Primary Roles Covered | Owner/Admin, Staff |
| Related Pages | `/members`, `/members/new`, `/members/[id]` |

## Scope

This document validates:

- Members list page rendering
- Initial loading, filtering, and error handling
- Summary stat cards and pagination behavior
- Search and filter behavior across the full matching dataset
- Add Member flow
- Member details page rendering
- Record Payment flow
- Change / Renew Plan flow
- End Membership flow
- Edit Member flow
- Delete Member flow
- Focus, scroll-to-message, and loading behavior
- Responsive behavior on key viewports

## Test Cases

| TC ID | Scenario | Role | Preconditions | Steps | Expected Result | Priority |
| --- | --- | --- | --- | --- | --- | --- |
| MEM-001 | Open members list successfully after login | Owner/Admin | User is logged in with a valid active session | 1. Open `/members` 2. Observe page load | Members page loads without crash. Summary cards, filters, table, and actions are visible. | Critical |
| MEM-002 | Show members loading state on first visit | Owner/Admin | User is logged in and members data is not yet loaded | 1. Open `/members` from another module or immediately after login 2. Observe first render | Workspace loading experience appears immediately instead of a blank or broken page. | High |
| MEM-003 | Show list error state when members load fails | Owner/Admin | Backend/API is unavailable or members request fails | 1. Open `/members` 2. Simulate API failure | Error state appears with retry option. Page does not stay stuck in endless loading. | High |
| MEM-004 | Validate members summary cards render with correct labels | Owner/Admin | Member data exists | 1. Open `/members` 2. Observe top stat cards | Cards display `Overall Members`, `Active`, `Renewal Due`, and `Payment Due` with count, icon, and helper text. | High |
| MEM-005 | Validate summary cards use full matching dataset, not current page only | Owner/Admin | Member list contains multiple pages of records | 1. Open `/members` 2. Note summary values on page 1 3. Move to page 2 4. Compare summary values with the total matching dataset | Summary cards continue to represent the full matching member set and do not change only because pagination page changed. | Critical |
| MEM-006 | Focus search field on first page visit | Owner/Admin | Members page loads successfully | 1. Open `/members` 2. Observe cursor placement | Search input receives focus automatically. User can start typing immediately. | Medium |
| MEM-007 | Keep search focus when moving between pagination pages | Owner/Admin | Members list contains more than one page | 1. Open `/members` 2. Click `Next` or `Previous` 3. Observe search field | Page changes successfully and search input regains focus after navigation. | Medium |
| MEM-008 | Search by member name across all records | Owner/Admin | Matching member exists in dataset | 1. Enter a known member name in search 2. Observe results | Matching records are shown even if the member was not originally visible on the current page. Pagination updates to the filtered result set. | Critical |
| MEM-009 | Search by mobile number across all records | Owner/Admin | Matching mobile number exists in dataset | 1. Enter a known mobile number in search 2. Observe results | Matching record appears based on full dataset search, not only the current page. | Critical |
| MEM-010 | Show inline filtering indicator while member list updates | Owner/Admin | Members page is loaded | 1. Type in search or change any filter 2. Observe filter area | A subtle loading indicator appears while the list refreshes. Page does not feel frozen. | High |
| MEM-011 | Filter by status | Owner/Admin | Dataset contains mixed statuses | 1. Select a status from `Status` filter 2. Observe results | Only records with the selected status appear. Summary cards update to the filtered dataset. | High |
| MEM-012 | Filter by plan | Owner/Admin | Dataset contains multiple plans | 1. Select a plan from `Plan` filter 2. Observe results | Only members on the selected plan appear. Summary cards and pagination update correctly. | High |
| MEM-013 | Filter by payment state | Owner/Admin | Dataset contains paid and pending members | 1. Select `Payment Due` or `Fully Paid` from `Payments` filter 2. Observe results | Table shows only members matching the selected payment state. | High |
| MEM-014 | Combine search and filters | Owner/Admin | Dataset contains enough records for overlapping criteria | 1. Enter search text 2. Apply status and/or plan and/or payment filters 3. Observe results | Results reflect the combined criteria across the full matching dataset. | High |
| MEM-015 | Clear all filters | Owner/Admin | One or more filters are active | 1. Click `Clear` 2. Observe cards, table, and pagination | Search and all filters reset. Full member list is restored and page returns to page 1. | High |
| MEM-016 | Show active filter chips | Owner/Admin | One or more filters are active | 1. Apply search or any filter 2. Observe chip area | Active filter chips appear and reflect the applied values clearly. | Medium |
| MEM-017 | Remove one filter using its chip | Owner/Admin | Multiple filters are active | 1. Delete one active filter chip 2. Observe results | Only the selected filter is removed. Remaining filters stay active and results refresh correctly. | Medium |
| MEM-018 | Show empty state when no members exist | Owner/Admin | No member records exist in the system | 1. Open `/members` | Empty state appears with a usable action to add the first member. | High |
| MEM-019 | Show empty state when filters return no results | Owner/Admin | Member records exist but current filters return no match | 1. Apply filters that produce zero matches | Empty filtered state appears clearly and allows user to clear filters. | High |
| MEM-020 | Validate pagination controls | Owner/Admin | Members list contains more than one page | 1. Open `/members` 2. Use `Next` and `Previous` buttons | Pagination moves between pages correctly. Current page indicator updates accurately. | High |
| MEM-021 | Reset page to page 1 after changing search or filters | Owner/Admin | User is currently on page 2 or later | 1. Navigate to a later page 2. Change search or any filter | Members list returns to page 1 of the new result set automatically. | High |
| MEM-022 | Open Add Member page from members list | Owner/Admin | Members page is loaded | 1. Click `Add Member` | User is taken to `/members/new` and the add-member form loads successfully. | High |
| MEM-023 | Render Add Member page successfully | Owner/Admin | User is on `/members/new` | 1. Open `/members/new` 2. Observe form | Add Member page shows personal details, membership details, additional notes, and action buttons without broken layout. | High |
| MEM-024 | Show loading state while add-member options load | Owner/Admin | Plans and slots are not yet loaded | 1. Open `/members/new` 2. Observe first render | Page shows loading experience while membership options are being prepared. | Medium |
| MEM-025 | Focus Full Name field on Add Member page | Owner/Admin | Add Member page loads successfully | 1. Open `/members/new` | Cursor is placed in `Full Name` field automatically. | Medium |
| MEM-026 | Auto-calculate final price after selecting plan and slot | Owner/Admin | At least one plan and slot exist | 1. Open `/members/new` 2. Select a plan 3. Select a slot | `Final Price` updates correctly based on the selected plan and slot combination. | Critical |
| MEM-027 | Allow manual final-price override during add-member flow | Owner/Admin | Plan and slot are selected | 1. Enter a custom value in `Final Price` 2. Submit valid member form | Member is created successfully with the overridden final price. | Medium |
| MEM-028 | Create member successfully with valid data | Owner/Admin | Valid plans and slots exist | 1. Fill required fields 2. Submit form | Member record is created successfully and success feedback is shown. | Critical |
| MEM-029 | Show validation for missing required add-member fields | Owner/Admin | Add Member page is open | 1. Leave required fields empty 2. Submit form | Required field validation appears and form is not submitted. | High |
| MEM-030 | Show duplicate-mobile error and auto-scroll to message on Add Member | Owner/Admin | A member with the same mobile already exists | 1. Fill form using an existing mobile number 2. Submit form | Error message is shown clearly and page scrolls to bring the message into view automatically. | Critical |
| MEM-031 | Keep submit button in loading state during add-member request | Owner/Admin | Add Member page is open | 1. Submit valid form 2. Observe action area | Submit button shows inline loading state and prevents repeated submissions until request completes. | High |
| MEM-032 | Cancel add-member flow | Owner/Admin | Add Member page is open | 1. Click `Cancel` | User returns to members list without crash. | Medium |
| MEM-033 | Open member details page from list | Owner/Admin | At least one member record exists | 1. Click view action for any member | Member details page opens for the selected record. | Critical |
| MEM-034 | Render member details page successfully | Owner/Admin | Valid member exists | 1. Open `/members/[id]` for a valid record | Summary cards, personal details, membership details, payment summary, payment history, and action buttons render correctly. | Critical |
| MEM-035 | Show member-details loading state on first visit | Owner/Admin | Member details are not yet loaded | 1. Open any member details page 2. Observe first render | Member details page shows loading treatment immediately instead of blank space. | High |
| MEM-036 | Show member-details error state when member load fails | Owner/Admin | Backend/API fails for member details request | 1. Open any member details page 2. Simulate API failure | Error state appears clearly. User is not left on a broken details screen. | High |
| MEM-037 | Record payment successfully | Owner/Admin | Selected member has pending amount greater than zero | 1. Open member details page 2. Click `Record Payment` 3. Enter valid amount within allowed range 4. Confirm | Payment is recorded successfully. Payment summary and history update correctly. | Critical |
| MEM-038 | Prevent overpayment in Record Payment flow | Owner/Admin | Selected member has pending amount greater than zero | 1. Open `Record Payment` dialog 2. Enter amount above allowed pending balance 3. Try to submit | Overpayment is prevented. User is shown clear validation and payment is not accepted incorrectly. | Critical |
| MEM-039 | Show inline loading state during Record Payment submit | Owner/Admin | Record Payment dialog is open | 1. Submit a valid payment 2. Observe action button | Submit button shows inline spinner and prevents duplicate submission until action completes. | High |
| MEM-040 | Open Change / Renew Plan flow for active member | Owner/Admin | Selected member is active | 1. Open active member details page 2. Click `Change / Renew Plan` | Membership update dialog opens successfully with current context populated. | High |
| MEM-041 | Open Renew Membership flow for inactive or ended member where allowed | Owner/Admin | Selected member is not currently active and renew action is available | 1. Open member details page 2. Click `Renew Membership` | Renew dialog opens successfully with appropriate fields and pricing context. | High |
| MEM-042 | Recalculate membership amount correctly during plan change | Owner/Admin | Member exists with current plan and payment history | 1. Open change-plan flow 2. Select a different plan 3. Observe price breakdown | Price breakdown updates correctly for the selected plan and current member context. | Critical |
| MEM-043 | Recalculate membership amount correctly during renewal | Owner/Admin | Member is eligible for renewal | 1. Open renewal flow 2. Select renewal plan and slot as needed 3. Observe price breakdown | Final amount, collected-now value, and due state calculate correctly for renewal. | Critical |
| MEM-044 | Prevent over-collection during plan change or renewal | Owner/Admin | Change / renew dialog is open | 1. Enter payment amount above allowed due 2. Try to submit | Excess collection is prevented and validation is shown. | Critical |
| MEM-045 | Save changed or renewed membership successfully | Owner/Admin | Valid change or renewal details are entered | 1. Complete plan-change or renewal form 2. Submit | Membership updates successfully. Member summary and payment state refresh correctly. | Critical |
| MEM-046 | Edit personal details successfully | Owner/Admin | Valid member exists | 1. Open member details 2. Click `Edit` in personal details 3. Update values 4. Save | Member personal information updates successfully and refreshed data is shown. | High |
| MEM-047 | Focus Full Name field when Edit Member dialog opens | Owner/Admin | Edit Member dialog is opened | 1. Open `Edit Member` dialog | Cursor starts in `Full Name` field automatically. | Medium |
| MEM-048 | End membership successfully | Owner/Admin | Valid member exists and end action is enabled | 1. Open member details 2. Click `End Membership` 3. Enter required end details 4. Confirm | Membership is ended successfully and member status changes to `Ended`. | Critical |
| MEM-049 | Show Not Applicable for renewal date after membership is ended | Owner/Admin | Member membership has been ended | 1. Open ended member details 2. Observe renewal summary and list representation | Renewal date is shown as `Not Applicable` for ended membership instead of misleading active-style renewal date. | High |
| MEM-050 | Show settlement outcome clearly when membership is ended | Owner/Admin | Member has either refundable balance or outstanding due | 1. End membership for different financial cases 2. Observe payment summary | Summary communicates the correct final outcome, such as refund due or pending amount due to the gym, without misleading wording. | High |
| MEM-051 | Keep ended member visible in members list with correct status | Owner/Admin | A member has been ended successfully | 1. Return to `/members` 2. Find the ended member | Ended member remains accessible in the list and is clearly marked with `Ended` status. | High |
| MEM-052 | Delete member successfully from members list | Owner/Admin | Deletable member exists | 1. Click delete action from list 2. Confirm deletion | Member is deleted successfully and list refreshes without crash. | Critical |
| MEM-053 | Cancel member deletion | Owner/Admin | Delete confirmation dialog is open | 1. Open delete confirmation 2. Cancel action | Dialog closes and member remains unchanged. | Medium |
| MEM-054 | Show inline loading state during deletion | Owner/Admin | Delete confirmation dialog is open | 1. Confirm deletion 2. Observe action button | Confirmation button shows loading state and blocks repeated submission until action finishes. | High |
| MEM-055 | Auto-scroll to visible error when member-detail action fails | Owner/Admin | Any detail-page action fails due to API or validation response | 1. Trigger a failing action such as payment, renew, edit, or end membership 2. Observe error visibility | Error message is brought into view automatically so user does not miss the failure reason. | High |
| MEM-056 | Keep number fields protected from accidental mouse-wheel changes | Owner/Admin | Payment or membership amount field is focused | 1. Focus numeric amount field 2. Scroll mouse wheel | Value does not accidentally change due to mouse-wheel input. | Medium |
| MEM-057 | Members list is usable on mobile viewport | Owner/Admin | Browser width is between 360px and 480px | 1. Open `/members` on mobile viewport 2. Observe stat cards, filters, list/table, and actions | Page remains usable without horizontal page break. Filters stack cleanly and tap targets remain usable. | Critical |
| MEM-058 | Add Member page is usable on mobile viewport | Owner/Admin | Browser width is between 360px and 480px | 1. Open `/members/new` on mobile viewport 2. Observe form layout and action buttons | Form fields stack vertically, remain readable, and do not require broken pinch-zoom behavior. | High |
| MEM-059 | Member details page and dialogs are usable on mobile viewport | Owner/Admin | Browser width is between 360px and 480px | 1. Open a member details page on mobile viewport 2. Open payment, renew, edit, and end dialogs | Details layout and dialogs remain readable and usable on mobile-sized screens. | High |
| MEM-060 | Members module is usable on tablet viewport | Owner/Admin | Browser width is between 768px and 1024px | 1. Open list, add, and detail pages on tablet viewport | Layout remains balanced, content is not clipped, and actions remain easy to use. | High |
| MEM-061 | Members module is usable on laptop viewport | Owner/Admin | Browser width is between 1280px and 1440px | 1. Open list, add, and detail pages on laptop viewport | Layout remains visually balanced and table/actions remain fully visible. | Medium |
| MEM-062 | Members module is usable on large desktop viewport | Owner/Admin | Browser width is 1920px or above | 1. Open list, add, and detail pages on large desktop viewport | Layout remains balanced without odd stretching, clipping, or overlap. | Medium |
| MEM-063 | Staff can access allowed members module functions | Staff | Valid staff account exists with members access | 1. Login as staff 2. Open `/members` 3. Validate available actions | Members module loads successfully for staff according to access permissions. | High |

## Execution Notes

- Validate both populated and low-data conditions where possible.
- For filter validation, include records distributed across more than one pagination page.
- For add-member duplicate checks, use an already existing mobile number in the test environment.
- For financial actions, validate both paid and pending member states where applicable.
- For ended-membership checks, validate at least one case with refund due and one case with pending amount due.
- For responsive checks, validate at minimum:
  - `360px`
  - `768px`
  - `1280px`
  - `1920px`

## Entry Criteria

- Frontend and backend are running.
- Valid owner/admin and staff test accounts are available.
- At least one plan and one slot exist.
- Member data exists across multiple statuses and more than one pagination page.

## Exit Criteria

- All critical and high-priority members scenarios pass.
