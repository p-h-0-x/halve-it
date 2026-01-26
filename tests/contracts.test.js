/**
 * Specification-based tests for Halve-It contract validation
 * Tests are written based on the game rules, not the implementation
 *
 * Game Rules Summary:
 * - Capital: First 3 darts establish starting score
 * - 20/19/18/17/16/15/14: Hit the respective segment (single, double, or triple counts)
 * - Side: Hit 3 adjacent segments. Single bull (25) touches all segments. Double bull does NOT.
 * - 3 in a Row: Hit 3 different consecutive numbers (e.g., 14-15-16). Bull doesn't count.
 * - Color: Hit 3 different colors (black, white, green, red)
 *   - Singles: black/white based on segment
 *   - Doubles/Triples: black segments have red rings, white segments have green rings
 *   - Single bull: green, Double bull: red
 * - Double: Hit any double (including double bull)
 * - Triple: Hit any triple
 * - 57: Score exactly 57 with 3 darts
 * - Bull: Hit the bullseye (single 25 or double 50)
 */

const {
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
} = require('../src/contracts');

// ============================================================================
// Helper function tests
// ============================================================================

describe('createDart helper', () => {
    test('creates a single dart with auto-calculated score', () => {
        const dart = createDart(20, 'single');
        expect(dart).toEqual({ number: 20, modifier: 'single', score: 20 });
    });

    test('creates a double dart with auto-calculated score', () => {
        const dart = createDart(20, 'double');
        expect(dart).toEqual({ number: 20, modifier: 'double', score: 40 });
    });

    test('creates a triple dart with auto-calculated score', () => {
        const dart = createDart(20, 'triple');
        expect(dart).toEqual({ number: 20, modifier: 'triple', score: 60 });
    });

    test('creates a single bull dart (25 points)', () => {
        const dart = createDart(25, 'single');
        expect(dart).toEqual({ number: 25, modifier: 'single', score: 25 });
    });

    test('creates a double bull dart (50 points)', () => {
        const dart = createDart(25, 'double');
        expect(dart).toEqual({ number: 25, modifier: 'double', score: 50 });
    });

    test('creates a miss dart (0 points)', () => {
        const dart = createDart(0, 'single');
        expect(dart).toEqual({ number: 0, modifier: 'single', score: 0 });
    });
});

// ============================================================================
// Color determination tests (per game rules)
// Rule: Singles are black/white, Doubles/Triples use ring colors (red/green)
// Black segments have red D/T rings, white segments have green D/T rings
// Single bull = green, Double bull = red
// ============================================================================

describe('getDartColor - Game Rule: Color determination', () => {
    describe('Singles use segment colors (black/white)', () => {
        test('single 20 is black', () => {
            expect(getDartColor(createDart(20, 'single'))).toBe('black');
        });

        test('single 1 is white', () => {
            expect(getDartColor(createDart(1, 'single'))).toBe('white');
        });

        test('single 19 is white', () => {
            expect(getDartColor(createDart(19, 'single'))).toBe('white');
        });

        test('single 18 is black', () => {
            expect(getDartColor(createDart(18, 'single'))).toBe('black');
        });
    });

    describe('Doubles/Triples use ring colors - black segments have red rings', () => {
        test('double 20 is red (20 is black segment)', () => {
            expect(getDartColor(createDart(20, 'double'))).toBe('red');
        });

        test('triple 20 is red (20 is black segment)', () => {
            expect(getDartColor(createDart(20, 'triple'))).toBe('red');
        });

        test('double 18 is red (18 is black segment)', () => {
            expect(getDartColor(createDart(18, 'double'))).toBe('red');
        });

        test('triple 18 is red (18 is black segment)', () => {
            expect(getDartColor(createDart(18, 'triple'))).toBe('red');
        });
    });

    describe('Doubles/Triples use ring colors - white segments have green rings', () => {
        test('double 1 is green (1 is white segment)', () => {
            expect(getDartColor(createDart(1, 'double'))).toBe('green');
        });

        test('triple 1 is green (1 is white segment)', () => {
            expect(getDartColor(createDart(1, 'triple'))).toBe('green');
        });

        test('double 19 is green (19 is white segment)', () => {
            expect(getDartColor(createDart(19, 'double'))).toBe('green');
        });

        test('triple 19 is green (19 is white segment)', () => {
            expect(getDartColor(createDart(19, 'triple'))).toBe('green');
        });
    });

    describe('Bull colors', () => {
        test('single bull (25) is green', () => {
            expect(getDartColor(createDart(25, 'single'))).toBe('green');
        });

        test('double bull (50) is red', () => {
            expect(getDartColor(createDart(25, 'double'))).toBe('red');
        });
    });

    describe('Miss has no color', () => {
        test('miss returns null', () => {
            expect(getDartColor(createDart(0, 'single'))).toBe(null);
        });
    });

    describe('Color pattern verification - all segments follow the rule', () => {
        test('all black segments have red double/triple rings', () => {
            Object.entries(DART_SINGLE_COLORS).forEach(([num, singleColor]) => {
                if (singleColor === 'black') {
                    expect(DART_RING_COLORS[num]).toBe('red');
                }
            });
        });

        test('all white segments have green double/triple rings', () => {
            Object.entries(DART_SINGLE_COLORS).forEach(([num, singleColor]) => {
                if (singleColor === 'white') {
                    expect(DART_RING_COLORS[num]).toBe('green');
                }
            });
        });
    });
});

