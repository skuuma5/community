"use server";

import db from "@/lib/db";
import bcrypt from "bcryptjs";

export async function registerUser(formData: FormData) {
  try {
    const username = formData.get("username")?.toString().trim();
    const email = formData.get("email")?.toString().trim();
    const password = formData.get("password")?.toString();
    const bio = formData.get("bio")?.toString().trim() || "";

    if (!username || !email || !password) {
      return { error: "Please fill in all required fields." };
    }

    if (username.length < 3 || username.length > 20) {
      return { error: "Username must be between 3 and 20 characters." };
    }

    // Check alphanumeric
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return { error: "Username can only contain letters, numbers, and underscores." };
    }

    if (password.length < 6) {
      return { error: "Password must be at least 6 characters long." };
    }

    // Check if username already exists
    const existingUserByUsername = await db.user.findUnique({
      where: { username },
    });

    if (existingUserByUsername) {
      return { error: "Username is already taken." };
    }

    // Check if email already exists
    const existingUserByEmail = await db.user.findUnique({
      where: { email },
    });

    if (existingUserByEmail) {
      return { error: "Email is already registered." };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Default pixel avatar url
    const avatarUrl = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${username}`;

    // Create user
    await db.user.create({
      data: {
        username,
        email,
        passwordHash,
        avatarUrl,
        bio: bio || "New member of the forum!",
        reputation: 10,
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Registration error:", error);
    return { error: "An unexpected error occurred. Please try again." };
  }
}
