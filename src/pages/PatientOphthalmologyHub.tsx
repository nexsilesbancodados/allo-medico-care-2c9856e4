import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getPatientNav } from "@/components/patient/patientNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Calendar, Glasses, ChevronRight } from "lucide-react";

const PatientOphthalmologyHub = () => {
  const navigate = useNavigate();

  const sections = [
    {
      title: "Teste de acuidade visual",
      description: "Avalie sua visão online em poucos minutos com nosso teste guiado.",
      icon: Eye,
      cta: "Iniciar teste",
      action: () => navigate("/dashboard/patient/visual-acuity"),
      available: true,
    },
    {
      title: "Agendar consulta com oftalmologista",
      description: "Marque uma consulta online com um especialista em oftalmologia verificado.",
      icon: Calendar,
      cta: "Ver médicos",
      action: () => navigate("/dashboard/doctors?type=oftalmologia"),
      available: true,
    },
    {
      title: "Receita de óculos digital",
      description: "Solicite ou renove sua prescrição de óculos de forma 100% digital.",
      icon: Glasses,
      cta: "Em breve",
      action: () => {},
      available: false,
    },
  ];

  return (
    <DashboardLayout title="Oftalmologia" nav={getPatientNav("ophthalmology")}>
      <div className="w-full max-w-3xl mx-auto pb-24 md:pb-6 space-y-6">
        <header className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[hsl(var(--p-primary))]/10 text-[hsl(var(--p-primary))] text-xs font-semibold">
            <Eye className="w-3.5 h-3.5" /> Saúde dos olhos
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground font-[Manrope] leading-tight">
            Cuide da sua visão
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl">
            Centralizamos aqui tudo que você precisa para cuidar dos seus olhos: teste de visão, consultas com oftalmologistas e receita digital.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <Card
                key={section.title}
                className={`relative overflow-hidden border-border/40 shadow-[var(--p-shadow-card)] hover:shadow-[var(--p-shadow-elevated)] transition-shadow ${
                  section.available ? "cursor-pointer" : "opacity-80"
                }`}
                onClick={section.available ? section.action : undefined}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[hsl(var(--p-primary))]/10 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-[hsl(var(--p-primary))]" />
                    </div>
                    {!section.available && (
                      <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                        Em breve
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-base font-bold mt-3 font-[Manrope]">
                    {section.title}
                  </CardTitle>
                  <CardDescription className="text-sm">{section.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    size="sm"
                    disabled={!section.available}
                    className="rounded-full bg-[#00347F] text-white font-semibold gap-1.5"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (section.available) section.action();
                    }}
                  >
                    {section.cta}
                    {section.available && <ChevronRight className="w-4 h-4 -mr-1" />}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PatientOphthalmologyHub;