// ============================================================================
// Side Contract Tests (areAdjacent)
// Rule: Hit 3 adjacent segments. Single bull touches all. Double bull does NOT.
// ============================================================================

describe('areAdjacent - Game Rule: Side contract (3 adjacent segments)', () => {
    describe('Adjacent segments on dartboard', () => {
        test('20-1-18 are adjacent (clockwise from top)', () => {
            const d1 = createDart(20, 'single');
            const d2 = createDart(1, 'single');
            const d3 = createDart(18, 'single');
            expect(areAdjacent(d1, d2, d3)).toBe(true);
        });

        test('5-20-1 are adjacent (wrapping around the board)', () => {
            const d1 = createDart(5, 'single');
            const d2 = createDart(20, 'single');
            const d3 = createDart(1, 'single');
            expect(areAdjacent(d1, d2, d3)).toBe(true);
        });

        test('12-5-20 are adjacent (end of sequence wrapping to start)', () => {
            const d1 = createDart(12, 'single');
            const d2 = createDart(5, 'single');
            const d3 = createDart(20, 'single');
            expect(areAdjacent(d1, d2, d3)).toBe(true);
        });

        test('doubles and triples count for adjacency', () => {
            const d1 = createDart(20, 'double');
            const d2 = createDart(1, 'triple');
            const d3 = createDart(18, 'single');
            expect(areAdjacent(d1, d2, d3)).toBe(true);
        });
    });

    describe('Non-adjacent segments', () => {
        test('1-2-3 are NOT adjacent (consecutive numbers but not adjacent on board)', () => {
            const d1 = createDart(1, 'single');
            const d2 = createDart(2, 'single');
            const d3 = createDart(3, 'single');
            expect(areAdjacent(d1, d2, d3)).toBe(false);
        });

        test('20-19-18 are NOT adjacent (consecutive numbers but not adjacent on board)', () => {
            const d1 = createDart(20, 'single');
            const d2 = createDart(19, 'single');
            const d3 = createDart(18, 'single');
            expect(areAdjacent(d1, d2, d3)).toBe(false);
        });

        test('random non-adjacent segments fail', () => {
            const d1 = createDart(20, 'single');
            const d2 = createDart(5, 'single');
            const d3 = createDart(3, 'single');
            expect(areAdjacent(d1, d2, d3)).toBe(false);
        });
    });

    describe('Single bull rule: touches all segments', () => {
        test('single bull + any 2 segments = adjacent (bull touches all)', () => {
            const bull = createDart(25, 'single');
            const d1 = createDart(5, 'single');
            const d2 = createDart(12, 'single');
            expect(areAdjacent(bull, d1, d2)).toBe(true);
        });

        test('single bull in any position makes it adjacent', () => {
            const bull = createDart(25, 'single');
            const d1 = createDart(1, 'single');
            const d2 = createDart(20, 'single');
            expect(areAdjacent(d1, bull, d2)).toBe(true);
            expect(areAdjacent(d1, d2, bull)).toBe(true);
        });
    });

    describe('Double bull rule: does NOT touch all segments', () => {
        test('double bull + 2 non-adjacent segments = NOT adjacent', () => {
            const doubleBull = createDart(25, 'double');
            const d1 = createDart(5, 'single');
            const d2 = createDart(3, 'single');
            expect(areAdjacent(doubleBull, d1, d2)).toBe(false);
        });

        test('double bull + 2 adjacent segments = NOT adjacent (need 3 segments, bull doesnt count)', () => {
            const doubleBull = createDart(25, 'double');
            const d1 = createDart(20, 'single');
            const d2 = createDart(1, 'single');
            // 20-1 are adjacent but we need 3 adjacent segments, double bull doesn't help
            expect(areAdjacent(doubleBull, d1, d2)).toBe(false);
        });

        test('double bull + single bull + any segment = adjacent (because single bull touches all)', () => {
            const doubleBull = createDart(25, 'double');
            const singleBull = createDart(25, 'single');
            const d1 = createDart(7, 'single');
            expect(areAdjacent(doubleBull, singleBull, d1)).toBe(true);
        });
    });

    describe('Miss handling', () => {
        test('miss + 2 adjacent segments = NOT adjacent (need 3 valid segments)', () => {
            const miss = createDart(0, 'single');
            const d1 = createDart(20, 'single');
            const d2 = createDart(1, 'single');
            expect(areAdjacent(miss, d1, d2)).toBe(false);
        });
    });
});

