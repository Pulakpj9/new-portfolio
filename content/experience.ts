/* Work experience — single source of truth.
   Imported by ExperienceSection (display) and the chat knowledge base.
   Do not duplicate this data elsewhere. */

export interface Experience {
  period: string;
  role: string;
  company: string;
  description: string;
  highlights: string[];
}

export const experiences: Experience[] = [
  {
    period: "July 2024 -- Present",
    role: "Node Js Developer",
    company: "Infoware India",
    description:
      "Architected backend modules for 7+ cross-domain products, advancing scalability through scheduled messaging and route-planning automation.Deployed 5+ external APIs (Stripe, Razorpay, OpenAI, LMS) into core services, broadening capabilities and halving integration timelines.",
    highlights: [
      "Shipped 4 products",
      "Integrated 5+ external services (Stripe, Rag Service, OpenAI, LMS etc.)",
      "Optimized system for processing 1M weekly records scale",
    ],
  },
  {
    period: "January 2024 -- June 2024",
    role: "Node Js Intern",
    company: "Infoware India",
    description:
      "Crafted APIs for HMS and Alumni Portal, weaving in ABDM workflows to handle 1,000+ patient/record exchanges efficiently.Refined backend modules with Sequelize + MySQL query tweaks, elevating data retrieval speeds by 20-30% and code maintainability.",
    highlights: [
      "Optimized MySQL queries by 30%",
      "Improved API response performance",
      "Enhanced backend code maintainability",
    ],
  },
  {
    period: "June 2023 -- July 2023",
    role: "Analyst-I Software Engineer Intern",
    company: "Capgemini",
    description:
      "Contributed in an Agile environment to develop a scalable ABDM APIs library, implementing reliable API functions and enhancing UI components while ensuring secure integrations, maintainable architecture, and adherence to industry best practices.",
    highlights: [
      "Developed scalable ABDM API modules",
      "Worked in Agile sprint environment",
      "Enhanced reusable backend library components",
    ],
  },
];
