/* Offline/degraded-mode replies. Used by the client when the LLM path is
   unreachable and by /api/chat when the provider times out or errors.
   Deliberately dumb — the smarts live server-side. */

export const FALLBACK_FOLLOWUPS = ["About Pulak", "Skills", "Projects", "Contact"];

export function botReply(input: string): string {
  const q = input.toLowerCase();
  if (/(skill|stack|tech|language|tools?)/.test(q)) {
    return "Pulak is a full-stack developer working with TypeScript, Next.js, React, Node.js, Express, MySQL, MongoDB, WebSockets, Docker and AWS. Backend is his playground!";
  }
  if (/(project|portfoli|built|work)/.test(q)) {
    return "Head to the Projects section — he has selected work with detailed case studies covering design, architecture and tricky problems. It's worth a scroll!";
  }
  if (/(experien|career|jobs?|roles?)/.test(q)) {
    return "Pulak is a backend-focused full-stack developer with hands-on experience in solution design and implementation. The Experience section has his full journey.";
  }
  if (/(contact|email|mail|reach|hire)/.test(q)) {
    return "Easy — drop him a line at pulakpj9@gmail.com, or use the Contact section at the bottom. He usually replies fast!";
  }
  if (/(about|who|pulak)/.test(q)) {
    return "Pulak Jain is a software developer who loves turning complex problems into clean, scalable products. He thinks like a backend engineer and ships like a product owner.";
  }
  if (/(hire|available|job|work)/.test(q)) {
    return "Yes — Pulak is actively looking for work! Check the Contact section or email pulakpj9@gmail.com to get the ball rolling. 🚀";
  }
  return "Hmm, I'm still a demo-bot so I may not have that answer yet. Try asking about his skills, experience, projects, or contact details — or just scroll the page!";
}
