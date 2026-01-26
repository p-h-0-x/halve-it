/**
 * Contract validation logic for Halve-It darts game
 * Supports both Classic and Yahtzee game modes
 */

// Contract IDs in order of play
const CONTRACT_IDS = ['capital', '20', 'side', '19', '3row', '18', 'color', '17', 'double', '16', 'triple', '15', '57', '14', 'bull'];

// Dartboard color map for SINGLE sections (standard dartboard - alternating black/white)
const DART_SINGLE_COLORS = {
    20: 'black', 1: 'white', 18: 'black', 4: 'white', 13: 'black', 6: 'white',
    10: 'black', 15: 'white', 2: 'black', 17: 'white', 3: 'black', 19: 'white',
    7: 'black', 16: 'white', 8: 'black', 11: 'white', 14: 'black', 9: 'white',
    12: 'black', 5: 'white'
};

// Dartboard color map for DOUBLE/TRIPLE rings (standard dartboard - alternating red/green)
const DART_RING_COLORS = {
    20: 'red', 1: 'green', 18: 'red', 4: 'green', 13: 'red', 6: 'green',
    10: 'red', 15: 'green', 2: 'red', 17: 'green', 3: 'red', 19: 'green',
    7: 'red', 16: 'green', 8: 'red', 11: 'green', 14: 'red', 9: 'green',
    12: 'red', 5: 'green'
};

// Dartboard arrangement (clockwise from top)
const DARTBOARD_SEQUENCE = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];

/**
 * Get the color of a dart based on what was actually hit
 * - Singles: black or white (segment color)
 * - Doubles/Triples: red or green (ring color)
 * - Bull: green (single), red (double)
 * @param {Object} dart - Dart object with number and modifier properties
 * @returns {string|null} Color of the dart hit area
 */
function getDartColor(dart) {
    if (dart.number === 25) {
        return dart.modifier === 'double' ? 'red' : 'green';
    }
    if (dart.number === 0) {
        return null; // Miss
    }
    // Doubles and triples use ring colors (red/green)
    if (dart.modifier === 'double' || dart.modifier === 'triple') {
        return DART_RING_COLORS[dart.number] || null;
    }
    // Singles use segment colors (black/white)
    return DART_SINGLE_COLORS[dart.number] || null;
}

/**
 * Check if 3 darts hit adjacent segments on the dartboard
 * @param {Object} dart1 - First dart
 * @param {Object} dart2 - Second dart
 * @param {Object} dart3 - Third dart
 * @returns {boolean} True if darts hit adjacent segments
 */
function areAdjacent(dart1, dart2, dart3) {
    // Only single bull (not double bull) is adjacent to everything
    const isSingleBull = (dart) => dart.number === 25 && dart.modifier === 'single';

    if (isSingleBull(dart1) || isSingleBull(dart2) || isSingleBull(dart3)) return true;

    const nums = [dart1.number, dart2.number, dart3.number].filter(n => n !== 0 && n !== 25);
    if (nums.length < 3) return false;

    for (let i = 0; i < DARTBOARD_SEQUENCE.length; i++) {
        const current = DARTBOARD_SEQUENCE[i];
        const next1 = DARTBOARD_SEQUENCE[(i + 1) % DARTBOARD_SEQUENCE.length];
        const next2 = DARTBOARD_SEQUENCE[(i + 2) % DARTBOARD_SEQUENCE.length];

        if (nums.includes(current) && nums.includes(next1) && nums.includes(next2)) {
            return true;
        }
    }
    return false;
}

/**
 * Check if 3 numbers are consecutive (e.g., 14-15-16)
 * @param {number} num1 - First number
 * @param {number} num2 - Second number
 * @param {number} num3 - Third number
 * @returns {boolean} True if numbers are consecutive
 */
function areConsecutive(num1, num2, num3) {
    // Filter out invalid values: undefined, NaN, 0 (miss), 25 (bull)
    const nums = [num1, num2, num3]
        .filter(n => typeof n === 'number' && !isNaN(n) && n !== 0 && n !== 25)
        .sort((a, b) => a - b);

    // Need exactly 3 valid numbers
    if (nums.length < 3) return false;

    // Check for consecutive sequence
    return nums[1] === nums[0] + 1 && nums[2] === nums[1] + 1;
}

/**
 * For Yahtzee mode: Determine which contracts are valid for given darts
 * @param {Array} darts - Array of dart objects with number, modifier, and score
 * @returns {Array} Array of valid contract IDs
 */
