/**
 * PLYA Fitness App - Project Content
 *
 * Edit this file to update project details displayed in the client portal.
 * Changes will appear in all three views:
 *   - Compact tile (portal homepage)
 *   - Expanded tile (click to expand)
 *   - Full project page (/client-portals/plya/project/plya-fitness-app)
 */

import { ProjectData } from "@/components/portal/types";

export const plyaFitnessApp: ProjectData = {
  // ============================================================================
  // BASIC INFO (shown in compact tile)
  // ============================================================================
  id: "plya-fitness-app",
  name: "PLYA Fitness App",
  description: "AI-powered workout planning for athletes",
  status: "on-track", // 'on-track' | 'ahead' | 'attention'
  startDate: "Jan 6, 2026",
  targetDelivery: "Mar 7, 2026",

  // ============================================================================
  // PROGRESS (shown in compact tile)
  // ============================================================================
  currentWeek: 3,
  totalWeeks: 8,

  // ============================================================================
  // WEEK MINDSET (prominent banner at top of project tile)
  // Frames founder focus for each phase - the constant reminder to stay in lane
  // ============================================================================
  weekMindset: {
    "1-2": {
      title: "Sharpen Your Understanding of Who Will Use PLYA",
      message:
        "The goal is to validate what you THINK you know about your target customer by connecting with REAL people. These people will act as your 'reality check' throughout the design and build process, and will be your first beta testers.",
    },
    "3-4": {
      title: "Listen & Learn from Real Users",
      message:
        "User interviews are your most valuable source of truth. Stay curious, ask follow-up questions, and let their actual needs shape the product - not your assumptions.",
    },
    "5-6": {
      title: "Build for Your Beta Testers",
      message:
        "Everything you build this phase should be something you can put in front of real users. Prioritize features that let you learn, not features that feel impressive.",
    },
    "7-8": {
      title: "Polish & Prepare for Launch",
      message:
        "Focus on making the core experience bulletproof. A small, polished product beats a large, buggy one. Your beta testers' feedback should drive final priorities.",
    },
  },

  // ============================================================================
  // THIS WEEK'S WORK (shown in compact tile)
  // ============================================================================
  thisWeek: {
    productBuild: {
      title: "Database & Profile System",
      tasks: [
        { label: "Database schema implementation", status: "done" },
        { label: "Profile system architecture", status: "in-progress" },
        { label: "Core UI components", status: "upcoming" },
      ],
    },
    strategy: {
      title: "Research & Validation",
      tasks: [
        { label: "User interview synthesis", status: "in-progress" },
        { label: "Persona refinement from interviews", status: "in-progress" },
        { label: "Competitive analysis", status: "upcoming" },
      ],
    },
  },

  // ============================================================================
  // NEXT WEEK PREVIEW (shown in expanded tile)
  // ============================================================================
  nextWeek: {
    productBuild: "Content engine & calendar UI foundations",
    strategy: "Landing page design & beta prep",
  },

  // ============================================================================
  // CLIENT ACTION ITEMS (shown in expanded tile + full page)
  // ============================================================================
  actionItems: [
    {
      id: 1,
      label: "Review & refine personas based on interview insights",
      link: "#",
      neededFor: "Finalized personas for beta prep (Week 5)",
    },
    {
      id: 2,
      label: "Share competitive analysis findings",
      link: "#",
      neededFor: "Landing page positioning (Week 5-6)",
    },
    {
      id: 3,
      label: "Confirm beta tester list (aim for 10-15 committed users)",
      link: "#",
      neededFor: "MVP beta release (Week 5-6)",
    },
  ],

  // ============================================================================
  // TIMELINE (shown on full project page)
  // ============================================================================
  timeline: {
    // Product Build Track (gold color)
    productBuild: [
      {
        weeks: "1-2",
        phase: "Foundation",
        status: "done",
        items: [
          "User auth foundations",
          "Architecture exploration",
          "Data model design",
          "Initial scaffolding",
        ],
      },
      {
        weeks: "3-4",
        phase: "Frame",
        status: "current",
        items: [
          "Database schema",
          "Profile system",
          "Frontend architecture",
          "Core UI components",
        ],
      },
      {
        weeks: "5-6",
        phase: "Build",
        status: "upcoming",
        items: ["Content engine", "Calendar UI", "Daily views", "QA & testing"],
      },
      {
        weeks: "7-8",
        phase: "Finish",
        status: "upcoming",
        items: [
          "AI tagging",
          "AI coach chat",
          "Smart plans",
          "Polish & deploy",
        ],
      },
    ],

    // Strategy Track (green color)
    strategy: [
      {
        weeks: "1-2",
        phase: "Personas & Advisors",
        status: "done",
        items: [
          "User personas",
          "Expert/advisor personas",
          "Interview guide",
        ],
      },
      {
        weeks: "3-4",
        phase: "Research & Validation",
        status: "current",
        items: [
          "User interviews",
          "Persona refinement",
          "Competitive analysis",
          "Landing page design",
        ],
      },
      {
        weeks: "5-6",
        phase: "Beta Prep",
        status: "upcoming",
        items: [
          "Landing page launch",
          "MVP → beta group",
          "Persona validation check",
          "Vision deck",
        ],
      },
      {
        weeks: "7-8",
        phase: "Launch Readiness",
        status: "upcoming",
        items: [
          "MVP refinement",
          "Broader beta testing",
          "Advisory board plan",
          "Outreach templates",
        ],
      },
    ],
  },

  // ============================================================================
  // DELIVERABLES (shown on full project page)
  // ============================================================================
  deliverables: {
    completed: [
      {
        name: "Persona Sharpener Tool",
        date: "Jan 8",
        link: "#",
      },
    ],
    inProgress: [
      { name: "Authentication / User Account Foundations", estimate: "Jan 10" },
      { name: "Architecture & Data Model Exploration", estimate: "Jan 12" },
      { name: "Founder Persona Hypotheses (V0)", estimate: "Jan 10" },
      { name: "Expert/Advisor Personas", estimate: "Jan 12" },
    ],
    upcoming: [
      { name: "Initial Web App Scaffolding", week: "Week 2" },
      { name: "User Interviews", week: "Week 3-4" },
      { name: "Persona Refinement", week: "Week 3-4" },
      { name: "Competitive Analysis", week: "Week 3-4" },
      { name: "Database Schema", week: "Week 3-4" },
      { name: "Profile System", week: "Week 3-4" },
      { name: "Landing Page", week: "Week 3-4" },
      { name: "Content Engine", week: "Week 5-6" },
      { name: "Calendar & Planning UI", week: "Week 5-6" },
      { name: "Vision Deck", week: "Week 5-6" },
      { name: "MVP Beta Release", week: "Week 5-6" },
      { name: "AI Content Tagging", week: "Week 7-8" },
      { name: "AI Coach Chat", week: "Week 7-8" },
      { name: "Smart Plan Generation", week: "Week 7-8" },
      { name: "Advisory Board Plan", week: "Week 7-8" },
    ],
  },
};
