import { useState } from "react";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getReceptionNav } from "./receptionNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Send, Search, User, Clock, CheckCheck } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
}

const mockConversations: Conversation[] = [
  { id: "1", name: "Maria Silva", lastMessage: "Obrigada pela confirmação!", time: "10:30", unread: 0 },
  { id: "2", name: "João Santos", lastMessage: "Preciso reagendar minha consulta", time: "09:45", unread: 2 },
  { id: "3", name: "Ana Costa", lastMessage: "Qual o horário de funcionamento?", time: "08:20", unread: 1 },
  { id: "4", name: "Carlos Oliveira", lastMessage: "Tudo certo, estarei lá!", time: "Ontem", unread: 0 },
];

const ReceptionMessages = () => {
  const [search, setSearch] = useState("");
  const [selectedConv, setSelectedConv] = useState<string | null>("2");
  const [newMessage, setNewMessage] = useState("");

  const filtered = mockConversations.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout title="Mensagens" nav={getReceptionNav("messages")} role="receptionist">
      <div className="space-y-6 pb-24 md:pb-8">
        <div>
          <h2 className="text-2xl font-bold text-foreground tabular-nums">Central de Mensagens</h2>
          <p className="text-muted-foreground text-sm">Comunicação com pacientes via chat interno</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[60vh] min-h-[400px] max-h-[700px]">
          {/* Conversations List */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar conversa..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[40vh] sm:h-[500px]">
                {filtered.map(conv => (
                  <div key={conv.id}>
                    <button
                      className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex items-start gap-3 ${selectedConv === conv.id ? "bg-muted" : ""}`}
                      onClick={() => setSelectedConv(conv.id)}
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm truncate">{conv.name}</p>
                          <span className="text-xs text-muted-foreground">{conv.time}</span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
                      </div>
                      {conv.unread > 0 && (
                        <Badge className="rounded-full w-5 h-5 p-0 flex items-center justify-center text-[10px]">
                          {conv.unread}
                        </Badge>
                      )}
                    </button>
                    <Separator />
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2 flex flex-col">
            {selectedConv ? (
              <>
                <CardHeader className="border-b pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{mockConversations.find(c => c.id === selectedConv)?.name}</CardTitle>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Online agora
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-4 overflow-auto">
                  <div className="space-y-4">
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-2 max-w-[70%]">
                        <p className="text-sm">Olá, gostaria de reagendar minha consulta de amanhã.</p>
                        <p className="text-[10px] text-muted-foreground mt-1">09:45</p>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-2 max-w-[70%]">
                        <p className="text-sm">Claro! Para qual data gostaria de reagendar?</p>
                        <p className="text-[10px] opacity-70 mt-1 flex items-center gap-1 justify-end">
                          09:47 <CheckCheck className="w-3 h-3" />
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-2 max-w-[70%]">
                        <p className="text-sm">Preciso reagendar minha consulta para a próxima semana, pode ser terça?</p>
                        <p className="text-[10px] text-muted-foreground mt-1">09:48</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Digite sua mensagem..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      rows={1}
                      className="resize-none"
                    />
                    <Button size="icon" className="shrink-0" aria-label="Enviar">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground/40" />
                  <p className="text-muted-foreground">Selecione uma conversa</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ReceptionMessages;
