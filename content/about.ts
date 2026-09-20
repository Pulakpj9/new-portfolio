/* About content — single source of truth.
   Imported by AboutSection (display) and the chat knowledge base.
   Do not duplicate this data elsewhere. */

import { Code2, Cpu, Layers, Zap, type LucideIcon } from "lucide-react";

export interface Skill {
  category: string;
  icon: LucideIcon;
  items: string[];
  color: string;
  accent: string;
}

export const skills: Skill[] = [
  {
    category: "Frontend",
    icon: Zap,
    items: ["React", "Next.js", "TypeScript", "Tailwind CSS"],
    color: "from-primary to-cyan-400",
    accent: "#0ea5e9",
  },
  {
    category: "Backend",
    icon: Cpu,
    items: ["Node.js", "Express.js", "Docker", "Socket.io", "Microservices"],
    color: "from-blue-400 to-primary",
    accent: "#2563eb",
  },
  {
    category: "Database",
    icon: Layers,
    items: ["MySQL", "MongoDB"],
    color: "from-primary to-teal-300",
    accent: "#0d9488",
  },
  {
    category: "Tools",
    icon: Code2,
    items: ["Git", "VS Code", "Github", "Postman", "Swagger"],
    color: "from-teal-300 to-cyan-400",
    accent: "#06b6d4",
  },
];

export interface Stat {
  value: string;
  label: string;
  accent: string;
}

export const stats: Stat[] = [
  { value: "1.5+", label: "Years Full Time Experience", accent: "#0d9488" },
  { value: "5+", label: "months internship Experience", accent: "#f59e0b" },
  { value: "4+", label: "Projects Shipped", accent: "#0ea5e9" },
  { value: "2+", label: "Projects Ongoing", accent: "#a855f7" },
];

/* Condensed, skimmable intro copy */
export const INTRO_MAIN =
  "I'm a backend-focused software engineer building systems that create real-world impact — from healthcare platforms to education solutions, designing infrastructure that keeps apps reliable, scalable, and secure.";
export const INTRO_SUPPORT =
  "Great software starts with strong foundations. Clean architecture, thoughtful database design, optimized APIs, and maintainable code aren't afterthoughts — they're the core of everything I build. I think in systems and outcomes, take ownership, and build backend solutions that empower teams and support meaningful user experiences.";

/* Identity headline: types "a Developer." then appends a rotating role */
export const PRIMARY_LINE = "a Developer.";
export const SECONDARY_LINE = [
  "A Builder",
  "A Tech Enthusiast",
  "A Learner",
  "An Explorer",
  "A Problem Solver",
  "A Systems Thinker",
];
