import { Navigate } from "react-router-dom";
/** @deprecated Plans removed — redirects to dashboard */
const PlansCheckout = () => <Navigate to="/dashboard" replace />;
export default PlansCheckout;
