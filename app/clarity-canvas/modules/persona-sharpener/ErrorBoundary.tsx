'use client';

import React, { Component, ReactNode } from 'react';
import Link from 'next/link';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class PersonaSharpenerErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Persona Sharpener Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center px-6">
          <div className="max-w-md text-center">
            <span className="text-6xl mb-6 block">⚠️</span>
            <h1 className="text-2xl font-display mb-4">Something went wrong</h1>
            <p className="text-zinc-400 mb-6">
              The Persona Sharpener encountered an error. Your progress may have
              been saved.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="block w-full px-6 py-3 bg-[#D4A84B] text-black font-medium rounded-lg hover:bg-[#e0b55c] transition-colors"
              >
                Reload Page
              </button>
              <Link
                href="/clarity-canvas/modules"
                className="block w-full px-6 py-3 bg-zinc-800 text-white font-medium rounded-lg hover:bg-zinc-700 transition-colors text-center"
              >
                Back to Modules
              </Link>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-zinc-500 text-sm">
                  Error Details
                </summary>
                <pre className="mt-2 text-xs bg-zinc-900 p-4 rounded overflow-auto text-red-400">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
