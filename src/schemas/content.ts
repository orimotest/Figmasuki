export const contentTypes = ["note_thumbnail", "seminar_banner"] as const;

export type ContentType = (typeof contentTypes)[number];
