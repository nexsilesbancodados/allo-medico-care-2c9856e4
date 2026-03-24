import { useState } from "react";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getReceptionNav } from "./receptionNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, Clock, Search, Plus, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CallLog {
  id: string;
  type: "incoming" | "outgoing" | "missed";
  contact: string;
  phone: string;
  subject: string;
  date: string;
  duration: string;
  notes: string;
}

const mockCalls: CallLog[] = [
  { id: "1", type: "incoming", contact: "Maria Silva", phone: "(11) 99999-1234", subject: "Agendamento de consulta", date: "2026-02-27 10:30", duration: "3 min", notes: "Agendada para 02/03" },
  { id: "2", type: "outgoing", contact: "João Santos", phone: "(11) 98888-5678", subject: "Confirmação de consulta", date: "2026-02-27 09:15", duration: "2 min", notes: "Confirmou presença" },
  { id: "3", type: "missed", contact: "Ana Costa", phone: "(11) 97777-9012", subject: "", date: "2026-02-27 08:45", duration: "—", notes: "Retornar ligação" },
];

const typeConfig = {
  incoming: { icon: PhoneIncoming, label: "Recebida", color: "text-green-600" },
  outgoing: { icon: PhoneOutgoing, label: "Realizada", color: "text-blue-600" },
  missed: { icon: PhoneMissed, label: "Perdida", color: "text-red-600" },
};

const ReceptionCalls = () => {
  const [calls] = useState<CallLog[]>(mockCalls);
  const [search, setSearch] = useState("");

  const filtered = calls.filter(c =>
    c.contact.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  return (
    <DashboardLayout title="Chamadas" nav={getReceptionNav("calls")} role="receptionist">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground tabular-nums">Registro de Chamadas</h2>
            <p className="text-muted-foreground text-sm">Controle de ligações telefônicas da recepção</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" /> Nova Chamada
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Chamada</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tipo</Label>
                    <Select>
                      <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="incoming">Recebida</SelectItem>
                        <SelectItem value="outgoing">Realizada</SelectItem>
                        <SelectItem value="missed">Perdida</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Telefone</Label>
                    <Input placeholder="(00) 00000-0000" />
                  </div>
                </div>
                <div>
                  <Label>Contato</Label>
                  <Input placeholder="Nome do paciente ou contato" />
                </div>
                <div>
                  <Label>Assunto</Label>
                  <Input placeholder="Motivo da ligação" />
                </div>
                <div>
                  <Label>Observações</Label>
                  <Textarea placeholder="Notas sobre a chamada..." rows={3} />
                </div>
                <Button className="w-full">Salvar Registro</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(["incoming", "outgoing", "missed"] as const).map(type => {
            const config = typeConfig[type];
            const Icon = config.icon;
            const count = calls.filter(c => c.type === type).length;
            return (
              <Card key={type}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-muted ${config.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-sm text-muted-foreground">{config.label}s hoje</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <CardTitle className="text-lg">Histórico de Chamadas</CardTitle>
              <div className="relative w-full sm:w-64 pb-24 md:pb-8">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Assunto</TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Notas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(call => {
                  const config = typeConfig[call.type];
                  const Icon = config.icon;
                  return (
                    <TableRow key={call.id}>
                      <TableCell>
                        <Badge variant="outline" className={`gap-1 ${config.color}`}>
                          <Icon className="w-3 h-3" /> {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{call.contact}</TableCell>
                      <TableCell>{call.phone}</TableCell>
                      <TableCell className="text-muted-foreground">{call.subject || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{call.date}</TableCell>
                      <TableCell>{call.duration}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{call.notes}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ReceptionCalls;
