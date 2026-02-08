/**
 * Clarity Canvas Tools for AI Products
 *
 * Tool definitions that products can expose to their AI assistants
 * for fetching user context from Clarity Canvas.
 */

export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<
      string,
      {
        type: string;
        enum?: string[];
        description: string;
      }
    >;
    required: string[];
  };
}

/**
 * Standard tool definitions for Clarity Canvas integration.
 * Products should include these in their AI tool configuration.
 */
export const CLARITY_CANVAS_TOOLS: ToolDefinition[] = [
  {
    name: 'get_profile_index',
    description:
      "Get an overview of the user's Clarity Canvas profile sections with token counts and last updated dates. Use this to understand what information is available before fetching specific sections.",
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_profile_section',
    description:
      "Retrieve a specific section of the user's Clarity Canvas profile in full detail. Use this when you need more information about a particular topic (goals, personas, pain points, etc.).",
    input_schema: {
      type: 'object',
      properties: {
        section: {
          type: 'string',
          enum: [
            'individual',
            'role',
            'organization',
            'goals',
            'network',
            'projects',
          ],
          description: 'Which profile section to retrieve',
        },
      },
      required: ['section'],
    },
  },
  {
    name: 'search_profile',
    description:
      "Search the user's Clarity Canvas profile using natural language. Use this when looking for specific information that might be spread across multiple sections.",
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Natural language search query',
        },
        maxResults: {
          type: 'number',
          description: 'Maximum results to return (default: 5)',
        },
      },
      required: ['query'],
    },
  },
];

/**
 * Get tools formatted for Claude API.
 */
export function getToolsForClaude(): ToolDefinition[] {
  return CLARITY_CANVAS_TOOLS;
}

/**
 * Get tools formatted for OpenAI API (function calling).
 */
export function getToolsForOpenAI() {
  return CLARITY_CANVAS_TOOLS.map((tool) => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.input_schema,
    },
  }));
}