// ============================================================================
// 3 in a Row Contract Tests (areConsecutive)
// Rule: Hit 3 different consecutive numbers. Bull (25) doesn't count.
// ============================================================================

describe('areConsecutive - Game Rule: 3 in a Row contract', () => {
    describe('Valid consecutive sequences', () => {
        test('14-15-16 are consecutive', () => {
            expect(areConsecutive(14, 15, 16)).toBe(true);
        });

        test('1-2-3 are consecutive', () => {
            expect(areConsecutive(1, 2, 3)).toBe(true);
        });

        test('18-19-20 are consecutive', () => {
            expect(areConsecutive(18, 19, 20)).toBe(true);
        });

        test('order does not matter - 16-14-15 are consecutive', () => {
            expect(areConsecutive(16, 14, 15)).toBe(true);
        });

        test('order does not matter - 3-1-2 are consecutive', () => {
            expect(areConsecutive(3, 1, 2)).toBe(true);
        });
    });

    describe('Invalid sequences', () => {
        test('1-2-4 are NOT consecutive (gap)', () => {
            expect(areConsecutive(1, 2, 4)).toBe(false);
        });

        test('10-12-14 are NOT consecutive (even numbers with gaps)', () => {
            expect(areConsecutive(10, 12, 14)).toBe(false);
        });
    });

    describe('Must be 3 DIFFERENT numbers', () => {
        test('14-14-15 are NOT consecutive (duplicate)', () => {
            expect(areConsecutive(14, 14, 15)).toBe(false);
        });

        test('5-5-5 are NOT consecutive (all same)', () => {
            expect(areConsecutive(5, 5, 5)).toBe(false);
        });

        test('1-1-2 are NOT consecutive (duplicate)', () => {
            expect(areConsecutive(1, 1, 2)).toBe(false);
        });
    });

    describe('Bull (25) does not count', () => {
        test('24-25-26 is NOT valid (25 is bull, not a segment number)', () => {
            // Even though 24-25-26 looks consecutive, 25 is bull
            expect(areConsecutive(24, 25, 26)).toBe(false);
        });

        test('bull with any 2 numbers is NOT consecutive', () => {
            expect(areConsecutive(25, 1, 2)).toBe(false);
        });
    });

    describe('Miss (0) does not count', () => {
        test('0-1-2 is NOT valid (need 3 valid numbers)', () => {
            expect(areConsecutive(0, 1, 2)).toBe(false);
        });
    });

    describe('Modifiers do not matter - checking with darts', () => {
        test('single 14 + double 15 + triple 16 = valid consecutive', () => {
            const darts = [
                createDart(14, 'single'),
                createDart(15, 'double'),
                createDart(16, 'triple')
            ];
            expect(areConsecutive(darts[0].number, darts[1].number, darts[2].number)).toBe(true);
        });
    });
});

// ============================================================================
// Contract Requirements Tests - Classic Mode
// ============================================================================

