/**
 * Test portrait mode with references in config (app format) vs top-level
 */
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!apiKey) {
  console.error('Error: GEMINI_API_KEY environment variable not set');
  process.exit(1);
}

async function testConfigFormat() {
  console.log('Testing reference image placement in config vs top-level...\n');

  const ai = new GoogleGenAI({ apiKey });

  const ref1 = fs.readFileSync('./public/generated-refs/beach-freedom-2025/character-ref-1.png');
  const ref2 = fs.readFileSync('./public/generated-refs/beach-freedom-2025/character-ref-2.png');
  const ref3 = fs.readFileSync('./public/generated-refs/beach-freedom-2025/character-ref-3.png');

  // Format 1: References in config.referenceImages (app format with image wrapper)
  console.log('Test 1: References in config.referenceImages with image wrapper (app format)');
  const payload1 = {
    model: 'veo-3.1-generate-preview',
    prompt: 'A woman walking on a beach at sunset, slow motion, cinematic',
    config: {
      numberOfVideos: 1,
      aspectRatio: '9:16',
      resolution: '720p',
      referenceImages: [
        {
          image: {
            imageBytes: ref1.toString('base64'),
            mimeType: 'image/png',
          },
          referenceType: 'ASSET',
        },
        {
          image: {
            imageBytes: ref2.toString('base64'),
            mimeType: 'image/png',
          },
          referenceType: 'ASSET',
        },
        {
          image: {
            imageBytes: ref3.toString('base64'),
            mimeType: 'image/png',
          },
          referenceType: 'ASSET',
        },
      ],
    },
  };

  try {
    let operation = await ai.models.generateVideos(payload1);
    console.log('✓ SUCCESS with config.referenceImages format!');
    console.log('Operation:', operation.name, '\n');
  } catch (error) {
    console.error('✗ FAILED with config.referenceImages format');
    console.error('Error:', error.message, '\n');
  }

  // Format 2: References at top level (my test format)
  console.log('Test 2: References at top level (test script format)');
  const payload2 = {
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

  try {
    let operation = await ai.models.generateVideos(payload2);
    console.log('✓ SUCCESS with top-level referenceImages format!');
    console.log('Operation:', operation.name);
  } catch (error) {
    console.error('✗ FAILED with top-level referenceImages format');
    console.error('Error:', error.message);
  }
}

testConfigFormat();
