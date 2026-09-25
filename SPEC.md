# Spec: Board logic parity with the original Java game

Reference implementation: [jimnastic89/ModernScrambledNet](https://github.com/jimnastic89/ModernScrambledNet)
(`BoardView.java`, `Cell.java`), itself derived from Ian Cameron Smith's Scrambled Net.

## Objective

Make the web board logic in `src/board.ts` / `src/cell.ts` behave like the Java original
where the port has drifted, and fix the port's own bugs. The UI, themes and build are not in scope.

## Requirements

1. **Net generation respects `skill.branches`** (Java `createNet` / `addRandomDir`).
   Each cell gets one turn to grow 1–2 branches (3 when `branches >= 3`), so non-root cells on
   Novice/Normal/Expert never become 4-way crosses. The net is still a single tree rooted at the
   server. Regenerate up to 10 times until at least 85% of cells are used (as Java does; in practice the average fill is ~99%).
2. **Scrambling is immediate and uniform.** After `setupBoard` no cell is mid-rotation, each cell
   is one of the 4 rotations of its solution, and connection state is correct before the first frame.
   (Right now a zero-duration animation is used, which divides by zero and never produces 180°.)
3. **Blind cells on Insane** (Java `skill.blind`): cells with `numDirs() >= skill.blind` hide their
   cable. All cells become visible again once the puzzle is solved.
4. **One rotate path for mouse, touch and keyboard.** Free, empty and locked cells can't be rotated.
   A move counts only when the tapped cell differs from the last one tapped (as in Java `cellClicked`).
   Touch input currently skips the move counter entirely.
5. **Lock toggle** (Java long press): right-click or a long press (500 ms) on a cable cell toggles
   `isLocked` (the `background_locked.png` background already exists). The `L` key does the same for
   the keyboard-selected cell.
6. **The rotation clock is safe.** A negative elapsed time (a `requestAnimationFrame` timestamp
   earlier than the `performance.now()` taken at click time) must not draw the cable turning backwards.
7. **Sounds as in Java.** `start` on a new game, `turn` on a rotation, `click` on a refused
   rotate/lock, `pop` on a lock toggle, `connect` when a rotation joins new cells to the network,
   `win` on solve (instead of `connect`).
8. **Animated auto-solve** (Java `autosolve`). A "Solve" button in the in-game menu replays the
   solution from the server outwards, one quarter turn every 100 ms, unlocking and unblinding cells as
   it goes and highlighting the cell being solved. Pressing it again stops the solver. Player input is
   ignored while it runs, solver turns don't count as moves, and the win screen reads "Solved!".
9. **Data blips** (Java `advanceBlips`/`transferBlips`/`drawBlips`). Every 6th step (one step is 300 ms,
   half a cell) the server sends a blip down each connected cable. A blip that arrives in a cell leaves
   by every other connected side, so it follows the network and dies at a gap. Rotating a cell removes
   its blips. Blips use the Java sprites (green when connected, grey when not, a glow at the server).
   Terminals that receive data flicker green lines on their screen. Blind cells show no blips.
   The sprites are loaded for both themes.

## Testing

- Vitest unit tests for `Board`/`Cell` logic (`npm test`). `Assets` is stubbed.
- `npm run build` (tsc type-check via vite) must pass.
- Manual browser check with `npm run dev`.

## Boundaries

- Always: keep the rendering and asset APIs unchanged.
- Never: change the Android/F-Droid metadata or the `dist/` output as part of this work.
