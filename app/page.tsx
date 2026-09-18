"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Navigation } from "@/components/navigation";
import { HeroSection } from "@/components/hero-section";
import { AboutSection } from "@/components/about-section";
import { ExperienceSection } from "@/components/experience-section";
import { TextMarquee } from "@/components/text-marquee";
import { ProjectsSection } from "@/components/projects-section";
import { CaseStudiesSection } from "@/components/case-studies-section";
import { ContactSection } from "@/components/contact-section";
import { Footer } from "@/components/footer";
import { CursorFollower } from "@/components/cursor-follower";
import { ScrollProgress } from "@/components/scroll-progress";
import {
  AnalyticsProvider,
  TrackedSection,
} from "@/lib/analytics/use-section-tracking";

/* Below-the-fold interactive widget — split out of the initial bundle. */
const ChatAssistant = dynamic(
  () => import("@/components/chat-assistant").then((m) => m.ChatAssistant),
  { ssr: false },
);

export default function Page() {
  const [expandedStudy, setExpandedStudy] = useState<string | null>(null);

  return (
    <AnalyticsProvider>
    <main className="relative">
      <ScrollProgress />
      <CursorFollower />
      <Navigation />
      <TrackedSection slug="hero">
        <HeroSection />
      </TrackedSection>
      <TextMarquee
        items={[
          "React",
          "Next.js",
          "TypeScript",
          "Node.js",
          "Express.js",
          "MySQL",
          "Websockets",
          "MongoDb",
          "Tailwind",
          "Docker",
          "AWS",
        ]}
        blend
      />
      <TrackedSection slug="about">
        <AboutSection />
      </TrackedSection>
      <TrackedSection slug="experience">
        <ExperienceSection />
      </TrackedSection>
      <TextMarquee
        items={[
          "Design Systems",
          "Full-Stack",
          "Performance",
          "Accessibility",
          "APIs",
        ]}
        speed={35}
        className="py-8 scene-marquee-dark"
      />

      <TrackedSection slug="projects">
        <ProjectsSection
          expandedStudy={expandedStudy}
          setExpandedStudy={setExpandedStudy}
        />
      </TrackedSection>

      <TrackedSection slug="case-studies">
        <CaseStudiesSection
          expandedStudy={expandedStudy}
          setExpandedStudy={setExpandedStudy}
        />
      </TrackedSection>

      <TrackedSection slug="contact">
        <ContactSection />
      </TrackedSection>
      {/* <Footer /> */}
      <ChatAssistant />
    </main>
    </AnalyticsProvider>
  );
}
