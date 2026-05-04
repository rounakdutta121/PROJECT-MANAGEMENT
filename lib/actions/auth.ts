"use server";

import { hash } from "bcryptjs";
import { prisma } from "@/lib/db";
import { userSchema } from "@/lib/validations";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";

export async function signup(formData: FormData) {
  const validated = userSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  if (!validated.success) {
    return { error: "Invalid input" };
  }

  const { name, email, password, role } = validated.data;

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    return { error: "Email already in use" };
  }

  const hashedPassword = await hash(password, 12);

  await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
    },
  });

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Failed to sign in after signup" };
    }
    throw error;
  }
}
