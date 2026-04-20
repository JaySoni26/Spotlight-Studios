import { z } from "zod";

export const Weekday = z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]);

export const BatchScheduleEntry = z.object({
  day: Weekday,
  time: z.string().min(1).max(40),
});

export const BatchInput = z.object({
  name: z.string().min(1, "Name is required").max(100),
  price: z.coerce.number().int().nonnegative(),
  schedule: z.string().max(200).optional().nullable(),
  schedule_entries: z.array(BatchScheduleEntry).max(7).optional(),
  description: z.string().max(500).optional().nullable(),
});

export const StudentInput = z
  .object({
    name: z.string().min(1, "Name is required").max(100),
    phone: z.string().max(30).optional().nullable(),
    amount: z.coerce.number().int().nonnegative(),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
    validity_days: z.coerce.number().int().positive().max(3650),
    batch_id: z.string().nullable().optional(),
    notes: z.string().max(500).optional().nullable(),
    enrollment_kind: z.enum(["paid", "trial"]).optional().default("paid"),
  })
  .superRefine((val, ctx) => {
    if (val.enrollment_kind === "trial") {
      if (val.validity_days > 120) {
        ctx.addIssue({
          code: "custom",
          message: "Trial period: at most 120 days",
          path: ["validity_days"],
        });
      }
    }
  });

export const ConvertTrialInput = z.object({
  amount: z.coerce.number().int().positive(),
  validity_days: z.coerce.number().int().positive().max(3650),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
});

export const TrialExtendInput = z.object({
  additional_days: z.coerce.number().int().positive().max(365),
});

export const BatchChangeInput = z.object({
  student_id: z.string().min(1),
  to_batch_id: z.string().nullable(),
  note: z.string().max(200).optional().nullable(),
});

export const DeleteWithCodeInput = z.object({
  code: z.string().min(1).max(20),
  refund_amount: z.coerce.number().int().nonnegative().optional(),
});

export const StudentLeaveInput = z.object({
  leave_days: z.coerce.number().int().positive().max(365),
  transfer_days: z.coerce.number().int().nonnegative().max(365).optional(),
  notes: z.string().max(500).optional().nullable(),
});

export const StudentLeaveUpdateInput = z.object({
  leave_days: z.coerce.number().int().positive().max(365),
  transfer_days: z.coerce.number().int().nonnegative().max(365),
  notes: z.string().max(500).optional().nullable(),
});

export type BatchInputT = z.infer<typeof BatchInput>;
export type StudentInputT = z.infer<typeof StudentInput>;
export type StudentLeaveInputT = z.infer<typeof StudentLeaveInput>;
