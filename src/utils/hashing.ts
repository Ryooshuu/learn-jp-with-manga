import { createHash } from "crypto";

export function ComputeSha256Hash(content: Buffer): string {
    return createHash("sha256").update(content).digest("hex");
}