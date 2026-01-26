/**
 * Comprehensive tests for Halve-It contract validation
 * Tests both Classic and Yahtzee game modes
 */

const {
    CONTRACT_IDS,
    DART_SINGLE_COLORS,
    DART_RING_COLORS,
    DARTBOARD_SEQUENCE,
    VALIDATION_RULES,
    getDartColor,
    areAdjacent,
    areConsecutive,
    getValidContracts,
    calculateContractScore,
    checkContractRequirements,
    validateScore,
    getValidationRule,
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

    test('creates a single bull dart', () => {
        const dart = createDart(25, 'single');
        expect(dart).toEqual({ number: 25, modifier: 'single', score: 25 });
    });

    test('creates a double bull dart', () => {
        const dart = createDart(25, 'double');
        expect(dart).toEqual({ number: 25, modifier: 'double', score: 50 });
    });

    test('creates a miss dart', () => {
        const dart = createDart(0, 'single');
        expect(dart).toEqual({ number: 0, modifier: 'single', score: 0 });
    });

    test('allows manual score override', () => {
        const dart = createDart(20, 'single', 100);
        expect(dart).toEqual({ number: 20, modifier: 'single', score: 100 });
    });
});

describe('getDartColor', () => {
    describe('single darts (black/white)', () => {
        test('single 20 returns black', () => {
            expect(getDartColor(createDart(20, 'single'))).toBe('black');
        });

        test('single 1 returns white', () => {
            expect(getDartColor(createDart(1, 'single'))).toBe('white');
        });

        test('single 18 returns black', () => {
            expect(getDartColor(createDart(18, 'single'))).toBe('black');
        });

        test('single 19 returns white', () => {
            expect(getDartColor(createDart(19, 'single'))).toBe('white');
        });

        test('all singles have correct colors', () => {
            Object.entries(DART_SINGLE_COLORS).forEach(([num, color]) => {
                expect(getDartColor(createDart(parseInt(num), 'single'))).toBe(color);
            });
        });
    });

    describe('double darts (red/green)', () => {
        test('double 20 returns red', () => {
            expect(getDartColor(createDart(20, 'double'))).toBe('red');
        });

        test('double 1 returns green', () => {
            expect(getDartColor(createDart(1, 'double'))).toBe('green');
        });

        test('double 18 returns red', () => {
            expect(getDartColor(createDart(18, 'double'))).toBe('red');
        });

        test('double 19 returns green', () => {
            expect(getDartColor(createDart(19, 'double'))).toBe('green');
        });

        test('all doubles have correct colors', () => {
            Object.entries(DART_RING_COLORS).forEach(([num, color]) => {
                expect(getDartColor(createDart(parseInt(num), 'double'))).toBe(color);
            });
        });
    });

    describe('triple darts (red/green)', () => {
        test('triple 20 returns red', () => {
            expect(getDartColor(createDart(20, 'triple'))).toBe('red');
        });

        test('triple 1 returns green', () => {
            expect(getDartColor(createDart(1, 'triple'))).toBe('green');
        });

        test('all triples have correct colors', () => {
            Object.entries(DART_RING_COLORS).forEach(([num, color]) => {
                expect(getDartColor(createDart(parseInt(num), 'triple'))).toBe(color);
            });
        });
    });

    describe('bull darts', () => {
        test('single bull returns green', () => {
            expect(getDartColor(createDart(25, 'single'))).toBe('green');
        });

        test('double bull returns red', () => {
            expect(getDartColor(createDart(25, 'double'))).toBe('red');
        });
    });

    describe('miss', () => {
        test('miss returns null', () => {
            expect(getDartColor(createDart(0, 'single'))).toBe(null);
        });
    });
});

