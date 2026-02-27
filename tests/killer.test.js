/**
 * Specification-based tests for Killer mode game logic
 * Tests are written based on the game rules, not the implementation
 *
 * Killer Mode Rules Summary:
 * - Each player picks a unique number (1-20) on the dartboard
 * - Gain lives by hitting your own number (+3) or adjacent segments (+1)
 * - Doubles multiply by 2, Triples multiply by 3
 * - At 9 lives, become a "Killer" and attack others
 * - When a Killer hits another player's number: -3 × multiplier to that player
 * - When a Killer hits adjacent to another player's number: -1 × multiplier
 * - Killer status is checked per-dart (becoming killer mid-turn allows attacking with subsequent darts)
 * - Players are eliminated when lives drop to -1 or below
 * - Lives are capped at 9
 * - Bull (25) and miss (0) darts are ignored
 * - Last player standing wins
 */

const {
    DARTBOARD_SEQUENCE,
    KILLER_MAX_LIVES,
    KILLER_ELIMINATION_THRESHOLD,
    getKillerMultiplier,
    getAdjacentNumbers,
    processKillerDarts,
    applyKillerChanges,
    isKillerGameOver,
    getKillerWinner
} = require('../src/killer');

// Also import DARTBOARD_SEQUENCE from contracts.js to verify consistency
const contracts = require('../src/contracts');

// Helper to create a dart object
function dart(number, modifier = 'single') {
    return { number, modifier };
}

function miss() {
    return { number: 0, modifier: 'miss' };
}

// Helper to create a basic 2-player game state
function twoPlayerState(overrides = {}) {
    return {
        players: ['Alice', 'Bob'],
        killerNumbers: { Alice: 20, Bob: 3 },
        killerIsKiller: { Alice: false, Bob: false },
        killerLives: { Alice: 0, Bob: 0 },
        killerEliminated: { Alice: false, Bob: false },
        ...overrides
    };
}

// Helper to create a 3-player game state
function threePlayerState(overrides = {}) {
    return {
        players: ['Alice', 'Bob', 'Charlie'],
        killerNumbers: { Alice: 20, Bob: 3, Charlie: 17 },
        killerIsKiller: { Alice: false, Bob: false, Charlie: false },
        killerLives: { Alice: 0, Bob: 0, Charlie: 0 },
        killerEliminated: { Alice: false, Bob: false, Charlie: false },
        ...overrides
    };
}

// ============================================================================
// Constants
// ============================================================================

describe('Killer mode constants', () => {
    test('KILLER_MAX_LIVES is 9', () => {
        expect(KILLER_MAX_LIVES).toBe(9);
    });

    test('KILLER_ELIMINATION_THRESHOLD is -1', () => {
        expect(KILLER_ELIMINATION_THRESHOLD).toBe(-1);
    });

    test('DARTBOARD_SEQUENCE matches the canonical sequence from contracts.js', () => {
        expect(DARTBOARD_SEQUENCE).toEqual(contracts.DARTBOARD_SEQUENCE);
    });

    test('DARTBOARD_SEQUENCE has 20 segments', () => {
        expect(DARTBOARD_SEQUENCE).toHaveLength(20);
    });
});

// ============================================================================
// getKillerMultiplier
// ============================================================================

describe('getKillerMultiplier', () => {
    test('single returns 1', () => {
        expect(getKillerMultiplier('single')).toBe(1);
    });

    test('double returns 2', () => {
        expect(getKillerMultiplier('double')).toBe(2);
    });

    test('triple returns 3', () => {
        expect(getKillerMultiplier('triple')).toBe(3);
    });

    test('unknown modifier defaults to 1', () => {
        expect(getKillerMultiplier('miss')).toBe(1);
        expect(getKillerMultiplier(undefined)).toBe(1);
    });
});

// ============================================================================
// getAdjacentNumbers
// ============================================================================

