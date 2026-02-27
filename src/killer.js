/**
 * Killer mode game logic for Halve-It darts app
 *
 * Killer mode rules:
 * - Each player picks a unique number (1-20) on the dartboard
 * - Gain lives by hitting your own number (+3) or adjacent segments (+1)
 * - Doubles multiply by 2, Triples multiply by 3
 * - At 9 lives, become a "Killer" and attack others
 * - When a Killer hits another player's number: -3 × multiplier to that player
 * - When a Killer hits adjacent to another player's number: -1 × multiplier
 * - Killer status is checked per-dart: becoming killer mid-turn allows attacking with subsequent darts
 * - Players are eliminated when lives drop to -1 or below
 * - Lives are capped at 9 (max)
 * - Bull (25) and miss (0) darts are ignored
 * - Last player standing wins
 */

// Dartboard arrangement (clockwise from top) — same as contracts.js
const DARTBOARD_SEQUENCE = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];

/**
 * Maximum lives a player can have (also the threshold to become a Killer)
 */
const KILLER_MAX_LIVES = 9;

/**
 * Lives threshold at or below which a player is eliminated
 */
const KILLER_ELIMINATION_THRESHOLD = -1;

/**
 * Get the multiplier for a dart modifier
 * @param {string} modifier - 'single', 'double', or 'triple'
 * @returns {number} The multiplier (1, 2, or 3)
 */
function getKillerMultiplier(modifier) {
    if (modifier === 'double') return 2;
    if (modifier === 'triple') return 3;
    return 1;
}

/**
 * Get the two adjacent numbers on the dartboard for a given segment.
 * The dartboard is circular, so 20's neighbors are 5 (left) and 1 (right).
 * @param {number} num - Segment number (1-20)
 * @returns {number[]} Array of [leftNeighbor, rightNeighbor], or [] for invalid inputs
 */
function getAdjacentNumbers(num) {
    if (num === 0 || num === 25) return [];
    const idx = DARTBOARD_SEQUENCE.indexOf(num);
    if (idx === -1) return [];
    const left = DARTBOARD_SEQUENCE[(idx - 1 + DARTBOARD_SEQUENCE.length) % DARTBOARD_SEQUENCE.length];
    const right = DARTBOARD_SEQUENCE[(idx + 1) % DARTBOARD_SEQUENCE.length];
    return [left, right];
}

/**
 * Process a set of darts for a killer mode turn, returning life change events.
 * Each dart is evaluated against the thrower's number/adjacents for gaining lives,
 * and against all opponents' numbers/adjacents for attacking (if thrower is a killer).
 *
 * Killer status is checked per-dart: if a player becomes a killer on dart 1,
 * they can attack with darts 2 and 3 (but not dart 1 itself).
 *
 * @param {string} thrower - Name of the player throwing
 * @param {Array} darts - Array of dart objects with { number, modifier }
 * @param {Object} gameState - Current game state
 * @param {string[]} gameState.players - All player names
 * @param {Object} gameState.killerNumbers - Map of player name to their chosen number
 * @param {Object} gameState.killerIsKiller - Map of player name to killer status (boolean)
 * @param {Object} gameState.killerLives - Map of player name to current lives (number)
 * @param {Object} gameState.killerEliminated - Map of player name to eliminated status (boolean)
 * @returns {Array} Array of { player, delta, reason } change objects
 */
