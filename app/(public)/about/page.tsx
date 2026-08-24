import type { Metadata } from "next";
import { About } from "@/components/home/About";

export const metadata: Metadata = {
  title: "Танилцуулга · Монгол 3-р сургууль",
  description:
    "Нийслэлийн ерөнхий боловсролын 3 дугаар сургуулийн танилцуулга, түүх, зорилго, уламжлал.",
};

export default function AboutPage() {
  return <About />;
}
