import { AlertEntity } from "../../domain/entities/AlertEntity.js";
import { AlertSeverity } from "../../domain/enums/AlertSeverity.js";
import { AlertType } from "../../domain/enums/AlertType.js";
import { IAlertRepository } from "../../domain/repositories/IAlertRepository.js";
import { prismaInstance, PrismaClientSimulator } from "../database/PrismaClientSimulator.js";

/**
 * Adaptador que implementa el contrato IAlertRepository usando el simulador de Prisma de alta fidelidad.
 */
export class PrismaAlertRepository implements IAlertRepository {
  private prisma: PrismaClientSimulator;

  constructor() {
    this.prisma = prismaInstance;
  }

  public async findByPatientId(patientId: string): Promise<AlertEntity[]> {
    const rawAlerts = await this.prisma.findMany({ patientId });
    return rawAlerts.map(raw => this.mapToDomain(raw));
  }

  public async findActiveIdentical(patientId: string, type: AlertType, message: string): Promise<AlertEntity | null> {
    const raw = await this.prisma.findFirst({
      patientId,
      type,
      message,
      active: true
    });
    
    if (!raw) return null;
    return this.mapToDomain(raw);
  }

  public async findById(id: string): Promise<AlertEntity | null> {
    const raw = await this.prisma.findUnique({ id });
    if (!raw) return null;
    return this.mapToDomain(raw);
  }

  public async save(alert: AlertEntity): Promise<AlertEntity> {
    const record = await this.prisma.create({
      patientId: alert.patientId,
      type: alert.type,
      severity: alert.severity,
      message: alert.message,
      active: alert.active,
    });
    return this.mapToDomain(record);
  }

  public async update(alert: AlertEntity): Promise<AlertEntity> {
    const record = await this.prisma.update(alert.id, {
      type: alert.type,
      severity: alert.severity,
      message: alert.message,
      active: alert.active,
    });
    return this.mapToDomain(record);
  }

  public async delete(id: string): Promise<boolean> {
    return await this.prisma.delete(id);
  }

  /**
   * Utilidad auxiliar que mapea objetos del esquema de la BD a Entidades del Dominio.
   */
  private mapToDomain(schema: any): AlertEntity {
    return new AlertEntity({
      id: schema.id,
      patientId: schema.patientId,
      type: schema.type as AlertType,
      severity: schema.severity as AlertSeverity,
      message: schema.message,
      active: schema.active,
      createdAt: new Date(schema.createdAt),
      updatedAt: new Date(schema.updatedAt),
    });
  }
}
