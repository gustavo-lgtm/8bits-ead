"use client";

import { Gift, X } from "lucide-react";

type Props = {
  open: boolean;
  fromName: string;
  message: string;
  onClose: () => void;
};

export default function GiftMessageModal({ open, fromName, message, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* backdrop */}
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
        aria-label="Fechar"
      />

      {/* modal */}
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl border border-neutral-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-neutral-100 cursor-pointer"
          aria-label="Fechar"
        >
          <X className="h-5 w-5 text-neutral-700" />
        </button>

        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 border border-orange-200">
              <Gift className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <div className="text-sm font-semibold text-neutral-900">Você recebeu um presente</div>
              <div className="text-xs text-neutral-500">Mensagem especial para você</div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
            <div className="whitespace-pre-wrap text-sm text-neutral-800">{message}</div>
            <div className="mt-3 text-xs text-neutral-600">
              <span className="font-semibold">De:</span> {fromName}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-[#ffab40] px-4 py-2.5 text-sm font-semibold text-white shadow hover:opacity-90 cursor-pointer"
          >
            Abrir as missões
          </button>
        </div>
      </div>
    </div>
  );
}