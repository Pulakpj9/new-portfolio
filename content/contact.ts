/* Contact links + socials — single source of truth.
   Imported by ContactSection (display) and the chat knowledge base.
   Do not duplicate this data elsewhere. */

import {
  Github,
  Linkedin,
  Mail,
  MapPin,
  Twitter,
  type LucideIcon,
} from "lucide-react";

export interface ContactLink {
  label: string;
  value: string;
  href: string;
  icon: LucideIcon;
}

export const contactLinks: ContactLink[] = [
  {
    label: "Email",
    value: "pulakpj9@gmail.com",
    href: "mailto:pulakpj9@gmail.com",
    icon: Mail,
  },
  {
    label: "Location",
    value: "Ahmedabad, Gujarat",
    href: "#",
    icon: MapPin,
  },
];

export interface SocialLink {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const socialLinks: SocialLink[] = [
  { label: "GitHub", href: "https://github.com/Pulakpj9", icon: Github },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/pulak-jain-aa1053203",
    icon: Linkedin,
  },
  // { label: "Twitter", href: "#", icon: Twitter },
];

/* KB-facing identity facts (display copy stays in components). */
export const profile = {
  name: "Pulak Jain",
  role: "Backend-focused full-stack software developer",
  email: "pulakpj9@gmail.com",
  location: "Ahmedabad, Gujarat",
  github: "https://github.com/Pulakpj9",
  linkedin: "https://www.linkedin.com/in/pulak-jain-aa1053203",
  availability: "Actively looking for work",
};
