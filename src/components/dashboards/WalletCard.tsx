import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Sparkles, X, CreditCard, RotateCcw, Phone, Mail, Globe, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface WalletCardProps {
  name: string;
  cardNumber?: string;
  validUntil?: string;
  planName?: string;
  gradient?: string;
  orb1?: string;
  orb2?: string;
  onClick?: () => void;
}

function CardFace({ name, cardNumber, validUntil, planName, gradient, orb1, orb2, large = false }: {
  name: string; cardNumber: string; validUntil?: string; planName?: string;
  gradient: string; orb1: string; orb2: string; large?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-gradient-to-br",
        gradient,
        large ? "rounded-[28px] p-7" : "rounded-[22px] p-[18px]"
      )}
      style={{ boxShadow: large
        ? "0 20px 60px rgba(18,85,200,.4), 0 8px 24px rgba(0,0,0,.15), inset 0 1px 0 rgba(255,255,255,.2)"
        : "0 12px 40px rgba(18,85,200,.35)"
      }}
    >
      {/* Orbs */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-60" style={{ background: orb1, filter: "blur(32px)" }} />
      <div className="pointer-events-none absolute -bottom-6 -left-4 h-28 w-28 rounded-full opacity-30" style={{ background: orb2, filter: "blur(28px)" }} />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div>
            <p className={cn("font-bold uppercase tracking-[0.14em] text-white/50", large ? "text-[11px]" : "text-[9px]")}>Cartão de Benefícios</p>
            <p className={cn("mt-1 font-bold leading-tight text-white tracking-tight", large ? "text-[18px]" : "text-[14px]")}>{name}</p>
          </div>
          <div className={cn("flex items-center justify-center rounded-xl border border-white/20 bg-white/15 backdrop-blur-md", large ? "h-11 w-11" : "h-9 w-9")}>
            <Sparkles className={cn("text-white/80", large ? "h-5 w-5" : "h-4 w-4")} />
          </div>
        </div>

        {/* Chip EMV */}
        <div className={cn("flex items-center justify-center overflow-hidden rounded-[5px] border border-white/20 bg-white/15 backdrop-blur-sm", large ? "mt-4 mb-3 h-9 w-14" : "mt-2.5 mb-1.5 h-7 w-10")}>
          <div className="grid grid-cols-2 gap-px opacity-60">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={cn("rounded-[1px] bg-amber-300/80", large ? "h-2 w-5" : "h-1.5 w-3.5")} />
            ))}
          </div>
        </div>

        <p className={cn("font-mono tracking-[0.08em] text-white/40", large ? "text-[13px]" : "text-[10px]")}>{cardNumber}</p>

        <div className={cn("flex items-center justify-between", large ? "mt-4" : "mt-2.5")}>
          <div>
            {validUntil && <p className={cn("text-white/35", large ? "text-[11px]" : "text-[9px]")}>Válido até {validUntil}</p>}
            {planName && (
              <div className="mt-1 inline-flex items-center gap-1 rounded-lg bg-white/12 px-2 py-0.5 backdrop-blur-md border border-white/15">
                <span className={cn("font-bold text-white/80", large ? "text-[10px]" : "text-[8.5px]")}>{planName}</span>
              </div>
            )}
          </div>
          {large && (
            <div className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur-md">
              <CreditCard className="h-3.5 w-3.5 text-white/70" />
              <span className="text-[10px] font-bold text-white/70">AloClínica</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function WalletCard({
  name, cardNumber = "ALO · XXXX · 0001", validUntil, planName,
  gradient = "from-[#0A2A7A] via-[#1255C8] to-[#1E6DD4]",
  orb1 = "radial-gradient(#3B7FE8, transparent)",
  orb2 = "radial-gradient(#10B981, transparent)",
  onClick,
}: WalletCardProps) {
  const [open, setOpen] = useState(false);
  const [flipped, setFlipped] = useState(false);

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else {
      setFlipped(false);
      setOpen(true);
    }
  };

  return (
    <>
      <motion.div
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleCardClick}
        className={`relative cursor-pointer overflow-hidden rounded-[22px] bg-gradient-to-br ${gradient} p-[18px]`}
        style={{ boxShadow: "0 12px 40px rgba(18,85,200,.35)" }}
      >
        {/* Orbs */}
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-60" style={{ background: orb1, filter: "blur(32px)" }} />
        <div className="pointer-events-none absolute -bottom-6 -left-4 h-28 w-28 rounded-full opacity-30" style={{ background: orb2, filter: "blur(28px)" }} />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/50">Cartão de Benefícios</p>
              <p className="mt-1 text-[14px] font-bold leading-tight text-white tracking-tight">{name}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/15 backdrop-blur-md">
              <Sparkles className="h-4 w-4 text-white/80" />
            </div>
          </div>

          {/* Chip EMV */}
          <div className="mt-2.5 mb-1.5 flex h-7 w-10 items-center justify-center overflow-hidden rounded-[5px] border border-white/20 bg-white/15 backdrop-blur-sm">
            <div className="grid grid-cols-2 gap-px opacity-60">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-1.5 w-3.5 rounded-[1px] bg-amber-300/80" />
              ))}
            </div>
          </div>

          <p className="font-mono text-[10px] tracking-[0.08em] text-white/40">{cardNumber}</p>

          <div className="mt-2.5 flex items-center justify-between">
            <div>
              {validUntil && <p className="text-[9px] text-white/35">Válido até {validUntil}</p>}
              {planName && (
                <div className="mt-1 inline-flex items-center gap-1 rounded-lg bg-white/12 px-2 py-0.5 backdrop-blur-md border border-white/15">
                  <span className="text-[8.5px] font-bold text-white/80">{planName}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 rounded-xl border border-white/20 bg-white/15 px-2.5 py-1 backdrop-blur-md">
              <span className="text-[10px] font-bold text-white/80">Ver cartão</span>
              <ChevronRight className="h-3 w-3 text-white/60" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Fullscreen card overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <CardFace
                name={name}
                cardNumber={cardNumber}
                validUntil={validUntil}
                planName={planName}
                gradient={gradient}
                orb1={orb1}
                orb2={orb2}
                large
              />
              <button
                onClick={() => setOpen(false)}
                className="mx-auto mt-4 flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[12px] font-semibold text-white/80 backdrop-blur-md transition-all hover:bg-white/20"
              >
                <X className="h-3.5 w-3.5" />
                Fechar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
