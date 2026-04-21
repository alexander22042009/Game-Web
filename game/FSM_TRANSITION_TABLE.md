# FSM Transition Table - Neon Labyrinth: Echo Hunter

| Current State | Input / Condition | Next State | Action |
|---|---|---|---|
| IDLE | idle timer elapsed | PATROL | Select patrol point and begin movement |
| IDLE | playerDistance < detectionRadius AND lineOfSight = true | CHASE | Set target to player/decoy and pursue |
| PATROL | playerDistance < detectionRadius AND lineOfSight = true | CHASE | Lock target and increase move speed |
| PATROL | health / maxHealth < 0.2 | RETREAT | Move away from threat to recover distance |
| PATROL | health <= 0 | DEAD | Play destruction logic and disable behavior |
| CHASE | playerDistance < attackRange AND lineOfSight = true | ATTACK | Stop/slow movement and start attack cycle |
| CHASE | lost line of sight for more than 2.5s | PATROL | Resume patrol route |
| CHASE | health / maxHealth < 0.2 | RETREAT | Prioritize survival and disengage |
| CHASE | health <= 0 | DEAD | Trigger destruction and score event |
| ATTACK | playerDistance >= attackRange | CHASE | Continue pursuit |
| ATTACK | health / maxHealth < 0.2 | RETREAT | Abort attack and retreat |
| ATTACK | health <= 0 | DEAD | Trigger destruction and score event |
| RETREAT | safe distance restored OR retreat timer elapsed | PATROL | Return to normal route logic |
| RETREAT | health <= 0 | DEAD | Trigger destruction and score event |
| DEAD | canRespawn = true | RESPAWN | Start reboot timer |
| RESPAWN | rebootDelay elapsed | PATROL | Reset HP/position and rejoin combat |
| ANY | health <= 0 | DEAD | Highest-priority terminal transition |
