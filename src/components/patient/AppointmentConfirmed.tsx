import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, Calendar, Home, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import SEOHead from "@/components/SEOHead";

const AppointmentConfirmed = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-background relative overflow-hidden">
      <SEOHead title="Consulta Confirmada — AloClínica" description="Sua consulta foi confirmada com sucesso." />

      {/* Background decorative elements */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary/[0.03] blur-[80px]" />
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full bg-success/[0.04] blur-[60px]" />
      </div>

      {/* Celebration particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-primary/20"
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
            x: [0, (i % 2 === 0 ? 1 : -1) * (40 + i * 20)],
            y: [0, -(60 + i * 15)],
          }}
          transition={{ delay: 0.5 + i * 0.1, duration: 1.2, ease: "easeOut" }}
          style={{ top: "40%", left: "50%" }}
        />
      ))}

      <div className="relative z-10 w-full max-w-md">
        {/* Check icon with ring animation */}
        <div className="flex justify-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 12 }}
            className="relative"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.4, opacity: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="absolute inset-0 rounded-full bg-primary/20"
            />
            <div className="w-[76px] h-[76px] rounded-full bg-gradient-to-br from-primary to-[hsl(215_60%_45%)] flex items-center justify-center shadow-[0_8px_32px_hsl(215_75%_32%/0.35)]">
              <Check className="w-10 h-10 text-primary-foreground" strokeWidth={3} />
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/8 px-3 py-1 mb-3">
            <Sparkles className="w-3 h-3 text-primary" />
            <span className="text-[11px] font-bold text-primary">Confirmado</span>
          </div>
          <h1 className="font-[Manrope] text-[28px] font-extrabold text-primary">
            Tudo pronto!
          </h1>
          <p className="text-[14px] text-muted-foreground mt-2 max-w-xs mx-auto leading-relaxed">
            Sua consulta na AloClínica foi confirmada com sucesso.
          </p>
        </motion.div>

        {/* Confirmation Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-card rounded-[1.5rem] p-6 border border-border/20 shadow-[0_4px_24px_rgba(0,0,0,0.06)] mb-6"
        >
          <div className="text-center mb-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary mb-1">Consulta Confirmada</p>
            <h3 className="font-[Manrope] text-xl font-bold text-foreground">Sua consulta</h3>
            <p className="text-[13px] text-muted-foreground">Detalhes do agendamento</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="relative overflow-hidden bg-muted/30 rounded-2xl p-3.5">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-primary/20" />
              <div className="flex items-center gap-1.5 mb-1">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Data</span>
              </div>
              <p className="text-[14px] font-bold text-foreground">Confirmada</p>
            </div>
            <div className="relative overflow-hidden bg-muted/30 rounded-2xl p-3.5">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-secondary/20" />
              <div className="flex items-center gap-1.5 mb-1">
                <Calendar className="w-3.5 h-3.5 text-secondary" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Horário</span>
              </div>
              <p className="text-[14px] font-bold text-foreground">Reservado</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[13px] text-muted-foreground bg-muted/20 rounded-xl p-3">
            <div className="w-7 h-7 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
              <Calendar className="w-3.5 h-3.5 text-primary" />
            </div>
            <span>Teleconsulta via plataforma AloClínica</span>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-3"
        >
          <Button
            className="w-full h-[52px] rounded-full bg-primary text-primary-foreground font-[Manrope] font-bold text-[15px] gap-2 shadow-[0_4px_16px_hsl(215_75%_32%/0.3)]"
            onClick={() => {/* Add to calendar */}}
          >
            <Calendar className="w-4 h-4" /> Adicionar ao Calendário
          </Button>
          <Button
            variant="outline"
            className="w-full h-[52px] rounded-full font-[Manrope] font-semibold text-[15px] gap-2 border-border/30"
            onClick={() => navigate("/dashboard?role=patient")}
          >
            <Home className="w-4 h-4" /> Voltar para o Início
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default AppointmentConfirmed;
