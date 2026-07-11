import { useCallback, useEffect, useRef, useState } from "react";
import { GameShell, GameTopbar } from "@freegamestore/games";
import { PlayingCard } from "./components/PlayingCard";
import { useHighScore } from "./hooks/useHighScore";
import {
  initialState,
  startRound,
  playerDraw,
  playerBank,
  endRoundAfterBust,
  runAiTurn,
} from "./lib/gameLogic";
import type { GameState, Card } from "./types";

// ─── Score Bar ────────────────────────────────────────────────────────────────
function ScoreBar({ state }: { state: GameState }) {
  const playerPct = Math.min(100, (state.playerTotal / 100) * 100);
  const aiPct = Math.min(100, (state.aiTotal / 100) * 100);

  return (
    <div className="flex flex-col gap-1.5 w-full max-w-xl mx-auto px-4 py-2">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold w-16 text-right" style={{ color: "var(--accent)" }}>
          YOU
        </span>
        <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: "var(--line)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${playerPct}%`, background: "var(--accent)" }}
          />
        </div>
        <span className="text-xs font-bold w-8" style={{ color: "var(--accent)" }}>
          {state.playerTotal}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold w-16 text-right" style={{ color: "var(--error)" }}>
          AI
        </span>
        <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: "var(--line)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${aiPct}%`, background: "var(--error)" }}
          />
        </div>
        <span className="text-xs font-bold w-8" style={{ color: "var(--error)" }}>
          {state.aiTotal}
        </span>
      </div>
    </div>
  );
}

