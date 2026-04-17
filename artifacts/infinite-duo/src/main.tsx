import { createRoot } from "react-dom/client";
import { setBaseUrl } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

// Configure API base URL to point to API server
const apiUrl = import.meta.env.PROD_API_URL || "https://standalone-api-eight.vercel.app";
setBaseUrl(apiUrl);

createRoot(document.getElementById("root")!).render(<App />);
