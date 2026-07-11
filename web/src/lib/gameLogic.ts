import type { GameState, Card } from "../types";
import { buildDeck, drawCard } from "./deck";

export function initialState(): GameState {
  return {
    deck: buildDeck(),
    playerHand: [],
    aiHand: [],
    playerTotal: 0,
    aiTotal: 0,
    roundScore: 0,
    aiRoundScore: 0,
    phase: "idle",
    guardCount: 0,
    aiGuardCount: 0,
    message: "Draw a card to begin the heist!",
    round: 1,
  };
}

function ensureDeck(state: GameState): GameState {
  if (state.deck.length < 10) {
    return { ...state, deck: buildDeck() };
  }
  return state;
}

export function startRound(state: GameState): GameState {
  const fresh = ensureDeck(state);
  return {
    ...fresh,
    playerHand: [],
    aiHand: [],
    roundScore: 0,
    aiRoundScore: 0,
    guardCount: 0,
    aiGuardCount: 0,
    phase: "player",
    message: "Draw a card — or Bank if you're feeling lucky!",
  };
}

export function playerDraw(state: GameState): GameState {
  if (state.phase !== "player") return state;

  const result = drawCard(state.deck);
  if (!result) return state;

  const { card, remaining } = result;
  const newHand = [...state.playerHand, card];
  const newGuards = state.guardCount + (card.kind === "guard" ? 1 : 0);
  const newRound = state.roundScore + card.value;

  if (newGuards >= 2) {
    // Busted!
    return {
      ...state,
      deck: remaining,
      playerHand: newHand,
      guardCount: newGuards,
      roundScore: 0,
      phase: "busted",
      message: "Busted! Two guards caught you — round score lost.",
    };
  }

  if (newGuards === 1) {
    return {
      ...state,
      deck: remaining,
      playerHand: newHand,
      guardCount: newGuards,
      roundScore: newRound,
      phase: "player",
      message: "One guard spotted! Draw carefully or bank now.",
    };
  }

  return {
    ...state,
    deck: remaining,
    playerHand: newHand,
    guardCount: newGuards,
    roundScore: newRound,
    phase: "player",
    message: `Round score: ${newRound}. Keep going or bank?`,
  };
}

export function playerBank(state: GameState): GameState {
  if (state.phase !== "player") return state;
  const newTotal = state.playerTotal + state.roundScore;
  if (newTotal >= 100) {
    return {
      ...state,
      playerTotal: newTotal,
      roundScore: 0,
      phase: "won",
      message: `You banked ${state.roundScore} pts and reached ${newTotal}! You WIN!`,
    };
  }
  return {
    ...state,
    playerTotal: newTotal,
    roundScore: 0,
    phase: "ai",
    message: `Banked! You have ${newTotal} pts. AI is planning its heist...`,
  };
}

export function endRoundAfterBust(state: GameState): GameState {
  // After player busts, AI gets to play
  return {
    ...state,
    phase: "ai",
    message: "AI is planning its heist...",
  };
}

// AI logic: draw until score ≥ target OR bust. Target depends on score gap.
export function runAiTurn(state: GameState): GameState {
  let s = { ...state };
  const gap = s.playerTotal - s.aiTotal;
  // AI target: tries to get at least enough to close gap, or 15–25 pts
  const target = Math.max(15, Math.min(30, gap + 10));

  while (true) {
    const result = drawCard(s.deck);
    if (!result) break;

    const { card, remaining } = result;
    const newHand = [...s.aiHand, card];
    const newGuards = s.aiGuardCount + (card.kind === "guard" ? 1 : 0);
    const newRound = s.aiRoundScore + card.value;

    s = { ...s, deck: remaining, aiHand: newHand };

    if (newGuards >= 2) {
      // AI busts
      s = { ...s, aiGuardCount: newGuards, aiRoundScore: 0 };
      break;
    }

    s = { ...s, aiGuardCount: newGuards, aiRoundScore: newRound };

    // AI banks if target met or one guard already seen and score decent
    if (newRound >= target || (newGuards === 1 && newRound >= 10)) {
      const newTotal = s.aiTotal + newRound;
      s = { ...s, aiTotal: newTotal, aiRoundScore: 0 };
      break;
    }
  }

  // Check win condition
  if (s.aiTotal >= 100) {
    return {
      ...s,
      phase: "lost",
      message: `AI reached ${s.aiTotal} pts — you got caught! Better luck next time.`,
    };
  }

  return {
    ...s,
    phase: "idle",
    round: s.round + 1,
    message: `Round ${s.round + 1} — You: ${s.playerTotal} | AI: ${s.aiTotal}. Start your next heist!`,
  };
}

export function cardValue(card: Card): string {
  if (card.kind === "guard") return "GUARD";
  return `+${card.value}`;
}
