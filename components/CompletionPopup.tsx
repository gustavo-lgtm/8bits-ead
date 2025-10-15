"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Lottie from "lottie-react";

const BRAND = "#ffab40";

type Props = {
  open: boolean;
  xp: number;
  title?: string;
  subtitle?: string;
  onGoNext: () => void;
  onClose: () => void;
  // passe um JSON de lottie (import) ou deixe vazio para fallback
  lottieAnimation?: object;
};

export default function CompletionPopup({
  open,
  xp,
  title = "Unidade concluída!",
  subtitle = "Parabéns, você ganhou:",
  onGoNext,
  onClose,
  lottieAnimation,
}: Props) {
  const [displayXp, setDisplayXp] = useState(0);

  useEffect(() => {
    if (!open) return;
    setDisplayXp(0);
    let start: number | null = null;
    let rafId = 0;
    const dur = 1200;
    const tick = (t: number) => {
      if (start === null) start = t;
      const p = Math.min((t - start) / dur, 1);
      setDisplayXp(Math.round(p * xp));
      if (p < 1) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [open, xp]);

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
              {/* ícone: Lottie se vier; senão, fallback com “medalha” animada */}
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center">
                {lottieAnimation ? (
                  <Lottie animationData={lottieAnimation} loop={false} autoplay style={{ width: 64, height: 64 }} />
                ) : (
                  <motion.div
                    className="h-14 w-14 rounded-2xl"
                    style={{ backgroundColor: BRAND }}
                    initial={{ scale: 0.6, rotate: -8, opacity: 0 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 16 }}
                  >
                    <motion.div
                      className="h-full w-full rounded-2xl"
                      style={{
                        background:
                          "linear-gradient(145deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 40%)",
                        mixBlendMode: "soft-light",
                      }}
                      initial={{ opacity: 0.3 }}
                      animate={{ opacity: [0.3, 0.8, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                    />
                  </motion.div>
                )}
              </div>

              <div className="text-base font-bold text-neutral-900">{title}</div>
              <div className="mt-1 text-sm text-neutral-700">{subtitle}</div>
              <motion.div
                className="mt-2 text-4xl font-extrabold tracking-tight text-neutral-900"
                initial={{ scale: 0.96 }}
                animate={{ scale: [0.96, 1.06, 1] }}
                transition={{ times: [0, 0.7, 1], duration: 0.8 }}
              >
                {displayXp} XP
              </motion.div>
            </div>

            <div className="mt-5 flex flex-col sm:flex-row sm:justify-center gap-2">
              <button
                onClick={onGoNext}
                className="inline-flex justify-center rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-md hover:opacity-95"
                style={{ backgroundColor: BRAND }}
              >
                Próximas unidades
              </button>
              <button
                onClick={onClose}
                className="inline-flex justify-center rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
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
