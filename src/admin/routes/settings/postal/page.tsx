import { defineRouteConfig } from "@medusajs/admin-sdk";

export const config = defineRouteConfig({
  label: "Postal",
  icon: function PostalRouteIcon() {
    return (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="15" height="15" fill="#F43F5E" />
        <rect width="15" height="15" fill="url(#postal-settings-icon-gradient)" fillOpacity="0.2" />
        <g transform="translate(2 2) scale(0.7)" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
          <path d="M11.829 4.398a2.82 2.82 0 0 1 1.511 2.498v4.028c0 .444-.36.805-.805.805H6.493M4.48 4.077h4.832" />
          <path d="M4.48 4.077a2.82 2.82 0 0 1 2.819 2.82v4.027c0 .444-.361.805-.806.805H2.465a.806.806 0 0 1-.805-.805V6.896a2.82 2.82 0 0 1 2.82-2.82M7.299 11.528v1.812M4.48 6.896v1.208" />
          <path fill="white" d="M11.73.854H9.311v1.209h2.417z" />
          <path d="M9.313 5.285V1.86" />
        </g>
        <defs>
          <linearGradient id="postal-settings-icon-gradient" x1="7.5" y1="0" x2="7.5" y2="15" gradientUnits="userSpaceOnUse">
            <stop stopColor="white" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    )
  },
});

export { PostalSettingsPage as default } from "../../plugin-settings/postal/page";
