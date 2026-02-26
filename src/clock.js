/**
 * Clock mode game logic for Halve-It darts app
 *
 * Clock mode rules:
 * - Players hit 1, then 2, 3, ..., 10, then Bull to finish
 * - Doubles/triples count as extra advancement (e.g., triple 1 = advance 3 positions)
 * - Advancing past 10 does NOT skip Bull — target caps at 11 (Bull)
 * - When target is Bull (position 11), hitting single or double bull finishes
 * - If the last dart of a turn hits the current target (and player hasn't finished), extra turn
 * - First player to finish all targets wins; game ends immediately
 * - Each dart is evaluated against the current target at that point in the turn
 */

/**
 * Target positions: 1-10 = numbers, 11 = Bull, 12 = finished
 */
const CLOCK_POSITION_BULL = 11;
const CLOCK_POSITION_FINISHED = 12;

/**
 * Get the multiplier for a dart modifier
 * @param {string} modifier - 'single', 'double', or 'triple'
 * @returns {number} The multiplier (1, 2, or 3)
 */
function getMultiplier(modifier) {
    if (modifier === 'double') return 2;
    if (modifier === 'triple') return 3;
    return 1;
}

/**
 * Get the display name for a clock position
 * @param {number} position - Clock position (1-11, or 12 for finished)
 * @returns {string} Display name
 */
function getClockTargetName(position) {
    if (position >= CLOCK_POSITION_FINISHED) return 'Finished';
    if (position >= CLOCK_POSITION_BULL) return 'Bull';
    return String(position);
}

/**
 * Process a set of darts against a starting position, returning the result.
 * Each dart is evaluated against the current target at that point in the turn
 * (i.e., if dart 1 advances the target, dart 2 checks against the new target).
 *
 * @param {Array} darts - Array of dart objects with { number, modifier }
 * @param {number} startPosition - Starting clock position (1-11)
 * @returns {Object} Result: { endPosition, lastDartHit, finished, extraTurn }
 */
function processClockDarts(darts, startPosition) {
    if (!darts || darts.length === 0) {
        return { endPosition: startPosition, lastDartHit: false, finished: false, extraTurn: false };
    }

    let pos = startPosition;
    let lastDartHit = false;

    for (let i = 0; i < darts.length; i++) {
        const dart = darts[i];
        if (pos >= CLOCK_POSITION_FINISHED) break; // Already finished

        let hit = false;
        if (pos <= 10) {
            // Target is a number 1-10
            if (dart.number === pos) {
                hit = true;
                const advance = getMultiplier(dart.modifier);
                pos = pos + advance;
                if (pos > CLOCK_POSITION_BULL) pos = CLOCK_POSITION_BULL; // Cap at bull
            }
        } else {
            // Target is bull (position 11)
            if (dart.number === 25) {
                hit = true;
                pos = CLOCK_POSITION_FINISHED; // Finished!
            }
        }

        lastDartHit = (i === darts.length - 1) && hit;
    }

    const finished = pos >= CLOCK_POSITION_FINISHED;
    const extraTurn = lastDartHit && !finished;

    return {
        endPosition: finished ? CLOCK_POSITION_FINISHED : pos,
        lastDartHit,
        finished,
        extraTurn
    };
}

/**
 * Get the preview target position after simulating the given darts.
 * Used to dynamically update the UI as darts are entered one at a time.
 *
 * @param {Array} darts - Array of dart objects entered so far
 * @param {number} startPosition - Player's actual clock position
 * @returns {number} The target position for the next dart
 */
function getClockPreviewTarget(darts, startPosition) {
    const result = processClockDarts(darts, startPosition);
    return result.endPosition;
}

/**
 * Calculate progress percentage for a clock position (0-11 steps)
 * @param {number} position - Clock position (1-12)
 * @param {boolean} finished - Whether the player has finished
 * @returns {number} Progress percentage (0-100)
 */
function getClockProgress(position, finished) {
    if (finished) return 100;
    return ((position - 1) / 11) * 100;
}

// Export for Node.js (tests) while keeping browser globals
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CLOCK_POSITION_BULL,
        CLOCK_POSITION_FINISHED,
        getMultiplier,
        getClockTargetName,
        processClockDarts,
        getClockPreviewTarget,
        getClockProgress
    };
}
