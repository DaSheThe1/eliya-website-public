import {
  INTAKE_CONTRACT_VERSION,
  INTAKE_FIELD_IDS,
  INTAKE_FIELD_LIMITS,
  type IntakeFieldId,
  type SubmissionType,
} from "@foundation/intake";

import { generatedSiteConfig } from "./generated-site";

export const intakeConfig = {
  endpoint: "/api/contact",
  contractVersion: INTAKE_CONTRACT_VERSION,
  defaultType: (
    generatedSiteConfig.intakeMode === "booking" ? "booking" : "lead"
  ) satisfies SubmissionType,
  supportedTypes: ["lead", "booking"] satisfies readonly SubmissionType[],
  fields: generatedSiteConfig.intakeFields,
  selectedFields: INTAKE_FIELD_IDS.filter((field) =>
    Object.prototype.hasOwnProperty.call(
      generatedSiteConfig.intakeFields,
      field,
    ),
  ),
  isSelected(field: IntakeFieldId): boolean {
    return Object.prototype.hasOwnProperty.call(
      generatedSiteConfig.intakeFields,
      field,
    );
  },
  isRequired(field: IntakeFieldId): boolean {
    return generatedSiteConfig.intakeFields[field] === true;
  },
  fieldLimits: INTAKE_FIELD_LIMITS,
} as const;
