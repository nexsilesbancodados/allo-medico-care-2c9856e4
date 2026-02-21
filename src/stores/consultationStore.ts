import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface ConsultationState {
  // Prescription draft
  appointmentId: string | null;
  diagnosis: string;
  observations: string;
  medications: Medication[];
  // Consultation notes draft
  notesDraft: string;
  // Actions
  setAppointmentId: (id: string | null) => void;
  setDiagnosis: (d: string) => void;
  setObservations: (o: string) => void;
  setMedications: (m: Medication[]) => void;
  setNotesDraft: (n: string) => void;
  clearDraft: () => void;
}

export const useConsultationStore = create<ConsultationState>()(
  persist(
    (set) => ({
      appointmentId: null,
      diagnosis: "",
      observations: "",
      medications: [{ name: "", dosage: "", frequency: "", duration: "", instructions: "" }],
      notesDraft: "",
      setAppointmentId: (id) => set({ appointmentId: id }),
      setDiagnosis: (diagnosis) => set({ diagnosis }),
      setObservations: (observations) => set({ observations }),
      setMedications: (medications) => set({ medications }),
      setNotesDraft: (notesDraft) => set({ notesDraft }),
      clearDraft: () =>
        set({
          appointmentId: null,
          diagnosis: "",
          observations: "",
          medications: [{ name: "", dosage: "", frequency: "", duration: "", instructions: "" }],
          notesDraft: "",
        }),
    }),
    {
      name: "aloclinica-consultation-draft",
    }
  )
);
