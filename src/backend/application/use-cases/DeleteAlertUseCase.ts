import { IAlertRepository } from "../../domain/repositories/IAlertRepository.js";

/**
 * UseCase to handle clinical alert deletion.
 */
export class DeleteAlertUseCase {
  constructor(private readonly alertRepository: IAlertRepository) {}

  public async execute(alertId: string): Promise<boolean> {
    const alert = await this.alertRepository.findById(alertId);
    if (!alert) {
      throw new Error(`Error: No se ha encontrado la alerta con ID: ${alertId}`);
    }

    return await this.alertRepository.delete(alertId);
  }
}
