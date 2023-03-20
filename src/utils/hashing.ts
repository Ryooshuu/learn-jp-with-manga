import { createHash } from "crypto";

export function computeSha256Hash(content: Buffer): string {
    return createHash("sha256").update(content).digest("hex");
}