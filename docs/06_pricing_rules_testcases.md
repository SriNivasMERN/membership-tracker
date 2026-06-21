# Pricing Rules Test Cases

## Document Control

| Field | Value |
| --- | --- |
| Module | Pricing Rules |
| File Name | `06_pricing_rules_testcases.md` |
| Primary Roles Covered | Owner/Admin |
| Related Pages | `/pricing` |

## Scope

This document validates:

- Pricing Rules page rendering
- Initial loading and error handling
- Summary stat cards
- Pricing logic section
- Empty state behavior
- Add Pricing Rule flow
- Edit Pricing Rule flow
- Price preview behavior
- Activate / deactivate flow
- Delete Pricing Rule flow
- Table alignment and default visibility of pricing columns
- Dialog validation, focus, and scroll-to-message behavior
- Inline button loading behavior
- Responsive behavior on key viewports

## Test Cases

| TC ID | Scenario | Role | Preconditions | Steps | Expected Result | Priority |
| --- | --- | --- | --- | --- | --- | --- |
| PRC-001 | Open pricing rules page successfully after login | Owner/Admin | User is logged in with a valid active session | 1. Open `/pricing` 2. Observe page load | Pricing Rules page loads without crash. Summary cards, pricing logic section, add button, and rules table are visible. | Critical |
| PRC-002 | Show pricing-rules loading state on first visit | Owner/Admin | User is logged in and pricing rules data is not yet loaded | 1. Open `/pricing` from another module or immediately after login 2. Observe first render | Workspace loading experience appears immediately instead of a blank or broken page. | High |
| PRC-003 | Show pricing-rules error state when page load fails | Owner/Admin | Backend/API is unavailable or pricing requests fail | 1. Open `/pricing` 2. Simulate API failure | Error state appears with retry option. Page does not stay stuck in endless loading. | High |
| PRC-004 | Validate summary cards render with correct labels | Owner/Admin | Pricing rule data exists | 1. Open `/pricing` 2. Observe top stat cards | Cards display `Overall Rules`, `Active`, `Inactive`, and `Boosted Prices` with count, icon, and helper text. | High |
| PRC-005 | Validate pricing logic section is visible and readable | Owner/Admin | Pricing Rules page is loaded | 1. Open `/pricing` 2. Observe pricing logic section | Formula presentation clearly communicates `Base Price x Multiplier = Final Price`. | High |
| PRC-006 | Show empty state when no pricing rules exist | Owner/Admin | No pricing rules exist in the system | 1. Open `/pricing` | Empty state appears clearly and provides the `Add Rule` action. | High |
| PRC-007 | Open Add Pricing Rule dialog successfully | Owner/Admin | Pricing Rules page is loaded | 1. Click `Add Rule` | Add Pricing Rule dialog opens successfully without broken layout. | High |
| PRC-008 | Focus Plan field when Add Pricing Rule dialog opens | Owner/Admin | Add Pricing Rule dialog is open | 1. Open `Add Rule` dialog 2. Observe cursor position | Initial focus starts in the first required field for new rule creation. | Medium |
| PRC-009 | Validate required plan during rule creation | Owner/Admin | Add Pricing Rule dialog is open | 1. Leave `Plan` empty 2. Enter other values 3. Submit | Validation appears for missing plan and form is not submitted. | High |
| PRC-010 | Validate required slot during rule creation | Owner/Admin | Add Pricing Rule dialog is open | 1. Leave `Slot` empty 2. Enter other values 3. Submit | Validation appears for missing slot and form is not submitted. | High |
| PRC-011 | Validate minimum multiplier | Owner/Admin | Add Pricing Rule dialog is open | 1. Enter multiplier below `0.1` 2. Submit | Validation appears that multiplier must be at least `0.1`. | High |
| PRC-012 | Validate maximum multiplier | Owner/Admin | Add Pricing Rule dialog is open | 1. Enter multiplier above `10` 2. Submit | Validation appears that multiplier cannot exceed `10`. | Medium |
| PRC-013 | Keep multiplier field protected from accidental mouse-wheel changes | Owner/Admin | Multiplier field is focused | 1. Focus multiplier field 2. Scroll mouse wheel | Value does not accidentally change due to mouse-wheel input. | Medium |
| PRC-014 | Show price preview after selecting plan and entering multiplier | Owner/Admin | At least one plan exists | 1. Open `Add Rule` 2. Select plan 3. Enter multiplier 4. Observe preview | Price preview shows the correct base-price and multiplier calculation before save. | High |
| PRC-015 | Create pricing rule successfully with valid data | Owner/Admin | At least one active plan and one active slot exist | 1. Open `Add Rule` dialog 2. Enter valid plan, slot, multiplier, and active state 3. Submit | Pricing rule is created successfully. Dialog closes. New rule appears in table and summary cards refresh correctly. | Critical |
| PRC-016 | Show inline loading state during pricing-rule creation | Owner/Admin | Add Pricing Rule dialog is open | 1. Submit valid form 2. Observe action button | Submit button shows inline spinner and prevents repeated submission until request completes. | High |
| PRC-017 | Auto-scroll to API error in pricing dialog | Owner/Admin | Add or Edit Pricing Rule dialog is open | 1. Trigger an API validation or save failure 2. Observe dialog position | Error alert becomes visible without manual scrolling. | High |
| PRC-018 | Cancel Add Pricing Rule dialog | Owner/Admin | Add Pricing Rule dialog is open | 1. Click `Cancel` | Dialog closes without creating a new rule. | Medium |
| PRC-019 | Open Edit Pricing Rule dialog successfully | Owner/Admin | At least one pricing rule exists | 1. Click edit action for a rule | Edit Pricing Rule dialog opens successfully with current values prefilled. | High |
| PRC-020 | Keep plan and slot locked during pricing-rule edit | Owner/Admin | Edit Pricing Rule dialog is open | 1. Open `Edit Pricing Rule` 2. Observe plan and slot treatment | Existing plan and slot are shown as fixed context and cannot be changed after creation. | High |
| PRC-021 | Update multiplier and active state successfully during edit | Owner/Admin | Editable pricing rule exists | 1. Open `Edit Pricing Rule` 2. Change multiplier and/or active switch 3. Submit | Rule updates successfully. Dialog closes and table reflects the saved values. | Critical |
| PRC-022 | Show inline loading state during pricing-rule edit | Owner/Admin | Edit Pricing Rule dialog is open | 1. Submit valid edit 2. Observe action button | Save button shows inline spinner and prevents duplicate submission until request completes. | High |
| PRC-023 | Deactivate active pricing rule successfully | Owner/Admin | At least one active pricing rule exists | 1. Click toggle action on an active rule 2. Confirm action | Rule becomes inactive successfully. Status chip and summary cards refresh correctly. | Critical |
| PRC-024 | Activate inactive pricing rule successfully | Owner/Admin | At least one inactive pricing rule exists | 1. Click toggle action on an inactive rule 2. Confirm action | Rule becomes active successfully. Status chip and summary cards refresh correctly. | Critical |
| PRC-025 | Cancel pricing-rule activate or deactivate action | Owner/Admin | Toggle confirmation dialog is open | 1. Open toggle confirmation 2. Cancel action | Dialog closes and rule status remains unchanged. | Medium |
| PRC-026 | Show inline loading state during pricing-rule activate or deactivate | Owner/Admin | Toggle confirmation dialog is open | 1. Confirm activate or deactivate action 2. Observe button state | Confirmation button shows inline loading state and prevents repeated submission until request completes. | High |
| PRC-027 | Delete pricing rule successfully | Owner/Admin | Deletable pricing rule exists | 1. Click delete action for a rule 2. Confirm action | Pricing rule is deleted successfully. List refreshes without crash and summary cards update correctly. | Critical |
| PRC-028 | Cancel pricing-rule deletion | Owner/Admin | Delete confirmation dialog is open | 1. Open delete confirmation 2. Cancel action | Dialog closes and rule remains unchanged. | Medium |
| PRC-029 | Show inline loading state during pricing-rule deletion | Owner/Admin | Delete confirmation dialog is open | 1. Confirm deletion 2. Observe confirmation button | Confirmation button shows inline loading state and blocks repeated submission until request completes. | High |
| PRC-030 | Keep pricing table values readable after create, edit, toggle, and delete actions | Owner/Admin | Pricing rule data exists | 1. Perform create, edit, toggle, and delete flows 2. Observe table and cards after each action | Table and summary cards remain synchronized with the latest saved pricing-rule state. | High |
| PRC-031 | Keep pricing rules column spacing visually balanced | Owner/Admin | Pricing rule data exists | 1. Open `/pricing` on normal desktop viewport 2. Observe `Plan`, `Slot`, `Base Price`, `Multiplier`, `Final Price`, `Status`, and `Actions` columns | Column spacing looks balanced across the full table. No important column feels squeezed, detached, or disproportionately wide. | High |
| PRC-032 | Keep pricing headers aligned with their table data | Owner/Admin | Pricing rule data exists | 1. Open `/pricing` 2. Compare each header position with its row values | Each header aligns consistently with its column data. Left-aligned columns share the same readable starting margin and centered columns feel centered to their values. | High |
| PRC-033 | Keep all important pricing columns visible in default desktop view | Owner/Admin | Pricing rule data exists | 1. Open `/pricing` on normal desktop viewport 2. Observe the full table | `Plan`, `Slot`, `Base Price`, `Multiplier`, `Final Price`, `Status`, and `Actions` remain visible clearly without unnecessary horizontal scrolling. | High |
| PRC-034 | Pricing Rules page is usable on mobile viewport | Owner/Admin | Browser width is between 360px and 480px | 1. Open `/pricing` on mobile viewport 2. Observe cards, pricing logic section, table, dialogs, and action buttons | Page remains usable without horizontal page break. Dialog opens in a mobile-friendly full-screen style. | Critical |
| PRC-035 | Pricing Rules page is usable on tablet viewport | Owner/Admin | Browser width is between 768px and 1024px | 1. Open `/pricing` on tablet viewport 2. Observe layout | Layout remains balanced. Cards, formula section, and table remain readable and fully visible. | High |
| PRC-036 | Pricing Rules page is usable on laptop viewport | Owner/Admin | Browser width is between 1280px and 1440px | 1. Open `/pricing` on laptop viewport 2. Observe layout | Layout remains visually balanced and action controls remain fully usable. | Medium |
| PRC-037 | Pricing Rules page is usable on large desktop viewport | Owner/Admin | Browser width is 1920px or above | 1. Open `/pricing` on large desktop viewport 2. Observe spacing and alignment | Layout remains stable without odd stretching, clipping, or overlap. | Medium |

## Execution Notes

- Validate both populated and empty-data conditions where possible.
- Use at least one active rule and one inactive rule for toggle checks.
- Use one rule with multiplier above `1` to validate boosted-rule counts.
- Validate both create and edit flows because create supports plan and slot selection, while edit keeps them locked.
- For responsive checks, validate at minimum:
  - `360px`
  - `768px`
  - `1280px`
  - `1920px`

## Entry Criteria

- Frontend and backend are running.
- Valid owner/admin test account is available.
- At least one plan and one slot exist for rule creation.

## Exit Criteria

- All critical and high-priority pricing-rules scenarios pass.
