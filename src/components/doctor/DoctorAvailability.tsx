import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, Users, FileText, Settings, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const doctorNav = [
  { label: "Início", href: "/dashboard", icon: <Clock className="w-4 h-4" /> },
  { label: "Agenda", href: "/dashboard/schedule", icon: <Calendar className="w-4 h-4" /> },
  { label: "Pacientes", href: "/dashboard/patients", icon: <Users className="w-4 h-4" /> },
  { label: "Receitas", href: "/dashboard/prescriptions", icon: <FileText className="w-4 h-4" /> },
  { label: "Disponibilidade", href: "/dashboard/availability", icon: <Settings className="w-4 h-4" />, active: true },
];

const daysOfWeek = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const timeOptions = Array.from({ length: 28 }, (_, i) => {
  const h = Math.floor(i / 2) + 7;
  const m = (i % 2) * 30;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
});

interface Slot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

const DoctorAvailability = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [doctorProfileId, setDoctorProfileId] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [newDay, setNewDay] = useState("1");
  const [newStart, setNewStart] = useState("08:00");
  const [newEnd, setNewEnd] = useState("12:00");
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) fetchDoctorProfile(); }, [user]);

  const fetchDoctorProfile = async () => {
    const { data } = await supabase
      .from("doctor_profiles")
      .select("id")
      .eq("user_id", user!.id)
      .single();

    if (data) {
      setDoctorProfileId(data.id);
      fetchSlots(data.id);
    }
    setLoading(false);
  };

  const fetchSlots = async (profileId: string) => {
    const { data } = await supabase
      .from("availability_slots")
      .select("*")
      .eq("doctor_id", profileId)
      .order("day_of_week")
      .order("start_time");

    if (data) setSlots(data);
  };

  const addSlot = async () => {
    if (!doctorProfileId) return;
    const { error } = await supabase.from("availability_slots").insert({
      doctor_id: doctorProfileId,
      day_of_week: parseInt(newDay),
      start_time: newStart,
      end_time: newEnd,
    });

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Horário adicionado!" });
      fetchSlots(doctorProfileId);
    }
  };

  const removeSlot = async (id: string) => {
    await supabase.from("availability_slots").delete().eq("id", id);
    if (doctorProfileId) fetchSlots(doctorProfileId);
  };

  // Group by day
  const grouped = daysOfWeek.map((day, i) => ({
    day,
    index: i,
    slots: slots.filter(s => s.day_of_week === i),
  }));

  return (
    <DashboardLayout title="Médico" nav={doctorNav}>
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold text-foreground mb-1">Disponibilidade</h1>
        <p className="text-muted-foreground mb-6">Configure os horários em que você atende</p>

        {/* Add slot */}
        <Card className="border-border mb-6">
          <CardHeader><CardTitle className="text-base">Adicionar Horário</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Dia</p>
                <Select value={newDay} onValueChange={setNewDay}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {daysOfWeek.map((d, i) => (
                      <SelectItem key={i} value={String(i)}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Início</p>
                <Select value={newStart} onValueChange={setNewStart}>
                  <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {timeOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Fim</p>
                <Select value={newEnd} onValueChange={setNewEnd}>
                  <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {timeOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={addSlot} className="bg-gradient-hero text-primary-foreground">
                <Plus className="w-4 h-4 mr-1" /> Adicionar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Slots list */}
        <div className="space-y-4">
          {grouped.filter(g => g.slots.length > 0).map(g => (
            <Card key={g.index} className="border-border">
              <CardContent className="p-4">
                <h3 className="font-semibold text-foreground mb-3">{g.day}</h3>
                <div className="flex flex-wrap gap-2">
                  {g.slots.map(s => (
                    <Badge key={s.id} variant="secondary" className="flex items-center gap-2 py-1.5 px-3">
                      <Clock className="w-3 h-3" />
                      {s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)}
                      <button onClick={() => removeSlot(s.id)} className="ml-1 hover:text-destructive">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          {slots.length === 0 && !loading && (
            <Card className="border-border">
              <CardContent className="py-8 text-center">
                <Clock className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">Nenhum horário configurado ainda.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DoctorAvailability;
