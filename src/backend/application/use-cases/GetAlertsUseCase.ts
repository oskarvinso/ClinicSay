import { AlertEntity } from "../../domain/entities/AlertEntity.js";
import { AlertSeverity } from "../../domain/enums/AlertSeverity.js";
import { IAlertRepository } from "../../domain/repositories/IAlertRepository.js";

/**
 * UseCase para obtener alertas de un paciente.
 * Ordena automáticamente las alertas activas primero, luego por severidad clínica (HIGH, MEDIUM, LOW),
 * y finalmente de más reciente a más antiguo.
 */
export class GetAlertsUseCase {
  constructor(private readonly alertRepository: IAlertRepository) {}

  public async execute(patientId: string): Promise<AlertEntity[]> {
    if (!patientId || patientId.trim() === "") {
      throw new Error("El ID del paciente es obligatorio.");
    }

    const alerts = await this.alertRepository.findByPatientId(patientId);

    // Estrategia de ordenación según las especificaciones de priorización clínica de ClinicSay:
    return alerts.sort((a, b) => {
      // 1. Estados activos primero
      if (a.active !== b.active) {
        return a.active ? -1 : 1;
      }

      // 2. Prioridades clínicas (HIGH > MEDIUM > LOW)
      const severityScores: Record<AlertSeverity, number> = {
        [AlertSeverity.HIGH]: 3,
        [AlertSeverity.MEDIUM]: 2,
        [AlertSeverity.LOW]: 1,
      };

      const scoreA = severityScores[a.severity] || 0;
      const scoreB = severityScores[b.severity] || 0;

      if (scoreA !== scoreB) {
        return scoreB - scoreA; // Descending (High first)
      }

      // 3. Recencia cronológica (más recientes primero)
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }
}
