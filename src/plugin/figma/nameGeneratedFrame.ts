import type { ContentType } from "../../schemas/content";

export function nameGeneratedFrame(contentType: ContentType, index: number): string {
  return `${contentType}_generated_${String(index).padStart(2, "0")}`;
}
