import { z } from "zod";

export const userSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "intern"]).default("intern"),
});

export const taskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(1000).optional(),
  status: z.enum(["pending", "in_progress", "done"]).default("pending"),
  deadline: z.string().datetime().optional(),
  assignedToId: z.string().uuid("Invalid user ID"),
});

export type UserInput = z.infer<typeof userSchema>;
export type TaskInput = z.infer<typeof taskSchema>;