describe('checkContractRequirements - Classic Mode', () => {
    describe('Capital contract: First 3 darts establish starting score', () => {
        test('any darts pass the capital contract', () => {
            const darts = [createDart(5, 'single'), createDart(10, 'single'), createDart(3, 'single')];
            expect(checkContractRequirements(darts, 'capital')).toBe(true);
        });

        test('even all misses pass capital (establishes 0 as starting score)', () => {
            const darts = [createDart(0, 'single'), createDart(0, 'single'), createDart(0, 'single')];
            expect(checkContractRequirements(darts, 'capital')).toBe(true);
        });

        test('empty darts array fails', () => {
            expect(checkContractRequirements([], 'capital')).toBe(false);
        });

        test('null/undefined fails', () => {
            expect(checkContractRequirements(null, 'capital')).toBe(false);
            expect(checkContractRequirements(undefined, 'capital')).toBe(false);
        });
    });

    describe('Numeric contracts (20, 19, 18, 17, 16, 15, 14): Hit the segment', () => {
        const numericContracts = ['20', '19', '18', '17', '16', '15', '14'];

        numericContracts.forEach(contractId => {
            const num = parseInt(contractId);

            describe(`Contract ${contractId}: Hit the ${num} segment`, () => {
                test(`single ${num} passes`, () => {
                    const darts = [createDart(num, 'single'), createDart(5, 'single'), createDart(3, 'single')];
                    expect(checkContractRequirements(darts, contractId)).toBe(true);
                });

                test(`double ${num} passes (doubles count as hitting the segment)`, () => {
                    const darts = [createDart(num, 'double'), createDart(5, 'single'), createDart(3, 'single')];
                    expect(checkContractRequirements(darts, contractId)).toBe(true);
                });

                test(`triple ${num} passes (triples count as hitting the segment)`, () => {
                    const darts = [createDart(num, 'triple'), createDart(5, 'single'), createDart(3, 'single')];
                    expect(checkContractRequirements(darts, contractId)).toBe(true);
                });

                test(`not hitting ${num} fails`, () => {
                    const other1 = num === 1 ? 2 : 1;
                    const other2 = num === 3 ? 4 : 3;
                    const other3 = num === 5 ? 6 : 5;
                    const darts = [createDart(other1, 'single'), createDart(other2, 'single'), createDart(other3, 'single')];
                    expect(checkContractRequirements(darts, contractId)).toBe(false);
                });
            });
        });
    });

    describe('Side contract: Hit 3 adjacent segments', () => {
        test('passes with 20-1-18 (adjacent on board)', () => {
            const darts = [createDart(20, 'single'), createDart(1, 'single'), createDart(18, 'single')];
            expect(checkContractRequirements(darts, 'side')).toBe(true);
        });

        test('passes with single bull (touches all segments)', () => {
            const darts = [createDart(25, 'single'), createDart(5, 'single'), createDart(12, 'single')];
            expect(checkContractRequirements(darts, 'side')).toBe(true);
        });

        test('fails with non-adjacent numbers', () => {
            const darts = [createDart(20, 'single'), createDart(5, 'single'), createDart(3, 'single')];
            expect(checkContractRequirements(darts, 'side')).toBe(false);
        });

        test('fails with double bull and non-adjacent (double bull does NOT touch all)', () => {
            const darts = [createDart(25, 'double'), createDart(5, 'single'), createDart(3, 'single')];
            expect(checkContractRequirements(darts, 'side')).toBe(false);
        });

        test('passes with double bull + single bull + any (single bull saves it)', () => {
            const darts = [createDart(25, 'double'), createDart(25, 'single'), createDart(7, 'single')];
            expect(checkContractRequirements(darts, 'side')).toBe(true);
        });
    });

    describe('3 in a Row contract: Hit 3 different consecutive numbers', () => {
        test('passes with 14-15-16', () => {
            const darts = [createDart(14, 'single'), createDart(15, 'single'), createDart(16, 'single')];
            expect(checkContractRequirements(darts, '3row')).toBe(true);
        });

        test('passes with 18-19-20', () => {
            const darts = [createDart(18, 'single'), createDart(19, 'single'), createDart(20, 'single')];
            expect(checkContractRequirements(darts, '3row')).toBe(true);
        });

        test('passes regardless of order (16-14-15)', () => {
            const darts = [createDart(16, 'single'), createDart(14, 'single'), createDart(15, 'single')];
            expect(checkContractRequirements(darts, '3row')).toBe(true);
        });

        test('passes with mixed modifiers (single 14 + double 15 + triple 16)', () => {
            const darts = [createDart(14, 'single'), createDart(15, 'double'), createDart(16, 'triple')];
            expect(checkContractRequirements(darts, '3row')).toBe(true);
        });

        test('fails with non-consecutive numbers', () => {
            const darts = [createDart(1, 'single'), createDart(3, 'single'), createDart(5, 'single')];
            expect(checkContractRequirements(darts, '3row')).toBe(false);
        });

        test('fails with duplicate numbers (14-14-15 is only 2 different numbers)', () => {
            const darts = [createDart(14, 'single'), createDart(14, 'double'), createDart(15, 'single')];
            expect(checkContractRequirements(darts, '3row')).toBe(false);
        });

        test('fails with bull included (bull is not a segment number)', () => {
            const darts = [createDart(25, 'single'), createDart(1, 'single'), createDart(2, 'single')];
            expect(checkContractRequirements(darts, '3row')).toBe(false);
        });
    });

    describe('Color contract: Hit 3 different colors', () => {
        test('passes with black + white + red', () => {
            const darts = [
                createDart(20, 'single'),  // black
                createDart(1, 'single'),   // white
                createDart(20, 'double')   // red (black segment has red ring)
            ];
            expect(checkContractRequirements(darts, 'color')).toBe(true);
        });

        test('passes with black + white + green', () => {
            const darts = [
                createDart(20, 'single'),  // black
                createDart(1, 'single'),   // white
                createDart(1, 'double')    // green (white segment has green ring)
            ];
            expect(checkContractRequirements(darts, 'color')).toBe(true);
        });

        test('passes with red + green + black', () => {
            const darts = [
                createDart(20, 'double'),  // red
                createDart(1, 'triple'),   // green
                createDart(18, 'single')   // black
            ];
            expect(checkContractRequirements(darts, 'color')).toBe(true);
        });

        test('passes with single bull (green) + double bull (red) + single (black/white)', () => {
            const darts = [
                createDart(25, 'single'),  // green
                createDart(25, 'double'),  // red
                createDart(20, 'single')   // black
            ];
            expect(checkContractRequirements(darts, 'color')).toBe(true);
        });

        test('fails with only 2 colors', () => {
            const darts = [
                createDart(20, 'single'),  // black
                createDart(18, 'single'),  // black
                createDart(1, 'single')    // white
            ];
            expect(checkContractRequirements(darts, 'color')).toBe(false);
        });

        test('fails with all same color', () => {
            const darts = [
                createDart(20, 'single'),  // black
                createDart(18, 'single'),  // black
                createDart(2, 'single')    // black
            ];
            expect(checkContractRequirements(darts, 'color')).toBe(false);
        });

        test('fails with miss included (miss has no color)', () => {
            const darts = [
                createDart(0, 'single'),   // null (miss)
                createDart(20, 'single'),  // black
                createDart(1, 'single')    // white
            ];
            expect(checkContractRequirements(darts, 'color')).toBe(false);
        });
    });

    describe('Double contract: Hit any double', () => {
        test('passes with one double', () => {
            const darts = [createDart(20, 'double'), createDart(5, 'single'), createDart(3, 'single')];
            expect(checkContractRequirements(darts, 'double')).toBe(true);
        });

        test('passes with double bull (double bull counts as a double)', () => {
            const darts = [createDart(25, 'double'), createDart(5, 'single'), createDart(3, 'single')];
            expect(checkContractRequirements(darts, 'double')).toBe(true);
        });

        test('passes with multiple doubles', () => {
            const darts = [createDart(20, 'double'), createDart(10, 'double'), createDart(5, 'double')];
            expect(checkContractRequirements(darts, 'double')).toBe(true);
        });

        test('fails with no doubles (only singles and triples)', () => {
            const darts = [createDart(20, 'single'), createDart(20, 'triple'), createDart(5, 'single')];
            expect(checkContractRequirements(darts, 'double')).toBe(false);
        });
    });

    describe('Triple contract: Hit any triple', () => {
        test('passes with one triple', () => {
            const darts = [createDart(20, 'triple'), createDart(5, 'single'), createDart(3, 'single')];
            expect(checkContractRequirements(darts, 'triple')).toBe(true);
        });

        test('passes with multiple triples', () => {
            const darts = [createDart(20, 'triple'), createDart(19, 'triple'), createDart(18, 'triple')];
            expect(checkContractRequirements(darts, 'triple')).toBe(true);
        });

        test('fails with no triples', () => {
            const darts = [createDart(20, 'single'), createDart(20, 'double'), createDart(5, 'single')];
            expect(checkContractRequirements(darts, 'triple')).toBe(false);
        });

        test('bull cannot be a triple (only single or double)', () => {
            const darts = [createDart(25, 'single'), createDart(25, 'double'), createDart(5, 'single')];
            expect(checkContractRequirements(darts, 'triple')).toBe(false);
        });
    });

    describe('57 contract: Score exactly 57 with 3 darts', () => {
        test('passes with exactly 57 (20 + 20 + 17)', () => {
            const darts = [createDart(20, 'single'), createDart(20, 'single'), createDart(17, 'single')];
            expect(checkContractRequirements(darts, '57')).toBe(true);
        });

        test('passes with exactly 57 (19 + 19 + 19)', () => {
            const darts = [createDart(19, 'single'), createDart(19, 'single'), createDart(19, 'single')];
            expect(checkContractRequirements(darts, '57')).toBe(true);
        });

        test('passes with 57 using mixed modifiers (triple 19 = 57)', () => {
            const darts = [createDart(19, 'triple'), createDart(0, 'single'), createDart(0, 'single')];
            expect(checkContractRequirements(darts, '57')).toBe(true);
        });

        test('fails with less than 57', () => {
            const darts = [createDart(20, 'single'), createDart(20, 'single'), createDart(16, 'single')];
            expect(checkContractRequirements(darts, '57')).toBe(false);
        });

        test('fails with more than 57', () => {
            const darts = [createDart(20, 'single'), createDart(20, 'single'), createDart(18, 'single')];
            expect(checkContractRequirements(darts, '57')).toBe(false);
        });
    });

    describe('Bull contract: Hit the bullseye (single 25 or double 50)', () => {
        test('passes with single bull (25)', () => {
            const darts = [createDart(25, 'single'), createDart(5, 'single'), createDart(3, 'single')];
            expect(checkContractRequirements(darts, 'bull')).toBe(true);
        });

        test('passes with double bull (50)', () => {
            const darts = [createDart(25, 'double'), createDart(5, 'single'), createDart(3, 'single')];
            expect(checkContractRequirements(darts, 'bull')).toBe(true);
        });

        test('passes with multiple bulls', () => {
            const darts = [createDart(25, 'single'), createDart(25, 'double'), createDart(25, 'single')];
            expect(checkContractRequirements(darts, 'bull')).toBe(true);
        });

        test('fails with no bull hit', () => {
            const darts = [createDart(20, 'single'), createDart(19, 'single'), createDart(18, 'single')];
            expect(checkContractRequirements(darts, 'bull')).toBe(false);
        });
    });
});

