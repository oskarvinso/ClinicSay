import { AlertEntity } from "../src/backend/domain/entities/AlertEntity.js";
import { AlertSeverity } from "../src/backend/domain/enums/AlertSeverity.js";
import { AlertType } from "../src/backend/domain/enums/AlertType.js";
import { PrismaAlertRepository } from "../src/backend/infrastructure/repositories/PrismaAlertRepository.js";
import { CreateAlertUseCase } from "../src/backend/application/use-cases/CreateAlertUseCase.js";
import { UpdateAlertUseCase } from "../src/backend/application/use-cases/UpdateAlertUseCase.js";
import { GetAlertsUseCase } from "../src/backend/application/use-cases/GetAlertsUseCase.js";
import { AlertsController } from "../src/backend/presentation/controllers/AlertsController.js";
import { prismaInstance } from "../src/backend/infrastructure/database/PrismaClientSimulator.js";

// Colors for terminal formatting
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string, errorMessage?: string) {
  if (condition) {
    console.log(` ✅ ${GREEN}PASSED:${RESET} ${testName}`);
    passCount++;
  } else {
    console.error(` ❌ ${RED}FAILED:${RESET} ${testName}`);
    if (errorMessage) {
      console.error(`    -> ${errorMessage}`);
    }
    failCount++;
  }
}

