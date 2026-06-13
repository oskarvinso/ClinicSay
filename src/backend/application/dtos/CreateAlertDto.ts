import { AlertSeverity } from "../../domain/enums/AlertSeverity.js";
import { AlertType } from "../../domain/enums/AlertType.js";

export interface CreateAlertDto {
  patientId: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  active?: boolean;
}