function processKillerDarts(thrower, darts, gameState) {
    const { players, killerNumbers, killerIsKiller, killerLives, killerEliminated } = gameState;
    const changes = [];
    const throwerNum = killerNumbers[thrower];
    const throwerAdj = getAdjacentNumbers(throwerNum);
    let isThrowerKiller = killerIsKiller[thrower];
    let runningLives = killerLives[thrower];

    for (const dart of darts) {
        if (dart.number === 0 || dart.number === 25) continue;

        const multiplier = getKillerMultiplier(dart.modifier);
        const wasKillerBeforeDart = isThrowerKiller;

        let livesGained = 0;
        if (dart.number === throwerNum) {
            livesGained = 3 * multiplier;
            changes.push({ player: thrower, delta: livesGained, reason: 'own' });
        } else if (throwerAdj.includes(dart.number)) {
            livesGained = 1 * multiplier;
            changes.push({ player: thrower, delta: livesGained, reason: 'adjacent' });
        }

        runningLives += livesGained;
        if (!isThrowerKiller && runningLives >= KILLER_MAX_LIVES) {
            isThrowerKiller = true;
        }

        if (wasKillerBeforeDart) {
            for (const otherPlayer of players) {
                if (otherPlayer === thrower || killerEliminated[otherPlayer]) continue;
                const otherNum = killerNumbers[otherPlayer];
                const otherAdj = getAdjacentNumbers(otherNum);

                if (dart.number === otherNum) {
                    changes.push({ player: otherPlayer, delta: -3 * multiplier, reason: 'killed' });
                } else if (otherAdj.includes(dart.number)) {
                    changes.push({ player: otherPlayer, delta: -1 * multiplier, reason: 'adj-killed' });
                }
            }
        }
    }

    return changes;
}

/**
 * Apply killer turn changes to game state. Aggregates changes per player,
 * caps lives at KILLER_MAX_LIVES, sets killer status, and marks eliminations.
 *
 * @param {Array} changes - Array of { player, delta, reason } from processKillerDarts
 * @param {Object} lives - Map of player name to current lives (will be copied, not mutated)
 * @param {Object} isKiller - Map of player name to killer status (will be copied, not mutated)
 * @param {Object} eliminated - Map of player name to eliminated status (will be copied, not mutated)
 * @returns {Object} { lives, isKiller, eliminated, newlyEliminated }
 */
function applyKillerChanges(changes, lives, isKiller, eliminated) {
    const newLives = { ...lives };
    const newIsKiller = { ...isKiller };
    const newEliminated = { ...eliminated };

    // Aggregate changes per player
    const aggregated = {};
    for (const c of changes) {
        if (!aggregated[c.player]) aggregated[c.player] = 0;
        aggregated[c.player] += c.delta;
    }

    // Apply deltas, cap at max
    for (const [player, delta] of Object.entries(aggregated)) {
        newLives[player] = Math.min(newLives[player] + delta, KILLER_MAX_LIVES);
    }

    // Update killer status
    for (const player of Object.keys(newLives)) {
        if (!newEliminated[player] && newLives[player] >= KILLER_MAX_LIVES) {
            newIsKiller[player] = true;
        }
    }

    // Check eliminations
    const newlyEliminated = [];
    for (const player of Object.keys(newLives)) {
        if (!newEliminated[player] && newLives[player] <= KILLER_ELIMINATION_THRESHOLD) {
            newEliminated[player] = true;
            newlyEliminated.push(player);
        }
    }

    return { lives: newLives, isKiller: newIsKiller, eliminated: newEliminated, newlyEliminated };
}

/**
 * Check if the killer game is over (1 or fewer players alive)
 * @param {string[]} players - All player names
 * @param {Object} eliminated - Map of player name to eliminated status
 * @returns {boolean} True if the game is over
 */
function isKillerGameOver(players, eliminated) {
    const alivePlayers = players.filter(p => !eliminated[p]);
    return alivePlayers.length <= 1;
}

/**
 * Get the winner of a killer game (last player standing)
 * @param {string[]} players - All player names
 * @param {Object} eliminated - Map of player name to eliminated status
 * @returns {string|null} Winner name, or null if game not over
 */
function getKillerWinner(players, eliminated) {
    const alivePlayers = players.filter(p => !eliminated[p]);
    if (alivePlayers.length === 1) return alivePlayers[0];
    return null;
}

// Export for Node.js (tests) while keeping browser globals
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        DARTBOARD_SEQUENCE,
        KILLER_MAX_LIVES,
        KILLER_ELIMINATION_THRESHOLD,
        getKillerMultiplier,
        getAdjacentNumbers,
        processKillerDarts,
        applyKillerChanges,
        isKillerGameOver,
        getKillerWinner
    };
}
