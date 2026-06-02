"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, FileSignature, Wrench } from "lucide-react";
import UsersPanel, { type AdminUser } from "./UsersPanel";
import SignaturesPanel, { type AdminSignature } from "./SignaturesPanel";
import BulkPanel from "./BulkPanel";

export default function AdminTabs({
  users,
  signatures,
  meId,
  adminsCount,
}: {
  users: AdminUser[];
  signatures: AdminSignature[];
  meId: string;
  adminsCount: number;
}) {
  return (
    <Tabs defaultValue="users" className="w-full">
      <TabsList className="grid w-full grid-cols-3 sm:max-w-md">
        <TabsTrigger value="users">
          <Users className="mr-2 h-4 w-4" />
          Хэрэглэгч
        </TabsTrigger>
        <TabsTrigger value="signatures">
          <FileSignature className="mr-2 h-4 w-4" />
          Гарын үсэг
        </TabsTrigger>
        <TabsTrigger value="bulk">
          <Wrench className="mr-2 h-4 w-4" />
          Үйлдэл
        </TabsTrigger>
      </TabsList>

      <TabsContent value="users" className="mt-4">
        <UsersPanel users={users} meId={meId} adminsCount={adminsCount} />
      </TabsContent>

      <TabsContent value="signatures" className="mt-4">
        <SignaturesPanel signatures={signatures} />
      </TabsContent>

      <TabsContent value="bulk" className="mt-4">
        <BulkPanel signatureCount={signatures.length} userCount={users.length} />
      </TabsContent>
    </Tabs>
  );
}
