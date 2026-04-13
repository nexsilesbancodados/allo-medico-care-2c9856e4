import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getAdminNav } from "./adminNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Save, RefreshCw, Plus, Trash2, Pencil, X, Star,
  Globe, Palette, Search, Plug, LayoutTemplate, SlidersHorizontal,
  MessageSquareQuote, CircleDollarSign, HelpCircle, Image, GripVertical, Check,
} from "lucide-react";
import { warn } from "@/lib/logger";
import { invalidateSiteConfig } from "@/lib/site-config";

// ── Types ─────────────────────────────────────────────────────────────────────

type ConfigMap = Record<string, string>;

type Plan = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  interval: string;
  max_appointments: number | null;
  is_active: boolean;
  features: string[];
  stripe_price_id: string | null;
};

type Testimonial = {
  id: string;
  name: string;
  role: string | null;
  company: string | null;
  avatar_url: string | null;
  text: string;
  rating: number;
  is_active: boolean;
  order_index: number;
};

type FaqItem = {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  is_active: boolean;
  order_index: number;
};

type ConfigRow = {
  id: string;
  key: string;
  value: string | null;
  category: string;
  label: string;
  input_type: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const SaveBtn = ({ onSave, saving }: { onSave: () => void; saving: boolean }) => (
  <Button onClick={onSave} disabled={saving}>
    {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
    {saving ? "Salvando…" : "Salvar"}
  </Button>
);

const ConfigField = ({
  row,
  value,
  onChange,
}: {
  row: ConfigRow;
  value: string;
  onChange: (key: string, val: string) => void;
}) => {
  const v = value ?? "";

  if (row.input_type === "boolean") {
    return (
      <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
        <Label className="font-normal text-sm">{row.label}</Label>
        <Switch checked={v === "true"} onCheckedChange={(c) => onChange(row.key, String(c))} />
      </div>
    );
  }
  if (row.input_type === "textarea") {
    return (
      <div className="space-y-1.5">
        <Label className="text-sm">{row.label}</Label>
        <Textarea value={v} onChange={(e) => onChange(row.key, e.target.value)} className="resize-none min-h-[80px]" placeholder={row.label} />
      </div>
    );
  }
  if (row.input_type === "color") {
    return (
      <div className="space-y-1.5">
        <Label className="text-sm">{row.label}</Label>
        <div className="flex items-center gap-3">
          <input type="color" value={v || "#000000"} onChange={(e) => onChange(row.key, e.target.value)} className="w-10 h-10 rounded-lg border border-border cursor-pointer p-0.5" />
          <Input value={v} onChange={(e) => onChange(row.key, e.target.value)} className="font-mono uppercase w-32" placeholder="#000000" maxLength={7} />
          {v && <span className="w-8 h-8 rounded-lg border border-border shadow-sm" style={{ backgroundColor: v }} />}
        </div>
      </div>
    );
  }
  if (row.input_type === "url") {
    return (
      <div className="space-y-1.5">
        <Label className="text-sm">{row.label}</Label>
        <div className="flex gap-2">
          <Input value={v} onChange={(e) => onChange(row.key, e.target.value)} placeholder="https://" className="flex-1" />
          {v && <a href={v} target="_blank" rel="noopener noreferrer"><Button variant="outline" size="icon" type="button" tabIndex={-1}><Image className="w-4 h-4" /></Button></a>}
        </div>
        {v && /\.(png|jpg|jpeg|gif|webp|svg)(\?.*)?$/i.test(v) && (
          <img src={v} alt="preview" className="mt-1 h-14 w-auto rounded-lg border border-border object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        )}
      </div>
    );
  }
  if (row.input_type === "number") {
    return (
      <div className="space-y-1.5">
        <Label className="text-sm">{row.label}</Label>
        <Input type="number" value={v} onChange={(e) => onChange(row.key, e.target.value)} className="w-32" />
      </div>
    );
  }
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{row.label}</Label>
      <Input value={v} onChange={(e) => onChange(row.key, e.target.value)} placeholder={row.label} />
    </div>
  );
};

// ── Stars ─────────────────────────────────────────────────────────────────────

const StarRating = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((s) => (
      <button key={s} type="button" onClick={() => onChange(s)}>
        <Star className={`w-5 h-5 ${s <= value ? "text-amber-400 fill-amber-400" : "text-muted-foreground"}`} />
      </button>
    ))}
  </div>
);

// ── Main component ─────────────────────────────────────────────────────────────

const AdminSiteConfig = () => {
  const nav = getAdminNav("site-config");

  // Config key-value
  const [configRows, setConfigRows] = useState<ConfigRow[]>([]);
  const [values, setValues] = useState<ConfigMap>({});
  const [savingCat, setSavingCat] = useState<string | null>(null);

  // Plans
  const [plans, setPlans] = useState<Plan[]>([]);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [planDialog, setPlanDialog] = useState(false);
  const [planFeatureInput, setPlanFeatureInput] = useState("");
  const [savingPlan, setSavingPlan] = useState(false);

  // Testimonials
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [testimonialDialog, setTestimonialDialog] = useState(false);
  const [savingTestimonial, setSavingTestimonial] = useState(false);

  // FAQ
  const [faqItems, setFaqItems] = useState<FaqItem[]>([]);
  const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);
  const [faqDialog, setFaqDialog] = useState(false);
  const [savingFaq, setSavingFaq] = useState(false);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("geral");

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<{ type: "plan" | "testimonial" | "faq"; id: string; label: string } | null>(null);

  // ── Data loading ───────────────────────────────────────────────────────────

  const loadConfig = useCallback(async () => {
    const { data, error } = await supabase.from("site_config").select("*").order("category").order("key");
    if (error) { warn("[SiteConfig] config error", error); return; }
    setConfigRows(data ?? []);
    const map: ConfigMap = {};
    for (const r of data ?? []) map[r.key] = r.value ?? "";
    setValues(map);
  }, []);

  const loadPlans = useCallback(async () => {
    const { data, error } = await supabase.from("plans").select("*").order("price");
    if (error) { warn("[SiteConfig] plans error", error); return; }
    setPlans((data ?? []).map((p: any) => ({
      ...p,
      features: Array.isArray(p.features) ? p.features : [],
    })));
  }, []);

  const loadTestimonials = useCallback(async () => {
    const { data, error } = await supabase.from("testimonials").select("*").order("order_index");
    if (error) { warn("[SiteConfig] testimonials error", error); return; }
    setTestimonials(data ?? []);
  }, []);

  const loadFaq = useCallback(async () => {
    const { data, error } = await supabase.from("faq_items").select("*").order("order_index");
    if (error) { warn("[SiteConfig] faq error", error); return; }
    setFaqItems(data ?? []);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadConfig(), loadPlans(), loadTestimonials(), loadFaq()]);
    setLoading(false);
  }, [loadConfig, loadPlans, loadTestimonials, loadFaq]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Config save ────────────────────────────────────────────────────────────

  const saveCategory = async (cat: string) => {
    setSavingCat(cat);
    const catRows = configRows.filter((r) => r.category === cat);
    await Promise.all(catRows.map((r) =>
      supabase.from("site_config").update({ value: values[r.key] ?? "" }).eq("key", r.key)
    ));
    toast.success("Configurações salvas!");
    invalidateSiteConfig();
    loadConfig();
    setSavingCat(null);
  };

  const handleChange = (key: string, val: string) => setValues((p) => ({ ...p, [key]: val }));

  const rows = (cat: string) => configRows.filter((r) => r.category === cat);

  // ── Plans CRUD ─────────────────────────────────────────────────────────────

  const blankPlan = (): Plan => ({
    id: "", name: "", description: "", price: 0, interval: "monthly",
    max_appointments: null, is_active: true, features: [], stripe_price_id: null,
  });

  const openNewPlan = () => { setEditingPlan(blankPlan()); setPlanFeatureInput(""); setPlanDialog(true); };
  const openEditPlan = (p: Plan) => { setEditingPlan({ ...p, features: [...p.features] }); setPlanFeatureInput(""); setPlanDialog(true); };

  const addFeature = () => {
    if (!planFeatureInput.trim() || !editingPlan) return;
    setEditingPlan({ ...editingPlan, features: [...editingPlan.features, planFeatureInput.trim()] });
    setPlanFeatureInput("");
  };

  const removeFeature = (i: number) => {
    if (!editingPlan) return;
    setEditingPlan({ ...editingPlan, features: editingPlan.features.filter((_, idx) => idx !== i) });
  };

  const savePlan = async () => {
    if (!editingPlan) return;
    if (!editingPlan.name.trim()) { toast.error("Nome do plano é obrigatório"); return; }
    setSavingPlan(true);
    const payload = {
      name: editingPlan.name,
      description: editingPlan.description || null,
      price: Number(editingPlan.price),
      interval: editingPlan.interval,
      max_appointments: editingPlan.max_appointments ? Number(editingPlan.max_appointments) : null,
      is_active: editingPlan.is_active,
      features: editingPlan.features,
      stripe_price_id: editingPlan.stripe_price_id || null,
    };
    let error;
    if (editingPlan.id) {
      ({ error } = await supabase.from("plans").update(payload).eq("id", editingPlan.id));
    } else {
      ({ error } = await supabase.from("plans").insert(payload));
    }
    if (error) { toast.error("Erro ao salvar plano", { description: error.message }); }
    else { toast.success(editingPlan.id ? "Plano atualizado!" : "Plano criado!"); setPlanDialog(false); loadPlans(); }
    setSavingPlan(false);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { type, id } = deleteTarget;
    if (type === "plan") {
      const { error } = await supabase.from("plans").delete().eq("id", id);
      if (error) toast.error("Erro ao excluir plano");
      else { toast.success("Plano excluído"); loadPlans(); }
    } else if (type === "testimonial") {
      await supabase.from("testimonials").delete().eq("id", id);
      toast.success("Depoimento excluído"); loadTestimonials();
    } else if (type === "faq") {
      await supabase.from("faq_items").delete().eq("id", id);
      toast.success("Item excluído"); loadFaq();
    }
    setDeleteTarget(null);
  };

  const deletePlan = (id: string, name: string) => setDeleteTarget({ type: "plan", id, label: name });

  const togglePlanActive = async (p: Plan) => {
    await supabase.from("plans").update({ is_active: !p.is_active }).eq("id", p.id);
    loadPlans();
  };

  // ── Testimonials CRUD ──────────────────────────────────────────────────────

  const blankTestimonial = (): Testimonial => ({
    id: "", name: "", role: "", company: "", avatar_url: "", text: "", rating: 5, is_active: true, order_index: testimonials.length + 1,
  });

  const openNewTestimonial = () => { setEditingTestimonial(blankTestimonial()); setTestimonialDialog(true); };
  const openEditTestimonial = (t: Testimonial) => { setEditingTestimonial({ ...t }); setTestimonialDialog(true); };

  const saveTestimonial = async () => {
    if (!editingTestimonial) return;
    if (!editingTestimonial.name.trim() || !editingTestimonial.text.trim()) { toast.error("Nome e texto são obrigatórios"); return; }
    setSavingTestimonial(true);
    const payload = {
      name: editingTestimonial.name,
      role: editingTestimonial.role || null,
      company: editingTestimonial.company || null,
      avatar_url: editingTestimonial.avatar_url || null,
      text: editingTestimonial.text,
      rating: editingTestimonial.rating,
      is_active: editingTestimonial.is_active,
      order_index: editingTestimonial.order_index,
    };
    let error;
    if (editingTestimonial.id) {
      ({ error } = await supabase.from("testimonials").update(payload).eq("id", editingTestimonial.id));
    } else {
      ({ error } = await supabase.from("testimonials").insert(payload));
    }
    if (error) { toast.error("Erro ao salvar depoimento", { description: error.message }); }
    else { toast.success(editingTestimonial.id ? "Depoimento atualizado!" : "Depoimento criado!"); setTestimonialDialog(false); loadTestimonials(); }
    setSavingTestimonial(false);
  };

  const deleteTestimonial = (id: string, name: string) => setDeleteTarget({ type: "testimonial", id, label: name });

  const toggleTestimonialActive = async (t: Testimonial) => {
    await supabase.from("testimonials").update({ is_active: !t.is_active }).eq("id", t.id);
    loadTestimonials();
  };

  // ── FAQ CRUD ───────────────────────────────────────────────────────────────

  const blankFaq = (): FaqItem => ({
    id: "", question: "", answer: "", category: "geral", is_active: true, order_index: faqItems.length + 1,
  });

  const openNewFaq = () => { setEditingFaq(blankFaq()); setFaqDialog(true); };
  const openEditFaq = (f: FaqItem) => { setEditingFaq({ ...f }); setFaqDialog(true); };

  const saveFaq = async () => {
    if (!editingFaq) return;
    if (!editingFaq.question.trim() || !editingFaq.answer.trim()) { toast.error("Pergunta e resposta são obrigatórias"); return; }
    setSavingFaq(true);
    const payload = {
      question: editingFaq.question,
      answer: editingFaq.answer,
      category: editingFaq.category || "geral",
      is_active: editingFaq.is_active,
      order_index: editingFaq.order_index,
    };
    let error;
    if (editingFaq.id) {
      ({ error } = await supabase.from("faq_items").update(payload).eq("id", editingFaq.id));
    } else {
      ({ error } = await supabase.from("faq_items").insert(payload));
    }
    if (error) { toast.error("Erro ao salvar FAQ", { description: error.message }); }
    else { toast.success(editingFaq.id ? "FAQ atualizado!" : "FAQ criado!"); setFaqDialog(false); loadFaq(); }
    setSavingFaq(false);
  };

  const deleteFaq = (id: string, question: string) => setDeleteTarget({ type: "faq", id, label: question });

  const toggleFaqActive = async (f: FaqItem) => {
    await supabase.from("faq_items").update({ is_active: !f.is_active }).eq("id", f.id);
    loadFaq();
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout title="Configuração do Site" nav={nav} role="admin">
      <div className="space-y-6 pb-24 md:pb-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Configuração da Plataforma</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Edite textos, imagens, planos, depoimentos, FAQ, cores e integrações sem código.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={loadAll} disabled={loading} className="shrink-0">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Recarregar
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-muted-foreground text-sm">
            Carregando configurações…
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="flex flex-wrap gap-1 h-auto p-1 mb-6">
              {[
                { id: "geral",        label: "Geral",          icon: <Globe               className="w-3.5 h-3.5" /> },
                { id: "landing",      label: "Landing",        icon: <LayoutTemplate      className="w-3.5 h-3.5" /> },
                { id: "cards",        label: "Cards de entrada", icon: <LayoutTemplate    className="w-3.5 h-3.5" /> },
                { id: "secoes",       label: "Seções",         icon: <SlidersHorizontal   className="w-3.5 h-3.5" /> },
                { id: "planos",       label: "Planos",         icon: <CircleDollarSign    className="w-3.5 h-3.5" /> },
                { id: "depoimentos",  label: "Depoimentos",    icon: <MessageSquareQuote  className="w-3.5 h-3.5" /> },
                { id: "faq",          label: "FAQ",            icon: <HelpCircle          className="w-3.5 h-3.5" /> },
                { id: "aparencia",    label: "Aparência",      icon: <Palette             className="w-3.5 h-3.5" /> },
                { id: "seo",          label: "SEO",            icon: <Search              className="w-3.5 h-3.5" /> },
                { id: "integracoes",  label: "Integrações",    icon: <Plug                className="w-3.5 h-3.5" /> },
              ].map((t) => (
                <TabsTrigger key={t.id} value={t.id} className="flex items-center gap-1.5 text-xs">
                  {t.icon}{t.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* ── GERAL ─────────────────────────────────────────────────── */}
            <TabsContent value="geral">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Identidade</CardTitle>
                    <p className="text-xs text-muted-foreground">Nome, logo, favicon e descrição.</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {rows("geral").filter(r => ["site_name","site_description","logo_url","favicon_url"].includes(r.key)).map(r => (
                      <ConfigField key={r.key} row={r} value={values[r.key] ?? ""} onChange={handleChange} />
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Contato & Rodapé</CardTitle>
                    <p className="text-xs text-muted-foreground">E-mail, telefone, WhatsApp e textos do rodapé.</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {rows("geral").filter(r => ["contact_email","contact_phone","whatsapp_number","footer_text","footer_tagline"].includes(r.key)).map(r => (
                      <ConfigField key={r.key} row={r} value={values[r.key] ?? ""} onChange={handleChange} />
                    ))}
                  </CardContent>
                </Card>
                <Card className="md:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Redes Sociais</CardTitle>
                    <p className="text-xs text-muted-foreground">Links das redes sociais exibidos no rodapé.</p>
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {rows("geral").filter(r => r.key.startsWith("social_")).map(r => (
                      <ConfigField key={r.key} row={r} value={values[r.key] ?? ""} onChange={handleChange} />
                    ))}
                  </CardContent>
                </Card>
              </div>
              <div className="mt-4 flex justify-end">
                <SaveBtn onSave={() => saveCategory("geral")} saving={savingCat === "geral"} />
              </div>
            </TabsContent>

            {/* ── LANDING ───────────────────────────────────────────────── */}
            <TabsContent value="landing">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Hero</CardTitle>
                    <p className="text-xs text-muted-foreground">Bloco principal da página inicial.</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {rows("landing").filter(r => ["landing_badge_text","hero_title","hero_subtitle","hero_cta_text","hero_cta_primary_text","hero_cta_primary_url","hero_cta_secondary_text","hero_cta_secondary_url","landing_second_cta","hero_image_url","hero_video_url"].includes(r.key)).map(r => (
                      <ConfigField key={r.key} row={r} value={values[r.key] ?? ""} onChange={handleChange} />
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Estatísticas em destaque</CardTitle>
                    <p className="text-xs text-muted-foreground">4 números exibidos abaixo do hero.</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[1, 2, 3, 4].map((n) => (
                      <div key={n} className="grid grid-cols-2 gap-2 pb-3 border-b border-border last:border-0">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Stat {n} — Valor</Label>
                          <Input
                            value={values[`stat_${n}_value`] ?? ""}
                            onChange={(e) => handleChange(`stat_${n}_value`, e.target.value)}
                            placeholder="10k+"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Stat {n} — Rótulo</Label>
                          <Input
                            value={values[`stat_${n}_label`] ?? ""}
                            onChange={(e) => handleChange(`stat_${n}_label`, e.target.value)}
                            placeholder="Pacientes"
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
              <div className="mt-4 flex justify-end">
                <SaveBtn onSave={() => saveCategory("landing")} saving={savingCat === "landing"} />
              </div>
            </TabsContent>

            {/* ── CARDS DE ENTRADA / LISTAS JSON ────────────────────────── */}
            <TabsContent value="cards">
              <div className="grid gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Cards de entrada da landing</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      JSON com os 3 cards logo abaixo do Hero. Cada item: <code>{`{title, description, icon, cta, href, isClinic?}`}</code>. Ícones suportados: Stethoscope, Eye, Building2.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      className="font-mono text-xs min-h-[220px]"
                      value={values["entry_cards"] ?? ""}
                      onChange={(e) => handleChange("entry_cards", e.target.value)}
                      placeholder='[{"title":"...","description":"...","icon":"Stethoscope","cta":"Agendar","href":"/..."}]'
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Dica: valide o JSON antes de salvar — se estiver inválido, a landing usa os valores padrão.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Como funciona — Passos</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      JSON array de passos: <code>{`{step, title, desc, time?}`}</code>.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      className="font-mono text-xs min-h-[180px]"
                      value={values["how_it_works_steps"] ?? ""}
                      onChange={(e) => handleChange("how_it_works_steps", e.target.value)}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Especialidades em destaque</CardTitle>
                    <p className="text-xs text-muted-foreground">JSON array de nomes de especialidades.</p>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      className="font-mono text-xs min-h-[120px]"
                      value={values["featured_specialties"] ?? ""}
                      onChange={(e) => handleChange("featured_specialties", e.target.value)}
                      placeholder='["Cardiologia","Dermatologia",...]'
                    />
                  </CardContent>
                </Card>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <SaveBtn onSave={() => saveCategory("cards")} saving={savingCat === "cards"} />
                <SaveBtn onSave={() => saveCategory("secoes")} saving={savingCat === "secoes"} />
              </div>
            </TabsContent>

            {/* ── SEÇÕES ────────────────────────────────────────────────── */}
            <TabsContent value="secoes">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Visibilidade das Seções</CardTitle>
                  <p className="text-xs text-muted-foreground">Ative ou desative blocos de conteúdo na página inicial.</p>
                </CardHeader>
                <CardContent>
                  {rows("secoes").map(r => (
                    <ConfigField key={r.key} row={r} value={values[r.key] ?? ""} onChange={handleChange} />
                  ))}
                  <div className="mt-4">
                    <SaveBtn onSave={() => saveCategory("secoes")} saving={savingCat === "secoes"} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── PLANOS ────────────────────────────────────────────────── */}
            <TabsContent value="planos">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{plans.length} plano{plans.length !== 1 ? "s" : ""} cadastrado{plans.length !== 1 ? "s" : ""}</p>
                    <p className="text-xs text-muted-foreground">Edite preços, funcionalidades e descrições dos planos de assinatura.</p>
                  </div>
                  <Button onClick={openNewPlan} size="sm"><Plus className="w-4 h-4 mr-2" />Novo Plano</Button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {plans.map((p) => (
                    <Card key={p.id} className={`relative ${!p.is_active ? "opacity-60" : ""}`}>
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div>
                            <p className="font-semibold text-sm">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.description ?? "—"}</p>
                          </div>
                          <Switch checked={p.is_active} onCheckedChange={() => togglePlanActive(p)} className="shrink-0" />
                        </div>
                        <div className="flex items-baseline gap-1 mb-2">
                          <span className="text-2xl font-bold">R$ {Number(p.price).toFixed(2).replace(".", ",")}</span>
                          <span className="text-xs text-muted-foreground">/{p.interval === "monthly" ? "mês" : p.interval === "annual" ? "ano" : "único"}</span>
                        </div>
                        {p.features.length > 0 && (
                          <ul className="mb-3 space-y-0.5">
                            {p.features.slice(0, 4).map((f, i) => (
                              <li key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Check className="w-3 h-3 text-emerald-500 shrink-0" />{f}
                              </li>
                            ))}
                            {p.features.length > 4 && <li className="text-xs text-muted-foreground pl-4">+{p.features.length - 4} mais…</li>}
                          </ul>
                        )}
                        <div className="flex gap-2 mt-2">
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditPlan(p)}>
                            <Pencil className="w-3.5 h-3.5 mr-1.5" />Editar
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => deletePlan(p.id, p.name)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Plan dialog */}
              <Dialog open={planDialog} onOpenChange={setPlanDialog}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingPlan?.id ? "Editar Plano" : "Novo Plano"}</DialogTitle>
                  </DialogHeader>
                  {editingPlan && (
                    <div className="space-y-4">
                      <div>
                        <Label>Nome do plano *</Label>
                        <Input className="mt-1" value={editingPlan.name} onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })} placeholder="Plano Básico" />
                      </div>
                      <div>
                        <Label>Descrição</Label>
                        <Textarea className="mt-1 resize-none min-h-[60px]" value={editingPlan.description ?? ""} onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Preço (R$)</Label>
                          <Input className="mt-1" type="number" min={0} step={0.01} value={editingPlan.price} onChange={(e) => setEditingPlan({ ...editingPlan, price: Number(e.target.value) })} />
                        </div>
                        <div>
                          <Label>Intervalo</Label>
                          <Select value={editingPlan.interval} onValueChange={(v) => setEditingPlan({ ...editingPlan, interval: v })}>
                            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="monthly">Mensal</SelectItem>
                              <SelectItem value="annual">Anual</SelectItem>
                              <SelectItem value="single">Avulso</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Máx. consultas (vazio = ilimitado)</Label>
                          <Input className="mt-1" type="number" min={1} value={editingPlan.max_appointments ?? ""} onChange={(e) => setEditingPlan({ ...editingPlan, max_appointments: e.target.value ? Number(e.target.value) : null })} placeholder="∞" />
                        </div>
                        <div>
                          <Label>Stripe Price ID</Label>
                          <Input className="mt-1 font-mono text-xs" value={editingPlan.stripe_price_id ?? ""} onChange={(e) => setEditingPlan({ ...editingPlan, stripe_price_id: e.target.value || null })} placeholder="price_xxx" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <Label className="font-normal">Plano ativo</Label>
                        <Switch checked={editingPlan.is_active} onCheckedChange={(c) => setEditingPlan({ ...editingPlan, is_active: c })} />
                      </div>
                      <div>
                        <Label>Funcionalidades incluídas</Label>
                        <div className="flex flex-wrap gap-1.5 mt-2 min-h-[32px]">
                          {editingPlan.features.map((f, i) => (
                            <Badge key={i} variant="secondary" className="gap-1 pr-1">
                              {f}
                              <button type="button" onClick={() => removeFeature(i)} className="ml-0.5 text-muted-foreground hover:text-foreground">
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Input
                            value={planFeatureInput}
                            onChange={(e) => setPlanFeatureInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFeature(); } }}
                            placeholder="Ex: Consultas ilimitadas"
                            className="flex-1 text-sm"
                          />
                          <Button type="button" variant="outline" size="sm" onClick={addFeature}><Plus className="w-4 h-4" /></Button>
                        </div>
                      </div>
                    </div>
                  )}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setPlanDialog(false)}>Cancelar</Button>
                    <Button onClick={savePlan} disabled={savingPlan}>
                      {savingPlan ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Salvar Plano
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>

            {/* ── DEPOIMENTOS ───────────────────────────────────────────── */}
            <TabsContent value="depoimentos">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{testimonials.length} depoimento{testimonials.length !== 1 ? "s" : ""}</p>
                    <p className="text-xs text-muted-foreground">Depoimentos exibidos na landing page.</p>
                  </div>
                  <Button size="sm" onClick={openNewTestimonial}><Plus className="w-4 h-4 mr-2" />Novo Depoimento</Button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {testimonials.map((t) => (
                    <Card key={t.id} className={!t.is_active ? "opacity-60" : ""}>
                      <CardContent className="pt-4 pb-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {t.avatar_url ? (
                              <img src={t.avatar_url} alt={t.name} className="w-8 h-8 rounded-full object-cover border border-border" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">{t.name[0]}</div>
                            )}
                            <div>
                              <p className="text-sm font-semibold leading-tight">{t.name}</p>
                              <p className="text-xs text-muted-foreground">{t.role ?? ""}{t.company ? ` · ${t.company}` : ""}</p>
                            </div>
                          </div>
                          <Switch checked={t.is_active} onCheckedChange={() => toggleTestimonialActive(t)} />
                        </div>
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(s => <Star key={s} className={`w-3.5 h-3.5 ${s <= t.rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground"}`} />)}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-3">"{t.text}"</p>
                        <div className="flex gap-2 pt-1">
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditTestimonial(t)}><Pencil className="w-3.5 h-3.5 mr-1.5" />Editar</Button>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => deleteTestimonial(t.id, t.name)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <Dialog open={testimonialDialog} onOpenChange={setTestimonialDialog}>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>{editingTestimonial?.id ? "Editar Depoimento" : "Novo Depoimento"}</DialogTitle>
                  </DialogHeader>
                  {editingTestimonial && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Nome *</Label>
                          <Input className="mt-1" value={editingTestimonial.name} onChange={(e) => setEditingTestimonial({ ...editingTestimonial, name: e.target.value })} />
                        </div>
                        <div>
                          <Label>Cargo / Papel</Label>
                          <Input className="mt-1" value={editingTestimonial.role ?? ""} onChange={(e) => setEditingTestimonial({ ...editingTestimonial, role: e.target.value })} placeholder="Paciente" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Empresa (opcional)</Label>
                          <Input className="mt-1" value={editingTestimonial.company ?? ""} onChange={(e) => setEditingTestimonial({ ...editingTestimonial, company: e.target.value })} />
                        </div>
                        <div>
                          <Label>Foto (URL)</Label>
                          <Input className="mt-1" value={editingTestimonial.avatar_url ?? ""} onChange={(e) => setEditingTestimonial({ ...editingTestimonial, avatar_url: e.target.value })} placeholder="https://..." />
                        </div>
                      </div>
                      <div>
                        <Label>Depoimento *</Label>
                        <Textarea className="mt-1 resize-none min-h-[80px]" value={editingTestimonial.text} onChange={(e) => setEditingTestimonial({ ...editingTestimonial, text: e.target.value })} />
                      </div>
                      <div className="flex items-center gap-4">
                        <div>
                          <Label className="text-sm mb-1 block">Avaliação</Label>
                          <StarRating value={editingTestimonial.rating} onChange={(v) => setEditingTestimonial({ ...editingTestimonial, rating: v })} />
                        </div>
                        <div className="flex items-center gap-2 ml-auto">
                          <Label className="font-normal text-sm">Ativo</Label>
                          <Switch checked={editingTestimonial.is_active} onCheckedChange={(c) => setEditingTestimonial({ ...editingTestimonial, is_active: c })} />
                        </div>
                      </div>
                      <div>
                        <Label>Ordem de exibição</Label>
                        <Input className="mt-1 w-24" type="number" min={1} value={editingTestimonial.order_index} onChange={(e) => setEditingTestimonial({ ...editingTestimonial, order_index: Number(e.target.value) })} />
                      </div>
                    </div>
                  )}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setTestimonialDialog(false)}>Cancelar</Button>
                    <Button onClick={saveTestimonial} disabled={savingTestimonial}>
                      {savingTestimonial ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Salvar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>

            {/* ── FAQ ───────────────────────────────────────────────────── */}
            <TabsContent value="faq">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{faqItems.length} pergunta{faqItems.length !== 1 ? "s" : ""} no FAQ</p>
                    <p className="text-xs text-muted-foreground">Perguntas frequentes exibidas na landing page.</p>
                  </div>
                  <Button size="sm" onClick={openNewFaq}><Plus className="w-4 h-4 mr-2" />Nova Pergunta</Button>
                </div>
                <div className="space-y-2">
                  {faqItems.map((f) => (
                    <Card key={f.id} className={!f.is_active ? "opacity-60" : ""}>
                      <CardContent className="py-3 px-4">
                        <div className="flex items-start gap-3">
                          <GripVertical className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                              <p className="text-sm font-medium">{f.question}</p>
                              {f.category && <Badge variant="outline" className="text-[10px]">{f.category}</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">{f.answer}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Switch checked={f.is_active} onCheckedChange={() => toggleFaqActive(f)} />
                            <Button variant="ghost" size="sm" onClick={() => openEditFaq(f)}><Pencil className="w-3.5 h-3.5" /></Button>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => deleteFaq(f.id, f.question)}><Trash2 className="w-3.5 h-3.5" /></Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <Dialog open={faqDialog} onOpenChange={setFaqDialog}>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>{editingFaq?.id ? "Editar Pergunta" : "Nova Pergunta"}</DialogTitle>
                  </DialogHeader>
                  {editingFaq && (
                    <div className="space-y-4">
                      <div>
                        <Label>Pergunta *</Label>
                        <Input className="mt-1" value={editingFaq.question} onChange={(e) => setEditingFaq({ ...editingFaq, question: e.target.value })} />
                      </div>
                      <div>
                        <Label>Resposta *</Label>
                        <Textarea className="mt-1 resize-none min-h-[100px]" value={editingFaq.answer} onChange={(e) => setEditingFaq({ ...editingFaq, answer: e.target.value })} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Categoria</Label>
                          <Input className="mt-1" value={editingFaq.category ?? ""} onChange={(e) => setEditingFaq({ ...editingFaq, category: e.target.value })} placeholder="geral" />
                        </div>
                        <div>
                          <Label>Ordem</Label>
                          <Input className="mt-1" type="number" min={1} value={editingFaq.order_index} onChange={(e) => setEditingFaq({ ...editingFaq, order_index: Number(e.target.value) })} />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="font-normal text-sm">Ativo</Label>
                        <Switch checked={editingFaq.is_active} onCheckedChange={(c) => setEditingFaq({ ...editingFaq, is_active: c })} />
                      </div>
                    </div>
                  )}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setFaqDialog(false)}>Cancelar</Button>
                    <Button onClick={saveFaq} disabled={savingFaq}>
                      {savingFaq ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Salvar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>

            {/* ── APARÊNCIA ─────────────────────────────────────────────── */}
            <TabsContent value="aparencia">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Cores e Estilo</CardTitle>
                  <p className="text-xs text-muted-foreground">Paleta principal da plataforma.</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {rows("aparencia").map(r => (
                    <ConfigField key={r.key} row={r} value={values[r.key] ?? ""} onChange={handleChange} />
                  ))}
                  <div className="p-3 rounded-xl border border-border bg-muted/40">
                    <p className="text-xs text-muted-foreground mb-2 font-medium">Pré-visualização</p>
                    <div className="flex gap-3 flex-wrap">
                      {(["color_primary","color_secondary","color_accent"] as const).map(k => (
                        <div key={k} className="flex flex-col items-center gap-1">
                          <div className="w-14 h-14 rounded-xl border border-border shadow-sm" style={{ backgroundColor: values[k] || "#cccccc" }} />
                          <span className="text-[10px] text-muted-foreground font-mono">{values[k] || "—"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <SaveBtn onSave={() => saveCategory("aparencia")} saving={savingCat === "aparencia"} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── SEO ───────────────────────────────────────────────────── */}
            <TabsContent value="seo">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">SEO e Metadados</CardTitle>
                  <p className="text-xs text-muted-foreground">Título, descrição e imagem para buscadores e redes sociais.</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {rows("seo").map(r => (
                    <ConfigField key={r.key} row={r} value={values[r.key] ?? ""} onChange={handleChange} />
                  ))}
                  <div className="p-4 rounded-xl border border-border bg-white dark:bg-zinc-900 shadow-sm">
                    <p className="text-xs text-muted-foreground mb-1.5">Prévia no Google:</p>
                    <p className="text-blue-600 dark:text-blue-400 text-sm font-medium leading-tight">{values["seo_title"] || "AlôMédico"}</p>
                    <p className="text-green-700 dark:text-green-500 text-xs">alomedico.com.br</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{values["seo_description"] || "—"}</p>
                  </div>
                  <SaveBtn onSave={() => saveCategory("seo")} saving={savingCat === "seo"} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── INTEGRAÇÕES ───────────────────────────────────────────── */}
            <TabsContent value="integracoes">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    Integrações e Flags
                    {values["maintenance_mode"] === "true" && (
                      <Badge variant="destructive" className="text-[10px]">MANUTENÇÃO ATIVA</Badge>
                    )}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Ative/desative funcionalidades e modo manutenção.</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {rows("integracoes").filter(r => r.input_type === "boolean").map(r => (
                    <ConfigField key={r.key} row={r} value={values[r.key] ?? ""} onChange={handleChange} />
                  ))}
                  <div className="space-y-4 pt-2 border-t border-border">
                    {rows("integracoes").filter(r => r.input_type !== "boolean").map(r => (
                      <ConfigField key={r.key} row={r} value={values[r.key] ?? ""} onChange={handleChange} />
                    ))}
                  </div>
                  <SaveBtn onSave={() => saveCategory("integracoes")} saving={savingCat === "integracoes"} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir{" "}
              <span className="font-semibold text-foreground">"{deleteTarget?.label}"</span>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default AdminSiteConfig;
