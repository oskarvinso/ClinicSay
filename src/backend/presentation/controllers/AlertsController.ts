import { Request, Response } from "express";
import { PrismaAlertRepository } from "../../infrastructure/repositories/PrismaAlertRepository.js";
import { GetAlertsUseCase } from "../../application/use-cases/GetAlertsUseCase.js";
import { CreateAlertUseCase } from "../../application/use-cases/CreateAlertUseCase.js";
import { UpdateAlertUseCase } from "../../application/use-cases/UpdateAlertUseCase.js";
import { DeleteAlertUseCase } from "../../application/use-cases/DeleteAlertUseCase.js";
import { AlertType } from "../../domain/enums/AlertType.js";
import { AlertSeverity } from "../../domain/enums/AlertSeverity.js";

/**
 * Controlador que gestiona los mapeos HTTP para las alertas clínicas.
 * Funciona como un controlador ligero (delegando las operaciones completas a los UseCases).
 */
export class AlertsController {
  private repository: PrismaAlertRepository;
  private getAlertsUseCase: GetAlertsUseCase;
  private createAlertUseCase: CreateAlertUseCase;
  private updateAlertUseCase: UpdateAlertUseCase;
  private deleteAlertUseCase: DeleteAlertUseCase;

  constructor() {
    this.repository = new PrismaAlertRepository();
    this.getAlertsUseCase = new GetAlertsUseCase(this.repository);
    this.createAlertUseCase = new CreateAlertUseCase(this.repository);
    this.updateAlertUseCase = new UpdateAlertUseCase(this.repository);
    this.deleteAlertUseCase = new DeleteAlertUseCase(this.repository);
  }

  /**
   * GET /patients/:patientId/alerts
   */
  public getPatientAlerts = async (req: Request, res: Response) => {
    try {
      const { patientId } = req.params;
      const resultEntities = await this.getAlertsUseCase.execute(patientId);
      
      // Mapear entidades de dominio a JSON de presentación
      const resultDto = resultEntities.map(ent => ({
        id: ent.id,
        patientId: ent.patientId,
        type: ent.type,
        severity: ent.severity,
        message: ent.message,
        active: ent.active,
        createdAt: ent.createdAt,
        updatedAt: ent.updatedAt
      }));

      res.status(200).json(resultDto);
    } catch (err: any) {
      console.error("Error fetching alerts: ", err);
      res.status(400).json({ status: "error", error: err.message || "Error al obtener las alertas." });
    }
  };

  /**
   * POST /patients/:patientId/alerts
   */
  public createAlert = async (req: Request, res: Response) => {
    try {
      const { patientId } = req.params;
      const { type, severity, message, active } = req.body;

      // Verificación básica de los campos de entrada
      if (!type || !severity || !message) {
        return res.status(400).json({
          status: "invalid_inputs",
          error: "Los campos 'type', 'severity' y 'message' son campos médicos obligatorios."
        });
      }

      const entity = await this.createAlertUseCase.execute({
        patientId,
        type: type as AlertType,
        severity: severity as AlertSeverity,
        message: message as string,
        active: active !== undefined ? !!active : true
      });

      res.status(201).json({
        id: entity.id,
        patientId: entity.patientId,
        type: entity.type,
        severity: entity.severity,
        message: entity.message,
        active: entity.active,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt
      });
    } catch (err: any) {
      console.warn("Clinical Rule Violated: ", err.message);

      // Distinguir violaciones de reglas clínicas (400 Cliente / 409 Conflict)
      const isClinicalDuplicate = err.message.includes("REGLA CLÍNICA VIOLADA");
      res.status(isClinicalDuplicate ? 409 : 400).json({
        status: "clinical_rule_error",
        error: err.message || "Error al registrar la alerta clínica."
      });
    }
  };

  /**
   * PATCH /patient-alerts/:alertId
   */
  public updateAlert = async (req: Request, res: Response) => {
    try {
      const { alertId } = req.params;
      const { type, severity, message, active } = req.body;

      const entity = await this.updateAlertUseCase.execute(alertId, {
        type: type as AlertType,
        severity: severity as AlertSeverity,
        message: message as string,
        active: active !== undefined ? !!active : undefined
      });

      res.status(200).json({
        id: entity.id,
        patientId: entity.patientId,
        type: entity.type,
        severity: entity.severity,
        message: entity.message,
        active: entity.active,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt
      });
    } catch (err: any) {
      console.warn("Failed to update clinical alert: ", err.message);
      const isClinicalDuplicate = err.message.includes("REGLA CLÍNICA VIOLADA");
      res.status(isClinicalDuplicate ? 409 : 400).json({
        status: "clinical_rule_error",
        error: err.message || "Error al actualizar la alerta clínica."
      });
    }
  };

  /**
   * DELETE /patient-alerts/:alertId
   */
  public deleteAlert = async (req: Request, res: Response) => {
    try {
      const { alertId } = req.params;
      const success = await this.deleteAlertUseCase.execute(alertId);
      res.status(200).json({ status: "success", deleted: success, id: alertId });
    } catch (err: any) {
      console.error("Failed to delete clinical alert: ", err.message);
      res.status(400).json({ status: "error", error: err.message || "Error al eliminar la alerta clínica." });
    }
  };
}