// ============================================================================
// Valid Contracts Tests - Yahtzee Mode
// ============================================================================

describe('getValidContracts - Yahtzee Mode', () => {
    test('returns empty array for empty darts', () => {
        expect(getValidContracts([])).toEqual([]);
        expect(getValidContracts(null)).toEqual([]);
        expect(getValidContracts(undefined)).toEqual([]);
    });

    test('capital is always valid', () => {
        const darts = [createDart(1, 'single'), createDart(2, 'single'), createDart(3, 'single')];
        expect(getValidContracts(darts)).toContain('capital');
    });

    test('returns all applicable numeric contracts', () => {
        const darts = [createDart(20, 'single'), createDart(19, 'single'), createDart(18, 'single')];
        const valid = getValidContracts(darts);
        expect(valid).toContain('20');
        expect(valid).toContain('19');
        expect(valid).toContain('18');
        expect(valid).not.toContain('17');
        expect(valid).not.toContain('16');
    });

    test('returns side when darts are adjacent', () => {
        const darts = [createDart(20, 'single'), createDart(1, 'single'), createDart(18, 'single')];
        expect(getValidContracts(darts)).toContain('side');
    });

    test('returns 3row when numbers are consecutive', () => {
        const darts = [createDart(14, 'single'), createDart(15, 'single'), createDart(16, 'single')];
        expect(getValidContracts(darts)).toContain('3row');
    });

    test('returns color when 3 different colors', () => {
        const darts = [
            createDart(20, 'single'),  // black
            createDart(1, 'single'),   // white
            createDart(20, 'double')   // red
        ];
        expect(getValidContracts(darts)).toContain('color');
    });

    test('returns double when any double hit', () => {
        const darts = [createDart(20, 'double'), createDart(5, 'single'), createDart(3, 'single')];
        expect(getValidContracts(darts)).toContain('double');
    });

    test('returns triple when any triple hit', () => {
        const darts = [createDart(20, 'triple'), createDart(5, 'single'), createDart(3, 'single')];
        expect(getValidContracts(darts)).toContain('triple');
    });

    test('returns 57 when total is exactly 57', () => {
        const darts = [createDart(19, 'single'), createDart(19, 'single'), createDart(19, 'single')];
        expect(getValidContracts(darts)).toContain('57');
    });

    test('returns bull when bullseye hit', () => {
        const darts = [createDart(25, 'single'), createDart(5, 'single'), createDart(3, 'single')];
        expect(getValidContracts(darts)).toContain('bull');
    });

    test('comprehensive example: triple 20 + single 19 + double 18', () => {
        const darts = [
            createDart(20, 'triple'),   // 60 points, red color
            createDart(19, 'single'),   // 19 points, white color
            createDart(18, 'double')    // 36 points, red color
        ];
        const valid = getValidContracts(darts);

        // Should be valid for:
        expect(valid).toContain('capital');   // Always valid
        expect(valid).toContain('20');        // Hit 20
        expect(valid).toContain('19');        // Hit 19
        expect(valid).toContain('18');        // Hit 18
        expect(valid).toContain('3row');      // 18-19-20 consecutive
        expect(valid).toContain('triple');    // Has triple
        expect(valid).toContain('double');    // Has double

        // Should NOT be valid for:
        expect(valid).not.toContain('color'); // Only 2 colors (red, white, red)
        expect(valid).not.toContain('57');    // Total is 60+19+36=115
        expect(valid).not.toContain('bull');  // No bull hit
        expect(valid).not.toContain('side');  // 20, 19, 18 not adjacent on board
    });
});

