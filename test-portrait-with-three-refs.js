/**
 * Test portrait mode with THREE reference images (what the app uses)
 */
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!apiKey) {
  console.error('Error: GEMINI_API_KEY environment variable not set');
  process.exit(1);
}

async function testPortraitWithThreeRefs() {
  console.log('Testing Veo 3.1 portrait mode with THREE reference images...\n');

  const ai = new GoogleGenAI({ apiKey });

  const ref1 = fs.readFileSync('./public/generated-refs/beach-freedom-2025/character-ref-1.png');
  const ref2 = fs.readFileSync('./public/generated-refs/beach-freedom-2025/character-ref-2.png');
  const ref3 = fs.readFileSync('./public/generated-refs/beach-freedom-2025/character-ref-3.png');

  console.log('Reference images: 3 (all landscape 1344x768)\n');

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
      { imageBytes: ref3.toString('base64'), referenceType: 'ASSET' },
    ],
  };

  console.log('Submitting request with 3 references...\n');

  try {
    let operation = await ai.models.generateVideos(generateVideoPayload);
    console.log('✓ SUCCESS! Three references work in portrait mode!');
    console.log('Operation:', operation.name);
  } catch (error) {
    console.error('\n✗ FAILED:', error.message);
    console.log('\nThis is the error the app was hitting!');
    process.exit(1);
  }
}

testPortraitWithThreeRefs();
