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

## Stage 10 verification record

The production preview passed keyboard focus checks for SPA route changes,
skip-link activation and mobile-menu `Escape` handling. Browser inspection
confirmed descriptive titles, visible focus behavior, an accessible map region
with a complete list alternative, chart/table equivalence, new-window link
announcements and expected landmark, heading, label and live-region structure.

Four representative workflows were checked at `390 x 844` with no horizontal
page overflow, providing an equivalent reflow check for enlarged content.
Reduced-motion and forced-colors media modes were exercised successfully, and
the console reported no application errors. The complete frontend suite passed
71 tests, including 5 focused accessibility checks, and the production build
completed successfully.

A native VoiceOver, NVDA or equivalent screen-reader session cannot be
automated by this repository and remains recommended as a final human
acceptance check before submission. Any issue found there should be recorded
and fixed in a separate reviewable commit.
