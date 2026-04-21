# Draw.io FSM Diagram Instructions

Use these steps to recreate `fsm-diagram.png` in draw.io:

1. Create circles for states:
   - `IDLE`
   - `PATROL`
   - `CHASE`
   - `ATTACK`
   - `RETREAT`
   - `DEAD`
   - `RESPAWN`

2. Add an initial pseudo-node (small filled circle) with arrow to `IDLE`.

3. Draw transitions and labels:
   - `IDLE -> PATROL` : `idleTimer <= 0`
   - `IDLE -> CHASE` : `playerDistance < detectionRadius && lineOfSight`
   - `PATROL -> CHASE` : `detect player/decoy`
   - `PATROL -> RETREAT` : `health < 20%`
   - `PATROL -> DEAD` : `health <= 0`
   - `CHASE -> ATTACK` : `playerDistance < attackRange`
   - `CHASE -> PATROL` : `lostSightTimer > 2.5s`
   - `CHASE -> RETREAT` : `health < 20%`
   - `CHASE -> DEAD` : `health <= 0`
   - `ATTACK -> CHASE` : `playerDistance >= attackRange`
   - `ATTACK -> RETREAT` : `health < 20%`
   - `ATTACK -> DEAD` : `health <= 0`
   - `RETREAT -> PATROL` : `safeDistance || retreatTimer <= 0`
   - `RETREAT -> DEAD` : `health <= 0`
   - `DEAD -> RESPAWN` : `canRespawn = true`
   - `RESPAWN -> PATROL` : `rebootDelay elapsed`

4. Add a note box:
   - `ANY -> DEAD when health <= 0 (highest priority guard)`

5. Suggested styling:
   - Dark background (#070b16)
   - Cyan outlines for normal transitions
   - Orange for retreat transitions
   - Red for DEAD transitions
   - Green for RESPAWN transition
