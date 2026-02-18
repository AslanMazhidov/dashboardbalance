"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Coffee, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Неверный email или пароль");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Произошла ошибка. Попробуйте снова.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-stone-50 via-emerald-50/30 to-stone-50 px-4">
      {/* Background decorative elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-stone-200/30 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo section */}
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25">
            <Coffee className="size-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Balance Coffee
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Система управления кофейнями
          </p>
        </div>

        {/* Login card */}
        <Card className="border-0 shadow-xl shadow-slate-200/50">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Вход в систему</CardTitle>
            <CardDescription>
              Введите ваш email и пароль для входа
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error message */}
              {error && (
                <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-200">
                  {error}
                </div>
              )}

              {/* Email field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@balancecoffee.ru"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  disabled={isLoading}
                />
              </div>

              {/* Password field */}
              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Введите пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={isLoading}
                />
              </div>

              {/* Submit button */}
              <Button
                type="submit"
                className="w-full bg-primary text-white hover:bg-brand-hover"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Вход...
                  </>
                ) : (
                  "Войти"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-400">
          Balance Coffee &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
