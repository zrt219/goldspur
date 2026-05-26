# Goldspur Loading Performance Record

Measured locally with Playwright against `http://127.0.0.1:5173/` with browser cache disabled.

## Current Pass

| Metric | Before mounted split | After lazy mounted atlases |
| --- | ---: | ---: |
| Boot asset requests | 81 | 50 |
| Mounted boot requests | 31 | 0 |
| Boot asset transfer | 8.93 MB | 4.67 MB |
| Mounted boot transfer | 4.26 MB | 0 |
| Boot asset waterfall | 828 ms | 814 ms |
| Browser load event | 407 ms | 441 ms |

Notes:
- The measured load event has local-dev jitter, but the important win is structural: mounted animation cost is no longer on the boot path.
- Mounted assets now load from 4 files on first mount: `mounted_idle.png`, plus 3 spritesheets in `sprites/mounted_atlas/`.
- First cold mount after this pass: 4 mounted requests, 2.81 MB transfer, 16 ms local resource waterfall, about 1.35 s wall-clock including Phaser loader/decode/wait overhead.

## Path To A 5 ms Mount

The cold network path cannot honestly be 5 ms. A 5 ms target is only realistic for the warm path: the mounted textures and animations must already be in memory before the player presses mount.

1. Keep boot blocking cost at 0 mounted bytes.
2. Prewarm the mounted atlas set during idle time after the first playable scene is stable, using `requestIdleCallback` or a 2-3 second delayed scene loader.
3. Move `mounted_idle.png` into the idle spritesheet so the warm-up is 3 requests instead of 4.
4. Trim transparent margins and produce a packed JSON atlas instead of full 384x384 frames. This should reduce decode/upload work more than PNG compression alone.
5. Add a runtime perf mark around mount input to mounted sprite swap. Budget: warm mount texture swap under 5 ms, cold mount under 250 ms on production CDN after atlas trimming and preload.
6. Cache the mounted atlas files through the browser cache or a service worker so repeat sessions stay on the warm path.

Next target: idle prewarm + trimmed atlas. That is the direct route from "faster boot" to "mount feels instant."
