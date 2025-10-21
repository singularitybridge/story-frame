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
 * Generate a video with optional character reference images, start frame, and custom settings
 * @param prompt - Text prompt for video generation
 * @param characterReferences - Optional character reference images for consistency
 * @param settings - Optional generation settings (model, aspect ratio, resolution, looping)
 * @param startFrameDataUrl - Optional data URL of start frame from previous scene (for shot continuity)
 */
export const generateVideo = async (
  prompt: string,
  characterReferences?: GeneratedImage[],
  settings?: VideoGenerationSettings,
  startFrameDataUrl?: string,
): Promise<GeneratedVideo> => {
  console.log('Generating video with prompt:', prompt);
  console.log('Character references:', characterReferences?.length || 0);
  console.log('Start frame provided:', !!startFrameDataUrl);
  console.log('Settings:', settings);

  const aspectRatio = settings?.aspectRatio || AspectRatio.LANDSCAPE;

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

  // Convert start frame data URL to ImageFile if provided
  let startFrame: ImageFile | null = null;
  if (startFrameDataUrl) {
    const base64Data = startFrameDataUrl.split(',')[1];
    const mimeType = startFrameDataUrl.match(/data:([^;]+);/)?.[1] || 'image/png';
    const blob = await fetch(startFrameDataUrl).then(r => r.blob());
    startFrame = {
      file: new File([blob], 'start-frame.png', { type: mimeType }),
      base64: base64Data,
    };
    console.log('Converted start frame data URL to ImageFile for shot continuity');
  }

  // Use FRAMES_TO_VIDEO mode when start frame is provided (shot continuity)
  // Use REFERENCES_TO_VIDEO mode when only references are provided (character consistency)
  // Use TEXT_TO_VIDEO mode otherwise
  let mode: GenerationMode;
  if (startFrame) {
    mode = GenerationMode.FRAMES_TO_VIDEO;
  } else if (referenceImages.length > 0) {
    mode = GenerationMode.REFERENCES_TO_VIDEO;
  } else {
    mode = GenerationMode.TEXT_TO_VIDEO;
  }

  console.log(`Using generation mode: ${mode}`);

  const params: GenerateVideoParams = {
    mode,
    model: settings?.model || VeoModel.VEO,
    prompt,
    aspectRatio,
    resolution: settings?.resolution || Resolution.P720,
    startFrame,
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
