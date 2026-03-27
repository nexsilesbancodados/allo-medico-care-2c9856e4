import { lazy, Suspense } from "react";
const EditorLaudo = lazy(() => import("@/components/laudos/EditorLaudo"));
export default function LaudosEditorPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
      <EditorLaudo />
    </Suspense>
  );
}