describe('areAdjacent', () => {
    test('20-1-18 are adjacent (clockwise sequence)', () => {
        const d1 = createDart(20, 'single');
        const d2 = createDart(1, 'single');
        const d3 = createDart(18, 'single');
        expect(areAdjacent(d1, d2, d3)).toBe(true);
    });

    test('5-20-1 are adjacent (wrapping around)', () => {
        const d1 = createDart(5, 'single');
        const d2 = createDart(20, 'single');
        const d3 = createDart(1, 'single');
        expect(areAdjacent(d1, d2, d3)).toBe(true);
    });

    test('12-5-20 are adjacent (wrapping at end)', () => {
        const d1 = createDart(12, 'single');
        const d2 = createDart(5, 'single');
        const d3 = createDart(20, 'single');
        expect(areAdjacent(d1, d2, d3)).toBe(true);
    });

    test('1-2-3 are NOT adjacent (consecutive but not adjacent on board)', () => {
        const d1 = createDart(1, 'single');
        const d2 = createDart(2, 'single');
        const d3 = createDart(3, 'single');
        expect(areAdjacent(d1, d2, d3)).toBe(false);
    });

    test('single bull is adjacent to everything', () => {
        const bull = createDart(25, 'single');
        const d1 = createDart(1, 'single');
        const d2 = createDart(2, 'single');
        expect(areAdjacent(bull, d1, d2)).toBe(true);
    });

    test('double bull is NOT adjacent to everything', () => {
        const doubleBull = createDart(25, 'double');
        const d1 = createDart(1, 'single');
        const d2 = createDart(2, 'single');
        expect(areAdjacent(doubleBull, d1, d2)).toBe(false);
    });

    test('doubles and triples work for adjacency', () => {
        const d1 = createDart(20, 'double');
        const d2 = createDart(1, 'triple');
        const d3 = createDart(18, 'single');
        expect(areAdjacent(d1, d2, d3)).toBe(true);
    });

    test('misses are handled - not enough valid numbers', () => {
        const d1 = createDart(0, 'single');
        const d2 = createDart(20, 'single');
        const d3 = createDart(1, 'single');
        expect(areAdjacent(d1, d2, d3)).toBe(false);
    });
});

describe('areConsecutive', () => {
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

    test('1-2-4 are NOT consecutive', () => {
        expect(areConsecutive(1, 2, 4)).toBe(false);
    });

    test('1-1-2 are NOT consecutive (duplicates)', () => {
        expect(areConsecutive(1, 1, 2)).toBe(false);
    });

    test('bull (25) is ignored', () => {
        expect(areConsecutive(25, 1, 2)).toBe(false);
    });

    test('miss (0) is ignored', () => {
        expect(areConsecutive(0, 1, 2)).toBe(false);
    });

    test('handles undefined/NaN values', () => {
        expect(areConsecutive(undefined, 1, 2)).toBe(false);
        expect(areConsecutive(NaN, 1, 2)).toBe(false);
    });
});

// ============================================================================
// Contract requirement tests (Classic mode)
// ============================================================================

