import { motion } from "framer-motion";
import { ChevronRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

export function WalletCard({
  name, cardNumber = "ALO · XXXX · XXXX · 0001", validUntil, planName,
  gradient = "from-[#0A2A7A] via-[#1255C8] to-[#1E6DD4]",
  orb1 = "radial-gradient(#3B7FE8, transparent)",
  orb2 = "radial-gradient(#10B981, transparent)",
  onClick,
}: WalletCardProps) {
  const navigate = useNavigate();
  const handleClick = onClick ?? (() => navigate("/dashboard/discount-card?role=patient"));

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.005 }}
      whileTap={{ scale: 0.97 }}
      onClick={handleClick}
      className={`relative cursor-pointer overflow-hidden rounded-[24px] bg-gradient-to-br ${gradient} p-5`}
      style={{ boxShadow: "0 16px 48px rgba(18,85,200,.32), 0 4px 16px rgba(0,0,0,.12), inset 0 1px 0 rgba(255,255,255,.15)" }}
    >
      {/* Orbs com blur maior */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-55" style={{ background: orb1, filter: "blur(40px)" }} />
      <div className="pointer-events-none absolute -bottom-8 -left-6 h-32 w-32 rounded-full opacity-30" style={{ background: orb2, filter: "blur(36px)" }} />
      {/* Top shine */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/50">Cartão de Benefícios</p>
            <p className="mt-1 text-[15px] font-bold leading-tight text-white tracking-tight">{name}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/15 backdrop-blur-md">
            <Sparkles className="h-5 w-5 text-white/80" />
          </div>
        </div>

        {/* Chip EMV — decorativo */}
        <div className="mt-3 mb-2 flex h-8 w-12 items-center justify-center overflow-hidden rounded-[6px] border border-white/20 bg-white/15 backdrop-blur-sm">
          <div className="grid grid-cols-2 gap-px opacity-60">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-2 w-4 rounded-[1px] bg-amber-300/80" />
            ))}
          </div>
        </div>

        <p className="font-mono text-[11px] tracking-[0.08em] text-white/40">{cardNumber}</p>

        <div className="mt-3 flex items-center justify-between">
          <div>
            {validUntil && <p className="text-[9px] text-white/35">Válido até {validUntil}</p>}
            {planName && (
              <div className="mt-1 inline-flex items-center gap-1 rounded-lg bg-white/12 px-2 py-0.5 backdrop-blur-md border border-white/15">
                <span className="text-[8.5px] font-bold text-white/80">{planName}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 rounded-xl border border-white/20 bg-white/15 px-3 py-1.5 backdrop-blur-md">
            <span className="text-[10px] font-bold text-white/80">Ver cartão</span>
            <ChevronRight className="h-3 w-3 text-white/60" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
