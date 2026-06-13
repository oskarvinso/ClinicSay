import { AlertEntity } from "../entities/AlertEntity.js";

/**
 * Port Interface for the Clinical Alert Storage / Repository.
 */
export interface IAlertRepository {
  /**
   * Finds all alerts recorded for a specific patient.
   */
  findByPatientId(patientId: string): Promise<AlertEntity[]>;

  /**
   * Finds any active alerts that are identical (same types and normalized message).
   */
  findActiveIdentical(patientId: string, type: string, message: string): Promise<AlertEntity | null>;

  /**
   * Retrieves an alert by its ID.
   */
  findById(id: string): Promise<AlertEntity | null>;

  /**
   * Persists a new alert.
   */
  save(alert: AlertEntity): Promise<AlertEntity>;

  /**
   * Updates an existing alert in storage.
   */
  update(alert: AlertEntity): Promise<AlertEntity>;

  /**
   * Deletes an alert from storage.
   */
  delete(id: string): Promise<boolean>;
}
