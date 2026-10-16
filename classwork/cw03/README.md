# Classwork 03: JavaScript Trail Report

**Name:** Naji Araiza

I built a JavaScript trail report for Papago Park Loop using three trail segments totaling 4.5 miles.
I created a station report form that calculates operating hours and displays a heat warning when the temperature reaches the 105°F threshold.

- **Break 1 — Removed defer:** I predicted the script would run before the HTML elements loaded. The page produced a JavaScript error because the total element was null when the script tried to update it.
- **Break 2 — Duplicate button ID:** I predicted the first matching button would receive the event listener. The first button worked, but the second button did not trigger the report.
- **Break 3 — Removed Number():** I predicted the hours calculation would be incorrect. There was no error, but 3 + 1 produced 31 because the input value was treated as a string.
