import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  KeyRound,
  Mail,
  Settings as SettingsIcon,
} from "lucide-react";
import LogoutButton from "@/components/LogoutButton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import EmailForm from "./EmailForm";
import PinForm from "./PinForm";

export default async function SettingsPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const backHref =
    me.role === "APPROVER" ? "/dashboard/approver" : "/dashboard/teacher";

  return (
    <main className="mx-auto max-w-2xl p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Буцах
        </Link>
        <div className="mt-3 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <SettingsIcon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                Тохиргоо
              </h1>
              <p className="text-sm text-muted-foreground">
                {me.name} · {me.position}
              </p>
            </div>
          </div>

        </div>
      </header>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="h-4 w-4" />
              Имэйл хаяг
            </CardTitle>
            <CardDescription>
              Имэйлийг хэдийд ч өөрчилж, хоосон үлдээж болно.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EmailForm currentEmail={me.email} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="h-4 w-4" />
              PIN код
            </CardTitle>
            <CardDescription>
              Анхны PIN бүгдэд адил{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                0000
              </code>
              . Аюулгүй байдлын үүднээс заавал солих хэрэгтэй.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PinForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
