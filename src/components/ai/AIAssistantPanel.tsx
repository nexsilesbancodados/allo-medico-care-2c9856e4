import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bot, MessageSquare, Stethoscope, FileText, ClipboardList, History,
  Home, Settings as SettingsIcon, User,
} from "lucide-react";
import AIChatTab from "./tabs/AIChatTab";
import AITriageTab from "./tabs/AITriageTab";
import AIDocumentsTab from "./tabs/AIDocumentsTab";
import AISummaryTab from "./tabs/AISummaryTab";
import AIHistoryTab from "./tabs/AIHistoryTab";

const AIAssistantPanel = () => {
  const { roles } = useAuth();
  const [activeTab, setActiveTab] = useState("chat");

  const primaryRole = roles.includes("admin") ? "admin"
    : roles.includes("doctor") ? "doctor"
    : roles.includes("receptionist") ? "receptionist"
    : roles.includes("support") ? "support"
    : roles.includes("clinic") ? "clinic"
    : roles.includes("partner") ? "partner"
    : roles.includes("affiliate") ? "affiliate"
    : "patient";

  const aiNav = [
    { label: "Chat IA", href: "/dashboard/ai-assistant", icon: <Bot className="w-4 h-4" />, active: true, group: "Assistente" },
    { label: "Voltar ao Painel", href: "/dashboard", icon: <Home className="w-4 h-4" />, group: "Navegação" },
    { label: "Configurações", href: "/dashboard/settings", icon: <SettingsIcon className="w-4 h-4" />, group: "Navegação" },
    { label: "Perfil", href: "/dashboard/profile", icon: <User className="w-4 h-4" />, group: "Navegação" },
  ];

  const tabs = [
    { id: "chat", label: "Chat", icon: MessageSquare },
    { id: "triage", label: "Triagem", icon: Stethoscope },
    { id: "documents", label: "Documentos", icon: FileText },
    { id: "summary", label: "Resumo", icon: ClipboardList },
    { id: "history", label: "Histórico", icon: History },
  ];

  return (
    <DashboardLayout title="Assistente IA" nav={aiNav} role="ai">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Assistente IA</h1>
            <p className="text-xs text-muted-foreground">
              Chat, triagem, documentos e resumos inteligentes
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start gap-1 bg-muted/30 p-1 rounded-xl mb-4 flex-wrap h-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="gap-1.5 text-xs rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="chat" className="mt-0">
            <AIChatTab primaryRole={primaryRole} />
          </TabsContent>
          <TabsContent value="triage" className="mt-0">
            <AITriageTab />
          </TabsContent>
          <TabsContent value="documents" className="mt-0">
            <AIDocumentsTab primaryRole={primaryRole} />
          </TabsContent>
          <TabsContent value="summary" className="mt-0">
            <AISummaryTab primaryRole={primaryRole} />
          </TabsContent>
          <TabsContent value="history" className="mt-0">
            <AIHistoryTab primaryRole={primaryRole} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AIAssistantPanel;