describe('getAdjacentNumbers', () => {
    // DARTBOARD_SEQUENCE: [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5]

    describe('standard segments', () => {
        test('20 is at top of board, neighbors are 5 (left) and 1 (right)', () => {
            expect(getAdjacentNumbers(20)).toEqual([5, 1]);
        });

        test('1 neighbors are 20 (left) and 18 (right)', () => {
            expect(getAdjacentNumbers(1)).toEqual([20, 18]);
        });

        test('18 neighbors are 1 (left) and 4 (right)', () => {
            expect(getAdjacentNumbers(18)).toEqual([1, 4]);
        });

        test('5 neighbors are 12 (left) and 20 (right) — wraps around', () => {
            expect(getAdjacentNumbers(5)).toEqual([12, 20]);
        });

        test('17 neighbors are 2 (left) and 3 (right)', () => {
            expect(getAdjacentNumbers(17)).toEqual([2, 3]);
        });

        test('3 neighbors are 17 (left) and 19 (right)', () => {
            expect(getAdjacentNumbers(3)).toEqual([17, 19]);
        });

        test('every segment 1-20 returns exactly 2 neighbors', () => {
            for (let i = 1; i <= 20; i++) {
                const adj = getAdjacentNumbers(i);
                expect(adj).toHaveLength(2);
                // Each neighbor should also be a valid segment
                expect(DARTBOARD_SEQUENCE).toContain(adj[0]);
                expect(DARTBOARD_SEQUENCE).toContain(adj[1]);
            }
        });
    });

    describe('invalid inputs', () => {
        test('miss (0) returns empty array', () => {
            expect(getAdjacentNumbers(0)).toEqual([]);
        });

        test('bull (25) returns empty array', () => {
            expect(getAdjacentNumbers(25)).toEqual([]);
        });

        test('number not on the board (21) returns empty array', () => {
            expect(getAdjacentNumbers(21)).toEqual([]);
        });

        test('negative number returns empty array', () => {
            expect(getAdjacentNumbers(-1)).toEqual([]);
        });
    });

    describe('circular board property', () => {
        test('adjacency is symmetric — if A is adjacent to B, B is adjacent to A', () => {
            for (let i = 0; i < DARTBOARD_SEQUENCE.length; i++) {
                const num = DARTBOARD_SEQUENCE[i];
                const [left, right] = getAdjacentNumbers(num);
                // left's right neighbor should be num
                expect(getAdjacentNumbers(left)[1]).toBe(num);
                // right's left neighbor should be num
                expect(getAdjacentNumbers(right)[0]).toBe(num);
            }
        });
    });
});

// ============================================================================
// processKillerDarts — Own number hits
// ============================================================================

