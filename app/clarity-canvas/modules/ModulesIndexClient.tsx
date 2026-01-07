'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface Module {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  estimatedMinutes: number;
  enrichesSections: string[];
  isActive: boolean;
}

interface User {
  id?: string;
  name?: string | null;
}

export function ModulesIndexClient({ user }: { user: User }) {
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchModules() {
      try {
        const response = await fetch('/api/clarity-canvas/modules');
        if (!response.ok) throw new Error('Failed to fetch modules');
        const data = await response.json();
        setModules(data.modules);
      } catch (err) {
        setError('Failed to load modules');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchModules();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            href="/clarity-canvas"
            className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2"
          >
            <span>←</span>
            <span>Back to Profile</span>
          </Link>
          <h1 className="text-xl font-display text-white">Clarity Modules</h1>
          <div className="w-24" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-display text-white mb-3">
            Enrich Your Profile
          </h2>
          <p className="text-zinc-400 mb-8 max-w-2xl">
            Complete focused experiences to deepen specific aspects of your
            clarity profile. Each module helps you capture structured insights
            that inform your strategy.
          </p>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-[#D4A84B] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="text-red-400 bg-red-400/10 px-4 py-3 rounded-lg">
              {error}
            </div>
          ) : (
            <div className="space-y-4">
              {modules.map((module, index) => (
                <ModuleCard key={module.id} module={module} index={index} />
              ))}

              {/* Coming Soon Placeholder */}
              <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6 opacity-50">
                <div className="flex items-start gap-4">
                  <span className="text-3xl">🎯</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-medium text-zinc-500">
                        Coming Soon: Problem Validator
                      </h3>
                    </div>
                    <p className="text-zinc-600 text-sm">
                      Validate your problem hypothesis with structured customer
                      discovery.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}

function ModuleCard({ module, index }: { module: Module; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 hover:border-[#D4A84B]/50 transition-colors"
    >
      <div className="flex items-start gap-4">
        <span className="text-3xl">{module.icon}</span>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium text-white">{module.name}</h3>
            <span className="text-sm text-zinc-500">
              ~{module.estimatedMinutes} min
            </span>
          </div>
          <p className="text-zinc-400 text-sm mb-4">{module.description}</p>
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {module.enrichesSections.map((section) => (
                <span
                  key={section}
                  className="text-xs px-2 py-1 bg-zinc-800 text-zinc-400 rounded"
                >
                  {section}
                </span>
              ))}
            </div>
            <Link
              href={`/clarity-canvas/modules/${module.slug}`}
              className="px-4 py-2 bg-[#D4A84B] text-black text-sm font-medium rounded-lg hover:bg-[#e0b55c] transition-colors"
            >
              Start →
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
