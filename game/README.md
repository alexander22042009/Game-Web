# Neon Labyrinth: Echo Hunter

Browser game made with HTML5 Canvas and vanilla JavaScript.

You play as the Echo Hunter in a cyber labyrinth. Collect shards, survive enemy drones driven by FSM AI, and clear all 3 levels.

## Features

- Top-down action gameplay on HTML5 Canvas
- Responsive game loop with `requestAnimationFrame`
- Reusable enemy FSM with states: `IDLE`, `PATROL`, `CHASE`, `ATTACK`, `RETREAT`, `DEAD`, `RESPAWN`
- 5 drone archetypes: Scout, Hunter, Tank, Alarm, Reboot
- 3-level progression with final win on level 3
- Weapon progression by level:
  - Level 1: Pistol (1 shot/second, long range)
  - Level 2: Shotgun (3 pellets with spread)
  - Level 3: AK-47 (5 shots/second, tight spread)
- Weapon recoil animation, muzzle flash, and directional sprites
- Hero HP bar above player with critical blinking below 20 HP
- Heal mechanic: collecting a shard restores 10% HP
- Menu, HUD, pause, game-over/win screen
- Background music + per-weapon shooting SFX

## Controls

- `WASD` / `Arrow Keys` - Move
- `Mouse Move` - Aim
- `Left Click` / hold - Shoot
- `Right Click` - Deploy decoy
- `Shift` - Dash
- `Esc` - Pause / Resume
- `M` - Mute audio
- `H` - Toggle help tip

## Gameplay Rules

- Collect shards to unlock the portal
- Enter the portal to advance level
- Clear level 3 to win the game
- If HP reaches 0, game over

## Events Implemented

- Keyboard: `keydown`, `keyup`, `keypress`
- Mouse: `mousemove`, `click`, `mousedown`, `mouseup`, `contextmenu`, `wheel`
- Window/document: `load`, `resize`, `focus`, `blur`, `visibilitychange`
- System timing: `requestAnimationFrame`, `setTimeout`, `setInterval`
- Custom events: `gameStart`, `gameOver`, `levelUp`, `portalUnlocked`, `enemyDestroyed`, `pauseToggled`, `playerDamaged`

## FSM Documentation

- Transition table: `FSM_TRANSITION_TABLE.md`
- Diagram instructions: `FSM_DIAGRAM_INSTRUCTIONS.md`
- Diagram image: `fsm-diagram.png`

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript (ES modules)
- Canvas 2D API
- Web Audio API + HTML Audio

## Project Structure

```text
game/
  assets/
    images/
    sounds/
  css/
    style.css
  js/
    main.js
    game.js
    input.js
    renderer.js
    utils.js
    constants.js
    audio.js
    ui.js
    fsm.js
    entity.js
    player.js
    enemy.js
    projectile.js
    level.js
    collision.js
  index.html
  README.md
  FSM_TRANSITION_TABLE.md
  FSM_DIAGRAM_INSTRUCTIONS.md
  fsm-diagram.png
  .gitignore
```

## Run Locally

From the `game` folder:

```bash
python -m http.server 8080
```

Open:

`http://127.0.0.1:8080`

## GitHub Pages

1. Push the `game` content to repository root (or configure publish folder).
2. Enable GitHub Pages in repository settings.
3. Confirm `index.html` is in the published path.

## Audio Credits

- Pistol SFX: `assets/sounds/fire_sounds/pistol/freesound_community-single-pistol-gunshot-33-37187.mp3`
- Shotgun SFX: `assets/sounds/fire_sounds/shotgun/freesound_community-shotgun-firing-3-14483.mp3`
- AK-47 SFX: `assets/sounds/fire_sounds/ak-47/microsammy-ak-47-firing-8760.mp3`