describe('processKillerDarts', () => {
    describe('own number hits', () => {
        test('single hit on own number gives +3 lives', () => {
            const state = twoPlayerState();
            // Alice's number is 20
            const changes = processKillerDarts('Alice', [dart(20)], state);
            expect(changes).toEqual([{ player: 'Alice', delta: 3, reason: 'own' }]);
        });

        test('double hit on own number gives +6 lives', () => {
            const state = twoPlayerState();
            const changes = processKillerDarts('Alice', [dart(20, 'double')], state);
            expect(changes).toEqual([{ player: 'Alice', delta: 6, reason: 'own' }]);
        });

        test('triple hit on own number gives +9 lives', () => {
            const state = twoPlayerState();
            const changes = processKillerDarts('Alice', [dart(20, 'triple')], state);
            expect(changes).toEqual([{ player: 'Alice', delta: 9, reason: 'own' }]);
        });

        test('multiple darts hitting own number accumulate', () => {
            const state = twoPlayerState();
            const changes = processKillerDarts('Alice', [dart(20), dart(20), dart(20)], state);
            expect(changes).toHaveLength(3);
            expect(changes.every(c => c.player === 'Alice' && c.delta === 3 && c.reason === 'own')).toBe(true);
        });
    });

    // ============================================================================
    // processKillerDarts — Adjacent hits
    // ============================================================================

    describe('adjacent hits', () => {
        test('single hit on adjacent number gives +1 life', () => {
            const state = twoPlayerState(); // Alice = 20, adj = [5, 1]
            const changes = processKillerDarts('Alice', [dart(1)], state);
            expect(changes).toEqual([{ player: 'Alice', delta: 1, reason: 'adjacent' }]);
        });

        test('double hit on adjacent gives +2 lives', () => {
            const state = twoPlayerState();
            const changes = processKillerDarts('Alice', [dart(5, 'double')], state);
            expect(changes).toEqual([{ player: 'Alice', delta: 2, reason: 'adjacent' }]);
        });

        test('triple hit on adjacent gives +3 lives', () => {
            const state = twoPlayerState();
            const changes = processKillerDarts('Alice', [dart(1, 'triple')], state);
            expect(changes).toEqual([{ player: 'Alice', delta: 3, reason: 'adjacent' }]);
        });

        test('both adjacent numbers count', () => {
            const state = twoPlayerState(); // Alice = 20, adj = [5, 1]
            const changes = processKillerDarts('Alice', [dart(5), dart(1)], state);
            expect(changes).toHaveLength(2);
            expect(changes[0]).toEqual({ player: 'Alice', delta: 1, reason: 'adjacent' });
            expect(changes[1]).toEqual({ player: 'Alice', delta: 1, reason: 'adjacent' });
        });
    });

    // ============================================================================
    // processKillerDarts — Miss and bull
    // ============================================================================

    describe('miss and bull darts', () => {
        test('miss (0) produces no changes', () => {
            const state = twoPlayerState();
            const changes = processKillerDarts('Alice', [miss()], state);
            expect(changes).toEqual([]);
        });

        test('bull (25) produces no changes', () => {
            const state = twoPlayerState();
            const changes = processKillerDarts('Alice', [dart(25)], state);
            expect(changes).toEqual([]);
        });

        test('double bull (25 double) produces no changes', () => {
            const state = twoPlayerState();
            const changes = processKillerDarts('Alice', [dart(25, 'double')], state);
            expect(changes).toEqual([]);
        });

        test('all 3 darts missing produces empty changes', () => {
            const state = twoPlayerState();
            const changes = processKillerDarts('Alice', [miss(), miss(), miss()], state);
            expect(changes).toEqual([]);
        });

        test('all 3 darts hitting bull produces empty changes', () => {
            const state = twoPlayerState();
            const changes = processKillerDarts('Alice', [dart(25), dart(25, 'double'), dart(25)], state);
            expect(changes).toEqual([]);
        });
    });

    // ============================================================================
    // processKillerDarts — Mixed darts
    // ============================================================================

    describe('mixed darts in a turn', () => {
        test('own + adjacent + miss produce correct combined changes', () => {
            const state = twoPlayerState(); // Alice = 20, adj = [5, 1]
            const changes = processKillerDarts('Alice', [dart(20), dart(1), miss()], state);
            expect(changes).toHaveLength(2);
            expect(changes[0]).toEqual({ player: 'Alice', delta: 3, reason: 'own' });
            expect(changes[1]).toEqual({ player: 'Alice', delta: 1, reason: 'adjacent' });
        });

        test('hitting a number that is not own or adjacent produces no change for that dart', () => {
            const state = twoPlayerState(); // Alice = 20, adj = [5, 1]
            // 10 is not Alice's number or adjacent
            const changes = processKillerDarts('Alice', [dart(10)], state);
            expect(changes).toEqual([]);
        });

        test('unrelated numbers mixed with own number', () => {
            const state = twoPlayerState(); // Alice = 20
            const changes = processKillerDarts('Alice', [dart(7), dart(20), dart(13)], state);
            expect(changes).toHaveLength(1);
            expect(changes[0]).toEqual({ player: 'Alice', delta: 3, reason: 'own' });
        });
    });

    // ============================================================================
    // processKillerDarts — Killer status mid-turn
    // ============================================================================

    describe('killer status mid-turn (wasKillerBeforeDart)', () => {
        test('player who becomes killer on dart 1 can attack with darts 2 and 3', () => {
            // Alice has 6 lives, needs 3 more to become killer
            // Dart 1: triple on own number = +9 → running = 15, becomes killer
            // Dart 2: hit Bob's number (3) → should attack
            const state = twoPlayerState({
                killerLives: { Alice: 6, Bob: 5 }
            });
            const changes = processKillerDarts('Alice', [dart(20, 'triple'), dart(3)], state);

            // Dart 1: +9 to Alice (own, triple)
            expect(changes[0]).toEqual({ player: 'Alice', delta: 9, reason: 'own' });
            // Dart 2: -3 to Bob (killed, single) — Alice is now killer
            expect(changes).toContainEqual({ player: 'Bob', delta: -3, reason: 'killed' });
        });

        test('player who becomes killer on last dart does NOT attack on that dart', () => {
            // Alice has 6 lives, hits own number single (+3) → running = 9, becomes killer on this dart
            // But wasKillerBeforeDart is false, so no attack
            // Bob's number is 3, and dart hits 3... but Alice wasn't killer BEFORE this dart
            const state = twoPlayerState({
                killerLives: { Alice: 6, Bob: 5 },
                killerNumbers: { Alice: 20, Bob: 1 }  // Bob = 1, adj = [20, 18]
            });
            // Dart 1: hit 20 (own) → +3, running = 9 → becomes killer
            // Since wasKillerBeforeDart was false, no attack check on dart 1
            const changes = processKillerDarts('Alice', [dart(20)], state);
            expect(changes).toEqual([{ player: 'Alice', delta: 3, reason: 'own' }]);
            // No attack on Bob despite 20 being adjacent to Bob's number (1)
        });

        test('player already killer attacks from dart 1', () => {
            const state = twoPlayerState({
                killerLives: { Alice: 9, Bob: 5 },
                killerIsKiller: { Alice: true, Bob: false }
            });
            // Alice is already killer. Hit Bob's number (3).
            const changes = processKillerDarts('Alice', [dart(3)], state);
            expect(changes).toContainEqual({ player: 'Bob', delta: -3, reason: 'killed' });
        });

        test('becoming killer mid-turn: first dart gains lives, second dart attacks', () => {
            // Alice at 8 lives, hits adjacent (+1) → 9 = killer, then hits opponent
            const state = twoPlayerState({
                killerLives: { Alice: 8, Bob: 5 },
                killerNumbers: { Alice: 20, Bob: 3 } // Alice adj = [5, 1], Bob adj = [17, 19]
            });
            // Dart 1: hit 1 (adjacent) → +1, running = 9, becomes killer
            // Dart 2: hit 3 (Bob's number) → -3 to Bob
            const changes = processKillerDarts('Alice', [dart(1), dart(3)], state);
            expect(changes).toContainEqual({ player: 'Alice', delta: 1, reason: 'adjacent' });
            expect(changes).toContainEqual({ player: 'Bob', delta: -3, reason: 'killed' });
        });
    });

    // ============================================================================
    // processKillerDarts — Killer attacking
    // ============================================================================

    describe('killer attacking opponents', () => {
        test('killer hitting opponent own number deals -3 × multiplier', () => {
            const state = twoPlayerState({
                killerLives: { Alice: 9, Bob: 5 },
                killerIsKiller: { Alice: true, Bob: false }
            });
            const changes = processKillerDarts('Alice', [dart(3, 'double')], state);
            expect(changes).toContainEqual({ player: 'Bob', delta: -6, reason: 'killed' });
        });

        test('killer hitting adjacent to opponent deals -1 × multiplier', () => {
            const state = twoPlayerState({
                killerLives: { Alice: 9, Bob: 5 },
                killerIsKiller: { Alice: true, Bob: false }
            });
            // Bob = 3, adj = [17, 19]
            const changes = processKillerDarts('Alice', [dart(17)], state);
            expect(changes).toContainEqual({ player: 'Bob', delta: -1, reason: 'adj-killed' });
        });

        test('killer hitting adjacent to opponent with triple deals -3', () => {
            const state = twoPlayerState({
                killerLives: { Alice: 9, Bob: 5 },
                killerIsKiller: { Alice: true, Bob: false }
            });
            // Bob = 3, adj = [17, 19]
            const changes = processKillerDarts('Alice', [dart(19, 'triple')], state);
            expect(changes).toContainEqual({ player: 'Bob', delta: -3, reason: 'adj-killed' });
        });

        test('killer can attack multiple opponents with same dart', () => {
            // Alice is killer. Bob = 3, Charlie = 17. They are adjacent (3 adj = [17, 19])
            // If Alice hits 17 (Charlie's number), it's also adjacent to Bob
            const state = threePlayerState({
                killerLives: { Alice: 9, Bob: 5, Charlie: 4 },
                killerIsKiller: { Alice: true, Bob: false, Charlie: false }
            });
            // Hit 17 — Charlie's own number (-3) and Bob's adjacent (-1 because 3 adj = [17, 19])
            const changes = processKillerDarts('Alice', [dart(17)], state);
            expect(changes).toContainEqual({ player: 'Charlie', delta: -3, reason: 'killed' });
            expect(changes).toContainEqual({ player: 'Bob', delta: -1, reason: 'adj-killed' });
        });

        test('eliminated players are not targeted by killer attacks', () => {
            const state = twoPlayerState({
                killerLives: { Alice: 9, Bob: -1 },
                killerIsKiller: { Alice: true, Bob: false },
                killerEliminated: { Alice: false, Bob: true }
            });
            // Hit Bob's number (3) — but Bob is eliminated
            const changes = processKillerDarts('Alice', [dart(3)], state);
            // No damage to Bob
            const bobChanges = changes.filter(c => c.player === 'Bob');
            expect(bobChanges).toHaveLength(0);
        });

        test('killer can gain lives and attack in the same turn', () => {
            const state = twoPlayerState({
                killerLives: { Alice: 9, Bob: 5 },
                killerIsKiller: { Alice: true, Bob: false }
            });
            // Dart 1: hit own number (20) → +3, Dart 2: hit Bob's number (3) → -3
            const changes = processKillerDarts('Alice', [dart(20), dart(3)], state);
            expect(changes).toContainEqual({ player: 'Alice', delta: 3, reason: 'own' });
            expect(changes).toContainEqual({ player: 'Bob', delta: -3, reason: 'killed' });
        });

        test('killer hitting own number that is also adjacent to opponent — gains lives and attacks', () => {
            // Alice = 20, adj = [5, 1]. Bob = 1, adj = [20, 18].
            // Alice hits 20 (own) → +3 for Alice. Also 20 is adjacent to Bob's 1 → -1 for Bob
            const state = twoPlayerState({
                killerNumbers: { Alice: 20, Bob: 1 },
                killerLives: { Alice: 9, Bob: 5 },
                killerIsKiller: { Alice: true, Bob: false }
            });
            const changes = processKillerDarts('Alice', [dart(20)], state);
            expect(changes).toContainEqual({ player: 'Alice', delta: 3, reason: 'own' });
            expect(changes).toContainEqual({ player: 'Bob', delta: -1, reason: 'adj-killed' });
        });
    });

    // ============================================================================
    // processKillerDarts — No effect darts
    // ============================================================================

    describe('no effect darts', () => {
        test('hitting a number unrelated to any player produces no changes', () => {
            // Alice = 20, Bob = 3. Hit 10 — not related to either player
            const state = twoPlayerState();
            const changes = processKillerDarts('Alice', [dart(10)], state);
            expect(changes).toEqual([]);
        });

        test('non-killer hitting opponent number has no attacking effect', () => {
            const state = twoPlayerState({
                killerLives: { Alice: 5, Bob: 5 },
                killerIsKiller: { Alice: false, Bob: false }
            });
            // Alice is NOT a killer. Hit Bob's number (3) — no damage
            const changes = processKillerDarts('Alice', [dart(3)], state);
            expect(changes).toEqual([]);
        });
    });
});