// ============================================================================
// Score Calculation Tests
// ============================================================================

describe('calculateContractScore', () => {
    test('returns 0 for empty darts', () => {
        expect(calculateContractScore([], 'capital')).toBe(0);
        expect(calculateContractScore(null, 'capital')).toBe(0);
        expect(calculateContractScore(undefined, 'capital')).toBe(0);
    });

    describe('Capital, Side, 3row, Color, 57 - return total score of all darts', () => {
        const totalContracts = ['capital', 'side', '3row', 'color', '57'];

        totalContracts.forEach(contractId => {
            test(`${contractId} returns total of all darts`, () => {
                const darts = [createDart(20, 'single'), createDart(19, 'single'), createDart(18, 'single')];
                // 20 + 19 + 18 = 57
                expect(calculateContractScore(darts, contractId)).toBe(57);
            });
        });
    });

    describe('Numeric contracts - only count darts hitting that number', () => {
        test('20 contract only counts 20s', () => {
            const darts = [createDart(20, 'single'), createDart(20, 'double'), createDart(19, 'single')];
            // 20 + 40 = 60 (19 not counted)
            expect(calculateContractScore(darts, '20')).toBe(60);
        });

        test('19 contract only counts 19s', () => {
            const darts = [createDart(20, 'single'), createDart(19, 'double'), createDart(19, 'single')];
            // 38 + 19 = 57 (20 not counted)
            expect(calculateContractScore(darts, '19')).toBe(57);
        });

        test('returns 0 if no matching numbers', () => {
            const darts = [createDart(1, 'single'), createDart(2, 'single'), createDart(3, 'single')];
            expect(calculateContractScore(darts, '20')).toBe(0);
        });
    });

    describe('Double contract - only count doubles', () => {
        test('only counts doubles', () => {
            const darts = [createDart(20, 'double'), createDart(19, 'single'), createDart(10, 'double')];
            // 40 + 20 = 60 (19 single not counted)
            expect(calculateContractScore(darts, 'double')).toBe(60);
        });

        test('counts double bull', () => {
            const darts = [createDart(25, 'double'), createDart(20, 'single'), createDart(1, 'single')];
            expect(calculateContractScore(darts, 'double')).toBe(50);
        });

        test('returns 0 if no doubles', () => {
            const darts = [createDart(20, 'single'), createDart(20, 'triple'), createDart(1, 'single')];
            expect(calculateContractScore(darts, 'double')).toBe(0);
        });
    });

    describe('Triple contract - only count triples', () => {
        test('only counts triples', () => {
            const darts = [createDart(20, 'triple'), createDart(19, 'single'), createDart(18, 'triple')];
            // 60 + 54 = 114 (19 single not counted)
            expect(calculateContractScore(darts, 'triple')).toBe(114);
        });

        test('returns 0 if no triples', () => {
            const darts = [createDart(20, 'single'), createDart(20, 'double'), createDart(1, 'single')];
            expect(calculateContractScore(darts, 'triple')).toBe(0);
        });
    });

    describe('Bull contract - only count bulls', () => {
        test('only counts bulls', () => {
            const darts = [createDart(25, 'single'), createDart(25, 'double'), createDart(20, 'single')];
            // 25 + 50 = 75 (20 not counted)
            expect(calculateContractScore(darts, 'bull')).toBe(75);
        });

        test('returns 0 if no bulls', () => {
            const darts = [createDart(20, 'single'), createDart(19, 'single'), createDart(18, 'single')];
            expect(calculateContractScore(darts, 'bull')).toBe(0);
        });
    });
});

