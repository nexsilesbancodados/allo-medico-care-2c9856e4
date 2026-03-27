import { lazy, Suspense } from "react";
const EditorLaudoCompleto = lazy(() => import("@/components/laudos/EditorLaudoCompleto"));
export default function LaudosEditarPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
      <EditorLaudoCompleto />
    </Suspense>
  );
}
