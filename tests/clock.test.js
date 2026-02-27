/**
 * Specification-based tests for Clock mode game logic
 * Tests are written based on the game rules, not the implementation
 *
 * Clock Mode Rules Summary:
 * - Players hit 1, then 2, 3, ..., 10, then Bull to finish
 * - Doubles/triples count as extra advancement (triple 1 = advance 3)
 * - Advancing past 10 caps at Bull (position 11), never skips it
 * - When target is Bull, hitting single or double bull finishes
 * - Last dart hitting target (without finishing) grants an extra turn
 * - First player to finish wins; game ends immediately
 * - If no one finishes within 10 turns each, the player furthest ahead wins; ties possible
 * - Each dart is evaluated against the current target at that point
 * - Darts that don't match the current target are misses (no effect)
 */

const {
    CLOCK_POSITION_BULL,
    CLOCK_POSITION_FINISHED,
    CLOCK_MAX_TURNS,
    getMultiplier,
    getClockTargetName,
    processClockDarts,
    getClockPreviewTarget,
    getClockProgress,
    determineClockWinner
} = require('../src/clock');

// Helper to create a dart object for clock mode tests
function dart(number, modifier = 'single') {
    return { number, modifier };
}

function miss() {
    return { number: 0, modifier: 'miss' };
}

// ============================================================================
// Constants
// ============================================================================

describe('Clock mode constants', () => {
    test('Bull position is 11', () => {
        expect(CLOCK_POSITION_BULL).toBe(11);
    });

    test('Finished position is 12', () => {
        expect(CLOCK_POSITION_FINISHED).toBe(12);
    });

    test('Max turns per player is 10', () => {
        expect(CLOCK_MAX_TURNS).toBe(10);
    });
});

// ============================================================================
// getMultiplier
// ============================================================================

describe('getMultiplier', () => {
    test('single returns 1', () => {
        expect(getMultiplier('single')).toBe(1);
    });

    test('double returns 2', () => {
        expect(getMultiplier('double')).toBe(2);
    });

    test('triple returns 3', () => {
        expect(getMultiplier('triple')).toBe(3);
    });

    test('unknown modifier defaults to 1', () => {
        expect(getMultiplier('miss')).toBe(1);
        expect(getMultiplier(undefined)).toBe(1);
    });
});

// ============================================================================
// getClockTargetName
// ============================================================================

describe('getClockTargetName', () => {
    test('positions 1-10 return the number as string', () => {
        for (let i = 1; i <= 10; i++) {
            expect(getClockTargetName(i)).toBe(String(i));
        }
    });

    test('position 11 (Bull) returns "Bull"', () => {
        expect(getClockTargetName(11)).toBe('Bull');
    });

    test('position 12 (Finished) returns "Finished"', () => {
        expect(getClockTargetName(12)).toBe('Finished');
    });
});

// ============================================================================
// processClockDarts - Core game logic
// ============================================================================