// ============================================================================
// applyKillerChanges
// ============================================================================

describe('applyKillerChanges', () => {
    test('correctly aggregates multiple changes for same player', () => {
        const lives = { Alice: 0 };
        const isKiller = { Alice: false };
        const eliminated = { Alice: false };
        const changes = [
            { player: 'Alice', delta: 3, reason: 'own' },
            { player: 'Alice', delta: 1, reason: 'adjacent' }
        ];

        const result = applyKillerChanges(changes, lives, isKiller, eliminated);
        expect(result.lives.Alice).toBe(4);
    });

    test('caps lives at 9 (max)', () => {
        const lives = { Alice: 7 };
        const isKiller = { Alice: false };
        const eliminated = { Alice: false };
        const changes = [{ player: 'Alice', delta: 6, reason: 'own' }];

        const result = applyKillerChanges(changes, lives, isKiller, eliminated);
        expect(result.lives.Alice).toBe(9); // 7 + 6 = 13, capped to 9
    });

    test('sets killer status when lives reach 9', () => {
        const lives = { Alice: 6 };
        const isKiller = { Alice: false };
        const eliminated = { Alice: false };
        const changes = [{ player: 'Alice', delta: 3, reason: 'own' }];

        const result = applyKillerChanges(changes, lives, isKiller, eliminated);
        expect(result.lives.Alice).toBe(9);
        expect(result.isKiller.Alice).toBe(true);
    });

    test('eliminates player when lives drop to -1', () => {
        const lives = { Alice: 9, Bob: 2 };
        const isKiller = { Alice: true, Bob: false };
        const eliminated = { Alice: false, Bob: false };
        const changes = [{ player: 'Bob', delta: -3, reason: 'killed' }];

        const result = applyKillerChanges(changes, lives, isKiller, eliminated);
        expect(result.lives.Bob).toBe(-1);
        expect(result.eliminated.Bob).toBe(true);
        expect(result.newlyEliminated).toContain('Bob');
    });

    test('eliminates player when lives drop below -1', () => {
        const lives = { Bob: 1 };
        const isKiller = { Bob: false };
        const eliminated = { Bob: false };
        const changes = [{ player: 'Bob', delta: -9, reason: 'killed' }];

        const result = applyKillerChanges(changes, lives, isKiller, eliminated);
        expect(result.lives.Bob).toBe(-8);
        expect(result.eliminated.Bob).toBe(true);
    });

    test('player with exactly 0 lives is NOT eliminated', () => {
        const lives = { Bob: 3 };
        const isKiller = { Bob: false };
        const eliminated = { Bob: false };
        const changes = [{ player: 'Bob', delta: -3, reason: 'killed' }];

        const result = applyKillerChanges(changes, lives, isKiller, eliminated);
        expect(result.lives.Bob).toBe(0);
        expect(result.eliminated.Bob).toBe(false);
        expect(result.newlyEliminated).not.toContain('Bob');
    });

    test('player with exactly 9 lives IS a killer', () => {
        const lives = { Alice: 9 };
        const isKiller = { Alice: false };
        const eliminated = { Alice: false };
        const changes = []; // No changes needed, just check status update

        // Apply with starting lives at 9
        const result = applyKillerChanges(changes, lives, isKiller, eliminated);
        expect(result.isKiller.Alice).toBe(true);
    });

    test('does not re-eliminate already eliminated players', () => {
        const lives = { Bob: -5 };
        const isKiller = { Bob: false };
        const eliminated = { Bob: true };
        const changes = [{ player: 'Bob', delta: -3, reason: 'killed' }];

        const result = applyKillerChanges(changes, lives, isKiller, eliminated);
        expect(result.eliminated.Bob).toBe(true);
        expect(result.newlyEliminated).not.toContain('Bob');
    });

    test('returns newly eliminated list with multiple players', () => {
        const lives = { Alice: 9, Bob: 2, Charlie: 1 };
        const isKiller = { Alice: true, Bob: false, Charlie: false };
        const eliminated = { Alice: false, Bob: false, Charlie: false };
        const changes = [
            { player: 'Bob', delta: -6, reason: 'killed' },
            { player: 'Charlie', delta: -3, reason: 'killed' }
        ];

        const result = applyKillerChanges(changes, lives, isKiller, eliminated);
        expect(result.newlyEliminated).toContain('Bob');
        expect(result.newlyEliminated).toContain('Charlie');
        expect(result.newlyEliminated).toHaveLength(2);
    });

    test('does not mutate input objects', () => {
        const lives = { Alice: 5 };
        const isKiller = { Alice: false };
        const eliminated = { Alice: false };
        const changes = [{ player: 'Alice', delta: 4, reason: 'own' }];

        applyKillerChanges(changes, lives, isKiller, eliminated);

        // Originals should be unchanged
        expect(lives.Alice).toBe(5);
        expect(isKiller.Alice).toBe(false);
        expect(eliminated.Alice).toBe(false);
    });

    test('negative aggregated change can push lives below zero', () => {
        const lives = { Bob: 2 };
        const isKiller = { Bob: false };
        const eliminated = { Bob: false };
        const changes = [
            { player: 'Bob', delta: -3, reason: 'killed' },
            { player: 'Bob', delta: -3, reason: 'killed' }
        ];

        const result = applyKillerChanges(changes, lives, isKiller, eliminated);
        expect(result.lives.Bob).toBe(-4); // 2 + (-3) + (-3) = -4
        expect(result.eliminated.Bob).toBe(true);
    });
});

