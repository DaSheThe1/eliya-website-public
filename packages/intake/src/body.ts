export class BodyReadError extends Error {
  constructor(
    readonly code:
      | "invalid_content_type"
      | "invalid_content_length"
      | "payload_too_large"
      | "invalid_json",
  ) {
    super(code);
    this.name = "BodyReadError";
  }
}

const httpToken = String.raw`[!#$%&'*+\-.^_\x60|~0-9A-Za-z]+`;
const quotedString = String.raw`"(?:[\t !#-\[\]-~\x80-\xff]|\\[\t !-~\x80-\xff])*"`;
const jsonMediaType = new RegExp(
  String.raw`^[\t ]*application/json[\t ]*(?:;[\t ]*${httpToken}=(?:${httpToken}|${quotedString}))?` +
    String.raw`(?:[\t ]*;[\t ]*${httpToken}=(?:${httpToken}|${quotedString}))*[\t ]*$`,
  "i",
);

export function isJsonMediaType(value: string | null): boolean {
  return value !== null && jsonMediaType.test(value);
}

export type IntakeRequestMediaType = "form" | "json" | "unsupported";

export function classifyIntakeRequestMediaType(
  value: string | null,
): IntakeRequestMediaType {
  const baseType = value?.split(";", 1)[0]?.trim().toLowerCase() ?? "";
  if (baseType === "application/x-www-form-urlencoded") {
    return "form";
  }
  return isJsonMediaType(value) ? "json" : "unsupported";
}

export async function readBoundedJson(
  request: Request,
  maximumBytes: number,
): Promise<unknown> {
  if (!isJsonMediaType(request.headers.get("content-type"))) {
    throw new BodyReadError("invalid_content_type");
  }

  const declaredLength = request.headers.get("content-length");
  if (declaredLength) {
    const parsedLength = Number(declaredLength);
    if (!Number.isSafeInteger(parsedLength) || parsedLength < 0) {
      throw new BodyReadError("invalid_content_length");
    }
    if (parsedLength > maximumBytes) {
      throw new BodyReadError("payload_too_large");
    }
  }

  const reader = request.body?.getReader();
  if (!reader) {
    throw new BodyReadError("invalid_json");
  }
  const chunks: Uint8Array[] = [];
  let byteLength = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    byteLength += value.byteLength;
    if (byteLength > maximumBytes) {
      await reader.cancel();
      throw new BodyReadError("payload_too_large");
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    throw new BodyReadError("invalid_json");
  }
}