describe('processClockDarts', () => {
    describe('basic advancement', () => {
        test('single hit on current target advances by 1', () => {
            const result = processClockDarts([dart(1)], 1);
            expect(result.endPosition).toBe(2);
            expect(result.finished).toBe(false);
        });

        test('hitting target 5 advances to 6', () => {
            const result = processClockDarts([dart(5)], 5);
            expect(result.endPosition).toBe(6);
        });

        test('hitting target 10 advances to Bull (11)', () => {
            const result = processClockDarts([dart(10)], 10);
            expect(result.endPosition).toBe(CLOCK_POSITION_BULL);
        });
    });

    describe('doubles and triples advance extra', () => {
        test('double hit advances by 2', () => {
            const result = processClockDarts([dart(1, 'double')], 1);
            expect(result.endPosition).toBe(3);
        });

        test('triple hit advances by 3', () => {
            const result = processClockDarts([dart(1, 'triple')], 1);
            expect(result.endPosition).toBe(4);
        });

        test('triple 3 from position 3 advances to 6', () => {
            const result = processClockDarts([dart(3, 'triple')], 3);
            expect(result.endPosition).toBe(6);
        });

        test('double 5 from position 5 advances to 7', () => {
            const result = processClockDarts([dart(5, 'double')], 5);
            expect(result.endPosition).toBe(7);
        });
    });

    describe('advancement past 10 caps at Bull', () => {
        test('double 10 caps at Bull (not 12/finished)', () => {
            const result = processClockDarts([dart(10, 'double')], 10);
            expect(result.endPosition).toBe(CLOCK_POSITION_BULL);
            expect(result.finished).toBe(false);
        });

        test('triple 10 caps at Bull (not beyond)', () => {
            const result = processClockDarts([dart(10, 'triple')], 10);
            expect(result.endPosition).toBe(CLOCK_POSITION_BULL);
            expect(result.finished).toBe(false);
        });

        test('triple 9 from position 9 caps at Bull', () => {
            const result = processClockDarts([dart(9, 'triple')], 9);
            expect(result.endPosition).toBe(CLOCK_POSITION_BULL);
            expect(result.finished).toBe(false);
        });

        test('double 9 from position 9 = 11 (Bull), does not skip', () => {
            const result = processClockDarts([dart(9, 'double')], 9);
            expect(result.endPosition).toBe(CLOCK_POSITION_BULL);
        });

        test('triple 8 from position 8 = 11 (Bull), caps correctly', () => {
            const result = processClockDarts([dart(8, 'triple')], 8);
            expect(result.endPosition).toBe(CLOCK_POSITION_BULL);
        });
    });

    describe('Bull target (position 11)', () => {
        test('single bull finishes the game', () => {
            const result = processClockDarts([dart(25, 'single')], 11);
            expect(result.endPosition).toBe(CLOCK_POSITION_FINISHED);
            expect(result.finished).toBe(true);
        });

        test('double bull finishes the game', () => {
            const result = processClockDarts([dart(25, 'double')], 11);
            expect(result.endPosition).toBe(CLOCK_POSITION_FINISHED);
            expect(result.finished).toBe(true);
        });

        test('miss does not finish', () => {
            const result = processClockDarts([miss()], 11);
            expect(result.endPosition).toBe(CLOCK_POSITION_BULL);
            expect(result.finished).toBe(false);
        });

        test('non-bull number does not finish', () => {
            const result = processClockDarts([dart(20)], 11);
            expect(result.endPosition).toBe(CLOCK_POSITION_BULL);
            expect(result.finished).toBe(false);
        });
    });

    describe('misses have no effect', () => {
        test('miss does not advance position', () => {
            const result = processClockDarts([miss()], 1);
            expect(result.endPosition).toBe(1);
        });

        test('three misses leave position unchanged', () => {
            const result = processClockDarts([miss(), miss(), miss()], 5);
            expect(result.endPosition).toBe(5);
        });

        test('wrong number does not advance', () => {
            const result = processClockDarts([dart(5)], 3);
            expect(result.endPosition).toBe(3);
        });
    });

    describe('sequential dart evaluation (each dart checks current target)', () => {
        test('hitting target 1 then target 2 in same turn advances to 3', () => {
            const result = processClockDarts([dart(1), dart(2)], 1);
            expect(result.endPosition).toBe(3);
        });

        test('three consecutive hits from position 1 advance to 4', () => {
            const result = processClockDarts([dart(1), dart(2), dart(3)], 1);
            expect(result.endPosition).toBe(4);
        });

        test('hit, miss, hit evaluates correctly', () => {
            const result = processClockDarts([dart(1), miss(), dart(2)], 1);
            expect(result.endPosition).toBe(3);
        });

        test('double advances target, next dart checks new target', () => {
            // Position 1, double 1 = advance to 3, then dart(3) hits new target
            const result = processClockDarts([dart(1, 'double'), dart(3)], 1);
            expect(result.endPosition).toBe(4);
        });

        test('triple 1 advances to 4, next dart at 4 advances to 5', () => {
            const result = processClockDarts([dart(1, 'triple'), dart(4)], 1);
            expect(result.endPosition).toBe(5);
        });

        test('second dart that matches old target but not new target is a miss', () => {
            // Position 1, hit 1 → position 2. Dart(1) again doesn't match new target 2
            const result = processClockDarts([dart(1), dart(1)], 1);
            expect(result.endPosition).toBe(2);
        });

        test('advancing to Bull mid-turn, then hitting Bull finishes', () => {
            const result = processClockDarts([dart(10), dart(25)], 10);
            expect(result.endPosition).toBe(CLOCK_POSITION_FINISHED);
            expect(result.finished).toBe(true);
        });

        test('triple advancing to Bull, then Bull finishes', () => {
            // Position 8, triple 8 → advance 3, capped at 11. Then bull finishes.
            const result = processClockDarts([dart(8, 'triple'), dart(25)], 8);
            expect(result.endPosition).toBe(CLOCK_POSITION_FINISHED);
            expect(result.finished).toBe(true);
        });
    });

    describe('finishing mid-turn stops processing', () => {
        test('finishing on dart 1 ignores remaining darts', () => {
            const result = processClockDarts([dart(25), dart(20), dart(5)], 11);
            expect(result.endPosition).toBe(CLOCK_POSITION_FINISHED);
            expect(result.finished).toBe(true);
        });

        test('finishing on dart 2 ignores dart 3', () => {
            const result = processClockDarts([miss(), dart(25), dart(20)], 11);
            expect(result.endPosition).toBe(CLOCK_POSITION_FINISHED);
            expect(result.finished).toBe(true);
        });
    });

    describe('extra turn rule', () => {
        test('last dart (dart 3) hitting target grants extra turn', () => {
            const result = processClockDarts([miss(), miss(), dart(1)], 1);
            expect(result.extraTurn).toBe(true);
            expect(result.lastDartHit).toBe(true);
        });

        test('last dart (dart 1 if only 1 dart) hitting target grants extra turn', () => {
            const result = processClockDarts([dart(5)], 5);
            expect(result.extraTurn).toBe(true);
        });

        test('last dart (dart 2 if 2 darts) hitting target grants extra turn', () => {
            const result = processClockDarts([miss(), dart(3)], 3);
            expect(result.extraTurn).toBe(true);
        });

        test('last dart missing does not grant extra turn', () => {
            const result = processClockDarts([dart(1), miss(), miss()], 1);
            expect(result.extraTurn).toBe(false);
        });

        test('non-last dart hitting target does not grant extra turn', () => {
            const result = processClockDarts([dart(1), miss()], 1);
            expect(result.extraTurn).toBe(false);
        });

        test('last dart finishing the game does NOT grant extra turn', () => {
            // Finishing = game over, no extra turn needed
            const result = processClockDarts([miss(), miss(), dart(25)], 11);
            expect(result.finished).toBe(true);
            expect(result.extraTurn).toBe(false);
        });

        test('finishing mid-turn does not grant extra turn even if last dart was a hit', () => {
            const result = processClockDarts([dart(25)], 11);
            expect(result.finished).toBe(true);
            expect(result.extraTurn).toBe(false);
        });

        test('extra turn with double: last dart double advances and grants extra', () => {
            const result = processClockDarts([miss(), miss(), dart(3, 'double')], 3);
            expect(result.endPosition).toBe(5);
            expect(result.extraTurn).toBe(true);
        });

        test('extra turn with triple: last dart triple advances and grants extra', () => {
            const result = processClockDarts([miss(), miss(), dart(2, 'triple')], 2);
            expect(result.endPosition).toBe(5);
            expect(result.extraTurn).toBe(true);
        });

        test('no extra turn if last dart hits but player finishes (via Bull)', () => {
            const result = processClockDarts([dart(10), miss(), dart(25)], 10);
            expect(result.finished).toBe(true);
            expect(result.extraTurn).toBe(false);
        });
    });

    describe('empty and edge cases', () => {
        test('empty darts array returns start position unchanged', () => {
            const result = processClockDarts([], 1);
            expect(result.endPosition).toBe(1);
            expect(result.finished).toBe(false);
            expect(result.extraTurn).toBe(false);
            expect(result.lastDartHit).toBe(false);
        });

        test('null darts returns start position unchanged', () => {
            const result = processClockDarts(null, 5);
            expect(result.endPosition).toBe(5);
        });

        test('already finished position stays finished', () => {
            const result = processClockDarts([dart(1)], 12);
            expect(result.endPosition).toBe(CLOCK_POSITION_FINISHED);
        });
    });

    describe('full game simulations', () => {
        test('speedrun: triple 1 (→4), triple 4 (→7), triple 7 (→10) in one turn', () => {
            const result = processClockDarts(
                [dart(1, 'triple'), dart(4, 'triple'), dart(7, 'triple')],
                1
            );
            expect(result.endPosition).toBe(10);
            expect(result.extraTurn).toBe(true); // last dart hit
        });

        test('speedrun continuation: single 10 (→Bull), then Bull finishes', () => {
            const result = processClockDarts(
                [dart(10), dart(25)],
                10
            );
            expect(result.endPosition).toBe(CLOCK_POSITION_FINISHED);
            expect(result.finished).toBe(true);
        });

        test('all misses turn: position unchanged, no extra turn', () => {
            const result = processClockDarts([miss(), miss(), miss()], 7);
            expect(result.endPosition).toBe(7);
            expect(result.extraTurn).toBe(false);
            expect(result.finished).toBe(false);
        });

        test('double advancing past 10 to Bull, then Bull in same turn', () => {
            // Position 9, double 9 → pos 11 (capped), then bull → finished
            const result = processClockDarts(
                [dart(9, 'double'), dart(25)],
                9
            );
            expect(result.endPosition).toBe(CLOCK_POSITION_FINISHED);
            expect(result.finished).toBe(true);
        });
    });
});

