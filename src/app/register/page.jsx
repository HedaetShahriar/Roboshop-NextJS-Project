'use client'

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerUser } from "@/data/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterPage() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState(null);
  const router = useRouter();

  const handleSubmit = (formData) => {
    startTransition(async () => {
      const result = await registerUser(formData);
      if (result?.error) {
        setMessage(result);
      } else if (result?.successRedirect) {
        router.push(result.successRedirect);
      }
    });
  };

  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Create an Account</CardTitle>
          <CardDescription>Join Roboshop to get started.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="grid gap-4">
            {message?.error && <p className="bg-red-100 text-red-700 p-2 rounded text-sm">{message.error}</p>}
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input type="text" id="name" name="name" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input type="email" id="email" name="email" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input type="password" id="password" name="password" required />
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>{isPending ? 'Creating Account...' : 'Create Account'}</Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 hover:underline">Login</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}