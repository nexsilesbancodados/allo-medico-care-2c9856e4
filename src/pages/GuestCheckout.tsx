import { Navigate } from "react-router-dom";
/** Guest checkout removed — login required. Redirects to patient auth. */
const GuestCheckout = () => <Navigate to="/paciente" replace />;
export default GuestCheckout;
