"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import axios from "axios";

import { Button } from "@workspace/ui/components/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@workspace/ui/components/select";
import { API } from "@shared/constants/constants";

// Updated validation schema: email, password, and role (master, operator, curator)
const AccountSchema = z.object({
    email: z
        .string()
        .min(1, { message: "Enter email." })
        .email({ message: "Invalid email." }),
    password: z.string().min(6, { message: "Password must be at least 6 characters." }),
    role: z.enum(["master", "operator", "curator"], { required_error: "Select a role." }),
});

export function AccountFormComponent() {
    const form = useForm<z.infer<typeof AccountSchema>>({
        resolver: zodResolver(AccountSchema),
        defaultValues: {
            email: "",
            password: "",
            role: "master",
        },
    });

    const [showPassword, setShowPassword] = useState(false);

    // Function to generate a random password with 16 characters
    const generateRandomPassword = () => {
        const length = 16;
        const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
        let result = "";
        for (let i = 0; i < length; i++) {
            result += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return result;
    };

    const handleGeneratePassword = () => {
        form.setValue("password", generateRandomPassword());
    };

    const onSubmit = async (data: z.infer<typeof AccountSchema>) => {
        const token = localStorage.getItem("token");
        try {
            const response = await axios.post(
                `${API}/api/users/create/`,
                data,
                {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Token ${token}`,
                    },
                }
            );
            console.log("Account created successfully:", response.data);
            toast.success("Account created successfully!", {
                description: (
                    <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
            <code className="text-white">{JSON.stringify(response.data, null, 2)}</code>
          </pre>
                ),
            });
        } catch (error: any) {
            console.error("Error creating account:", error);
            toast.error("Error creating account: " + (error.response?.data?.error || error.message));
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-full sm:w-2/3 space-y-6">
                {/* Email */}
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input className="w-full" placeholder="Enter email" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                {/* Password with adaptive layout */}
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Password</FormLabel>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <FormControl className="flex-1">
                                    <Input
                                        className="w-full"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter password"
                                        {...field}
                                    />
                                </FormControl>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <Button type="button" onClick={() => setShowPassword(!showPassword)}>
                                        {showPassword ? "Hide" : "Show"}
                                    </Button>
                                    <Button type="button" onClick={handleGeneratePassword}>
                                        Generate
                                    </Button>
                                </div>
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                {/* Role */}
                <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Role</FormLabel>
                            <FormControl>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="master">Master</SelectItem>
                                        <SelectItem value="operator">Operator</SelectItem>
                                        <SelectItem value="curator">Curator</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit">Create Account</Button>
            </form>
        </Form>
    );
}
