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
  currentWeek: 1,
  totalWeeks: 8,

  // ============================================================================
  // THIS WEEK'S WORK (shown in compact tile)
  // ============================================================================
  thisWeek: {
    productBuild: {
      title: "User system & database",
      tasks: [
        { label: "Authentication / user account foundations", status: "done" },
        {
          label: "Architecture and data model exploration",
          status: "in-progress",
        },
      ],
    },
    strategy: {
      title: "Personas & Advisors",
      tasks: [
        { label: "Ship Persona Sharpener tool", status: "done" },
        { label: "User personas V0: Founder hypotheses", status: "in-progress" },
        { label: "Expert/advisor personas", status: "upcoming" },
      ],
    },
  },

  // ============================================================================
  // NEXT WEEK PREVIEW (shown in expanded tile)
  // ============================================================================
  nextWeek: {
    productBuild: "Initial web app scaffolding",
    strategy: "Interview guide + user network outreach",
  },

  // ============================================================================
  // CLIENT ACTION ITEMS (shown in expanded tile + full page)
  // ============================================================================
  actionItems: [
    {
      id: 1,
      label: "Complete Persona Sharpener for user personas",
      link: "#",
      neededFor: "User interviews & persona refinement (Week 3-4)",
    },
    {
      id: 2,
      label: "Define 2-3 expert/advisor personas (coaches, trainers, nutritionists)",
      link: "#",
      neededFor: "Advisory board plan (Week 7-8)",
    },
    {
      id: 3,
      label:
        "Identify 20 people in your network who fit one of the PLYA personas",
      link: "#",
      neededFor: "User interviews (Week 3-4), Beta testing (Week 5-8)",
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
        status: "current",
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
        status: "upcoming",
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
        status: "current",
        items: [
          "User personas",
          "Expert/advisor personas",
          "Interview guide",
        ],
      },
      {
        weeks: "3-4",
        phase: "Research & Validation",
        status: "upcoming",
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
