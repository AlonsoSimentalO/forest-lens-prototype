# Forest Lens

A mobile-first forest management prototype with a simulated camera view. Built with HTML, CSS, browser JavaScript and a dependency-free Node.js server.

## Run

Requires Node.js 20 or newer. No install step is needed.

```sh
node server.mjs
```

Open http://localhost:5173. On Windows, `npm.cmd start` also works.

## Experience

- A generated forest photograph fills the background. The Camera button is UI only and explains the simulation when tapped. There is no camera access, video feed, webcam enumeration or camera permission request.
- A compact location card selects one of three hardcoded Finnish sample forest zones. Optional GPS matches a zone only when the coordinates fall inside its sample radius.
- A forest label sits in a camera-style viewfinder. Its text describes the selected sample zone; the photo is generic and does not depict that actual location.
- One decision card groups the four current indicators, management priorities, scripted guide and details button. It sits beneath the forest view on mobile and floats to the right on desktop.
- Tap an indicator for its definition, open Forest profile for the current baseline, or choose Commercial, Conservation, Recreation or Carbon to update the outcomes.
- Explore trade-offs opens the actions, expected outcomes and affected stakeholders. Reset returns to the baseline; changing the zone also resets the scenario.
- The dismissible ranger uses predefined text. No AI conversation or forest data APIs are connected.

## Sample data and GPS

`data.js` contains the sample profiles, coordinates, geofence radii, all 12 zone/scenario combinations and guide text. Outcomes are invented directional assumptions relative to continuing existing management, not scientific estimates. No time horizon, carbon price or overall recommendation is calculated.

GPS permission is requested only after tapping the location button. Coordinates stay in the browser and are not saved or uploaded. GPS requires HTTPS or localhost in a supported browser. Outside the sample zones, the app retains the manually selected zone and explains that no match was found. All other prototype interactions work without GPS.

## Visual assets

`assets/forest-camera.png` is the project-local generated forest photograph. It was created with the built-in image generation tool. The exact prompt and provenance are saved in `assets/forest-camera.prompt.txt`. The ranger and icons are local SVG graphics. Google Fonts is optional, with system sans-serif fallbacks.

## Checks

```sh
node --test
```

The data tests check all scenario combinations, baseline consistency, GPS matching and invalid coordinates.

With the app running, `node scripts/check-browser.mjs` runs browser checks in installed Microsoft Edge. Set `BROWSER_PATH` for another Chromium executable. Checks include all scenarios, indicators, guide dismissal, profile, details sheet, zone reset, GPS states and responsive layouts. Camera calls are intercepted to verify that the UI never requests hardware access. Screenshots are written to `artifacts/`.
