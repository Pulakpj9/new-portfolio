/* Case studies — single source of truth.
   Imported by CaseStudiesSection (display) and the chat knowledge base.
   Do not duplicate this data elsewhere. */

export interface CaseStudyResult {
  metric: string;
  value: string;
  description: string;
}

export interface CaseStudy {
  id: string;
  title: string;
  client: string;
  duration: string;
  role: string;
  image: string;
  overview: string;
  challenge: string;
  approach: string[];
  techStack: string[];
  results: CaseStudyResult[];
  testimonial?: { text: string; author: string; role: string };
}

export const caseStudies: CaseStudy[] = [
  {
    id: "activity-tracker",
    title: "Scaling a Real-Time Workforce Activity Monitoring System",
    client: "Internal Product / SaaS Platform",
    duration: "Ongoing Optimization Phase",
    role: "Backend Engineer (Performance Optimization)",
    image: "/images/webtracker.png",
    overview:
      "The Activity Tracker platform monitors user interactions including application usage, web activity, keystrokes, attendance logs, and daily working hours. As user activity volume increased, the system faced performance bottlenecks and database strain.",
    challenge:
      "High-frequency real-time data ingestion was causing database load spikes and inconsistent server stability. The system needed improved uptime, optimized queries, and a scalable backend structure to handle nearly 1M weekly records without performance degradation.",
    approach: [
      "Refactored core backend modules to improve stability and maintainability",
      "Implemented SQL query optimization and indexing strategies",
      "Reduced redundant real-time DB operations through architectural tuning",
      "Enhanced error handling and production monitoring",
      "Improved API efficiency for high-volume activity ingestion",
    ],
    techStack: ["Node.js", "TypeScript", "MySQL", "Sequelize", "AWS S3"],
    results: [
      {
        metric: "Server Uptime",
        value: "99.9%",
        description: "Stabilized production reliability",
      },
      {
        metric: "Database Load",
        value: "-50%",
        description: "Reduced real-time operational strain",
      },
      {
        metric: "Data Volume",
        value: "~1M/week",
        description: "Handled high-frequency activity logs",
      },
    ],
  },
  {
    id: "whatsapp-crm",
    title: "Building a Scalable WhatsApp Automation & CRM Engine",
    client: "SaaS CRM Platform",
    duration: "6+ months",
    role: "Backend Developer",
    image: "/images/whatsapp-crm.png",
    overview:
      "The WhatsApp CRM platform was designed to help businesses automate customer communication using WhatsApp Cloud API. The goal was to enable no-code automation workflows and integrate payment, AI, and knowledge-based services.",
    challenge:
      "Businesses needed a flexible automation system that could manage conversational flows, integrate multiple third-party services, and execute time-based triggers reliably at scale. The backend required modular architecture to support extensibility and rapid feature rollout.",
    approach: [
      "Developed a reusable Flow Builder with 12+ no-code automation elements",
      "Integrated WhatsApp Cloud API for scalable messaging workflows",
      "Coordinated 5+ service integrations including OpenAI, Stripe, Razorpay, and RAG",
      "Implemented scheduled and trigger-based automation handling",
      "Designed modular backend services for extensibility",
    ],
    techStack: [
      "Node.js",
      "MongoDB",
      "WhatsApp Cloud API",
      "OpenAI",
      "Stripe",
      "Razorpay",
    ],
    results: [
      {
        metric: "Setup Speed",
        value: "4x Faster",
        description: "Reduced automation configuration time",
      },
      {
        metric: "Integrations",
        value: "5+",
        description: "Payments, AI, and knowledge services connected",
      },
      {
        metric: "Automation Modules",
        value: "12+",
        description: "Reusable no-code flow elements built",
      },
    ],
  },
  {
    id: "salesapp",
    title: "Optimizing Field Sales Operations with Smart Backend Automation",
    client: "Sales Distribution Organization",
    duration: "5 months",
    role: "Backend Developer",
    image: "/images/salesapp.png",
    overview:
      "SalesApp was developed to streamline operations for field sales teams by automating order management, inventory tracking, visit logging, and route planning. The platform required reliable backend orchestration for real-time coordination.",
    challenge:
      "Manual planning and route assignment were causing inefficiencies and inconsistent delivery performance. The backend needed structured workflow automation and optimized route sequencing to reduce operational friction for 30+ field staff.",
    approach: [
      "Built backend foundation supporting multi-channel sales workflows",
      "Designed route sequencing and assignment algorithms",
      "Automated order, inventory, and visit tracking modules",
      "Structured scalable REST APIs for mobile and web clients",
      "Improved planning efficiency through optimized logic",
    ],
    techStack: ["Node.js", "TypeScript", "MySQL", "REST APIs"],
    results: [
      {
        metric: "Field Staff Supported",
        value: "30+",
        description: "Enabled structured sales operations",
      },
      {
        metric: "Planning Efficiency",
        value: "30-40%",
        description: "Reduced manual route effort",
      },
      {
        metric: "Workflow Automation",
        value: "Orders & Inventory",
        description: "Digitized core sales processes",
      },
    ],
  },
];
