/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { VideoEvaluation } from '../services/evaluationService';
import { VeoModel, AspectRatio, Resolution } from '../types';

export type ProjectType = 'movie' | 'short' | 'commercial';

export interface GenerationSettings {
  model: VeoModel;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  isLooping: boolean;
}

export interface Scene {
  id: string;
  title: string;
  duration: number;
  prompt: string;
  cameraAngle: string;
  voiceover?: string;

  // Rendering data
  generated: boolean;
  videoUrl?: string;
  videoBlob?: Blob;
  settings?: GenerationSettings;
  lastFrameDataUrl?: string; // For shot continuity - used as start frame for next scene
  referenceMode?: 'previous' | number; // 'previous' = use previous shot, number = use specific ref (1-based)

  // Evaluation data
  evaluation?: VideoEvaluation;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  type: ProjectType;
  character?: string;
  createdAt: number;
  updatedAt: number;
  scenes: Scene[];
}
