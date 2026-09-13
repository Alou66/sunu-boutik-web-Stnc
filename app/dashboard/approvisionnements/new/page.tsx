import { Suspense } from "react";
import NewApprovisionnementPage from "@/features/approvisionnements/NewApprovisionnementPage";

export default function Page() {
  return (
    <Suspense fallback={<p className="text-gray-400">Chargement...</p>}>
      <NewApprovisionnementPage />
    </Suspense>
  );
}
