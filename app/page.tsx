"use client"

import { Navigation } from "@/components/navigation"
import { HeroSection } from "@/components/hero-section"
import { AboutSection } from "@/components/about-section"
import { ExperienceSection } from "@/components/experience-section"
import { TextMarquee } from "@/components/text-marquee"
import { ProjectsSection } from "@/components/projects-section"
import { CaseStudiesSection } from "@/components/case-studies-section"
import { ContactSection } from "@/components/contact-section"
import { Footer } from "@/components/footer"
import { CursorFollower } from "@/components/cursor-follower"
import { ScrollProgress } from "@/components/scroll-progress"

export default function Page() {
  return (
    <main className="relative">
      <ScrollProgress />
      <CursorFollower />
      <Navigation />
      <HeroSection />
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
      />
      <AboutSection />
      <ExperienceSection />
      <TextMarquee
        items={[
          "Design Systems",
          "Full-Stack",
          "Performance",
          "Accessibility",
          "APIs",
        ]}
        speed={35}
        className="py-8"
      />
      <ProjectsSection />
      <CaseStudiesSection />
      <ContactSection />
      <Footer />
    </main>
  )
}
