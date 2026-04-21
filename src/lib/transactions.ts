import { randomUUID } from "crypto";
import { type DbClient } from "@/lib/db";

type PaymentMethod = "cash" | "upi" | "card" | "bank_transfer" | "other";

export async function logStudentTransaction(
  d: DbClient,
  input: {
    studentId: string;
    studentName: string;
    action: "enrolment" | "renewal" | "trial_convert" | "refund";
    amount: number;
    paymentMethod?: PaymentMethod | null;
    note?: string | null;
  },
) {
  await d.run(
    `
    INSERT INTO transaction_events (id, entity_type, entity_id, student_name, action, amount, payment_method, note, created_at)
    VALUES (?, 'student', ?, ?, ?, ?, ?, ?, ?)
  `,
    [
      randomUUID(),
      input.studentId,
      input.studentName,
      input.action,
      Math.trunc(input.amount),
      input.paymentMethod ?? null,
      input.note ?? null,
      Date.now(),
    ],
  );
}
