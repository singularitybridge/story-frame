/**
 * Test portrait mode with TWO reference images
 */
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!apiKey) {
  console.error('Error: GEMINI_API_KEY environment variable not set');
  process.exit(1);
}

async function testPortraitWithTwoRefs() {
  console.log('Testing Veo 3.1 portrait mode with TWO reference images...\n');

  const ai = new GoogleGenAI({ apiKey });

  // Read two character references
  const ref1 = fs.readFileSync('./public/generated-refs/beach-freedom-2025/character-ref-1.png');
  const ref2 = fs.readFileSync('./public/generated-refs/beach-freedom-2025/character-ref-2.png');

  console.log('Reference images: 2 (both landscape 1344x768)\n');

  const generateVideoPayload = {
    model: 'veo-3.1-generate-preview',
    prompt: 'A woman walking on a beach at sunset, slow motion, cinematic',
    config: {
      numberOfVideos: 1,
      aspectRatio: '9:16',
      resolution: '720p',
    },
    referenceImages: [
      { imageBytes: ref1.toString('base64'), referenceType: 'ASSET' },
      { imageBytes: ref2.toString('base64'), referenceType: 'ASSET' },
    ],
  };

  console.log('Submitting request with 2 references...\n');

  try {
    let operation = await ai.models.generateVideos(generateVideoPayload);
    console.log('✓ SUCCESS! Two references accepted in portrait mode');
    console.log('Operation:', operation.name);
  } catch (error) {
    console.error('\n✗ FAILED:', error.message);
    console.log('\nConclusion: Portrait mode limit is ONE reference image');
    process.exit(1);
  }
}

testPortraitWithTwoRefs();