async function runAllTests() {
  console.log(`\n${BOLD}====================================================`);
  console.log(`🧪 CLINICSAY SUITE DE PRUEBAS AUTOMATIZADAS CLÍNICAS`);
  console.log(`====================================================${RESET}\n`);

  // Clear simulator database storage state to clean up side-effects
  prismaInstance.overrideDatabase([]);

  const repo = new PrismaAlertRepository();
  const createAlertUseCase = new CreateAlertUseCase(repo);
  const updateAlertUseCase = new UpdateAlertUseCase(repo);
  const getAlertsUseCase = new GetAlertsUseCase(repo);

  // ----------------------------------------------------
  // TEST 1: Regla de dominio - Bloqueo de duplicación activa
  // ----------------------------------------------------
  try {
    // 1. Create first active alert
    await createAlertUseCase.execute({
      patientId: "PT-TEST-01",
      type: AlertType.ALLERGY,
      severity: AlertSeverity.HIGH,
      message: "Reacción adversa severa detectada contra analgésicos narcóticos."
    });

    // 2. Attempt to register a duplicate active alert
    await createAlertUseCase.execute({
      patientId: "PT-TEST-01",
      type: AlertType.ALLERGY,
      severity: AlertSeverity.LOW, // severity shouldn't bypass duplicate checks
      message: "  Reacción adversa severa detectada contra analgésicos narcóticos.  " // spaces shouldn't bypass duplicate checks
    });

    assert(false, "REGLAS DE DOMINIO - Bloqueo de segunda alerta idéntica ACTIVA", "El sistema permitió guardar una alerta activa duplicada.");
  } catch (err: any) {
    const isViolated = err.message.includes("REGLA CLÍNICA VIOLADA");
    assert(isViolated, "REGLAS DE DOMINIO - Bloqueo de segunda alerta idéntica ACTIVA", `Se esperaba error clínico de coincidencia. Se obtuvo: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST 2: Regla de dominio - Múltiples alertas inactivas idénticas permitidas en historial clínico
  // ----------------------------------------------------
  try {
    // Clear state
    prismaInstance.overrideDatabase([]);

    // 1. Create active alert
    await createAlertUseCase.execute({
      patientId: "PT-TEST-02",
      type: AlertType.MEDICAL_RISK,
      severity: AlertSeverity.MEDIUM,
      message: "Glucemia inestable - requiere monitoreo."
    });

    // 2. Create inactive duplicate (Valid historical status)
    await createAlertUseCase.execute({
      patientId: "PT-TEST-02",
      type: AlertType.MEDICAL_RISK,
      severity: AlertSeverity.LOW,
      message: "Glucemia inestable - requiere monitoreo.",
      active: false
    });

    // 3. Create second inactive duplicate (Valid historical status)
    await createAlertUseCase.execute({
      patientId: "PT-TEST-02",
      type: AlertType.MEDICAL_RISK,
      severity: AlertSeverity.HIGH,
      message: "Glucemia inestable - requiere monitoreo.",
      active: false
    });

    const patientHistory = await repo.findByPatientId("PT-TEST-02");
    
    assert(
      patientHistory.length === 3,
      "REGLAS DE HISTORIAL - Permisión de múltiples duplicados INACTIVOS para auditoría histórica",
      `Se esperaban exactamente 3 registros en historial clínico, pero se obtuvieron: ${patientHistory.length}`
    );
  } catch (err: any) {
    assert(false, "REGLAS DE HISTORIAL - Permisión de múltiples duplicados INACTIVOS", err.message);
  }

  // ----------------------------------------------------
  // TEST 3: Presentación / Endpoint - Mapeo HTTP de error 409 Conflict al violar la regla
  // ----------------------------------------------------
  try {
    prismaInstance.overrideDatabase([]);
    const controller = new AlertsController();

    // Mock Express Request and Response structures
    let responseStatus = 0;
    let responseJson: any = null;

    const reqMock1 = {
      params: { patientId: "PT-TEST-03" },
      body: {
        type: "ALLERGY",
        severity: "HIGH",
        message: "Alergia confirmada a mariscos."
      }
    } as any;

    const resMock1 = {
      status: (code: number) => {
        responseStatus = code;
        return resMock1;
      },
      json: (data: any) => {
        responseJson = data;
        return resMock1;
      }
    } as any;

    // Call first POST
    await controller.createAlert(reqMock1, resMock1);
    const passedFirstEndpoint = responseStatus === 201 && responseJson.id !== undefined;

    // Call second identical POST
    let responseStatusSecond = 0;
    let responseJsonSecond: any = null;

    const resMock2 = {
      status: (code: number) => {
        responseStatusSecond = code;
        return resMock2;
      },
      json: (data: any) => {
        responseJsonSecond = data;
        return resMock2;
      }
    } as any;

    await controller.createAlert(reqMock1, resMock2);
    
    assert(
      passedFirstEndpoint && responseStatusSecond === 409 && responseJsonSecond.status === "clinical_rule_error",
      "INTEGRACIÓN ENDPOINT - Controller retorna HTTP 409 Conflict ante registros médicos de entrada inválidos",
      `Endpoint no respondió correctamente. Primer status: ${responseStatus}, Segundo status: ${responseStatusSecond}`
    );
  } catch (err: any) {
    assert(false, "INTEGRACIÓN ENDPOINT - Controller retorna HTTP 409 Conflict", err.message);
  }

  // ----------------------------------------------------
  // TEST 4: BONUS DE UI - Re-ordenamiento y visualización prioritaria de alertas críticas activas (GetAlertsUseCase)
  // ----------------------------------------------------
  try {
    prismaInstance.overrideDatabase([]);

    // Seed out-of-order severity alerts
    // 1. Inactive Alert
    await createAlertUseCase.execute({
      patientId: "PT-TEST-04",
      type: AlertType.ADMINISTRATIVE,
      severity: AlertSeverity.LOW,
      message: "Alerta administrativa inactiva de prueba.",
      active: false
    });

    // 2. Active LOW Alert
    await createAlertUseCase.execute({
      patientId: "PT-TEST-04",
      type: AlertType.SPECIAL_CONDITION,
      severity: AlertSeverity.LOW,
      message: "Alerta baja activa de prueba."
    });

    // 3. Active HIGH Alert
    await createAlertUseCase.execute({
      patientId: "PT-TEST-04",
      type: AlertType.ALLERGY,
      severity: AlertSeverity.HIGH,
      message: "Alerta alta activa de prueba."
    });

    // 4. Active MEDIUM Alert
    await createAlertUseCase.execute({
      patientId: "PT-TEST-04",
      type: AlertType.MEDICAL_RISK,
      severity: AlertSeverity.MEDIUM,
      message: "Alerta media activa de prueba."
    });

    // Invoke sorted fetcher
    const sortedAlerts = await getAlertsUseCase.execute("PT-TEST-04");

    // Order should be:
    // Index 0: HIGH active
    // Index 1: MEDIUM active
    // Index 2: LOW active
    // Index 3: Inactive alert
    const isSortedCorrectly = 
      sortedAlerts[0].severity === AlertSeverity.HIGH && sortedAlerts[0].active &&
      sortedAlerts[1].severity === AlertSeverity.MEDIUM && sortedAlerts[1].active &&
      sortedAlerts[2].severity === AlertSeverity.LOW && sortedAlerts[2].active &&
      !sortedAlerts[3].active;

    assert(
      isSortedCorrectly,
      "RENDER DE INTERFAZ (UI BONUS) - Priorización automatizada de alertas médicas por criticidad (HIGH -> MEDIUM -> LOW -> INACTIVAS)",
      `El orden clínico no se priorizó correctamente. Orden obtenido: ${sortedAlerts.map(a => `${a.severity}(Active:${a.active})`).join(" , ")}`
    );
  } catch (err: any) {
    assert(false, "RENDER DE INTERFAZ (UI BONUS)", err.message);
  }

  // ----------------------------------------------------
  // FINAL SUMMARY DASHBOARD
  // ----------------------------------------------------
  console.log(`\n${BOLD}----------------------------------------------------`);
  console.log(`📊 DIAGNÓSTICO FINAL DE PRUEBAS CLÍNICAS`);
  console.log(`----------------------------------------------------${RESET}`);
  console.log(`Pruebas Exitosas: ${GREEN}${BOLD}${passCount}${RESET}`);
  console.log(`Pruebas Fallidas: ${failCount > 0 ? RED + BOLD : GREEN}${BOLD}${failCount}${RESET}`);
  console.log(`${BOLD}====================================================${RESET}\n`);

  // Force seed restore to let primary mock UI load initially with clean starting conditions
  prismaInstance.overrideDatabase([]);

  if (failCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAllTests().catch((err) => {
  console.error("Critical failure during test execution suite:", err);
  process.exit(1);
});
