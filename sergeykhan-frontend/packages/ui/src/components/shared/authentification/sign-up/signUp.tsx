"use client"

import React, { useState } from 'react';
import { cn } from "@workspace/ui/lib/utils";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@workspace/ui/components/ui";
import { Input } from "@workspace/ui/components/ui";
import { Label } from "@workspace/ui/components/ui";
import {Button} from "@workspace/ui/components/ui";

const SignUp = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }

        const data = {
            name,
            email,
            password,
        };

        try {
            const response = await fetch('/api/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                // Обработка успешного ответа
                alert("Account created successfully!");
            } else {
                // Обработка ошибок
                const errorData = await response.json();
                alert(`Error: ${errorData.message}`);
            }
        } catch (error) {
            console.error("Error during sign up:", error);
            alert("An error occurred during sign up.");
        }
    };

    return (
        <div className={cn("flex items-center justify-center min-h-screen")}>
            <div className="w-full max-w-sm">
                <Card>
                    <CardHeader className="text-center">
                        <CardTitle className="text-xl">Create Account</CardTitle>
                        <CardDescription>Sign up to get started!</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit}>
                            <div className="grid gap-6">
                                <div className="grid gap-3">
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        placeholder="Your Name"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-3">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="you@example.com"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-3">
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-3">
                                    <Label htmlFor="confirm-password">Confirm Password</Label>
                                    <Input
                                        id="confirm-password"
                                        type="password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                </div>
                                <Button type="submit" className="w-full">
                                    Sign Up
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
                <div className="mt-4 text-center text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <a href="/login" className="underline underline-offset-4">
                        Sign in
                    </a>
                </div>
            </div>
        </div>
    );
};

export default SignUp;
