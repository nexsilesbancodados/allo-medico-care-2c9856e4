import { Navigate } from "react-router-dom";

/**
 * Legacy TelelaudoWorkspace — redirects to the unified laudista queue.
 * The ExamReportEditor (accessed from the queue) is the primary reporting tool.
 */
const TelelaudoWorkspace = () => {
  return <Navigate to="/dashboard/laudista/queue?role=doctor" replace />;
};

export default TelelaudoWorkspace;
