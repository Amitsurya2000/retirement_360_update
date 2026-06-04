"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import confetti from "canvas-confetti";

export function CongratsModal({
  name,
  subtitle,
  onClose,
}: {
  name?: string | null;
  subtitle: string;
  onClose: () => void;
}) {
  useEffect(() => {
    // Confetti "blast" — a few bursts for a celebratory feel.
    const fire = (particleRatio: number, opts: confetti.Options) => {
      confetti({
        origin: { y: 0.6 },
        ...opts,
        particleCount: Math.floor(220 * particleRatio),
      });
    };
    const blast = () => {
      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });
    };
    blast();
    const t1 = setTimeout(blast, 450);
    const t2 = setTimeout(blast, 900);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-md px-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-6xl mb-3">🎉</div>
        <h2 className="text-2xl font-bold text-emerald-700 mb-2">
          Congratulations{name ? `, ${name}` : ""}! 🎊
        </h2>
        <p className="text-lg font-semibold text-slate-900 mb-1">You&apos;re eligible! 🥳</p>
        <p className="text-slate-600 mb-6">{subtitle}</p>
        <button onClick={onClose} className="btn-primary w-full">
          See my plan →
        </button>
      </div>
    </div>,
    document.body
  );
}
