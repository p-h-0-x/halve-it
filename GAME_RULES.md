# Halve-It Darts Scorer - Game Rules

Halve-It is a darts scoring application supporting four distinct game modes plus a tournament wrapper. Below are the detailed rules for each mode.

---

## Classic Mode

### Overview

The traditional Halve-It game. All players play the same contract each round across 15 fixed rounds.

### Turn Structure

- Each round, every player throws **3 darts**.
- All players attempt the **same contract** in each round.
- Rounds proceed in a fixed order (see [Contracts](#contracts) below).

### Scoring

- Players start with a **capital** of 0.
- **Hit the contract** (meet the requirement): the contract's score is **added** to the player's capital.
- **Miss the contract** (fail the requirement): the player's capital is **halved** (rounded up).

### Winning Condition

- The player with the **highest capital** after all 15 rounds wins.
- Ties are possible.

### Example

| Round | Contract | Darts | Hit? | Capital |
|-------|----------|-------|------|---------|
| 1 | Capital | 20, 5, 18 | Always | 43 |
| 2 | 20 | T20, 5, 1 | Yes (+60) | 103 |
| 3 | Side | 3, 10, 7 | No (halved) | 52 |

---

## Yahtzee Style Mode

### Overview

A free-choice mode inspired by Yahtzee. Players throw their darts first, then choose which contract to fill based on what they hit.

### Turn Structure

1. Players take turns **one at a time**.
2. Throw **3 darts**.
3. Choose any **available** (unfilled, unscratched) contract:
   - **Fill**: Record the score for that contract (added to total).
   - **Scratch**: Voluntarily give up a contract (scores 0, removes it from play).

### Valid Contracts

After throwing, only contracts whose requirements are met by the 3 darts are available to fill. Any contract can be scratched regardless of what was thrown.

### Scoring

- Each filled contract's score is added to the player's cumulative total.
- Scratched contracts contribute 0.

### Game End

The game ends when all 15 contracts for every player are either filled or scratched.

### Winning Condition

- The player with the **highest total score** wins.
- Ties are possible.

---

## Clock Mode

### Overview

A racing game where players advance through targets 1 through 10, then Bull, to finish first.

### Target Sequence

Players must hit numbers in order: **1 -> 2 -> 3 -> ... -> 10 -> Bull**.

### Turn Structure

- Players take turns **one at a time**.
- Each turn: throw up to **3 darts**.
- Each dart is evaluated against the player's **current target at that moment** (targets update mid-turn as hits land).

### Advancement Rules

| Hit Type | Advance |
|----------|---------|
| Single (correct number) | +1 position |
| Double (correct number) | +2 positions |
| Triple (correct number) | +3 positions |
| Miss / Wrong number | No advance |

- **Advancing past 10** always caps at **Bull** (position 11). Bull is never skipped.
  - Example: At position 9, hitting a triple 9 would advance by 3 (to position 12), but caps at Bull (11).

### Bull Target

When the player's target is Bull:
- Hitting **single bull (25)** or **double bull (50)** finishes the game for that player.
- Any other number does **not** advance or finish.

### Extra Turn

- If the **last dart** of a turn hits the current target (without finishing the game), the player earns an **extra turn**.
- This does **not** apply if the player finishes on that dart.

### Winning Conditions

1. **First to finish wins.** The game ends **immediately** when a player hits Bull to complete all targets.
2. **Turn limit:** If no one finishes within **10 turns each**, the player furthest ahead (highest position) wins.
3. **Ties** are possible if multiple players share the highest position when the turn limit is reached.

---

## Killer Mode

### Overview

An elimination-style game where players choose personal target numbers and battle to be the last one standing.

### Setup

- Each player selects a **unique number** (1-20) as their personal target.

### Life System

- All players start with **0 lives**.
- Hitting **your own number**: **+3 lives**.
- Hitting segments **adjacent** to your number on the dartboard: **+1 life**.
- **Doubles** multiply the lives gained by **2**.
- **Triples** multiply the lives gained by **3**.

### Killer Status

- When a player reaches **9 lives**, they become a **Killer**.
- Killers can attack other players by hitting their target numbers, reducing their lives.

### Elimination

- A player is **eliminated** when their life count drops to **-1** or below.
- Eliminated players are marked as **OUT** and take no further turns.

### Winning Condition

- The **last player standing** (not eliminated) wins.

---

## Tournament Mode

### Overview

A single-elimination tournament bracket that wraps around any of the game modes above.

### Structure

- Requires a **minimum of 3 players**.
- Players are placed in a **single-elimination bracket**.
- Each match is a full game in the selected game mode.

### Progression

- Match winners advance to the next round.
- Match losers are eliminated from the tournament.
- Rounds progress: Quarterfinals -> Semifinals -> Finals.

### Tie Resolution

- If a match ends in a tie, the tournament operator manually selects which tied player advances.

### Tournament End

- The winner of the final match is crowned **Tournament Champion**.

---

## Contracts

All 15 contracts used in Classic and Yahtzee Style modes, listed in play order:

| # | ID | Name | Requirement | What Scores |
|---|-----|------|-------------|-------------|
| 1 | `capital` | Capital | Always succeeds | Sum of all 3 darts |
| 2 | `20` | 20 | At least one dart hits 20 | Only darts hitting 20 |
| 3 | `side` | Side | 3 darts hit 3 adjacent board segments | Sum of all 3 darts |
| 4 | `19` | 19 | At least one dart hits 19 | Only darts hitting 19 |
| 5 | `3row` | 3 in a Row | 3 darts hit 3 consecutive numbers | Sum of all 3 darts |
| 6 | `18` | 18 | At least one dart hits 18 | Only darts hitting 18 |
| 7 | `color` | Color | 3 darts hit 3 different colors | Sum of all 3 darts |
| 8 | `17` | 17 | At least one dart hits 17 | Only darts hitting 17 |
| 9 | `double` | Double | At least one dart is a double | Only double darts |
| 10 | `16` | 16 | At least one dart hits 16 | Only darts hitting 16 |
| 11 | `triple` | Triple | At least one dart is a triple | Only triple darts |
| 12 | `15` | 15 | At least one dart hits 15 | Only darts hitting 15 |
| 13 | `57` | 57 | Total of all 3 darts equals exactly 57 | Sum of all 3 darts |
| 14 | `14` | 14 | At least one dart hits 14 | Only darts hitting 14 |
| 15 | `bull` | Bull | At least one dart hits bullseye (25 or 50) | Only bull darts |

### Contract Detail: Side (Adjacent Segments)

Three darts must land in three segments that are **adjacent on the physical dartboard** (clockwise order: 20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5).

Special rules:
- **Single bull (25)** is considered adjacent to **every** segment. Throwing a single bull with any two other segments satisfies the Side contract.
- **Double bull (50)** is **not** adjacent to non-bull segments and cannot be used to satisfy Side.

### Contract Detail: 3 in a Row (Consecutive Numbers)

Three darts must hit three **strictly consecutive numbers** (e.g., 5-6-7 or 14-15-16).

- **Bull (25) does not count** for 3 in a Row.
- Numbers must be unique and consecutive (no duplicates).

### Contract Detail: Color (3 Different Colors)

Three darts must each be a **different color** from the set: black, white, red, green.

Color assignments:
- **Singles** are **black** or **white** based on segment:
  - Black segments: 20, 18, 13, 10, 2, 3, 7, 8, 14, 12
  - White segments: 1, 4, 6, 15, 17, 19, 16, 11, 9, 5
- **Doubles and triples** take the **ring color**:
  - Red rings: on black segments (20, 18, 13, 10, 2, 3, 7, 8, 14, 12)
  - Green rings: on white segments (1, 4, 6, 15, 17, 19, 16, 11, 9, 5)
- **Single bull (25)**: green
- **Double bull (50)**: red

### Contract Detail: 57

The **total score** of all 3 darts must equal **exactly 57**. All 3 darts contribute to the score.

---

## Dartboard Reference

### Segment Order (clockwise from top)

```
20 - 1 - 18 - 4 - 13 - 6 - 10 - 15 - 2 - 17 - 3 - 19 - 7 - 16 - 8 - 11 - 14 - 9 - 12 - 5
```

The board is circular, so 5 and 20 are also adjacent.

### Dart Notation

| Modifier | Multiplier | Example |
|----------|------------|---------|
| Single | x1 | Single 20 = 20 points |
| Double | x2 | Double 20 = 40 points |
| Triple | x3 | Triple 20 = 60 points |
| Single Bull | - | 25 points |
| Double Bull | - | 50 points |
| Miss | - | 0 points |
