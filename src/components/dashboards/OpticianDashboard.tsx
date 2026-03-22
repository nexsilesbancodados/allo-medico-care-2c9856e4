import { lazy, Suspense } from "react";
import { Spinner } from "@/components/ui/spinner";

const OpticianOverview = lazy(() => import("@/components/optician/OpticianOverview"));
const OpticianOrders = lazy(() => import("@/components/optician/OpticianOrders"));
const OpticianCatalog = lazy(() => import("@/components/optician/OpticianCatalog"));
const OpticianStock = lazy(() => import("@/components/optician/OpticianStock"));
const OpticianProduction = lazy(() => import("@/components/optician/OpticianProduction"));
const OpticianFinancial = lazy(() => import("@/components/optician/OpticianFinancial"));

const fallback = <div className="flex justify-center py-12"><Spinner /></div>;

interface Props {
  activeTab: string;
}

const OpticianDashboard = ({ activeTab }: Props) => {
  return (
    <Suspense fallback={fallback}>
      {activeTab === "overview" && <OpticianOverview />}
      {activeTab === "orders" && <OpticianOrders />}
      {activeTab === "catalog" && <OpticianCatalog />}
      {activeTab === "stock" && <OpticianStock />}
      {activeTab === "production" && <OpticianProduction />}
      {activeTab === "financial" && <OpticianFinancial />}
    </Suspense>
  );
};

export default OpticianDashboard;
