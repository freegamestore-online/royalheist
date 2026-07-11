import type { Card, Suit } from "../types";

const SUITS: Suit[] = ["♠", "♥", "♦", "♣"];

export function buildDeck(): Card[] {
  const cards: Card[] = [];
  let id = 0;

  for (const suit of SUITS) {
    // Number cards: 2–10
    for (let v = 2; v <= 10; v++) {
      cards.push({
        id: `${id++}`,
        suit,
        value: v,
        kind: "number",
        label: String(v),
      });
    }
    // Guard card per suit
    cards.push({
      id: `${id++}`,
      suit,
      value: 0,
      kind: "guard",
      label: "G",
    });
  }

  return shuffle(cards);
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i]!;
    a[i] = a[j]!;
    a[j] = tmp;
  }
  return a;
}

export function drawCard(deck: Card[]): { card: Card; remaining: Card[] } | null {
  if (deck.length === 0) return null;
  const [card, ...remaining] = deck;
  return { card: card!, remaining };
}
