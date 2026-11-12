import { z } from "zod";
import { DAYS, SESSION_TYPES, SYSTEMS, type Programme } from "./types";

const slug = z.string().regex(/^[a-z0-9-]+$/);
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const sessionSchema = z
  .object({
    day: z.enum(DAYS),
    start: time,
    end: time,
    type: z.enum(SESSION_TYPES),
    module: z.string().min(1),
    room: z.string(),
    groups: z.array(z.string().min(1)),
  })
  .refine((session) => session.start < session.end, {
    message: "start must be before end",
  });

const sectionSchema = z
  .object({
    id: slug,
    name: z.string(),
    groups: z.array(z.string().min(1)),
    sessions: z.array(sessionSchema),
  })
  .superRefine((section, context) => {
    section.sessions.forEach((session, index) => {
      for (const group of session.groups) {
        if (!section.groups.includes(group)) {
          context.addIssue({
            code: "custom",
            path: ["sessions", index, "groups"],
            message: `unknown group ${group}`,
          });
        }
      }
    });
  });

export const programmeSchema: z.ZodType<Programme> = z.object({
  system: z.enum(SYSTEMS),
  level: slug,
  speciality: z.object({ id: slug, name: z.string().min(1) }),
  academicYear: z.string().regex(/^\d{4}\/\d{4}$/),
  semester: z.union([z.literal(1), z.literal(2)]),
  status: z.enum(["published", "unsupported"]),
  source: z.object({
    title: z.string(),
    url: z.string().regex(/^https:\/\//),
    updatedAt: isoDate,
  }),
  sections: z.array(sectionSchema),
});
