import { useEffect, useState } from "react";
import type { Card } from "../types";

interface Props {
  card: Card;
  faceDown?: boolean;
  delay?: number; // ms before flip starts
  small?: boolean;
}

export function PlayingCard({ card, faceDown = false, delay = 0, small = false }: Props) {
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setFlipped(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  const isRed = card.suit === "♥" || card.suit === "♦";
  const isGuard = card.kind === "guard";

  const sizeClass = small
    ? "w-10 h-14 text-xs"
    : "w-16 h-24 text-base sm:w-20 sm:h-28";

  const innerClass = `relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${
    flipped && !faceDown ? "" : "[transform:rotateY(180deg)]"
  }`;

  return (
    <div
      className={`${sizeClass} rounded-xl flex-shrink-0`}
      style={{ perspective: "600px" }}
    >
      <div className={innerClass}>
        {/* Front */}
        <div
          className={`absolute inset-0 rounded-xl flex flex-col items-center justify-center border-2 [backface-visibility:hidden] ${
            isGuard
              ? "bg-red-700 border-red-900 text-white"
              : "bg-white border-gray-300"
          }`}
        >
          {isGuard ? (
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-2xl sm:text-3xl">🛡️</span>
              <span className="font-bold text-white text-xs">GUARD</span>
            </div>
          ) : (
            <div
              className={`flex flex-col items-center gap-1 ${isRed ? "text-red-600" : "text-gray-900"}`}
            >
              <span
                className="font-bold leading-none"
                style={{ fontFamily: "Fraunces, serif", fontSize: small ? "1rem" : "1.5rem" }}
              >
                {card.label}
              </span>
              <span className="text-lg leading-none">{card.suit}</span>
            </div>
          )}
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 rounded-xl border-2 border-blue-800 [backface-visibility:hidden] [transform:rotateY(180deg)] overflow-hidden"
          style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #1e3a8a 100%)" }}
        >
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-3/4 h-3/4 border-2 border-blue-400 rounded-lg opacity-40" />
          </div>
        </div>
      </div>
    </div>
  );
}
