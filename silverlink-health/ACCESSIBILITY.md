# Accessibility Statement and Audit Scope

SilverLink Health targets WCAG 2.1 AA for the completed A3 workflows. This
document records the controls implemented in the application and the checks
required before a release is marked fully verified.

## Implemented controls

- Every route has a descriptive document title. SPA navigation moves focus to
  the `main` landmark without scrolling the user away from the new page.
- A keyboard skip link, semantic landmarks, heading hierarchy, labelled form
  controls, error descriptions, live status messages and visible focus styles
  are used throughout the application.
- The mobile navigation exposes its expanded state, closes with `Escape` and
  returns focus to the menu trigger. All interactive controls use native links,
  buttons, form fields or table controls.
- Data tables expose captions, column headers, sort state, pagination state and
  a keyboard-focusable horizontal scroll region. Rating charts have an
  accessible label and an equivalent table view.
- The map is an explicitly labelled region with a text alternative and a
  complete service list below it. External links that open a new tab announce
  that behavior to assistive technology.
- Text and controls use rem-based sizing, responsive reflow, a high-contrast
  focus indicator, forced-colors support and reduced-motion preferences.

## Local automated checks

`tests/accessibility.test.js` checks the route metadata, focus behavior,
keyboard navigation contract, map semantics, external-link announcements,
table/chart alternatives, form descriptions and high-contrast preferences.

## Manual release checks

Before marking this stage `Verified`, test the production preview at desktop
and `390 x 844` mobile sizes with keyboard-only navigation, visible focus,
skip-link activation, mobile-menu Escape behavior, form error recovery, table
sorting/pagination, map-list alternatives, chart/table equivalence, browser
zoom to 200%, reduced-motion preference, forced-colors/high-contrast mode and
an accessibility-tree or screen-reader review. Record the result in the A3
requirements matrix and in the stage submission commit.