// ============================================================================
// Constants Validation
// ============================================================================

describe('Constants', () => {
    test('CONTRACT_IDS contains all 15 contracts in order', () => {
        expect(CONTRACT_IDS).toEqual([
            'capital', '20', 'side', '19', '3row', '18', 'color', '17',
            'double', '16', 'triple', '15', '57', '14', 'bull'
        ]);
        expect(CONTRACT_IDS.length).toBe(15);
    });

    test('DARTBOARD_SEQUENCE contains all 20 numbers in clockwise order', () => {
        expect(DARTBOARD_SEQUENCE).toEqual([20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5]);
        expect(DARTBOARD_SEQUENCE.length).toBe(20);
    });

    test('DART_SINGLE_COLORS has all 20 segments with alternating black/white', () => {
        expect(Object.keys(DART_SINGLE_COLORS).length).toBe(20);
        const colors = Object.values(DART_SINGLE_COLORS);
        expect(colors.filter(c => c === 'black').length).toBe(10);
        expect(colors.filter(c => c === 'white').length).toBe(10);
    });

    test('DART_RING_COLORS has all 20 segments with alternating red/green', () => {
        expect(Object.keys(DART_RING_COLORS).length).toBe(20);
        const colors = Object.values(DART_RING_COLORS);
        expect(colors.filter(c => c === 'red').length).toBe(10);
        expect(colors.filter(c => c === 'green').length).toBe(10);
    });
});

