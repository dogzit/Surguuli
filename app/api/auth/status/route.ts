import { NextResponse } from "next/server";
import { getCurrentActor, actorHomePath } from "@/lib/session";

// Small endpoint the public sidebar polls to decide whether to show
// "Нэвтрэх" or "Хэрэглэгч + Гарах". Must recognise ALL actor kinds —
// staff, student, and parent — otherwise the login button keeps
// showing after a student/parent has signed in.
export async function GET() {
  const actor = await getCurrentActor();
  if (!actor) {
    return NextResponse.json({ loggedIn: false });
  }

  switch (actor.kind) {
    case "user":
      return NextResponse.json({
        loggedIn: true,
        kind: "user",
        role: actor.user.role,
        name: actor.user.name,
        homePath: actorHomePath(actor),
      });
    case "student":
      return NextResponse.json({
        loggedIn: true,
        kind: "student",
        role: "STUDENT",
        name: `${actor.student.lastName}. ${actor.student.firstName}`,
        homePath: actorHomePath(actor),
      });
    case "parent":
      return NextResponse.json({
        loggedIn: true,
        kind: "parent",
        role: "PARENT",
        name: actor.parent.name,
        homePath: actorHomePath(actor),
      });
  }
}