// ─── Card Hand ────────────────────────────────────────────────────────────────
function CardHand({
  cards,
  label,
  roundScore,
  guardCount,
  faceDown = false,
}: {
  cards: Card[];
  label: string;
  roundScore: number;
  guardCount: number;
  faceDown?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2 w-full">
      <div className="flex items-center gap-3">
        <span className="text-sm font-bold" style={{ color: "var(--muted)" }}>
          {label}
        </span>
        {roundScore > 0 && (
          <span
            className="text-sm font-bold px-2 py-0.5 rounded-full"
            style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
          >
            +{roundScore}
          </span>
        )}
        {guardCount > 0 && (
          <span className="text-sm">
            {"🛡️".repeat(guardCount)}
          </span>
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-1.5 min-h-[56px]">
        {cards.length === 0 ? (
          <div
            className="w-10 h-14 rounded-lg border-2 border-dashed flex items-center justify-center"
            style={{ borderColor: "var(--line-strong)" }}
          >
            <span style={{ color: "var(--muted)", fontSize: "0.65rem" }}>empty</span>
          </div>
        ) : (
          cards.map((card, i) => (
            <PlayingCard
              key={card.id}
              card={card}
              faceDown={faceDown}
              delay={i * 120}
              small
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Message Banner ───────────────────────────────────────────────────────────
function MessageBanner({ message, phase }: { message: string; phase: string }) {
  const color =
    phase === "busted"
      ? "var(--error)"
      : phase === "won"
        ? "var(--success)"
        : phase === "lost"
          ? "var(--error)"
          : "var(--ink)";

  return (
    <div
      className="text-center text-sm font-semibold px-4 py-2 rounded-xl max-w-sm mx-auto"
      style={{ color, background: "var(--panel)", minHeight: "2.5rem" }}
    >
      {message}
    </div>
  );
}

// ─── Win / Loss Screen ────────────────────────────────────────────────────────
function EndScreen({
  won,
  playerTotal,
  aiTotal,
  highScore,
  onRestart,
}: {
  won: boolean;
  playerTotal: number;
  aiTotal: number;
  highScore: number;
  onRestart: () => void;
}) {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-6 z-20"
      style={{ background: "var(--glass)", backdropFilter: "blur(8px)" }}
    >
      <div className="text-6xl">{won ? "🏆" : "🚨"}</div>
      <h2
        className="text-4xl font-bold"
        style={{ fontFamily: "Fraunces, serif", color: won ? "var(--success)" : "var(--error)" }}
      >
        {won ? "Heist Complete!" : "Busted!"}
      </h2>
      <div className="flex flex-col items-center gap-1 text-sm" style={{ color: "var(--muted)" }}>
        <p>Your score: <strong style={{ color: "var(--ink)" }}>{playerTotal}</strong></p>
        <p>AI score: <strong style={{ color: "var(--ink)" }}>{aiTotal}</strong></p>
        <p>Best: <strong style={{ color: "var(--accent)" }}>{highScore}</strong></p>
      </div>
      <button
        onClick={onRestart}
        className="px-8 py-3 rounded-2xl text-white font-bold text-lg transition-transform active:scale-95"
        style={{ background: "var(--accent)", minHeight: "44px" }}
      >
        Play Again
      </button>
    </div>
  );
}

// ─── Action Buttons ───────────────────────────────────────────────────────────
function ActionButtons({
  phase,
  onDraw,
  onBank,
  onStart,
  onNext,
}: {
  phase: GameState["phase"];
  onDraw: () => void;
  onBank: () => void;
  onStart: () => void;
  onNext: () => void;
}) {
  if (phase === "idle") {
    return (
      <button
        onClick={onStart}
        className="px-8 py-3 rounded-2xl text-white font-bold text-lg transition-transform active:scale-95"
        style={{ background: "var(--accent)", minHeight: "44px" }}
      >
        🃏 Start Round
      </button>
    );
  }

  if (phase === "player") {
    return (
      <div className="flex gap-3">
        <button
          onClick={onDraw}
          className="px-6 py-3 rounded-2xl text-white font-bold text-base transition-transform active:scale-95"
          style={{ background: "#1d4ed8", minHeight: "44px" }}
        >
          🃏 Draw Card
        </button>
        <button
          onClick={onBank}
          className="px-6 py-3 rounded-2xl font-bold text-base transition-transform active:scale-95"
          style={{ background: "var(--success)", color: "#fff", minHeight: "44px" }}
        >
          🏦 Bank
        </button>
      </div>
    );
  }

  if (phase === "busted" || phase === "banked") {
    return (
      <button
        onClick={onNext}
        className="px-8 py-3 rounded-2xl text-white font-bold text-base transition-transform active:scale-95"
        style={{ background: "var(--accent)", minHeight: "44px" }}
      >
        Next →
      </button>
    );
  }

  if (phase === "ai") {
    return (
      <div
        className="px-6 py-3 rounded-2xl font-semibold text-sm"
        style={{ background: "var(--panel)", color: "var(--muted)" }}
      >
        ⏳ AI is playing...
      </div>
    );
  }

  return null;
}

// ─── Round indicator ──────────────────────────────────────────────────────────
function RoundBadge({ round }: { round: number }) {
  return (
    <div
      className="text-xs font-bold px-3 py-1 rounded-full"
      style={{ background: "var(--panel)", color: "var(--muted)" }}
    >
      Round {round}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [state, setState] = useState<GameState>(initialState);
  const [highScore, updateHighScore] = useHighScore("royal-heist_highscore");
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Kick off AI turn with a small delay so player can see what happened
  useEffect(() => {
    if (state.phase === "ai") {
      aiTimerRef.current = setTimeout(() => {
        setState((s) => runAiTurn(s));
      }, 1400);
    }
    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    };
  }, [state.phase]);

  // Track high score on win
  useEffect(() => {
    if (state.phase === "won") {
      updateHighScore(state.playerTotal);
    }
  }, [state.phase, state.playerTotal, updateHighScore]);

  const handleStart = useCallback(() => {
    setState((s) => startRound(s));
  }, []);

  const handleDraw = useCallback(() => {
    setState((s) => playerDraw(s));
  }, []);

  const handleBank = useCallback(() => {
    setState((s) => playerBank(s));
  }, []);

  const handleNext = useCallback(() => {
    setState((s) => endRoundAfterBust(s));
  }, []);

  const handleRestart = useCallback(() => {
    setState(initialState());
  }, []);

  const isOver = state.phase === "won" || state.phase === "lost";

  return (
    <GameShell topbar={<GameTopbar title="Royal Heist" score={state.playerTotal} />}>
      <div className="relative flex flex-col h-full overflow-hidden" style={{ background: "var(--paper)" }}>

        {/* Score bars */}
        <ScoreBar state={state} />

        <div className="flex-1 flex flex-col items-center justify-between px-4 py-2 gap-3 overflow-hidden">

          {/* AI hand */}
          <div
            className="w-full max-w-xl rounded-2xl p-3"
            style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
          >
            <CardHand
              cards={state.aiHand}
              label="AI Crew"
              roundScore={state.aiRoundScore}
              guardCount={state.aiGuardCount}
              faceDown={state.phase === "ai"}
            />
          </div>

          {/* Center: message + round + controls */}
          <div className="flex flex-col items-center gap-3 w-full max-w-xl">
            <RoundBadge round={state.round} />
            <MessageBanner message={state.message} phase={state.phase} />
            <ActionButtons
              phase={state.phase}
              onDraw={handleDraw}
              onBank={handleBank}
              onStart={handleStart}
              onNext={handleNext}
            />
          </div>

          {/* Player hand */}
          <div
            className="w-full max-w-xl rounded-2xl p-3"
            style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
          >
            <CardHand
              cards={state.playerHand}
              label="Your Crew"
              roundScore={state.roundScore}
              guardCount={state.guardCount}
            />
          </div>
        </div>

        {/* Win / Loss overlay */}
        {isOver && (
          <EndScreen
            won={state.phase === "won"}
            playerTotal={state.playerTotal}
            aiTotal={state.aiTotal}
            highScore={highScore}
            onRestart={handleRestart}
          />
        )}
      </div>
    </GameShell>
  );
}
