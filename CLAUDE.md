# CLAUDE.md - Halve-It Darts Scorer

This document provides guidance for AI assistants working on this codebase.

## Project Overview

**Halve-It** is a single-page web application for scoring the "Halve-It" darts game. It is a pure HTML/CSS/JavaScript project with no build step and no runtime dependencies. The app is deployed via GitHub Pages.

- **Live URL:** https://p-h-0-x.github.io/halve-it/
- **Repo:** https://github.com/p-h-0-x/halve-it

## Repository Structure

```
halve-it/
├── src/
│   └── contracts.js          # Core contract validation logic (shared between app and tests)
├── tests/
│   └── contracts.test.js     # Jest test suite for src/contracts.js
├── .github/
│   └── workflows/
│       └── tests.yml         # CI: runs tests on Node 18.x and 20.x
├── index.html                # Main application (self-contained SPA, ~3400 lines)
├── halve-it.html             # Legacy/alternative version of the app
├── package.json              # Dev dependencies (Jest only) and test scripts
├── README.md                 # User-facing game documentation
└── LICENSE                   # MIT
```

## Architecture

### Single-File Application

`index.html` is the complete application: HTML structure, CSS styles, and JavaScript game logic are all embedded in a single file. This is intentional — it allows the app to work fully offline after the first load and requires no installation.

### Shared Logic Module

`src/contracts.js` extracts the contract validation and scoring logic into a Node.js-compatible module. It uses a pattern that works in both browser globals and Node.js (CommonJS):

```js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ... };
}
```

This allows the same code to be `require()`-d by Jest tests and also included via `<script>` in `index.html`.

**When modifying contract logic**, changes must be made in `src/contracts.js` (not duplicated in `index.html`). The HTML file should reference or inline the contents of `src/contracts.js`.

## Game Modes

### Classic Mode
- All players play the same contract each round (15 rounds total).
- Hit the contract target: score is added to the player's capital.
- Miss the contract: capital is **halved (rounded up)**.
- Winner: highest capital after all 15 rounds.

### Yahtzee Style
- Players take turns one at a time; each turn throw 3 darts then choose any available contract.
- **Fill**: Enter your score for that contract (adds to total).
- **Scratch**: Voluntarily give up a contract (scores 0).
- Game ends when all contracts are filled or scratched.
- Winner: highest total score.

## Contracts (in play order)

| ID | Name | Requirement |
|----|------|-------------|
| `capital` | Capital | Always succeeds; total of 3 darts |
| `20` | 20 | At least one dart hits 20 |
| `side` | Side | 3 darts hit adjacent board segments |
| `19` | 19 | At least one dart hits 19 |
| `3row` | 3 in a Row | 3 darts hit 3 consecutive numbers |
| `18` | 18 | At least one dart hits 18 |
| `color` | Color | 3 darts hit 3 different colors |
| `17` | 17 | At least one dart hits 17 |
| `double` | Double | At least one dart is a double |
| `16` | 16 | At least one dart hits 16 |
| `triple` | Triple | At least one dart is a triple |
| `15` | 15 | At least one dart hits 15 |
| `57` | 57 | Total score of all 3 darts equals exactly 57 |
| `14` | 14 | At least one dart hits 14 |
| `bull` | Bull | At least one dart hits the bullseye (25 or 50) |

### Color Rules (important edge cases)
- **Singles**: black or white (based on segment — 20 is black, 1 is white, alternating)
- **Doubles/Triples**: red or green ring color (black segments have **red** rings, white segments have **green** rings)
- **Single bull (25)**: green
- **Double bull (50)**: red

### Side/Adjacent Rules
- Single bull (25, `modifier: 'single'`) is considered adjacent to **every** segment.
- Double bull (25, `modifier: 'double'`) is **not** adjacent to non-bull segments.

### 3 in a Row Rules
- Bull (25) does not count for `3row`.
- Numbers must be strictly consecutive: e.g., 14-15-16.

## Key Data Structures

### Dart Object
```js
{ number: 20, modifier: 'single', score: 20 }
// number:   1-20 for segments, 25 for bull, 0 for miss
// modifier: 'single' | 'double' | 'triple'
// score:    actual point value (number × multiplier, or 25/50 for bull)
```

