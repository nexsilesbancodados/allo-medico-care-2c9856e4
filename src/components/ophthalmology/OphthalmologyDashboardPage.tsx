import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Glasses } from "lucide-react";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

const OphthalmologyTechUpload = lazy(() => import("@/components/ophthalmology/OphthalmologyTechUpload"));
const OphthalmologyDoctorQueue = lazy(() => import("@/components/ophthalmology/OphthalmologyDoctorQueue"));

const OphthalmologyDashboardPage = () => {
  const { roles } = useAuth();
  const isDoctor = roles.includes("doctor") || roles.includes("admin");

  return (
    <Tabs defaultValue={isDoctor ? "queue" : "upload"} className="space-y-6">
      <TabsList className="bg-muted/50 rounded-xl p-1 h-auto">
        <TabsTrigger value="upload" className="rounded-lg gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
          <Upload className="w-4 h-4" /> Envio (Técnico)
        </TabsTrigger>
        {isDoctor && (
          <TabsTrigger value="queue" className="rounded-lg gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Glasses className="w-4 h-4" /> Fila Médica
          </TabsTrigger>
        )}
      </TabsList>

      <Suspense fallback={<div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
        <TabsContent value="upload">
          <OphthalmologyTechUpload />
        </TabsContent>
        {isDoctor && (
          <TabsContent value="queue">
            <OphthalmologyDoctorQueue />
          </TabsContent>
        )}
      </Suspense>
    </Tabs>
  );
};

export default OphthalmologyDashboardPage;
