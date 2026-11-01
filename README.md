# Connect 4: Subterranean Ascension

A 3D roguelike deckbuilder Connect 4 experience crafted by **Dyagonil**, featuring a Grandmaster Negamax AI solver, procedural cavern board topologies, consumable Arcane Cards, Tactical Reserve Tokens, Synergistic Gambit relics, a 2D physics Roulette Wheel of Subterranean Fate, mid-run checkpoint persistence, and an 8-bit Web Audio chiptune synthesizer.

## Quick Start (Double-Click `file://` & Static Host Compatible)

1. Unzip the archive to any folder on your computer.
2. Double-click **`index.html`** to open the game directly in any modern browser (Chrome, Edge, Firefox, Safari) — no local web server or build step required.
3. Tap or press `Enter` on the retro CRT terminal boot gate to unlock Web Audio synthesis and launch the game.

## Project Directory Structure

```text
connect4-subterranean-ascension/
├── index.html                      # Main HTML layout and ordered <script defer> loader
├── manifest.json                   # PWA Web App Manifest
├── sw.js                           # Offline-capable Service Worker
├── README.md                       # Documentation & quick-start guide
├── assets/
│   ├── icons/                      # Vector SVG medallions (bosses, cards, gambits, hud, reserves, slots, topologies, wheel)
│   └── images/
│       └── dyagonil-logo.png       # Dyagonil splash screen emblem
├── css/
│   ├── main.css                    # Core layout, typography, cavern panels, cards & callouts
│   ├── animations.css              # Keyframe animations (token boing, ripples, float-ups)
│   ├── overlays.css                # CRT terminal, splash screen, floor intro & tutorial spotlight
│   └── icons.css                   # Custom vector icon sizing & hover rules
└── js/
    ├── main.js                     # Application entry point, window.C4 namespace & bootGame()
    ├── config/
    │   ├── constants.js            # Grid dimensions, cell states & floor structure helpers
    │   ├── topologies.js           # Procedural 7x6 cavern topologies & mask builders
    │   ├── catalogs.js             # Cards, Reserve Tokens, Gambits, Enchanted Slots, Bosses & Roulette wedges
    │   └── difficulty.js           # Glowworm (Easy), Obsidian (Medium) & Abyssal (Hard) tiers
    ├── state/
    │   ├── settings.js             # Persistent user preferences (localStorage)
    │   ├── gameState.js            # Run state & consumable card stockpile engine
    │   └── persistence.js          # Mid-run checkpoint save/restore & 3D mesh rehydration
    ├── audio/
    │   ├── sfx.js                  # TactileSFX 8-bit Web Audio synthesizer & haptics
    │   └── bgm.js                  # SubterraneanChiptuneEngine (Cavern, Boss 1–3, Bazaar & Roulette suites)
    ├── engine/
    │   ├── ai.js                   # GrandmasterConnect4AI (Negamax + Alpha-Beta + Transposition Table)
    │   ├── boardLogic.js           # Gravity, slot enchantments, card/token dispatchers & Boss abilities
    │   └── rouletteSim.js          # SubterraneanRouletteSimulator (2D canvas physics wheel)
    ├── graphics/
    │   ├── scene3d.js              # Three.js 3D cavern scene, carved wood board & token meshes
    │   ├── vfx3d.js                # 3D particle bursts, shockwaves, beams & card choreography
    │   └── loop.js                 # Main requestAnimationFrame loop & 3D-to-2D telemetry projection
    └── ui/
        ├── iconSystem.js           # SVG medallion registry, catalog hydrator & canvas icon preloader
        ├── emojiReplacer.js        # MutationObserver interceptor for inline SVG icons
        ├── notifications.js        # Toasts, floating bonus pills & 3D-projected slot callouts
        ├── hud.js                  # Top/bottom HUD rendering, AI telemetry & action inspector
        ├── modals.js               # Underground Bazaar, Boss Chest, Info Sheet, Settings & Difficulty modals
        ├── input.js                # Three.js raycast pointer/touch/keyboard column targeting
        ├── introSequence.js        # CRT terminal gate, Dyagonil splash, title opener & floor intro
        ├── tutorial.js             # Interactive playable 4-step tactical combo tutorial
        └── debugMenu.js            # Secret title token code listener & DYAGONIL_OS debug launcher
```