// ============================================================================
// isKillerGameOver
// ============================================================================

describe('isKillerGameOver', () => {
    test('returns false when multiple players are alive', () => {
        const eliminated = { Alice: false, Bob: false };
        expect(isKillerGameOver(['Alice', 'Bob'], eliminated)).toBe(false);
    });

    test('returns true when only 1 player is alive', () => {
        const eliminated = { Alice: false, Bob: true };
        expect(isKillerGameOver(['Alice', 'Bob'], eliminated)).toBe(true);
    });

    test('returns true when all players are eliminated (edge case)', () => {
        const eliminated = { Alice: true, Bob: true };
        expect(isKillerGameOver(['Alice', 'Bob'], eliminated)).toBe(true);
    });

    test('returns false with 3 players and only 1 eliminated', () => {
        const eliminated = { Alice: false, Bob: true, Charlie: false };
        expect(isKillerGameOver(['Alice', 'Bob', 'Charlie'], eliminated)).toBe(false);
    });

    test('returns true with 3 players and 2 eliminated', () => {
        const eliminated = { Alice: false, Bob: true, Charlie: true };
        expect(isKillerGameOver(['Alice', 'Bob', 'Charlie'], eliminated)).toBe(true);
    });
});

// ============================================================================
// getKillerWinner
// ============================================================================

