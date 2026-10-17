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

Choose an existing player, or optionally add one. Select Steve, Creeper, Wolf, or Skeleton and a Galaxy, Jungle, or Undersea stage. Each runner has a distinct procedural voxel model, matching portrait, and animated limbs. The home preview shows the character's face; during play, runners face down the road. Left/Right changes between five lanes; Up jumps to submit the selected English word. On touch devices, tap a word to select its lane and tap Jump. Word boxes float above the runner, with their height adjusted to the character so a jump hits the selected box at its apex. A correct hit bumps the box and releases a golden star from its top before advancing. Every correct answer gives 100 speed points and advances to the next question. A wrong answer shows a cross and locks controls for one second; elapsed time continues. Finishing all questions ends the stage.

Results show elapsed seconds, speed points, mistakes, personal best, and the stage's top five players, sorted by each player's fastest time. Replay restarts the timer and score. Leaving an unfinished run does not record a result.

Adventure (Challenge) starts with a 3–2–1 countdown. Answers are locked during preparation, and the completion timer begins when the countdown ends. Leaving the run cancels the countdown.

Select Performance graphics if a device struggles. The renderer uses capped pixel density, lightweight geometry and delta-time motion; actual frame rate depends on the device and browser. Hardware acceleration/WebGL is required.

## 60-second challenge

Select **60-second challenge** for a one-minute round using all vocabulary entries from all stages, shuffled without replacement. The chosen world supplies the scenery. After the 3–2–1 preparation countdown, the timer starts at 60 seconds. Every correct answer earns one point; wrong answers keep the one-second input penalty while the timer continues. If you complete the pool, it reshuffles and continues until time expires. Answers landing at or after the deadline do not count.

The results show correct words, personal best, and the top five players by each player's highest correct-word count. This leaderboard is saved in this browser separately from adventure results. Leaving early does not save a score. Replay starts a fresh minute and reshuffles all words. Scene speed does not affect the time limit.

## Practice spelling

Every stage supports Practice spelling. Choose a stage and switch the mode before starting. All shuffled letters appear below the spelling boxes, wrapping onto additional rows for longer words. Each repeated letter has its own tile. Select a letter and press Up (or Jump) to place it in the selected box. Green boxes with a check mark indicate the correct position; red boxes with a cross indicate an incorrect position.

Select any spelling box and press Down, Delete, Backspace, or Remove to return that specific letter to the bank without shifting other letters. Left/Right moves through letters or boxes depending on which you last selected; Q/E selects the previous/next box. A correctly placed letter advances selection to the next empty box. Completing the correct spelling advances to the next word.

Practice has no timer, speed score, or rankings. Its completion screen shows words practiced and spelling retries. Practice results never enter challenge rankings. Replay resets the letters and sequence.

## Running speed

The footer's Running speed slider controls scenery and running animation from 0 to 5: 0 stops motion, 2.5 is the original speed, and 5 is double speed. Changes apply immediately, including the home preview, and persist in this browser. Jump timing, answer controls, scoring, and the challenge timer are unchanged.

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

Vocabulary boxes and practice letters use a clear sans-serif font; Chinese prompts use the system's Chinese font. Decorative timers and scores use the bundled Silkscreen font, licensed under the SIL Open Font License; see `public/fonts/OFL.txt`. Voxel characters are original procedural models built from cubes.
