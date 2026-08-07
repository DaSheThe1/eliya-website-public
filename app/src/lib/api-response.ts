import { randomUUID } from "node:crypto";

import {
  intakeResponseMessages,
  type IntakeResponseBody,
  type IntakeResponseStatus,
} from "@foundation/intake";

function intakeResponse(
  status: IntakeResponseStatus,
  httpStatus: number,
): Response {
  const requestId = randomUUID();
  const body: IntakeResponseBody = {
    status,
    message: intakeResponseMessages[status],
    requestId,
  };
  return Response.json(body, {
    status: httpStatus,
    headers: {
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "x-request-id": requestId,
    },
  });
}

export function intakeUnavailableResponse(): Response {
  return intakeResponse("temporarily_unavailable", 503);
}

export function intakeInvalidRequestResponse(): Response {
  return intakeResponse("invalid_request", 400);
}

export function intakeInvalidMethodResponse(): Response {
  return intakeResponse("invalid_request", 405);
}
