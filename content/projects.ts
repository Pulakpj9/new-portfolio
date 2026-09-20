/* Portfolio projects — single source of truth.
   Imported by ProjectsSection (display) and the chat knowledge base.
   Do not duplicate this data elsewhere. */

export interface ProjectMetric {
  label: string;
  value: string;
}

export interface Project {
  id: string;
  title: string;
  tagline: string;
  description: string;
  image?: string;
  video?: string;
  tags: string[];
  color: string;
  metrics: ProjectMetric[];
}

export const projects: Project[] = [
  {
    id: "activity-tracker",
    title: "Activity Tracker",
    tagline: "Smart Activity Tracking for Modern Teams.",
    description:
      "Optimized backend performance for a real-time user activity tracking platform monitoring application usage, web activity, keystrokes, attendance, and work hours. Improved system reliability by refactoring core modules and enhancing error handling, achieving 99.9% server uptime. Reduced real-time database load by 50% through SQL query optimization and indexing strategies.",
    image: "/images/webtracker.png",
    tags: ["TypeScript", "Node.js", "MySQL", "Sequelize", "AWS S3"],
    color: "from-primary to-cyan-400",
    metrics: [
      { label: "Data velocity (records/week)", value: "~1M (approx.)" },
      { label: "Uptime", value: "99.9%" },
    ],
  },
  {
    id: "whatsapp-crm",
    title: "WhatsApp CRM",
    tagline: "Automate Conversations. Scale Customer Engagement.",
    description:
      "Built a scalable backend for a WhatsApp CRM platform enabling automated customer engagement workflows. Developed a reusable Flow Builder with 12+ no-code elements, reducing automation setup time by 4x. Integrated WhatsApp Cloud API with OpenAI, Stripe, Razorpay, and RAG services, along with time-based triggers for streamlined outreach and conversational commerce.",
    video: "/videos/crmdemo.mp4",
    tags: ["Node.js", "MongoDB", "WhatsApp Cloud API", "OpenAI", "Stripe"],
    color: "from-green-500 to-emerald-400",
    metrics: [
      { label: "No-code elements", value: "12+" },
      { label: "Service integrations", value: "5+" },
      { label: "Setup time reduced", value: "4x faster" },
    ],
  },
  {
    id: "salesapp",
    title: "SalesApp",
    tagline: "Optimizing Field Sales Through Smart Automation.",
    description:
      "Engineered the backend foundation for a multi-channel sales platform supporting 30+ field staff. Automated order management, inventory tracking, visit logging, and route planning workflows. Designed route sequencing and assignment algorithms that improved delivery precision and reduced planning effort by 30–40%, enhancing overall operational efficiency.",
    video: "/videos/salesapp-video.mp4",
    tags: ["Node.js", "MySQL", "TypeScript", "REST APIs"],
    color: "from-orange-500 to-amber-400",
    metrics: [
      { label: "Field staff supported", value: "30+" },
      { label: "Planning efficiency gain", value: "30–40%" },
      { label: "Modules automated", value: "Orders, Inventory, Routes" },
    ],
  },
];
