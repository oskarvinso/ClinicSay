import { AlertEntity } from "../../domain/entities/AlertEntity.js";
import { IAlertRepository } from "../../domain/repositories/IAlertRepository.js";
import { CreateAlertDto } from "../dtos/CreateAlertDto.js";

/**
 * UseCase para manejar la creación de una alerta clínica.
 * Garantiza estrictamente la invariante del dominio de que no exista una alerta activa duplicada.
 */
export class CreateAlertUseCase {
  constructor(private readonly alertRepository: IAlertRepository) {}

  public async execute(dto: CreateAlertDto): Promise<AlertEntity> {
    const isNewActive = dto.active !== false; // por defecto activo: true

    // Normalizar temprano para realizar comprobaciones precisas anti-duplicado
    const normalizedMsg = dto.message.replace(/\s+/g, " ").trim();

    // Enforce business invariant at database check level:
    if (isNewActive) {
      const existingDuplicate = await this.alertRepository.findActiveIdentical(
        dto.patientId,
        dto.type,
        normalizedMsg
      );

      if (existingDuplicate) {
        throw new Error(
          `REGLA CLÍNICA VIOLADA: El paciente ya registra una alerta idéntica ACTIVA de tipo '${dto.type}' con el mensaje: "${normalizedMsg}"`
        );
      }
    }

    // Instantiation triggers domain model inner validation invariants (e.g. text length and enums)
    const alert = new AlertEntity({
      patientId: dto.patientId,
      type: dto.type,
      severity: dto.severity,
      message: dto.message,
      active: isNewActive
    });

    return await this.alertRepository.save(alert);
  }
}
