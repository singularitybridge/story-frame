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

  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('NEXT_PUBLIC_GEMINI_API_KEY not found in environment');
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
  console.log('Response type:', typeof response);
  console.log('Response keys:', Object.keys(response));

  // Try different possible response structures
  let imageBytes: string | undefined;
  let mimeType = 'image/png';

  // Check if response has parts array
  if (response.parts && Array.isArray(response.parts)) {
    console.log('Response has parts array, length:', response.parts.length);

    // Try camelCase naming (inlineData)
    const imagePartCamel = response.parts.find((part: any) => part.inlineData);
    if (imagePartCamel?.inlineData) {
      console.log('Found image with inlineData (camelCase)');
      imageBytes = imagePartCamel.inlineData.data;
      mimeType = imagePartCamel.inlineData.mimeType || mimeType;
    } else {
      // Try snake_case naming (inline_data)
      const imagePartSnake = response.parts.find((part: any) => part.inline_data);
      if (imagePartSnake?.inline_data) {
        console.log('Found image with inline_data (snake_case)');
        imageBytes = imagePartSnake.inline_data.data;
        mimeType = imagePartSnake.inline_data.mime_type || imagePartSnake.inline_data.mimeType || mimeType;
      }
    }
  }

  // Check if response has direct data property
  if (!imageBytes && (response as any).data) {
    console.log('Found response.data');
    imageBytes = (response as any).data;
  }

  // Check if response has direct image property
  if (!imageBytes && (response as any).image) {
    console.log('Found response.image');
    imageBytes = (response as any).image;
  }

  if (!imageBytes) {
    console.error('Failed to find image in response. Full response structure:', JSON.stringify(response, null, 2));
    throw new Error('No image was generated in the response');
  }

  console.log('Successfully extracted image bytes, length:', imageBytes.length);

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
  aspectRatio: '16:9' | '9:16' = '16:9',
): Promise<GeneratedImage[]> => {
  const prompts = [
    `Portrait of ${characterDescription}, front-facing, neutral friendly expression, high quality photorealistic, professional lighting`,
    `Portrait of ${characterDescription}, smiling and gesturing expressively, high quality photorealistic, professional lighting`,
    `Full body shot of ${characterDescription}, casual pose, high quality photorealistic, professional lighting`,
  ].slice(0, numberOfImages);

  const images: GeneratedImage[] = [];

  for (const prompt of prompts) {
    try {
      const image = await generateImage({ prompt, aspectRatio });
      images.push(image);
    } catch (error) {
      console.error('Failed to generate image for prompt:', prompt, error);
      throw error;
    }
  }

  return images;
};

export interface EditImageParams {
  originalDescription: string;
  editPrompt: string;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
}

/**
 * Edit an image by regenerating it with modifications
 * This combines the original description with the edit prompt to create a new image
 */
export const editImage = async (
  params: EditImageParams,
): Promise<GeneratedImage> => {
  console.log('Starting image editing with params:', params);

  // Combine original description with edit instructions
  const combinedPrompt = `${params.originalDescription}. ${params.editPrompt}. High quality photorealistic, professional lighting.`;

  console.log('Combined edit prompt:', combinedPrompt);

  // Generate new image based on combined prompt
  return generateImage({
    prompt: combinedPrompt,
    aspectRatio: params.aspectRatio || '16:9',
  });
};
