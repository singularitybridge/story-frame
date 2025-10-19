/**
 * Test script for 9:16 portrait mode
 * Tests both with and without image references
 */

import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error('Error: GEMINI_API_KEY not found in environment');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

async function testPortraitWithoutRefs() {
  console.log('\n=== Test 1: Portrait mode WITHOUT image references ===');

  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-generate-preview',
      prompt: 'A woman walking on a beach, casual beach attire, sunny day, ocean in background',
      config: {
        numberOfVideos: 1,
        aspectRatio: '9:16',
        resolution: '720p',
      },
    });

    console.log('Operation started, waiting for completion...');

    // Poll for completion
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      console.log('...Generating...');
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    if (operation?.response?.generatedVideos?.[0]?.video?.uri) {
      const videoUri = operation.response.generatedVideos[0].video.uri;
      console.log('✅ Success! Portrait mode works without refs');
      console.log('Video URI:', videoUri);

      // Fetch and save video
      const url = decodeURIComponent(videoUri);
      const res = await fetch(`${url}&key=${API_KEY}`);
      const videoBlob = await res.blob();
      const buffer = Buffer.from(await videoBlob.arrayBuffer());
      fs.writeFileSync('test-portrait-no-refs.mp4', buffer);
      console.log('Saved to: test-portrait-no-refs.mp4');

      return true;
    } else {
      throw new Error('No video generated');
    }
  } catch (error) {
    console.error('❌ Failed without refs:', error.message);
    if (error.response) {
      console.error('API Response:', JSON.stringify(error.response, null, 2));
    }
    return false;
  }
}

async function testPortraitWithSingleRef() {
  console.log('\n=== Test 2: Portrait mode WITH single image reference ===');

  const imagePath = path.join(__dirname, 'public', 'generated-refs', 'character-ref-1.png');

  if (!fs.existsSync(imagePath)) {
    console.log('⚠️  Character ref image not found at:', imagePath);
    console.log('Skipping this test');
    return null;
  }

  try {
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');

    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-generate-preview',
      prompt: 'A woman walking on a beach, casual beach attire, sunny day, ocean in background',
      config: {
        numberOfVideos: 1,
        aspectRatio: '9:16',
        resolution: '720p',
        referenceImages: [
          {
            image: {
              imageBytes: base64Image,
              mimeType: 'image/png',
            },
            referenceType: 'ASSET',
          },
        ],
      },
    });

    console.log('Operation started, waiting for completion...');

    // Poll for completion
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      console.log('...Generating...');
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    if (operation?.response?.generatedVideos?.[0]?.video?.uri) {
      const videoUri = operation.response.generatedVideos[0].video.uri;
      console.log('✅ Success! Portrait mode works with single ref');
      console.log('Video URI:', videoUri);
      return true;
    } else {
      throw new Error('No video generated');
    }
  } catch (error) {
    console.error('❌ Failed with single ref:', error.message);
    if (error.response) {
      console.error('API Response:', JSON.stringify(error.response, null, 2));
    }
    return false;
  }
}

async function testLandscapeForComparison() {
  console.log('\n=== Test 3: Landscape mode for comparison (should work) ===');

  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-generate-preview',
      prompt: 'A woman walking on a beach, casual beach attire, sunny day, ocean in background',
      config: {
        numberOfVideos: 1,
        aspectRatio: '16:9',
        resolution: '720p',
      },
    });

    console.log('Operation started, waiting for completion...');

    // Poll for completion
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      console.log('...Generating...');
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    if (operation?.response?.generatedVideos?.[0]?.video?.uri) {
      const videoUri = operation.response.generatedVideos[0].video.uri;
      console.log('✅ Success! Landscape mode works');
      console.log('Video URI:', videoUri);
      return true;
    } else {
      throw new Error('No video generated');
    }
  } catch (error) {
    console.error('❌ Failed landscape:', error.message);
    if (error.response) {
      console.error('API Response:', JSON.stringify(error.response, null, 2));
    }
    return false;
  }
}

async function main() {
  console.log('Starting portrait mode tests...');
  console.log('API Key:', API_KEY.substring(0, 10) + '...');

  // Test without refs first
  const test1 = await testPortraitWithoutRefs();

  // Wait a bit between tests
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test with single ref
  const test2 = await testPortraitWithSingleRef();

  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test landscape for comparison
  const test3 = await testLandscapeForComparison();

  console.log('\n=== Summary ===');
  console.log('Portrait without refs:', test1 ? '✅ Pass' : '❌ Fail');
  console.log('Portrait with single ref:', test2 === null ? '⚠️  Skipped' : (test2 ? '✅ Pass' : '❌ Fail'));
  console.log('Landscape mode:', test3 ? '✅ Pass' : '❌ Fail');

  if (!test1 && test3) {
    console.log('\n⚠️  Portrait mode is not supported with current API key/setup');
    console.log('This likely requires Vertex AI authentication instead of API key');
  }
}

main().catch(console.error);
