/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { GoogleGenAI } from '@google/genai';

export interface GenerateImageParams {
  prompt: string;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
}

export interface GeneratedImage {
  imageBytes: string;
  mimeType: string;
  objectUrl: string;
  blob: Blob;
}

/**
 * Generate an image using Gemini 2.5 Flash Image (Nano Banana)
 */
export const generateImage = async (
  params: GenerateImageParams,
): Promise<GeneratedImage> => {
  console.log('Starting image generation with params:', params);

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_GEMINI_API_KEY not found in environment');
  }

  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: [params.prompt],
    config: {
      responseModalities: ['IMAGE'],
      imageConfig: {
        aspectRatio: params.aspectRatio || '16:9',
      },
    },
  });

  console.log('Image generation response:', response);

  // Extract the image from the response
  const imagePart = response.parts?.find((part: any) => part.inlineData);

  if (!imagePart?.inlineData) {
    throw new Error('No image was generated in the response');
  }

  const imageBytes = imagePart.inlineData.data;
  const mimeType = imagePart.inlineData.mimeType || 'image/png';

  // Convert base64 to blob
  const byteString = atob(imageBytes);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  const blob = new Blob([ab], { type: mimeType });
  const objectUrl = URL.createObjectURL(blob);

  return {
    imageBytes,
    mimeType,
    objectUrl,
    blob,
  };
};

/**
 * Generate multiple character reference images
 */
export const generateCharacterReferences = async (
  characterDescription: string,
  numberOfImages: number = 2,
): Promise<GeneratedImage[]> => {
  const prompts = [
    `Portrait of ${characterDescription}, front-facing, neutral friendly expression, high quality photorealistic, professional lighting`,
    `Portrait of ${characterDescription}, smiling and gesturing expressively, high quality photorealistic, professional lighting`,
    `Full body shot of ${characterDescription}, casual pose, high quality photorealistic, professional lighting`,
  ].slice(0, numberOfImages);

  const images: GeneratedImage[] = [];

  for (const prompt of prompts) {
    try {
      const image = await generateImage({ prompt, aspectRatio: '16:9' });
      images.push(image);
    } catch (error) {
      console.error('Failed to generate image for prompt:', prompt, error);
      throw error;
    }
  }

  return images;
};
