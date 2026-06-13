import { AlertSeverity } from "../enums/AlertSeverity.js";
import { AlertType } from "../enums/AlertType.js";

export interface AlertProperties {
  id?: string;
  patientId: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Entidad de Dominio que representa una alerta clínica de un paciente.
 * Implementa validaciones estrictas del dominio para garantizar la seguridad clínica.
 */
export class AlertEntity {
  private readonly _id: string;
  private readonly _patientId: string;
  private readonly _type: AlertType;
  private _severity: AlertSeverity;
  private _message: string;
  private _active: boolean;
  private readonly _createdAt: Date;
  private readonly _updatedAt: Date;

  constructor(props: AlertProperties) {
    this._id = props.id || this.generateUuid();
    this._patientId = props.patientId;
    this._type = props.type;
    this._severity = props.severity;
    this._message = this.sanitizeAndNormalizeMessage(props.message);
    this._active = props.active;
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();

    this.validate();
  }

  // Accesores (getters)
  public get id(): string { return this._id; }
  public get patientId(): string { return this._patientId; }
  public get type(): AlertType { return this._type; }
  public get severity(): AlertSeverity { return this._severity; }
  public get message(): string { return this._message; }
  public get active(): boolean { return this._active; }
  public get createdAt(): Date { return this._createdAt; }
  public get updatedAt(): Date { return this._updatedAt; }

  // Setters/Mutadores que garantizan validaciones
  public updateMessage(newMessage: string): void {
    this._message = this.sanitizeAndNormalizeMessage(newMessage);
    this.validate();
  }

  public updateSeverity(newSeverity: AlertSeverity): void {
    this._severity = newSeverity;
    this.validate();
  }

  public toggleActive(isActive: boolean): void {
    this._active = isActive;
  }

  /**
   * Comprobación de invariante del dominio para verificar si otra alerta es idéntica y activa.
   */
  public isDuplicateOf(other: AlertEntity): boolean {
    return (
      this.patientId === other.patientId &&
      this.type === other.type &&
      this.message.toLowerCase().trim() === other.message.toLowerCase().trim() &&
      this.active &&
      other.active &&
      this.id !== other.id // Don't check against itself
    );
  }

  /**
   * Sanitiza el texto de entrada, reduciendo múltiples espacios y recortando.
   */
  private sanitizeAndNormalizeMessage(msg: string): string {
    if (!msg) return "";
    return msg.replace(/\s+/g, " ").trim();
  }

  /**
   * Validaciones del dominio para garantizar la estructura de datos correcta.
   */
  private validate(): void {
    if (!this._patientId || this._patientId.trim() === "") {
      throw new Error("El Identificador de Paciente (patientId) es requerido.");
    }

    if (!this._message || this._message.trim().length < 5) {
      throw new Error("El mensaje clínico debe poseer al menos 5 caracteres descriptivos.");
    }

    if (this._message.length > 500) {
      throw new Error("El mensaje clínico no puede superar los 500 caracteres.");
    }

    if (!Object.values(AlertSeverity).includes(this._severity)) {
      throw new Error(`Nivel de severidad clínico no válido: ${this._severity}`);
    }

    if (!Object.values(AlertType).includes(this._type)) {
      throw new Error(`Tipo de alerta clínico no válido: ${this._type}`);
    }
  }

  /**
   * Genera un UUID simple simulado si no se proporciona.
   */
  private generateUuid(): string {
    return 'alert_' + Math.random().toString(36).substr(2, 9);
  }
}
