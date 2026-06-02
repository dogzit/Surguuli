"use client";
import { useState } from "react";
import { loginAsAdmin } from "@/app/actions/admin-login";
import { useRouter } from "next/navigation";

export default function AdminLoginForm() {
    const [pin, setPin] = useState("");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await loginAsAdmin(pin);
        if (res.success) {
            router.push("/dashboard/admin");
            router.refresh();
        } else {
            alert(res.message);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex gap-2 p-4">
            <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Админ PIN"
                className="w-full rounded-md border border-input bg-background px-3 py-2"
            />
            <button type="submit" className="rounded-md bg-primary px-4 py-2 text-primary-foreground">
                Орох
            </button>
        </form>
    );
}