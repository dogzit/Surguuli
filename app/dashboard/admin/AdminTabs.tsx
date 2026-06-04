"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, FileSignature, Wrench, LayoutDashboard } from "lucide-react";
import UsersPanel, { type AdminUser } from "./UsersPanel";
import SignaturesPanel, { type AdminSignature } from "./SignaturesPanel";
import BulkPanel from "./BulkPanel";
import OverviewPanel, { type OverviewRow } from "./OverviewPanel";

export default function AdminTabs({
  users,
  signatures,
  overview,
}: {
  users: AdminUser[];
  signatures: AdminSignature[];
  overview: OverviewRow[];
}) {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-4 sm:max-w-xl">
        <TabsTrigger value="overview">
          <LayoutDashboard className="mr-2 h-4 w-4" />
          Нэгдсэн дүн
        </TabsTrigger>
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

      <TabsContent value="overview" className="mt-4">
        <OverviewPanel rows={overview} />
      </TabsContent>

      <TabsContent value="users" className="mt-4">
        <UsersPanel users={users} />
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