// ============================================================================
// Edge Cases and Game Scenarios
// ============================================================================

describe('Edge cases and game scenarios', () => {
    test('maximum possible score (180 - three triple 20s)', () => {
        const darts = [createDart(20, 'triple'), createDart(20, 'triple'), createDart(20, 'triple')];
        expect(calculateContractScore(darts, 'capital')).toBe(180);
    });

    test('minimum possible score (0 - all misses)', () => {
        const darts = [createDart(0, 'single'), createDart(0, 'single'), createDart(0, 'single')];
        expect(calculateContractScore(darts, 'capital')).toBe(0);
    });

    test('all bulls maximum (3x double bull = 150)', () => {
        const darts = [createDart(25, 'double'), createDart(25, 'double'), createDart(25, 'double')];
        expect(calculateContractScore(darts, 'bull')).toBe(150);
    });

    describe('Classic mode game simulation', () => {
        test('hitting 20s contract with triple, double, and single', () => {
            const darts = [createDart(20, 'triple'), createDart(20, 'double'), createDart(5, 'single')];

            // Check requirements
            expect(checkContractRequirements(darts, '20')).toBe(true);

            // Calculate score (only 20s count)
            expect(calculateContractScore(darts, '20')).toBe(100); // 60 + 40
        });

        test('missing the 20s contract (no 20 hit)', () => {
            const darts = [createDart(19, 'triple'), createDart(18, 'double'), createDart(5, 'single')];

            expect(checkContractRequirements(darts, '20')).toBe(false);
            expect(calculateContractScore(darts, '20')).toBe(0);
        });
    });

    describe('Color contract with different combinations', () => {
        test('single (black) + single (white) + double (red) = 3 colors', () => {
            const darts = [
                createDart(20, 'single'),  // black
                createDart(1, 'single'),   // white
                createDart(3, 'double')    // red (3 is black, so ring is red)
            ];
            expect(checkContractRequirements(darts, 'color')).toBe(true);
        });

        test('single (black) + triple (green) + double (red) = 3 colors', () => {
            const darts = [
                createDart(20, 'single'),  // black
                createDart(1, 'triple'),   // green (1 is white, so ring is green)
                createDart(3, 'double')    // red
            ];
            expect(checkContractRequirements(darts, 'color')).toBe(true);
        });

        test('single bull (green) + double bull (red) + single (white) = 3 colors', () => {
            const darts = [
                createDart(25, 'single'),  // green
                createDart(25, 'double'),  // red
                createDart(1, 'single')    // white
            ];
            expect(checkContractRequirements(darts, 'color')).toBe(true);
        });

        test('4 colors available but only need 3', () => {
            // This isn't possible with 3 darts, but the rule only requires 3 different colors
            const darts = [
                createDart(20, 'single'),  // black
                createDart(1, 'single'),   // white
                createDart(25, 'single')   // green
            ];
            expect(checkContractRequirements(darts, 'color')).toBe(true);
        });
    });
});