// ============================================================================
// getClockPreviewTarget
// ============================================================================

describe('getClockPreviewTarget', () => {
    test('no darts entered returns the start position', () => {
        expect(getClockPreviewTarget([], 1)).toBe(1);
    });

    test('after hitting target 1, preview shows 2', () => {
        expect(getClockPreviewTarget([dart(1)], 1)).toBe(2);
    });

    test('after miss, preview stays at current target', () => {
        expect(getClockPreviewTarget([miss()], 3)).toBe(3);
    });

    test('after double hit, preview advances by 2', () => {
        expect(getClockPreviewTarget([dart(5, 'double')], 5)).toBe(7);
    });

    test('after triple hit, preview advances by 3', () => {
        expect(getClockPreviewTarget([dart(2, 'triple')], 2)).toBe(5);
    });

    test('after advancing past 10, preview shows Bull (11)', () => {
        expect(getClockPreviewTarget([dart(10, 'double')], 10)).toBe(CLOCK_POSITION_BULL);
    });

    test('after hitting Bull, preview shows finished (12)', () => {
        expect(getClockPreviewTarget([dart(25)], 11)).toBe(CLOCK_POSITION_FINISHED);
    });

    test('simulates multiple darts correctly', () => {
        // Position 1: hit 1 (→2), hit 2 (→3), preview = 3
        expect(getClockPreviewTarget([dart(1), dart(2)], 1)).toBe(3);
    });

    test('second dart wrong number after hit does not advance', () => {
        // Position 1: hit 1 (→2), dart(1) misses target 2, preview = 2
        expect(getClockPreviewTarget([dart(1), dart(1)], 1)).toBe(2);
    });
});

