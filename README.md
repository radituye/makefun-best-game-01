# makefun-best-game-01

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/radituye/makefun-best-game-01/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/radituye/makefun-best-game-01/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

**GLOWMOTH — Night Garden.** A glowmoth gathers the last light of the night: dodge
shadow bats, drink the pollen, and flash them away with gathered light. Ten waves,
a Nightjar boss on waves 5 and 10 — survive them all and the dawn breaks.

## How to play

- **WASD / Arrows** — fly
- **Space / Click** — Flash: a burst of light that clears nearby bats (needs a full charge)
- **P** — pause · **M** — mute · **Enter** — start / play again

Collect pollen to score and charge the Flash. Chain pickups to raise the combo
multiplier (up to x8). Three petals are your lives; a bat's touch costs one. Clear
a wave for a bonus. Survive all 10 waves to win.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Or build the dossier the judge reads:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Files

- `game/` — the game as static files: `index.html`, `style.css`, `src/` (one module
  per job: config, random, input, audio, garden, moth, bats, orbs, particles, hud,
  world, shots, main)
- `screenshots/` — 4 renders of the game's own code: title, play, boss, victory
- `main.ts` — the entrypoint: copies `game/` + `screenshots/` and writes `dossier.json`
- `vendor/makefun-game.ts` — make.fun's dossier library, copied from the kit unchanged

All art is drawn in code and all sound is synthesized with WebAudio. No assets, no
network requests, nothing copied from any other game.

---

<sub>Entered on [make.fun](https://make.fun/?ref=8ak5ahcj&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
