# Plan: Board logic parity (see SPEC.md)

- [ ] **T1 Test harness.** Add vitest, `npm test` script, a smoke test that builds a Board with stubbed Assets.
  - Accept: `npm test` passes; `npm run build` passes.
- [ ] **T2 Branch-limited net generation + 85% fill retry** (SPEC R1). Depends: T1.
  - Accept: over many Novice boards no non-root cell has 4 dirs; Master boards do sometimes; every net is
    a tree reachable from the root; fill ≥ 85% on a typical board size.
- [ ] **T3 Immediate uniform scramble** (SPEC R2). Depends: T1.
  - Accept: no cell `isRotated()` after `setupBoard`; each cell's dirs is a rotation of `solutionDirs`;
    all 4 rotations occur.
- [ ] **T4 Blind cells on Insane** (SPEC R3). Depends: T3.
  - Accept: Insane cells with ≥3 dirs are blind, others not; other skills never blind; solving clears blind.
- [ ] **T5 Unified rotate + move counting** (SPEC R4). Depends: T1.
  - Accept: FREE/NONE/locked cells don't rotate; mouse/touch/keyboard share one path; repeat tap on the
    same cell doesn't add a move; touch counts moves.
- [ ] **T6 Lock toggle** (SPEC R5). Depends: T5.
  - Accept: toggleLock flips `isLocked` for cable cells only; locked cells refuse rotation; right-click,
    long-press and `L` wired up.
- [ ] **T7 Rotation clock clamp** (SPEC R6). Depends: T1.
  - Accept: `doUpdate` with `now < rotateStart` gives angle 0, not negative.
- [ ] **T8 Browser verification** with `npm run dev`.
