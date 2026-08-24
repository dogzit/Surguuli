"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, FileSignature, Wrench, LayoutDashboard, GraduationCap, Newspaper } from "lucide-react";
import UsersPanel, { type AdminUser } from "./UsersPanel";
import SignaturesPanel, { type AdminSignature } from "./SignaturesPanel";
import BulkPanel from "./BulkPanel";
import OverviewPanel, { type OverviewRow } from "./OverviewPanel";
import ClassroomPanel, { type AdminClassroom } from "./ClassroomPanel";
import ContentPanel, { type AdminAnnouncement, type AdminNewsItem, type AdminTourRoom, type AdminGalleryImage, type AdminAchievement, type AdminFaq, type AdminEvent, type AdminTestimonial, type AdminClub } from "./ContentPanel";

export default function AdminTabs({
  users,
  signatures,
  overview,
  classrooms,
  announcements,
  newsItems,
  tourRooms,
  gallery,
  achievements,
  faqs,
  events,
  testimonials,
  clubs,
}: {
  users: AdminUser[];
  signatures: AdminSignature[];
  overview: OverviewRow[];
  classrooms: AdminClassroom[];
  announcements: AdminAnnouncement[];
  newsItems: AdminNewsItem[];
  tourRooms: AdminTourRoom[];
  gallery: AdminGalleryImage[];
  achievements: AdminAchievement[];
  faqs: AdminFaq[];
  events: AdminEvent[];
  testimonials: AdminTestimonial[];
  clubs: AdminClub[];
}) {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-6 sm:max-w-3xl">
        <TabsTrigger value="overview">
          <LayoutDashboard className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Нэгдсэн дүн</span>
          <span className="sm:hidden">Дүн</span>
        </TabsTrigger>
        <TabsTrigger value="users">
          <Users className="mr-2 h-4 w-4" />
          Хэрэглэгч
        </TabsTrigger>
        <TabsTrigger value="classrooms">
          <GraduationCap className="mr-2 h-4 w-4" />
          Анги
        </TabsTrigger>
        <TabsTrigger value="signatures">
          <FileSignature className="mr-2 h-4 w-4" />
          Гарын үсэг
        </TabsTrigger>
        <TabsTrigger value="content">
          <Newspaper className="mr-2 h-4 w-4" />
          Контент
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

      <TabsContent value="classrooms" className="mt-4">
        <ClassroomPanel classrooms={classrooms} />
      </TabsContent>

      <TabsContent value="content" className="mt-4">
        <ContentPanel announcements={announcements} news={newsItems} tourRooms={tourRooms} gallery={gallery} achievements={achievements} faqs={faqs} events={events} testimonials={testimonials} clubs={clubs} />
      </TabsContent>

      <TabsContent value="bulk" className="mt-4">
        <BulkPanel signatureCount={signatures.length} userCount={users.length} />
      </TabsContent>
    </Tabs>
  );
}