// ============================================================================
// getClockProgress
// ============================================================================

describe('getClockProgress', () => {
    test('position 1 (start) is 0%', () => {
        expect(getClockProgress(1, false)).toBe(0);
    });

    test('position 6 (halfway through numbers) is ~45%', () => {
        const progress = getClockProgress(6, false);
        expect(progress).toBeCloseTo(45.45, 1);
    });

    test('position 11 (Bull) is ~90.9%', () => {
        const progress = getClockProgress(11, false);
        expect(progress).toBeCloseTo(90.91, 1);
    });

    test('finished player is 100%', () => {
        expect(getClockProgress(12, true)).toBe(100);
    });

    test('finished flag overrides position', () => {
        expect(getClockProgress(5, true)).toBe(100);
    });
});

// ============================================================================
// determineClockWinner - Winner determination with turn limit
// ============================================================================

describe('determineClockWinner', () => {
    describe('when a player finishes', () => {
        test('first finisher wins', () => {
            const result = determineClockWinner(
                ['Alice', 'Bob'],
                { Alice: 12, Bob: 5 },
                ['Alice']
            );
            expect(result.winners).toEqual(['Alice']);
            expect(result.isTie).toBe(false);
        });

        test('first finisher wins even if others are ahead in position', () => {
            const result = determineClockWinner(
                ['Alice', 'Bob', 'Charlie'],
                { Alice: 12, Bob: 11, Charlie: 12 },
                ['Charlie', 'Alice']
            );
            expect(result.winners).toEqual(['Charlie']);
            expect(result.isTie).toBe(false);
        });
    });

    describe('when no one finishes (turn limit reached)', () => {
        test('player with highest position wins', () => {
            const result = determineClockWinner(
                ['Alice', 'Bob'],
                { Alice: 8, Bob: 5 },
                []
            );
            expect(result.winners).toEqual(['Alice']);
            expect(result.isTie).toBe(false);
        });

        test('player at Bull beats player at number', () => {
            const result = determineClockWinner(
                ['Alice', 'Bob'],
                { Alice: 11, Bob: 9 },
                []
            );
            expect(result.winners).toEqual(['Alice']);
            expect(result.isTie).toBe(false);
        });

        test('two players tied at same position', () => {
            const result = determineClockWinner(
                ['Alice', 'Bob'],
                { Alice: 7, Bob: 7 },
                []
            );
            expect(result.winners).toEqual(['Alice', 'Bob']);
            expect(result.isTie).toBe(true);
        });

        test('three players tied at same position', () => {
            const result = determineClockWinner(
                ['Alice', 'Bob', 'Charlie'],
                { Alice: 5, Bob: 5, Charlie: 5 },
                []
            );
            expect(result.winners).toEqual(['Alice', 'Bob', 'Charlie']);
            expect(result.isTie).toBe(true);
        });

        test('two of three players tied, third behind', () => {
            const result = determineClockWinner(
                ['Alice', 'Bob', 'Charlie'],
                { Alice: 9, Bob: 3, Charlie: 9 },
                []
            );
            expect(result.winners).toEqual(['Alice', 'Charlie']);
            expect(result.isTie).toBe(true);
        });

        test('player with no position entry defaults to position 1', () => {
            const result = determineClockWinner(
                ['Alice', 'Bob'],
                { Alice: 5 },
                []
            );
            expect(result.winners).toEqual(['Alice']);
            expect(result.isTie).toBe(false);
        });

        test('all players at starting position is a tie', () => {
            const result = determineClockWinner(
                ['Alice', 'Bob'],
                { Alice: 1, Bob: 1 },
                []
            );
            expect(result.winners).toEqual(['Alice', 'Bob']);
            expect(result.isTie).toBe(true);
        });
    });

    describe('edge cases', () => {
        test('single player always wins', () => {
            const result = determineClockWinner(
                ['Alice'],
                { Alice: 3 },
                []
            );
            expect(result.winners).toEqual(['Alice']);
            expect(result.isTie).toBe(false);
        });

        test('null finishOrder treated as empty', () => {
            const result = determineClockWinner(
                ['Alice', 'Bob'],
                { Alice: 8, Bob: 5 },
                null
            );
            expect(result.winners).toEqual(['Alice']);
            expect(result.isTie).toBe(false);
        });
    });
});
