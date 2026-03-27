import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Check, Calendar, Clock, MapPin, Home } from "lucide-react";
import { motion } from "framer-motion";
import SEOHead from "@/components/SEOHead";

const AppointmentConfirmed = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12" style={{ backgroundColor: "hsl(210, 20%, 98%)" }}>
      <SEOHead title="Consulta Confirmada — AloClínica" description="Sua consulta foi confirmada com sucesso." />

      {/* Check icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="w-[72px] h-[72px] rounded-full bg-primary flex items-center justify-center mb-6"
      >
        <Check className="w-9 h-9 text-primary-foreground" strokeWidth={3} />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="font-[Manrope] text-[28px] font-extrabold text-primary text-center"
      >
        Tudo pronto!
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-sm text-muted-foreground text-center mt-2 max-w-xs"
      >
        Sua consulta na AloClínica foi confirmada com sucesso.
      </motion.p>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full max-w-md mt-8 bg-card rounded-[2rem] p-6"
        style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}
      >
        <p className="text-[11px] font-semibold uppercase tracking-widest text-primary mb-1">Especialista</p>
        <div className="flex items-center gap-3 mb-5">
          <Avatar className="w-14 h-14 border-2 border-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary font-bold">AM</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-[Manrope] text-xl font-bold text-foreground">Sua consulta</h3>
            <p className="text-sm text-muted-foreground">Detalhes confirmados</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-muted/30 rounded-2xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Data</span>
            </div>
            <p className="text-sm font-bold text-foreground">Confirmada</p>
          </div>
          <div className="bg-muted/30 rounded-2xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Horário</span>
            </div>
            <p className="text-sm font-bold text-foreground">Reservado</p>
          </div>
        </div>

        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <span>Teleconsulta via plataforma AloClínica</span>
        </div>

        {/* Map placeholder */}
        <div className="mt-4 rounded-2xl overflow-hidden h-36 bg-muted/30 flex items-center justify-center">
          <MapPin className="w-6 h-6 text-muted-foreground/30" />
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="w-full max-w-md mt-6 space-y-3"
      >
        <Button
          className="w-full h-[52px] rounded-full bg-primary text-primary-foreground font-[Manrope] font-bold text-base gap-2"
          onClick={() => {/* Add to calendar */}}
        >
          <Calendar className="w-4 h-4" /> Adicionar ao Calendário
        </Button>
        <Button
          variant="outline"
          className="w-full h-[52px] rounded-full bg-muted/50 font-[Manrope] font-semibold text-base gap-2"
          onClick={() => navigate("/dashboard?role=patient")}
        >
          <Home className="w-4 h-4" /> Voltar para o Início
        </Button>
      </motion.div>
    </div>
  );
};

export default AppointmentConfirmed;
