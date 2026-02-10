import { InputType, InputSession, FieldSource } from '@prisma/client';

export type { InputType, InputSession };

export interface InputSessionWithSources extends InputSession {
  fieldSources: (FieldSource & {
    field: {
      key: string;
      name: string;
      subsection: {
        key: string;
        name: string;
        section: {
          key: string;
          name: string;
        };
      };
    };
  })[];
}

export interface CreateInputSessionData {
  clarityProfileId?: string;
  pipelineClientId?: string;
  inputType: InputType;
  title: string;
  rawContent: string;
  sourceModule: 'clarity-canvas' | 'central-command';
  sourceContext?: string;
  durationSeconds?: number;
  originalFileName?: string;
  fieldsPopulated?: number;
}

export interface InputSessionFilters {
  inputType?: InputType | null;
  pillar?: string | null;
}
