# Goldspur Valley

Goldspur Valley is a playable MVP beta for a cozy 2D browser horse game built with Phaser 3, TypeScript, and Vite. The current build focuses on a complete local loop: choose a rider, start at the ranch, explore the open world, train and care for a horse, race, customize tack, discover story quests, and save progress in the browser.

The project is local-first and does not require a backend. Save data is stored in `localStorage`, generated fallback textures keep the game bootable when optional art is missing, and smoke scripts are included for browser playthrough checks.

## Setup

```bash
npm install
npm run dev
```

Open the local Vite URL shown in the terminal. The Phaser canvas is 1280x720, scales to fit, and centers automatically.

## Build

```bash
npm run build
```

The production build runs TypeScript compilation first and then emits the Vite bundle to `dist/`.

## Controls

- WASD / Arrow Keys: move
- E: interact
- M: toggle map / travel menu
- I: inventory
- H: return to ranch
- G: mount or dismount when a horse is available
- R: reset save with confirmation, except in Relaxation where R ends the day
- Space: start race from the race start UI
- Esc: return, close overlay, or open the relevant pause/settings flow

## Current Playable Features

- Main menu, character selection, settings, credits, and story-mode entry
- Ranch hub with starter home selection, NPC prompts, and guided progression
- Open-world exploration with procedural chunks, minimap support, travel points, high-delta collision recovery, hidden quest content, inventory-tool exploration scenarios, trail discovery milestones, and weather state
- Horse stats, stat clamping, autosave, load, corrupted-save fallback, and reset handling
- Player movement with horse companion behavior plus mounted riding and jumping sprites
- Training drills with stat previews and result popups
- Beginner Sprint Race with entry requirements, short race animation, score roll, rewards, costs, and results popup
- Horse customization store with purchasable visual options that affect ranch, open-world, and mounted horse tinting
- Health recovery service with coin cost
- Relaxation meadow with daily use limit and End Day action
- Inventory overlay with care items, horse tracker, and exploration tools for contextual trail rewards and journal progress
- Image and sprite loading with Phaser-generated fallbacks if files are missing

## Scene Descriptions

- MainMenuScene: story entry, current rider/quest status, settings and credits access
- CharacterSelectScene: selectable riders with saved identity state
- RanchScene: starter homes, signpost travel hub, ranch UI
- OpenWorldScene: procedural outdoor world, mounted traversal, quests, NPCs, minimap, weather, and travel links
- TrainingScene: sprint, endurance, and bond drills
- RacingScene: corrected race start reference, simulated oval race progress, results
- HealthScene: basic recovery at the vet area
- HorseCustomizationScene: tack/color customization and purchase flow
- RelaxationScene: meadow rest and day advancement
- InventoryScene: dark gold-bordered inventory panel and item grid
- SettingsScene: configurable game settings overlay
- BootScene: asset loading, fallback texture generation, safe save load

## Asset Replacement Guide

Place generated `$imagegen` files in:

```text
src/assets/images/
```

Use these exact names:

```text
ranch_hub.png
travel_hub.png
training_area.png
training_result.png
race_start.png
race_in_progress.png
race_results.png
health_area.png
relaxation_area.png
inventory_screen.png
player.png
horse.png
```

If an image exists, the game uses it as the scene background, UI reference, or sprite source. If it is missing or fails to load, BootScene and the texture factory generate fallback textures so the game continues to run.

Sprite frames live under:

```text
src/assets/sprites/
public/assets/sprites/
```

Run `npm run build:sprites` after changing source sprite references to regenerate the walk, horse, and mounted-rider animation frames.

## Save System Notes

Progress is saved in localStorage under:

```text
goldspur_valley_save_v1
```

The save includes horse stats, inventory, procedural world state, horse customization, story progress, selected character, starter home choice, coins, race records, day, and relaxation uses. Bad or partial save data is normalized back to safe defaults.

## Optional QA / Smoke Checks

The repo includes Playwright-style smoke scripts in `scripts/` for focused gameplay checks. They require Playwright to be available in the environment; the production build does not depend on it. `smoke-openworld-systems.mjs` writes `test-artifacts/openworld-systems-smoke.json` with collision sweep, exploration scenario, and customization evidence.

```bash
node scripts/smoke-playthrough.mjs
node scripts/smoke-openworld-systems.mjs
node scripts/smoke-horse-customization.mjs
node scripts/smoke-boat-parishes.mjs
```

Start the Vite dev server before running smoke scripts that target a live browser session.

## Known Limitations

- Race gameplay is simulated with UI and tweened sprites, not real racing physics.
- Inventory remains intentionally small, but tools now trigger contextual exploration scenarios, trail journal progress, and milestone rewards in the open world.
- Quests and open-world content are MVP-scale and mostly deterministic/local.
- Multiplayer, backend accounts, online leaderboards, audio polish, and mobile-specific controls are placeholders or out of scope for this MVP.

## Future Roadmap

- Add named horses, tack upgrades, and richer item effects
- Expand training minigames and race types
- Expand quests, NPC schedules, and area progression
- Improve sprite animations and audio
- Add mobile touch controls
- Build a larger save migration system for future versions
