/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { generateVideo as generateVideoGemini } from './geminiService';
import {
  GenerateVideoParams,
  GenerationMode,
  AspectRatio,
  Resolution,
  VeoModel,
  ImageFile,
} from '../types';
import { GeneratedImage } from './imageService';
import { trackVideoGeneration } from './costTrackingService';

export interface GeneratedVideo {
  objectUrl: string;
  blob: Blob;
  uri: string;
}

export interface VideoGenerationSettings {
  model?: VeoModel;
  aspectRatio?: AspectRatio;
  resolution?: Resolution;
  isLooping?: boolean;
}

/**
 * Generate a video with optional character reference images and custom settings
 */
export const generateVideo = async (
  prompt: string,
  characterReferences?: GeneratedImage[],
  settings?: VideoGenerationSettings,
): Promise<GeneratedVideo> => {
  console.log('Generating video with prompt:', prompt);
  console.log('Character references:', characterReferences?.length || 0);
  console.log('Settings:', settings);

  // Convert GeneratedImage to ImageFile format
  const referenceImages: ImageFile[] = characterReferences
    ? await Promise.all(
        characterReferences.map(async (img) => {
          return {
            file: new File([img.blob], 'reference.png', { type: img.mimeType }),
            base64: img.imageBytes,
          };
        })
      )
    : [];

  const params: GenerateVideoParams = {
    mode: GenerationMode.REFERENCES_TO_VIDEO,
    model: settings?.model || VeoModel.VEO,
    prompt,
    aspectRatio: settings?.aspectRatio || AspectRatio.LANDSCAPE,
    resolution: settings?.resolution || Resolution.P720,
    startFrame: null,
    endFrame: null,
    referenceImages,
    styleImage: null,
    inputVideo: null,
    inputVideoObject: null,
    isLooping: settings?.isLooping || false,
  };

  const result = await generateVideoGemini(params);

  // Track cost for this generation
  const duration = result.video.videoDuration || 8; // Default to 8 seconds if not available
  const resolutionKey = params.resolution === Resolution.P1080 ? '1080p' : '720p';
  const modelName = params.model === VeoModel.VEO ? 'veo-3.1' : 'veo-2';

  trackVideoGeneration(duration, resolutionKey, modelName);
  console.log('Video generation cost tracked:', { duration, resolution: resolutionKey, model: modelName });

  return {
    objectUrl: result.objectUrl,
    blob: result.blob,
    uri: result.uri,
  };
};
