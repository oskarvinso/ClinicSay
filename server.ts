import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { AlertsController } from "./src/backend/presentation/controllers/AlertsController.js";

async function bootstrap() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());

  // Instantiate presentation controllers
  const alertsController = new AlertsController();

  // Clinically compliant REST API Endpoints
  app.get("/api/patients/:patientId/alerts", alertsController.getPatientAlerts);
  app.post("/api/patients/:patientId/alerts", alertsController.createAlert);
  app.patch("/api/patient-alerts/:alertId", alertsController.updateAlert);
  app.delete("/api/patient-alerts/:alertId", alertsController.deleteAlert);

  // Health probe
  app.get("/api/health", (req, res) => {
    res.json({ status: "up", timestamp: new Date().toISOString() });
  });

  // Serve Frontend assets using dynamic Vite server (Dev) or Express static (Prod)
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting in DEVELOPMENT mode with Vite integration...");
    const viteInstance = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(viteInstance.middlewares);
  } else {
    console.log("Starting in PRODUCTION mode. Serving pre-compiled static assets...");
    const distPath = path.resolve(process.cwd(), "dist");
    app.use(express.static(distPath));
    
    // SPA Routing Fallback
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ClinicSay full-stack medical API listening safely on http://0.0.0.0:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error("Critical: Failed to boot ClinicSay core server", err);
});
