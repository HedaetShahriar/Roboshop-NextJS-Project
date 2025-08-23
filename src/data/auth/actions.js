'use server'

import getDb from "@/lib/mongodb";
import bcrypt from "bcryptjs";

export async function registerUser(formData) {
  // Manual Validation for User
  const name = formData.get('name');
  const emailRaw = formData.get('email');
  const password = formData.get('password');

  if (!name || name.length < 3) {
    return { error: "Name must be at least 3 characters" };
  }
  if (!emailRaw || !/^\S+@\S+\.\S+$/.test(emailRaw)) {
    return { error: "Please enter a valid email address" };
  }
  if (!password || password.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  try {
    const db = await getDb();
    const usersCollection = db.collection("users");

    const email = emailRaw.toLowerCase().trim();
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return { error: 'User with this email already exists.' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await usersCollection.insertOne({
      name,
      email,
      hashedPassword,
      createdAt: new Date(),
    });

    // After successful registration, signal client to navigate
    return { successRedirect: '/login?registered=1' };

  } catch (error) {
    console.error(error);
    return { error: 'An unexpected error occurred.' };
  }
}