function getValidContracts(darts) {
    if (!darts || darts.length === 0) return [];

    const validContracts = [];
    const numbers = darts.map(d => d.number);
    const modifiers = darts.map(d => d.modifier);

    // Capital: Always valid
    validContracts.push('capital');

    // Number contracts (20, 19, 18, 17, 16, 15, 14): Valid if any dart hit that number
    [20, 19, 18, 17, 16, 15, 14].forEach(num => {
        if (numbers.includes(num)) {
            validContracts.push(num.toString());
        }
    });

    // Side: 3 adjacent segments
    if (areAdjacent(darts[0], darts[1], darts[2])) {
        validContracts.push('side');
    }

    // 3 in a Row: 3 consecutive numbers
    if (areConsecutive(numbers[0], numbers[1], numbers[2])) {
        validContracts.push('3row');
    }

    // Color: 3 different colors
    const colors = darts.map(d => getDartColor(d)).filter(c => c !== null);
    const uniqueColors = new Set(colors);
    if (uniqueColors.size >= 3) {
        validContracts.push('color');
    }

    // Double: Any double hit
    if (modifiers.includes('double')) {
        validContracts.push('double');
    }

    // Triple: Any triple hit
    if (modifiers.includes('triple')) {
        validContracts.push('triple');
    }

    // 57: Exactly 57 points
    const total = darts.reduce((sum, d) => sum + d.score, 0);
    if (total === 57) {
        validContracts.push('57');
    }

    // Bull: Bullseye hit (25 or 50)
    if (numbers.includes(25)) {
        validContracts.push('bull');
    }

    return validContracts;
}

/**
 * Calculate score for a specific contract given the darts
 * @param {Array} darts - Array of dart objects
 * @param {string} contractId - Contract identifier
 * @returns {number} Calculated score for the contract
 */
function calculateContractScore(darts, contractId) {
    if (!darts || darts.length === 0) return 0;

    // Define which contracts are truly numeric (target a specific board number)
    const numericContracts = ['20', '19', '18', '17', '16', '15', '14'];

    // For numeric contracts, only count darts that hit that number
    if (numericContracts.includes(contractId)) {
        const targetNumber = parseInt(contractId);
        let score = 0;
        for (let dart of darts) {
            if (dart.number === targetNumber) {
                score += dart.score;
            }
        }
        return score;
    }

    // Special handling for specific contracts
    switch (contractId) {
        case 'double':
            // Only count darts that are doubles
            return darts.filter(d => d.modifier === 'double').reduce((sum, d) => sum + d.score, 0);

        case 'triple':
            // Only count darts that are triples
            return darts.filter(d => d.modifier === 'triple').reduce((sum, d) => sum + d.score, 0);

        case 'bull':
            // Only count darts that hit the bull (number 25)
            return darts.filter(d => d.number === 25).reduce((sum, d) => sum + d.score, 0);

        default:
            // For other contracts (capital, side, 3row, color, 57), return the total
            return darts.reduce((sum, d) => sum + d.score, 0);
    }
}

/**
 * Check if darts meet the contract requirements (for Classic mode)
 * @param {Array} darts - Array of dart objects
 * @param {string} contractId - Contract identifier
 * @returns {boolean} True if darts meet the contract requirements
 */
function checkContractRequirements(darts, contractId) {
    if (!darts || darts.length === 0) return false;

    const numbers = darts.map(d => d.number);
    const modifiers = darts.map(d => d.modifier);

    switch (contractId) {
        case 'capital':
            return true; // Capital always succeeds if darts are entered

        case 'side':
            // Must hit 3 adjacent segments
            return areAdjacent(darts[0], darts[1], darts[2]);

        case '3row':
            // Must hit 3 consecutive numbers
            return areConsecutive(numbers[0], numbers[1], numbers[2]);

        case 'color':
            // Must hit 3 different colors
            const colors = darts.map(d => getDartColor(d)).filter(c => c !== null);
            const uniqueColors = new Set(colors);
            return uniqueColors.size >= 3;

        case 'double':
            // Must hit at least one double
            return modifiers.includes('double');

        case 'triple':
            // Must hit at least one triple
            return modifiers.includes('triple');

        case '57':
            // Must score exactly 57
            const total = darts.reduce((sum, d) => sum + d.score, 0);
            return total === 57;

        case 'bull':
            // Must hit bullseye
            return numbers.includes(25);

        default:
            // For numeric contracts, check if at least one dart hit the number
            const targetNumber = parseInt(contractId);
            if (!isNaN(targetNumber)) {
                return numbers.includes(targetNumber);
            }
            return false;
    }
}

/**
 * Create a dart object
 * @param {number} number - The number hit (1-20, 25 for bull, 0 for miss)
 * @param {string} modifier - 'single', 'double', or 'triple'
 * @param {number} score - The score value of the dart
 * @returns {Object} Dart object
 */
function createDart(number, modifier = 'single', score = null) {
    if (score === null) {
        if (number === 0) {
            score = 0;
        } else if (number === 25) {
            score = modifier === 'double' ? 50 : 25;
        } else {
            const multiplier = modifier === 'triple' ? 3 : modifier === 'double' ? 2 : 1;
            score = number * multiplier;
        }
    }
    return { number, modifier, score };
}

module.exports = {
    CONTRACT_IDS,
    DART_SINGLE_COLORS,
    DART_RING_COLORS,
    DARTBOARD_SEQUENCE,
    getDartColor,
    areAdjacent,
    areConsecutive,
    getValidContracts,
    calculateContractScore,
    checkContractRequirements,
    createDart
};
