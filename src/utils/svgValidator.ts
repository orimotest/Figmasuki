import type { SvgValidationResult } from "../schemas/svg";

const MIN_SVG_LENGTH = 300;
const MAX_SVG_LENGTH = 80_000;

export function validateSvg(value: unknown): SvgValidationResult {
  const isString = typeof value === "string";
  const svg = isString ? value : "";
  const trimmed = svg.trim();
  const hasViewBox = /viewBox=["']0 0 800 450["']/.test(trimmed);
  const hasWidth = /width=["']800["']/.test(trimmed);
  const hasHeight = /height=["']450["']/.test(trimmed);
  const checks = {
    nonEmpty: trimmed.length > 0,
    hasSvgTag: /<svg\b/i.test(trimmed),
    hasClosingSvgTag: /<\/svg>/i.test(trimmed),
    hasViewBox,
    hasWidth: hasWidth || hasViewBox,
    hasHeight: hasHeight || hasViewBox,
    hasText: /<text\b/i.test(trimmed),
    noScript: !/<script\b/i.test(trimmed),
    noForeignObject: !/<foreignObject\b/i.test(trimmed),
    noExternalImage: !/(https?:\/\/|xlink:href=["']https?:\/\/|href=["']https?:\/\/)/i.test(trimmed),
    lengthInRange: trimmed.length >= MIN_SVG_LENGTH && trimmed.length <= MAX_SVG_LENGTH,
  };
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isString) errors.push("SVG must be a string.");
  if (!checks.nonEmpty) errors.push("SVG is empty.");
  if (!checks.hasSvgTag) errors.push("SVG must include an <svg> root.");
  if (!checks.hasClosingSvgTag) errors.push("SVG must include a closing </svg> tag.");
  if (!checks.hasViewBox) errors.push('SVG must include viewBox="0 0 800 450".');
  if (!checks.hasWidth) errors.push('SVG must include width="800" or a valid 800x450 viewBox.');
  if (!checks.hasHeight) errors.push('SVG must include height="450" or a valid 800x450 viewBox.');
  if (!checks.hasText) errors.push("SVG must include at least one editable <text> element.");
  if (!checks.noScript) errors.push("SVG must not include script tags.");
  if (!checks.noForeignObject) errors.push("SVG must not include foreignObject.");
  if (!checks.noExternalImage) errors.push("SVG must not include external http(s) references.");
  if (trimmed.length > 0 && trimmed.length < MIN_SVG_LENGTH) errors.push("SVG is too short to be a usable layout.");
  if (trimmed.length > MAX_SVG_LENGTH) errors.push("SVG is too long for the MVP plugin payload.");

  if (!hasWidth && hasViewBox) warnings.push("SVG has no explicit width but has the required viewBox.");
  if (!hasHeight && hasViewBox) warnings.push("SVG has no explicit height but has the required viewBox.");

  return {
    valid: errors.length === 0,
    warnings,
    checks,
    errors,
  };
}

export function extractSvgFromText(text: string): string {
  const fenced = text.match(/```(?:svg|xml)?\s*([\s\S]*?<svg[\s\S]*?<\/svg>)\s*```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }
  const inline = text.match(/<svg[\s\S]*?<\/svg>/i);
  return inline?.[0]?.trim() ?? text.trim();
}
