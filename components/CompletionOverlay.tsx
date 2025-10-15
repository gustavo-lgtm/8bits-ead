"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

type Props = {
  open: boolean;
  xp: number;
  streakDelta?: number;
  onFinish?: () => void;
};

export default function CompletionOverlay({ open, xp, streakDelta = 0, onFinish }: Props) {
  const [displayXp, setDisplayXp] = useState(0);

  useEffect(() => {
    if (!open) return;
    let start: number | null = null;
    const dur = 1200;
    const raf = (t: number) => {
      if (start === null) start = t;
      const p = Math.min((t - start) / dur, 1);
      setDisplayXp(Math.round(p * xp));
      if (p < 1) requestAnimationFrame(raf);
    };
    const id = requestAnimationFrame(raf);
    const end = setTimeout(() => onFinish?.(), 2000);
    return () => {
      cancelAnimationFrame(id);
      clearTimeout(end);
    };
  }, [open, xp, onFinish]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center 
                     bg-gradient-to-br from-background via-background/95 to-background"
        >
          {/* glow pulsante */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: [0.6, 1, 0.6], scale: [0.98, 1.02, 0.98] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute w-[60vmin] h-[60vmin] rounded-full blur-3xl bg-primary/20"
          />
          <div className="relative mx-6 w-full max-w-md text-center">
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
              className="inline-block rounded-2xl px-4 py-2 
                         bg-primary/15 border border-primary/30 text-primary font-semibold"
            >
              Nível concluído
            </motion.div>
            <motion.div
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.25 }}
              className="mt-4 text-4xl sm:text-5xl font-extrabold tracking-tight"
            >
              +{displayXp} XP
            </motion.div>
            <div className="mt-6 flex items-center justify-center gap-3">
              <motion.span
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.25 }}
                className="rounded-xl bg-foreground/5 px-3 py-1 text-sm"
              >
                Pontos adicionados
              </motion.span>
              {streakDelta > 0 && (
                <motion.span
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.22, duration: 0.25 }}
                  className="rounded-xl bg-foreground/5 px-3 py-1 text-sm"
                >
                  Streak +1
                </motion.span>
              )}
              <motion.span
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.29, duration: 0.25 }}
                className="rounded-xl bg-foreground/5 px-3 py-1 text-sm"
              >
                Próxima missão liberada
              </motion.span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
