'use server'

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { authOptions } from "./api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";

export async function addProduct(formData) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { error: 'You must be logged in to add a product.' };
  }

  // Manual Validation for Product
  const name = formData.get('name');
  const description = formData.get('description');
  const price = parseFloat(formData.get('price'));

  if (!name || name.length < 3) {
    return { error: "Product name must be at least 3 characters" };
  }
  if (!description || description.length < 10) {
    return { error: "Description must be at least 10 characters" };
  }
  if (isNaN(price) || price <= 0) {
    return { error: "Price must be a number greater than zero" };
  }

  try {
    const client = await clientPromise;
    const db = client.db("roboshop");
    await db.collection("products").insertOne({
      name,
      description,
      price,
      createdAt: new Date()
    });

    revalidatePath('/products');
    return { success: 'Product added successfully!' };

  } catch (error) {
    console.error(error);
    return { error: 'Failed to add product.' };
  }
}

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
    const client = await clientPromise;
    const db = client.db("roboshop");
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