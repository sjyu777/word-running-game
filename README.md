# Word Runner

A voxel-style 3D Chinese-to-English vocabulary runner for Linux and macOS. Runs in a modern browser with WebGL, using Three.js and Vite.

## Run locally

Install Node.js 22.12+ (or 24), then:

```sh
npm install
npm run dev
```

Open the URL printed by Vite, normally http://localhost:5173. For a production build:

```sh
npm run build
npm run preview
```

Deploy the `dist` directory to a static web host. Game code and scenery are bundled; the optional Google Fonts styles fall back to installed fonts without a network connection.

## Play

Choose an existing player, or optionally add one. Select Nova, Moss, or Bubbles and a Galaxy, Jungle, or Undersea stage. Left/Right changes between five lanes; Up jumps to submit the selected English word. On touch devices, tap a word to select its lane and tap Jump. Word boxes float above the runner; a jump hits the selected box at its apex. A correct hit bumps the box and releases a golden star from its top before advancing. Every correct answer gives 100 speed points and advances to the next question. A wrong answer shows a cross and locks controls for one second; elapsed time continues. Finishing all questions ends the stage.

Results show elapsed seconds, speed points, mistakes, personal best, and the stage's top five players, sorted by each player's fastest time. Replay restarts the timer and score. Leaving an unfinished run does not record a result.

Select Performance graphics if a device struggles. The renderer uses capped pixel density, lightweight geometry and delta-time motion; actual frame rate depends on the device and browser. Hardware acceleration/WebGL is required.

## Practice spelling

Every stage supports Practice spelling. Choose a stage and switch the mode before starting. The Chinese prompt remains visible, while the letters of its English answer are shuffled across the lanes. Jump to collect each letter in order; Your spelling shows the sequence as you build it. Each tile can be collected once, including separate tiles for repeated letters.

Down, Delete, Backspace, or the Undo button removes the last collected letter and restores its tile. An incorrect complete spelling stays editable. A correct complete spelling releases a golden star and advances to the next word. Longer words have multiple pages of five letter tiles; use the Letters buttons or Q/E to change pages.

Practice has no timer, speed score, or rankings. Its completion screen shows words practiced and spelling retries. Practice results never enter challenge rankings. Replay resets the letters and sequence.

## Sound

Each world has original, looping synthesized background music. Jump, letter collection, undo, correct answer / golden star, wrong answer and completion have distinct sound effects. Music starts when you start a run, stops when you leave or finish, and pauses while the browser tab is hidden. The browser requires a click/tap before audio can start.

The footer provides a Sound on/off toggle and master volume. Preferences persist in this browser (`word-runner-audio`). Music and effects are generated with Web Audio and require no audio downloads.

## Stage studio

Open Stage studio to create, edit, or delete stages. Each vocabulary line is:

```text
Chinese prompt | correct English answer | distractor 1 | distractor 2 | distractor 3 | distractor 4
```

Example:

```text
蘋果 | apple | apply | ample | maple | angle
```

A stage needs a name, theme and at least one question. All five choices must be nonempty and distinct (case-insensitive). Changing a stage clears its rankings so times remain comparable. At least one stage must remain.

## Data and scope

Profiles, stage definitions and results are saved in this browser's localStorage (`word-runner-v1`). Clearing browser data removes them. Rankings are local to the browser; they are not shared between devices. Stage studio is a local editing interface without authentication. A shared service with protected administration needs a backend and user authentication.

The approved interpretation is that each correct answer advances to the next question within the selected stage. Scenery scrolls while the actor runs; word targets are accessible HTML overlays aligned with the five 3D lanes. Speed points are 100 per correct answer, while elapsed time determines ranking.

## Tests

```sh
npm test
npx playwright install chromium
npm run test:e2e
npm run build
```

Unit tests cover vocabulary validation, the exact penalty boundary, scoring, completion and ranking. Browser tests cover keyboard play, wrong-answer locking, persistence, replay, stage editing, actors/themes and mobile controls.

## Font license

The English word boxes use the bundled Silkscreen font, licensed under the SIL Open Font License; see `public/fonts/OFL.txt`. Voxel characters are original procedural models built from cubes.