describe('checkContractRequirements - Classic Mode', () => {
    describe('capital contract', () => {
        test('always passes with any darts', () => {
            const darts = [createDart(5, 'single'), createDart(10, 'single'), createDart(3, 'single')];
            expect(checkContractRequirements(darts, 'capital')).toBe(true);
        });

        test('passes even with all misses', () => {
            const darts = [createDart(0, 'single'), createDart(0, 'single'), createDart(0, 'single')];
            expect(checkContractRequirements(darts, 'capital')).toBe(true);
        });

        test('fails with empty darts array', () => {
            expect(checkContractRequirements([], 'capital')).toBe(false);
        });

        test('fails with null/undefined', () => {
            expect(checkContractRequirements(null, 'capital')).toBe(false);
            expect(checkContractRequirements(undefined, 'capital')).toBe(false);
        });
    });

    describe('numeric contracts (20, 19, 18, 17, 16, 15, 14)', () => {
        const numericContracts = ['20', '19', '18', '17', '16', '15', '14'];

        numericContracts.forEach(contractId => {
            const num = parseInt(contractId);

            describe(`contract ${contractId}`, () => {
                test(`passes when hitting single ${num}`, () => {
                    const darts = [createDart(num, 'single'), createDart(5, 'single'), createDart(3, 'single')];
                    expect(checkContractRequirements(darts, contractId)).toBe(true);
                });

                test(`passes when hitting double ${num}`, () => {
                    const darts = [createDart(num, 'double'), createDart(5, 'single'), createDart(3, 'single')];
                    expect(checkContractRequirements(darts, contractId)).toBe(true);
                });

                test(`passes when hitting triple ${num}`, () => {
                    const darts = [createDart(num, 'triple'), createDart(5, 'single'), createDart(3, 'single')];
                    expect(checkContractRequirements(darts, contractId)).toBe(true);
                });

                test(`fails when not hitting ${num}`, () => {
                    // Use numbers that won't match any numeric contract being tested
                    const other1 = num === 1 ? 2 : 1;
                    const other2 = num === 3 ? 4 : 3;
                    const other3 = num === 5 ? 6 : 5;
                    const darts = [createDart(other1, 'single'), createDart(other2, 'single'), createDart(other3, 'single')];
                    expect(checkContractRequirements(darts, contractId)).toBe(false);
                });
            });
        });
    });

    describe('side contract (3 adjacent)', () => {
        test('passes with 20-1-18', () => {
            const darts = [createDart(20, 'single'), createDart(1, 'single'), createDart(18, 'single')];
            expect(checkContractRequirements(darts, 'side')).toBe(true);
        });

        test('passes with single bull (adjacent to all)', () => {
            const darts = [createDart(25, 'single'), createDart(5, 'single'), createDart(12, 'single')];
            expect(checkContractRequirements(darts, 'side')).toBe(true);
        });

        test('fails with non-adjacent numbers', () => {
            const darts = [createDart(20, 'single'), createDart(5, 'single'), createDart(3, 'single')];
            expect(checkContractRequirements(darts, 'side')).toBe(false);
        });

        test('fails with double bull (not adjacent to all)', () => {
            const darts = [createDart(25, 'double'), createDart(5, 'single'), createDart(3, 'single')];
            expect(checkContractRequirements(darts, 'side')).toBe(false);
        });
    });

    describe('3row contract (3 consecutive)', () => {
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

        test('fails with non-consecutive numbers', () => {
            const darts = [createDart(1, 'single'), createDart(3, 'single'), createDart(5, 'single')];
            expect(checkContractRequirements(darts, '3row')).toBe(false);
        });

        test('fails with bull included', () => {
            const darts = [createDart(25, 'single'), createDart(1, 'single'), createDart(2, 'single')];
            expect(checkContractRequirements(darts, '3row')).toBe(false);
        });
    });

    describe('color contract (3 different colors)', () => {
        test('passes with black, white, red', () => {
            const darts = [
                createDart(20, 'single'),  // black
                createDart(1, 'single'),   // white
                createDart(20, 'double')   // red
            ];
            expect(checkContractRequirements(darts, 'color')).toBe(true);
        });

        test('passes with black, white, green', () => {
            const darts = [
                createDart(20, 'single'),  // black
                createDart(1, 'single'),   // white
                createDart(1, 'double')    // green
            ];
            expect(checkContractRequirements(darts, 'color')).toBe(true);
        });

        test('passes with red, green, black', () => {
            const darts = [
                createDart(20, 'double'),  // red
                createDart(1, 'triple'),   // green
                createDart(18, 'single')   // black
            ];
            expect(checkContractRequirements(darts, 'color')).toBe(true);
        });

        test('passes with single bull (green), double bull (red), and single', () => {
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

        test('fails with miss included (only 2 valid colors)', () => {
            const darts = [
                createDart(0, 'single'),   // null (miss)
                createDart(20, 'single'),  // black
                createDart(1, 'single')    // white
            ];
            expect(checkContractRequirements(darts, 'color')).toBe(false);
        });
    });

    describe('double contract', () => {
        test('passes with one double', () => {
            const darts = [createDart(20, 'double'), createDart(5, 'single'), createDart(3, 'single')];
            expect(checkContractRequirements(darts, 'double')).toBe(true);
        });

        test('passes with double bull', () => {
            const darts = [createDart(25, 'double'), createDart(5, 'single'), createDart(3, 'single')];
            expect(checkContractRequirements(darts, 'double')).toBe(true);
        });

        test('passes with multiple doubles', () => {
            const darts = [createDart(20, 'double'), createDart(10, 'double'), createDart(5, 'double')];
            expect(checkContractRequirements(darts, 'double')).toBe(true);
        });

        test('fails with no doubles', () => {
            const darts = [createDart(20, 'single'), createDart(20, 'triple'), createDart(5, 'single')];
            expect(checkContractRequirements(darts, 'double')).toBe(false);
        });
    });

    describe('triple contract', () => {
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

        test('bull cannot be a triple', () => {
            // Even though we pass triple, bull only has single and double
            const darts = [createDart(25, 'single'), createDart(20, 'single'), createDart(5, 'single')];
            expect(checkContractRequirements(darts, 'triple')).toBe(false);
        });
    });

    describe('57 contract', () => {
        test('passes with exactly 57', () => {
            // 20 + 20 + 17 = 57
            const darts = [createDart(20, 'single'), createDart(20, 'single'), createDart(17, 'single')];
            expect(checkContractRequirements(darts, '57')).toBe(true);
        });

        test('passes with 57 using mixed modifiers', () => {
            // 19 + 19 + 19 = 57
            const darts = [createDart(19, 'single'), createDart(19, 'single'), createDart(19, 'single')];
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

    describe('bull contract', () => {
        test('passes with single bull', () => {
            const darts = [createDart(25, 'single'), createDart(5, 'single'), createDart(3, 'single')];
            expect(checkContractRequirements(darts, 'bull')).toBe(true);
        });

        test('passes with double bull', () => {
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
// Valid contracts tests (Yahtzee mode)
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

    test('comprehensive example: triple 19s score 57 and qualify for multiple contracts', () => {
        const darts = [createDart(19, 'triple'), createDart(19, 'triple'), createDart(19, 'triple')];
        const valid = getValidContracts(darts);
        expect(valid).toContain('capital');
        expect(valid).toContain('19');
        expect(valid).toContain('triple');
        // Note: 57 * 3 = 171, not 57
        expect(valid).not.toContain('57');
    });
});

// ============================================================================
// Score calculation tests
// ============================================================================

describe('calculateContractScore', () => {
    test('returns 0 for empty darts', () => {
        expect(calculateContractScore([], 'capital')).toBe(0);
        expect(calculateContractScore(null, 'capital')).toBe(0);
        expect(calculateContractScore(undefined, 'capital')).toBe(0);
    });

    describe('capital, side, 3row, color, 57 - total score', () => {
        const totalContracts = ['capital', 'side', '3row', 'color', '57'];

        totalContracts.forEach(contractId => {
            test(`${contractId} returns total of all darts`, () => {
                const darts = [createDart(20, 'single'), createDart(19, 'single'), createDart(18, 'single')];
                // 20 + 19 + 18 = 57
                expect(calculateContractScore(darts, contractId)).toBe(57);
            });
        });
    });

    describe('numeric contracts - only count matching number', () => {
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

    describe('double contract - only count doubles', () => {
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

    describe('triple contract - only count triples', () => {
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

    describe('bull contract - only count bulls', () => {
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
// Score validation tests
// ============================================================================

describe('validateScore', () => {
    describe('always valid contracts', () => {
        const alwaysValidContracts = ['capital', 'side', '3row', 'color', 'triple'];

        alwaysValidContracts.forEach(contractId => {
            test(`${contractId} accepts any score`, () => {
                expect(validateScore(0, contractId)).toBe(true);
                expect(validateScore(1, contractId)).toBe(true);
                expect(validateScore(57, contractId)).toBe(true);
                expect(validateScore(180, contractId)).toBe(true);
            });
        });
    });

    describe('numeric contracts', () => {
        test('20 contract: 0 or multiples of 20', () => {
            expect(validateScore(0, '20')).toBe(true);
            expect(validateScore(20, '20')).toBe(true);
            expect(validateScore(40, '20')).toBe(true);
            expect(validateScore(60, '20')).toBe(true);
            expect(validateScore(19, '20')).toBe(false);
            expect(validateScore(21, '20')).toBe(false);
        });

        test('19 contract: 0 or multiples of 19', () => {
            expect(validateScore(0, '19')).toBe(true);
            expect(validateScore(19, '19')).toBe(true);
            expect(validateScore(38, '19')).toBe(true);
            expect(validateScore(57, '19')).toBe(true);
            expect(validateScore(18, '19')).toBe(false);
            expect(validateScore(20, '19')).toBe(false);
        });

        test('18 contract: 0 or multiples of 18', () => {
            expect(validateScore(0, '18')).toBe(true);
            expect(validateScore(18, '18')).toBe(true);
            expect(validateScore(36, '18')).toBe(true);
            expect(validateScore(54, '18')).toBe(true);
            expect(validateScore(17, '18')).toBe(false);
            expect(validateScore(19, '18')).toBe(false);
        });

        test('17 contract: 0 or multiples of 17', () => {
            expect(validateScore(0, '17')).toBe(true);
            expect(validateScore(17, '17')).toBe(true);
            expect(validateScore(34, '17')).toBe(true);
            expect(validateScore(51, '17')).toBe(true);
            expect(validateScore(16, '17')).toBe(false);
            expect(validateScore(18, '17')).toBe(false);
        });

        test('16 contract: 0 or multiples of 16', () => {
            expect(validateScore(0, '16')).toBe(true);
            expect(validateScore(16, '16')).toBe(true);
            expect(validateScore(32, '16')).toBe(true);
            expect(validateScore(48, '16')).toBe(true);
            expect(validateScore(15, '16')).toBe(false);
            expect(validateScore(17, '16')).toBe(false);
        });

        test('15 contract: 0 or multiples of 15', () => {
            expect(validateScore(0, '15')).toBe(true);
            expect(validateScore(15, '15')).toBe(true);
            expect(validateScore(30, '15')).toBe(true);
            expect(validateScore(45, '15')).toBe(true);
            expect(validateScore(14, '15')).toBe(false);
            expect(validateScore(16, '15')).toBe(false);
        });

        test('14 contract: 0 or multiples of 14', () => {
            expect(validateScore(0, '14')).toBe(true);
            expect(validateScore(14, '14')).toBe(true);
            expect(validateScore(28, '14')).toBe(true);
            expect(validateScore(42, '14')).toBe(true);
            expect(validateScore(13, '14')).toBe(false);
            expect(validateScore(15, '14')).toBe(false);
        });
    });

    describe('double contract', () => {
        test('accepts 0 or even numbers', () => {
            expect(validateScore(0, 'double')).toBe(true);
            expect(validateScore(2, 'double')).toBe(true);
            expect(validateScore(40, 'double')).toBe(true);
            expect(validateScore(50, 'double')).toBe(true);
            expect(validateScore(1, 'double')).toBe(false);
            expect(validateScore(3, 'double')).toBe(false);
            expect(validateScore(39, 'double')).toBe(false);
        });
    });

    describe('57 contract', () => {
        test('accepts only 0 or 57', () => {
            expect(validateScore(0, '57')).toBe(true);
            expect(validateScore(57, '57')).toBe(true);
            expect(validateScore(56, '57')).toBe(false);
            expect(validateScore(58, '57')).toBe(false);
            expect(validateScore(1, '57')).toBe(false);
        });
    });

    describe('bull contract', () => {
        test('accepts 0, 25, 50, 75, or 100', () => {
            expect(validateScore(0, 'bull')).toBe(true);
            expect(validateScore(25, 'bull')).toBe(true);
            expect(validateScore(50, 'bull')).toBe(true);
            expect(validateScore(75, 'bull')).toBe(true);
            expect(validateScore(100, 'bull')).toBe(true);
            expect(validateScore(24, 'bull')).toBe(false);
            expect(validateScore(26, 'bull')).toBe(false);
            expect(validateScore(51, 'bull')).toBe(false);
        });
    });
});

describe('getValidationRule', () => {
    test('returns rule for known contracts', () => {
        const rule = getValidationRule('20');
        expect(rule).toHaveProperty('validate');
        expect(rule).toHaveProperty('message');
        expect(typeof rule.validate).toBe('function');
    });

    test('returns default rule for unknown contracts', () => {
        const rule = getValidationRule('unknown');
        expect(rule.validate()).toBe(true);
        expect(rule.message).toBe('');
    });
});

// ============================================================================
// Constants validation tests
// ============================================================================

describe('Constants', () => {
    test('CONTRACT_IDS contains all 15 contracts in order', () => {
        expect(CONTRACT_IDS).toEqual([
            'capital', '20', 'side', '19', '3row', '18', 'color', '17',
            'double', '16', 'triple', '15', '57', '14', 'bull'
        ]);
        expect(CONTRACT_IDS.length).toBe(15);
    });

    test('DARTBOARD_SEQUENCE contains all 20 numbers', () => {
        expect(DARTBOARD_SEQUENCE.length).toBe(20);
        const sorted = [...DARTBOARD_SEQUENCE].sort((a, b) => a - b);
        expect(sorted).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
    });

    test('DART_SINGLE_COLORS has all 20 segments', () => {
        expect(Object.keys(DART_SINGLE_COLORS).length).toBe(20);
        const colors = Object.values(DART_SINGLE_COLORS);
        expect(colors.filter(c => c === 'black').length).toBe(10);
        expect(colors.filter(c => c === 'white').length).toBe(10);
    });

    test('DART_RING_COLORS has all 20 segments', () => {
        expect(Object.keys(DART_RING_COLORS).length).toBe(20);
        const colors = Object.values(DART_RING_COLORS);
        expect(colors.filter(c => c === 'red').length).toBe(10);
        expect(colors.filter(c => c === 'green').length).toBe(10);
    });

    test('VALIDATION_RULES has all contracts', () => {
        CONTRACT_IDS.forEach(contractId => {
            expect(VALIDATION_RULES).toHaveProperty(contractId);
        });
    });
});

// ============================================================================
// Edge cases and integration tests
// ============================================================================

describe('Edge cases', () => {
    test('maximum possible score (180)', () => {
        const darts = [createDart(20, 'triple'), createDart(20, 'triple'), createDart(20, 'triple')];
        const score = calculateContractScore(darts, 'capital');
        expect(score).toBe(180);
    });

    test('minimum possible score (0 - all misses)', () => {
        const darts = [createDart(0, 'single'), createDart(0, 'single'), createDart(0, 'single')];
        const score = calculateContractScore(darts, 'capital');
        expect(score).toBe(0);
    });

    test('single bull has value 25', () => {
        const dart = createDart(25, 'single');
        expect(dart.score).toBe(25);
    });

    test('double bull has value 50', () => {
        const dart = createDart(25, 'double');
        expect(dart.score).toBe(50);
    });

    test('all triple bulls (theoretical max for bull contract)', () => {
        // Note: bull can only be single (25) or double (50), not triple
        // But the game allows multiple bull hits
        const darts = [createDart(25, 'double'), createDart(25, 'double'), createDart(25, 'double')];
        expect(calculateContractScore(darts, 'bull')).toBe(150);
    });
});

describe('Integration scenarios', () => {
    test('Classic mode: full game simulation for one round', () => {
        // Simulate hitting 20s contract
        const darts = [createDart(20, 'triple'), createDart(20, 'double'), createDart(5, 'single')];

        // Check requirements
        expect(checkContractRequirements(darts, '20')).toBe(true);

        // Calculate score (only 20s count)
        expect(calculateContractScore(darts, '20')).toBe(100); // 60 + 40

        // Validate the score
        expect(validateScore(100, '20')).toBe(true);
    });

    test('Yahtzee mode: determine available contracts for a throw', () => {
        // Player throws: triple 20, single 19, double 18
        const darts = [
            createDart(20, 'triple'),
            createDart(19, 'single'),
            createDart(18, 'double')
        ];

        const validContracts = getValidContracts(darts);

        // Should be valid for:
        expect(validContracts).toContain('capital');   // Always valid
        expect(validContracts).toContain('20');        // Hit 20
        expect(validContracts).toContain('19');        // Hit 19
        expect(validContracts).toContain('18');        // Hit 18
        expect(validContracts).toContain('3row');      // 18-19-20 consecutive
        expect(validContracts).toContain('triple');    // Has triple
        expect(validContracts).toContain('double');    // Has double

        // Check color calculation - T20 (red), S19 (white), D18 (red) = only 2 unique colors
        const colors = darts.map(d => getDartColor(d));
        expect(colors).toEqual(['red', 'white', 'red']); // Only 2 unique colors
        expect(validContracts).not.toContain('color');   // Not valid - only 2 colors

        // Should NOT be valid for:
        expect(validContracts).not.toContain('57');     // Total is 60+19+36=115
        expect(validContracts).not.toContain('bull');   // No bull hit
        expect(validContracts).not.toContain('side');   // 20, 19, 18 not adjacent on board
    });

    test('Color contract with different combinations', () => {
        // Test case 1: Single (black) + Single (white) + Double (red)
        const darts1 = [
            createDart(20, 'single'),  // black
            createDart(1, 'single'),   // white
            createDart(3, 'double')    // red
        ];
        expect(checkContractRequirements(darts1, 'color')).toBe(true);

        // Test case 2: Single (black) + Triple (green) + Double (red)
        const darts2 = [
            createDart(20, 'single'),  // black
            createDart(1, 'triple'),   // green
            createDart(3, 'double')    // red
        ];
        expect(checkContractRequirements(darts2, 'color')).toBe(true);

        // Test case 3: Bull single (green) + Bull double (red) + Single (white)
        const darts3 = [
            createDart(25, 'single'),  // green
            createDart(25, 'double'),  // red
            createDart(1, 'single')    // white
        ];
        expect(checkContractRequirements(darts3, 'color')).toBe(true);
    });
});
