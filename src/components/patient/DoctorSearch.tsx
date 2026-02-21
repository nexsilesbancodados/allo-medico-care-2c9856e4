import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Star, Calendar, Zap, AlertTriangle, SlidersHorizontal, X } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getPatientNav } from "./patientNav";

interface DoctorResult {
  id: string;
  user_id: string;
  crm: string;
  crm_state: string;
  bio: string | null;
  consultation_price: number;
  rating: number;
  total_reviews: number;
  experience_years: number;
  profile: { first_name: string; last_name: string; avatar_url: string | null } | null;
  specialties: string[];
}

const DoctorSearch = () => {
  const [searchParams] = useSearchParams();
  const isUrgency = searchParams.get("urgency") === "true";
  const [doctors, setDoctors] = useState<DoctorResult[]>([]);
  const [availableNowIds, setAvailableNowIds] = useState<Set<string>>(new Set());
  const [specialties, setSpecialties] = useState<{ id: string; name: string }[]>([]);
  const [search, setSearch] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  // Advanced filters
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [minRating, setMinRating] = useState(0);
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("rating");

  useEffect(() => {
    fetchSpecialties();
    fetchDoctors();
  }, []);

  const fetchSpecialties = async () => {
    const { data } = await supabase.from("specialties").select("id, name").order("name");
    if (data) setSpecialties(data);
  };

  const fetchDoctors = async () => {
    setLoading(true);

    const { data: doctorData } = await supabase
      .from("doctor_profiles")
      .select("id, user_id, crm, crm_state, bio, consultation_price, rating, total_reviews, experience_years")
      .eq("is_approved", true);

    if (!doctorData) { setLoading(false); return; }

    const doctorIds = doctorData.map(d => d.id);
    const userIds = doctorData.map(d => d.user_id);

    const [profilesRes, specRes, slotsRes] = await Promise.all([
      supabase.from("profiles").select("user_id, first_name, last_name, avatar_url").in("user_id", userIds),
      supabase.from("doctor_specialties").select("doctor_id, specialty_id, specialties(name)").in("doctor_id", doctorIds),
      supabase.from("availability_slots").select("doctor_id, day_of_week, start_time, end_time").eq("is_active", true).in("doctor_id", doctorIds),
    ]);

    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const availableNow = new Set<string>();
    slotsRes.data?.forEach(slot => {
      if (slot.day_of_week === currentDay && slot.start_time <= currentTime && slot.end_time > currentTime) {
        availableNow.add(slot.doctor_id);
      }
    });
    setAvailableNowIds(availableNow);

    const profilesMap = new Map(profilesRes.data?.map(p => [p.user_id, p]) ?? []);
    const specsMap = new Map<string, string[]>();
    specRes.data?.forEach((s: any) => {
      const arr = specsMap.get(s.doctor_id) ?? [];
      arr.push(s.specialties?.name ?? "");
      specsMap.set(s.doctor_id, arr);
    });

    const results: DoctorResult[] = doctorData.map(d => ({
      ...d,
      consultation_price: Number(d.consultation_price),
      rating: Number(d.rating),
      profile: profilesMap.get(d.user_id) as any ?? null,
      specialties: specsMap.get(d.id) ?? [],
    }));

    // Find max price for slider
    const maxPrice = Math.max(...results.map(d => d.consultation_price), 500);
    setPriceRange([0, maxPrice]);

    setDoctors(results);
    setLoading(false);
  };

  const filtered = doctors
    .filter(d => {
      const nameMatch = !search ||
        `${d.profile?.first_name} ${d.profile?.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
        d.crm.includes(search);
      const specMatch = !selectedSpecialty || d.specialties.some(s => s === selectedSpecialty);
      const urgencyMatch = !isUrgency || availableNowIds.has(d.id);
      const priceMatch = d.consultation_price >= priceRange[0] && d.consultation_price <= priceRange[1];
      const ratingMatch = d.rating >= minRating;
      const availMatch = availabilityFilter === "all" ||
        (availabilityFilter === "today" && availableNowIds.has(d.id));
      return nameMatch && specMatch && urgencyMatch && priceMatch && ratingMatch && availMatch;
    })
    .sort((a, b) => {
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "price_asc") return a.consultation_price - b.consultation_price;
      if (sortBy === "price_desc") return b.consultation_price - a.consultation_price;
      if (sortBy === "experience") return b.experience_years - a.experience_years;
      return 0;
    });

  const activeFilters = (minRating > 0 ? 1 : 0) + (availabilityFilter !== "all" ? 1 : 0) + (sortBy !== "rating" ? 1 : 0);

  return (
    <DashboardLayout title="Paciente" nav={getPatientNav("doctors")}>
      <div className="max-w-4xl">
        {isUrgency && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">Modo Urgência</p>
              <p className="text-xs text-muted-foreground">Mostrando apenas médicos com disponibilidade agora.</p>
            </div>
            <Button size="sm" variant="outline" className="ml-auto flex-shrink-0" onClick={() => navigate("/dashboard/schedule")}>
              Ver todos
            </Button>
          </div>
        )}
        <h1 className="text-2xl font-bold text-foreground mb-1">
          {isUrgency ? "⚡ Consulta de Urgência" : "Buscar Médicos"}
        </h1>
        <p className="text-muted-foreground mb-6">
          {isUrgency ? "Médicos disponíveis agora para atendimento imediato" : "Encontre o especialista ideal para você"}
        </p>

        {/* Search + filter toggle */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou CRM..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-1.5"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filtros
            {activeFilters > 0 && (
              <span className="ml-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                {activeFilters}
              </span>
            )}
          </Button>
        </div>

        {/* Advanced filters panel */}
        {showFilters && (
          <Card className="mb-4 border-border">
            <CardContent className="p-4 space-y-4">
              <div className="grid sm:grid-cols-3 gap-4">
                {/* Price range */}
                <div>
                  <p className="text-xs font-medium text-foreground mb-2">
                    Faixa de Preço: R${priceRange[0]} – R${priceRange[1]}
                  </p>
                  <Slider
                    min={0}
                    max={500}
                    step={10}
                    value={priceRange}
                    onValueChange={(v) => setPriceRange(v as [number, number])}
                  />
                </div>

                {/* Min rating */}
                <div>
                  <p className="text-xs font-medium text-foreground mb-2">Avaliação mínima</p>
                  <div className="flex gap-1.5">
                    {[0, 3, 3.5, 4, 4.5].map(r => (
                      <Button
                        key={r}
                        variant={minRating === r ? "default" : "outline"}
                        size="sm"
                        className="text-xs h-8 gap-1"
                        onClick={() => setMinRating(r)}
                      >
                        {r === 0 ? "Todas" : <><Star className="w-3 h-3 fill-current" /> {r}+</>}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Availability */}
                <div>
                  <p className="text-xs font-medium text-foreground mb-2">Disponibilidade</p>
                  <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Qualquer horário</SelectItem>
                      <SelectItem value="today">Atende hoje</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div>
                  <p className="text-xs font-medium text-foreground mb-1">Ordenar por</p>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="h-8 text-xs w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rating">Melhor avaliação</SelectItem>
                      <SelectItem value="price_asc">Menor preço</SelectItem>
                      <SelectItem value="price_desc">Maior preço</SelectItem>
                      <SelectItem value="experience">Mais experiente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground"
                  onClick={() => {
                    setMinRating(0);
                    setAvailabilityFilter("all");
                    setSortBy("rating");
                    setPriceRange([0, 500]);
                  }}
                >
                  <X className="w-3 h-3 mr-1" /> Limpar filtros
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Specialty chips */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Badge
            variant={selectedSpecialty === null ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setSelectedSpecialty(null)}
          >
            Todas
          </Badge>
          {specialties.map(s => (
            <Badge
              key={s.id}
              variant={selectedSpecialty === s.name ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedSpecialty(selectedSpecialty === s.name ? null : s.name)}
            >
              {s.name}
            </Badge>
          ))}
        </div>

        {/* Results count */}
        {!loading && (
          <p className="text-xs text-muted-foreground mb-3">{filtered.length} médico{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}</p>
        )}

        {/* Results */}
        {loading ? (
          <p className="text-muted-foreground text-sm">Carregando médicos...</p>
        ) : filtered.length === 0 ? (
          <Card className="border-border">
            <CardContent className="py-12 text-center">
              <Search className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Nenhum médico encontrado.</p>
              <p className="text-sm text-muted-foreground mt-1">Tente ajustar os filtros de busca.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filtered.map(doctor => (
              <Card key={doctor.id} className="border-border hover:shadow-card transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-14 h-14 flex-shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {doctor.profile?.first_name?.[0]}{doctor.profile?.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-foreground">
                            Dr(a). {doctor.profile?.first_name} {doctor.profile?.last_name}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            CRM {doctor.crm}/{doctor.crm_state}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-lg font-bold text-foreground">R${doctor.consultation_price}</p>
                          <p className="text-xs text-muted-foreground">por consulta</p>
                        </div>
                      </div>

                      {doctor.specialties.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {doctor.specialties.map(s => (
                            <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                          ))}
                        </div>
                      )}

                      {doctor.bio && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{doctor.bio}</p>
                      )}

                      <div className="flex items-center gap-4 mt-3">
                        {availableNowIds.has(doctor.id) && (
                          <Badge className="bg-secondary/10 text-secondary border-secondary/20 text-xs gap-1">
                            <Zap className="w-3 h-3" /> Disponível agora
                          </Badge>
                        )}
                        {doctor.rating > 0 && (
                          <span className="flex items-center gap-1 text-sm">
                            <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                            {doctor.rating.toFixed(1)} ({doctor.total_reviews})
                          </span>
                        )}
                        {doctor.experience_years > 0 && (
                          <span className="text-sm text-muted-foreground">
                            {doctor.experience_years} anos de exp.
                          </span>
                        )}
                      </div>

                      <Button
                        className="mt-3 bg-gradient-hero text-primary-foreground"
                        size="sm"
                        onClick={() => navigate(`/dashboard/schedule/${doctor.id}`)}
                      >
                        <Calendar className="w-4 h-4 mr-1" />
                        Agendar Consulta
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DoctorSearch;
