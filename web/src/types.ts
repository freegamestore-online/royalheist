export type Suit = "♠" | "♥" | "♦" | "♣";
export type CardKind = "number" | "guard";

export interface Card {
  id: string;
  suit: Suit;
  value: number; // 2–10 for number cards, 0 for guard
  kind: CardKind;
  label: string; // "7", "G", etc.
}

export type Phase =
  | "idle"       // waiting to start a round
  | "player"     // player's turn
  | "ai"         // AI playing
  | "busted"     // player busted this round
  | "banked"     // player banked this round
  | "won"        // player reached 100
  | "lost";      // AI reached 100

export interface GameState {
  deck: Card[];
  playerHand: Card[];
  aiHand: Card[];
  playerTotal: number;   // banked score
  aiTotal: number;
  roundScore: number;    // current round accumulation (player)
  aiRoundScore: number;
  phase: Phase;
  guardCount: number;    // guards drawn this round (player)
  aiGuardCount: number;
  message: string;
  round: number;
}