### CONTRACT_IDS (canonical order)
```js
['capital', '20', 'side', '19', '3row', '18', 'color', '17', 'double', '16', 'triple', '15', '57', '14', 'bull']
```

### DARTBOARD_SEQUENCE (clockwise from top)
```js
[20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5]
```

## API — `src/contracts.js`

| Export | Signature | Purpose |
|--------|-----------|---------|
| `createDart` | `(number, modifier?, score?) → Dart` | Factory; auto-calculates score if omitted |
| `getDartColor` | `(dart) → string\|null` | Returns color for color contract checks |
| `areAdjacent` | `(dart1, dart2, dart3) → boolean` | Side contract validation |
| `areConsecutive` | `(num1, num2, num3) → boolean` | 3-in-a-row contract validation |
| `checkContractRequirements` | `(darts[], contractId) → boolean` | Classic mode: did the player meet the contract? |
| `calculateContractScore` | `(darts[], contractId) → number` | Score for a fulfilled contract |
| `getValidContracts` | `(darts[]) → string[]` | Yahtzee mode: which contracts are valid? |
| `CONTRACT_IDS` | `string[]` | Ordered list of all 15 contract IDs |
| `DART_SINGLE_COLORS` | `Object` | Segment → black/white |
| `DART_RING_COLORS` | `Object` | Segment → red/green |
| `DARTBOARD_SEQUENCE` | `number[]` | Clockwise board layout |

## Development Workflow

### Running Tests
```bash
npm install          # first time only
npm test             # run tests once
npm run test:watch   # watch mode
npm run test:coverage  # with coverage report (output in coverage/)
```

Tests use **Jest 29** and run in the Node.js environment (no browser needed). Coverage is collected from `src/**/*.js`.

### No Build Step
There is no bundler, transpiler, or build process. Changes to `index.html` are immediately reflected when the file is opened in a browser.

### CI/CD
GitHub Actions (`.github/workflows/tests.yml`) runs the full test suite on every push/PR to `main`/`master` using Node.js 18.x and 20.x. Coverage artifacts are uploaded for Node 20.x runs (7-day retention). PRs should not break CI.

## Code Conventions

### Naming
- Functions: `camelCase` — `createDart`, `getDartColor`, `areAdjacent`
- Constants: `UPPER_SNAKE_CASE` — `CONTRACT_IDS`, `DARTBOARD_SEQUENCE`
- Contract IDs: lowercase strings — `'capital'`, `'3row'`, `'57'`
- Variables: `camelCase`

### Style
- Pure functions with no side effects in `src/contracts.js`.
- Functional array methods preferred: `map`, `filter`, `reduce`, `includes`.
- `Set` used for uniqueness checks (e.g., unique colors).
- JSDoc comments on all exported functions (`@param`, `@returns`).
- No external runtime dependencies — keep it that way.

### Testing Conventions
- Tests are **specification-based**: written against game rules, not implementation details.
- Use `createDart()` helper everywhere in tests rather than constructing objects manually.
- Organize tests with nested `describe` blocks mirroring feature areas.
- Add regression tests with clear comments when fixing bugs.
- Each test name should read as a human-readable rule statement.

## Important Constraints

1. **Do not add runtime dependencies.** The entire point of this project is that it runs offline from a single HTML file. No npm packages, no CDN imports for production.
2. **Keep contract logic in `src/contracts.js`.** The HTML file should not contain duplicate contract logic.
3. **Maintain dual-environment compatibility.** Any code in `src/contracts.js` must work in both Node.js (for tests) and browser (for the app) using the `module.exports` guard pattern.
4. **Test all contract logic changes.** `tests/contracts.test.js` is the source of truth for game rules. When changing contract behavior, update both the implementation and tests.
5. **Score calculation for numeric contracts (`20`, `19`, `18`, `17`, `16`, `15`, `14`)**: Only darts that hit the target number contribute to the score — do not sum all darts for these contracts.

## Multi-Language Support

The app supports English, Français, and Español. When adding UI text to `index.html`, ensure strings are added to all three language dictionaries within the app's translation system.

## Color Scheme

| Role | Value |
|------|-------|
| Background | `#1a1a2e` |
| Accent Red | `#e94560` |
| Accent Blue | `#3282b8` |
| Success Green | `#00b894` |
