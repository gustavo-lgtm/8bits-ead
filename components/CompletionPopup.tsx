// components/CompletionPopup.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Lottie, { LottieRefCurrentProps } from "lottie-react";

const BRAND = "#ffab40";

type Props = {
  open: boolean;
  xp: number;
  title?: string;
  subtitle?: string;
  onGoNext: () => void;
  onClose: () => void;

  // Lottie
  lottieAnimation?: object;   // JSON da animação
  lottieSize?: number;        // px (default 128)
  lottieSpeed?: number;       // 1 = normal (default 0.6 = mais lenta)

  // Contagem de XP
  xpDelayMs?: number;         // atraso para iniciar XP depois que a Lottie COMEÇA (default 1000ms)
  xpCountDurationMs?: number; // duração da contagem (default 1200ms)
};

export default function CompletionPopup({
  open,
  xp,
  title = "Unidade concluída!",
  subtitle = "Parabéns, você ganhou:",
  onGoNext,
  onClose,
  lottieAnimation,
  lottieSize = 128,
  lottieSpeed = 0.6,
  xpDelayMs = 1000,
  xpCountDurationMs = 1200,
}: Props) {
  const [displayXp, setDisplayXp] = useState(0);
  const [canStartXp, setCanStartXp] = useState(false); // habilita a contagem
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const delayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // reset a cada abertura
  useEffect(() => {
    if (!open) return;
    setDisplayXp(0);
    setCanStartXp(false);

    // se não tiver Lottie, inicia sem atraso
    if (!lottieAnimation) {
      delayTimerRef.current = setTimeout(() => setCanStartXp(true), Math.max(0, xpDelayMs));
    }

    return () => {
      if (delayTimerRef.current) {
        clearTimeout(delayTimerRef.current);
        delayTimerRef.current = null;
      }
    };
  }, [open, lottieAnimation, xpDelayMs]);

  // contador do XP — só inicia quando canStartXp = true
  useEffect(() => {
    if (!open || !canStartXp) return;
    let start: number | null = null;
    let rafId = 0;
    const dur = Math.max(200, xpCountDurationMs);
    const tick = (t: number) => {
      if (start === null) start = t;
      const p = Math.min((t - start) / dur, 1);
      setDisplayXp(Math.round(p * xp));
      if (p < 1) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [open, canStartXp, xp, xpCountDurationMs]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
            initial={{ y: 24, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
          >
            <div className="text-center">
              {/* Ícone / Animação */}
              <div
                className="mx-auto mb-3 flex items-center justify-center"
                style={{ width: lottieSize, height: lottieSize }}
              >
                {lottieAnimation ? (
                  <Lottie
                    lottieRef={lottieRef}
                    animationData={lottieAnimation}
                    loop={false}
                    autoplay
                    style={{ width: lottieSize, height: lottieSize }}
                    onDOMLoaded={() => {
                      // define velocidade assim que a animação inicia…
                      lottieRef.current?.setSpeed?.(lottieSpeed);
                      // …e agenda início da contagem de XP após o atraso desejado
                      if (delayTimerRef.current) clearTimeout(delayTimerRef.current);
                      delayTimerRef.current = setTimeout(
                        () => setCanStartXp(true),
                        Math.max(0, xpDelayMs)
                      );
                    }}
                  />
                ) : (
                  // fallback mínimo se não passar JSON
                  <motion.div
                    className="rounded-2xl"
                    style={{ width: lottieSize, height: lottieSize, backgroundColor: BRAND }}
                    initial={{ scale: 0.7, rotate: -8, opacity: 0 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 16 }}
                  />
                )}
              </div>

              <div className="text-base font-bold text-neutral-900">{title}</div>
              <div className="mt-1 text-sm text-neutral-700">{subtitle}</div>

              {/* Número de XP (inicia 1s após a Lottie começar) */}
              <motion.div
                className="mt-2 text-4xl font-extrabold tracking-tight text-neutral-900"
                initial={{ scale: 0.96, opacity: 0.9 }}
                animate={
                  canStartXp
                    ? { scale: [0.96, 1.06, 1], opacity: 1 }
                    : { scale: 0.96, opacity: 0.9 }
                }
                transition={{ times: [0, 0.7, 1], duration: 0.8 }}
              >
                {displayXp} XP
              </motion.div>
            </div>

            <div className="mt-5 flex flex-col sm:flex-row sm:justify-center gap-2">
              <button
                onClick={onGoNext}
                className="inline-flex justify-center rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-md hover:opacity-95 cursor-pointer"
                style={{ backgroundColor: BRAND }}
              >
                Próximas unidades
              </button>
              <button
                onClick={onClose}
                className="inline-flex justify-center rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50 cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