describe('getKillerWinner', () => {
    test('returns last player standing', () => {
        const eliminated = { Alice: false, Bob: true };
        expect(getKillerWinner(['Alice', 'Bob'], eliminated)).toBe('Alice');
    });

    test('returns null when game is not over (multiple alive)', () => {
        const eliminated = { Alice: false, Bob: false };
        expect(getKillerWinner(['Alice', 'Bob'], eliminated)).toBeNull();
    });

    test('returns null when all players are eliminated', () => {
        const eliminated = { Alice: true, Bob: true };
        expect(getKillerWinner(['Alice', 'Bob'], eliminated)).toBeNull();
    });

    test('returns correct winner in 3-player game', () => {
        const eliminated = { Alice: true, Bob: false, Charlie: true };
        expect(getKillerWinner(['Alice', 'Bob', 'Charlie'], eliminated)).toBe('Bob');
    });
});

// ============================================================================
// Full game scenarios
// ============================================================================

describe('full game scenarios', () => {
    test('two-player game: Alice builds to killer and eliminates Bob', () => {
        const players = ['Alice', 'Bob'];
        let lives = { Alice: 0, Bob: 0 };
        let isKiller = { Alice: false, Bob: false };
        let eliminated = { Alice: false, Bob: false };
        const numbers = { Alice: 20, Bob: 3 };

        const makeState = () => ({
            players, killerNumbers: numbers, killerIsKiller: isKiller,
            killerLives: lives, killerEliminated: eliminated
        });

        // Turn 1: Alice hits triple 20 (+9) → becomes killer
        let changes = processKillerDarts('Alice', [dart(20, 'triple')], makeState());
        let result = applyKillerChanges(changes, lives, isKiller, eliminated);
        lives = result.lives; isKiller = result.isKiller; eliminated = result.eliminated;

        expect(lives.Alice).toBe(9);
        expect(isKiller.Alice).toBe(true);
        expect(isKillerGameOver(players, eliminated)).toBe(false);

        // Turn 2: Bob hits single 3 (+3)
        changes = processKillerDarts('Bob', [dart(3)], makeState());
        result = applyKillerChanges(changes, lives, isKiller, eliminated);
        lives = result.lives; isKiller = result.isKiller; eliminated = result.eliminated;

        expect(lives.Bob).toBe(3);

        // Turn 3: Alice hits Bob's number 3 three times (-3 × 3 = -9)
        changes = processKillerDarts('Alice', [dart(3), dart(3), dart(3)], makeState());
        result = applyKillerChanges(changes, lives, isKiller, eliminated);
        lives = result.lives; isKiller = result.isKiller; eliminated = result.eliminated;

        expect(lives.Bob).toBe(-6);
        expect(eliminated.Bob).toBe(true);
        expect(result.newlyEliminated).toContain('Bob');
        expect(isKillerGameOver(players, eliminated)).toBe(true);
        expect(getKillerWinner(players, eliminated)).toBe('Alice');
    });

    test('player becomes killer mid-turn and attacks in same turn', () => {
        const players = ['Alice', 'Bob'];
        const numbers = { Alice: 20, Bob: 3 };
        const lives = { Alice: 6, Bob: 2 };
        const isKiller = { Alice: false, Bob: false };
        const eliminated = { Alice: false, Bob: false };
        const state = { players, killerNumbers: numbers, killerIsKiller: isKiller, killerLives: lives, killerEliminated: eliminated };

        // Dart 1: triple 20 (own) = +9 → running = 15 → becomes killer
        // Dart 2: single 3 (Bob's) → -3 → Bob goes from 2 to -1 → eliminated
        const changes = processKillerDarts('Alice', [dart(20, 'triple'), dart(3)], state);
        const result = applyKillerChanges(changes, lives, isKiller, eliminated);

        expect(result.lives.Alice).toBe(9); // 6 + 9 = 15, capped at 9
        expect(result.isKiller.Alice).toBe(true);
        expect(result.lives.Bob).toBe(-1);
        expect(result.eliminated.Bob).toBe(true);
        expect(result.newlyEliminated).toContain('Bob');
    });

    test('multiple players eliminated in same turn', () => {
        const players = ['Alice', 'Bob', 'Charlie'];
        // Alice is killer. Bob and Charlie both have 2 lives.
        // Bob = 3 (adj = [17, 19]), Charlie = 17 (adj = [2, 3])
        // If Alice hits 3: Bob gets -3 (own), Charlie gets -1 (adjacent to 17)
        const numbers = { Alice: 20, Bob: 3, Charlie: 17 };
        const lives = { Alice: 9, Bob: 2, Charlie: 0 };
        const isKiller = { Alice: true, Bob: false, Charlie: false };
        const eliminated = { Alice: false, Bob: false, Charlie: false };
        const state = { players, killerNumbers: numbers, killerIsKiller: isKiller, killerLives: lives, killerEliminated: eliminated };

        // Dart 1: hit 3 → Bob -3 (killed), Charlie -1 (adj-killed since 3 is adj to 17)
        // Dart 2: hit 17 → Charlie -3 (killed), Bob -1 (adj-killed since 17 is adj to 3)
        const changes = processKillerDarts('Alice', [dart(3), dart(17)], state);
        const result = applyKillerChanges(changes, lives, isKiller, eliminated);

        // Bob: 2 + (-3) + (-1) = -2 → eliminated
        expect(result.lives.Bob).toBe(-2);
        expect(result.eliminated.Bob).toBe(true);
        // Charlie: 0 + (-1) + (-3) = -4 → eliminated
        expect(result.lives.Charlie).toBe(-4);
        expect(result.eliminated.Charlie).toBe(true);
        expect(result.newlyEliminated).toHaveLength(2);
        expect(isKillerGameOver(players, result.eliminated)).toBe(true);
        expect(getKillerWinner(players, result.eliminated)).toBe('Alice');
    });

    test('both killers can attack each other', () => {
        const players = ['Alice', 'Bob'];
        // Both are killers. Alice = 20, Bob = 1 (adjacent to 20)
        const numbers = { Alice: 20, Bob: 1 };
        const lives = { Alice: 9, Bob: 9 };
        const isKiller = { Alice: true, Bob: true };
        const eliminated = { Alice: false, Bob: false };

        // Alice's turn: hits Bob's number (1), also adjacent to her own (20)
        const state = { players, killerNumbers: numbers, killerIsKiller: isKiller, killerLives: lives, killerEliminated: eliminated };
        const changes = processKillerDarts('Alice', [dart(1)], state);

        // Alice gains +1 (adjacent to own 20)
        expect(changes).toContainEqual({ player: 'Alice', delta: 1, reason: 'adjacent' });
        // Bob loses -3 (own number hit by killer)
        expect(changes).toContainEqual({ player: 'Bob', delta: -3, reason: 'killed' });

        const result = applyKillerChanges(changes, lives, isKiller, eliminated);
        expect(result.lives.Alice).toBe(9); // 9 + 1 = 10, capped at 9
        expect(result.lives.Bob).toBe(6);
    });

    test('game with all misses does not change state', () => {
        const state = twoPlayerState({ killerLives: { Alice: 4, Bob: 3 } });
        const changes = processKillerDarts('Alice', [miss(), miss(), miss()], state);
        expect(changes).toEqual([]);

        const result = applyKillerChanges(changes, state.killerLives, state.killerIsKiller, state.killerEliminated);
        expect(result.lives.Alice).toBe(4);
        expect(result.lives.Bob).toBe(3);
        expect(result.newlyEliminated).toHaveLength(0);
    });
});
