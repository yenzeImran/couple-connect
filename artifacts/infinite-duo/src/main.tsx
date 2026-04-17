import { createRoot } from "react-dom/client";
import { setBaseUrl } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

// Configure API base URL to point to the API server
setBaseUrl("http://localhost:8000");

createRoot(document.getElementById("root")!).render(<App />);
