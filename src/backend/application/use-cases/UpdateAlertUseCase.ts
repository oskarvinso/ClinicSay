import { AlertEntity } from "../../domain/entities/AlertEntity.js";
import { IAlertRepository } from "../../domain/repositories/IAlertRepository.js";
import { UpdateAlertDto } from "../dtos/UpdateAlertDto.js";

/**
 * UseCase para manejar la modificación o la transición de estado (Archivado/Activado)
 * de una alerta clínica existente. Incluye bloques rigurosos de validación anti-duplicado.
 */
export class UpdateAlertUseCase {
  constructor(private readonly alertRepository: IAlertRepository) {}

  public async execute(alertId: string, dto: UpdateAlertDto): Promise<AlertEntity> {
    const alert = await this.alertRepository.findById(alertId);
    if (!alert) {
      throw new Error(`Error: No se ha encontrado la alerta con ID: ${alertId}`);
    }

    // Capturar las propiedades potenciales entrantes
    const targetType = dto.type || alert.type;
    const targetMessage = dto.message !== undefined ? dto.message : alert.message;
    const targetSeverity = dto.severity || alert.severity;
    const targetActive = dto.active !== undefined ? dto.active : alert.active;

    // Normalizar el nuevo mensaje prospectivo para inspeccionar duplicados
    const normalizedMsg = targetMessage.replace(/\s+/g, " ").trim();

    // Si la alerta está activa (o se va a pasar a activa), comprobar duplicados
    if (targetActive) {
      const existingDuplicate = await this.alertRepository.findActiveIdentical(
        alert.patientId,
        targetType,
        normalizedMsg
      );

      // Si se encuentra un duplicado activo y no es la alerta actual en edición
      if (existingDuplicate && existingDuplicate.id !== alertId) {
        throw new Error(
          `REGLA CLÍNICA VIOLADA: Ya existe otra alerta idéntica ACTIVA para este paciente. No se puede configurar de forma concurrente.`
        );
      }
    }

    // Mutar y validar la entidad
    if (dto.message !== undefined) alert.updateMessage(dto.message);
    if (dto.severity !== undefined) alert.updateSeverity(dto.severity);
    if (dto.active !== undefined) alert.toggleActive(dto.active);

    return await this.alertRepository.update(alert);
  }
}
