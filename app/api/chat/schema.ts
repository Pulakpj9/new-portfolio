import { z } from "zod";

/* POST /api/chat validation. Tight caps: public endpoint, paid per call. */

const messageSchema = z.object({
  // "bot" tolerated and normalized (older clients send UI roles).
  role: z.enum(["user", "assistant", "bot"]),
  content: z.string().min(1).max(2000),
});

export const chatSchema = z
  .object({
    session_id: z.string().uuid().optional(),
    messages: z.array(messageSchema).min(1).max(10),
  })
  .transform((v) => ({
    ...v,
    messages: v.messages.map((m) => ({
      role: (m.role === "bot" ? "assistant" : m.role) as "user" | "assistant",
      content: m.content,
    })),
  }))
  .superRefine((v, ctx) => {
    const lastUser = [...v.messages].reverse().find((m) => m.role === "user");
    if (!lastUser) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "no user message" });
    } else if (lastUser.content.length > 500) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "user message too long (max 500 chars)",
      });
    }
  });

export type ChatInput = z.infer<typeof chatSchema>;
