import { useLocation } from "react-router-dom";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getOpticianNav } from "@/components/optician/opticianNav";
import OpticianOverview from "@/components/optician/OpticianOverview";

const OpticianDashboard = () => {
  const location = useLocation();
  const path = location.pathname;

  const getActive = () => {
    if (path.includes("/orders")) return "orders";
    if (path.includes("/catalog")) return "catalog";
    if (path.includes("/stock")) return "stock";
    if (path.includes("/production")) return "production";
    if (path.includes("/financial")) return "financial";
    return "home";
  };

  return (
    <DashboardLayout title="Ótica Online" nav={getOpticianNav(getActive())} role="optician">
      <div className="pb-24 md:pb-8">
        <OpticianOverview />
      </div>
    </DashboardLayout>
  );
};

export default OpticianDashboard;
