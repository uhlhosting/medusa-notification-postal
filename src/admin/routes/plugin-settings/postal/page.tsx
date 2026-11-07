import { Navigate } from "react-router-dom";

// Legacy location of the settings page; kept so saved links keep working.
const PostalPluginSettingsRedirect = () => (
  <Navigate to="/settings/postal" replace />
);

export default PostalPluginSettingsRedirect;
