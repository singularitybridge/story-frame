/**
 * Test portrait video with portrait reference image
 */

import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error('Error: GEMINI_API_KEY not found');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

async function testPortraitWithPortraitRef() {
  console.log('\n=== Testing Portrait Video (9:16) with Portrait Reference Image (1024x1792) ===');

  // Use one of the resized portrait images from Downloads
  const imagePath = path.join(
    process.env.HOME,
    'Downloads',
    'avi.osi_a_portrait_of_a_women_in_her_30s_with_a_seabeach_back_c2a879b7-6005-47c4-8217-20fe5a8857d6_3.png'
  );

  if (!fs.existsSync(imagePath)) {
    console.error('Portrait reference image not found at:', imagePath);
    return false;
  }

  // Check dimensions
  console.log('Using portrait reference image:', imagePath);

  try {
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');

    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-generate-preview',
      prompt: 'A woman walking confidently on a beach, casual beach attire, sunny day, ocean in background, warm lighting',
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
      console.log('✅ SUCCESS! Portrait video with portrait reference image WORKS!');
      console.log('Video URI:', videoUri);

      // Fetch and save video
      const url = decodeURIComponent(videoUri);
      const res = await fetch(`${url}&key=${API_KEY}`);
      const videoBlob = await res.blob();
      const buffer = Buffer.from(await videoBlob.arrayBuffer());
      fs.writeFileSync('test-portrait-with-portrait-ref.mp4', buffer);
      console.log('Saved to: test-portrait-with-portrait-ref.mp4');

      return true;
    } else {
      throw new Error('No video generated');
    }
  } catch (error) {
    console.error('❌ FAILED:', error.message);
    if (error.response) {
      console.error('API Response:', JSON.stringify(error.response, null, 2));
    }
    return false;
  }
}

async function main() {
  console.log('Testing if portrait reference images work with portrait video...');
  const result = await testPortraitWithPortraitRef();

  if (result) {
    console.log('\n🎉 CONCLUSION: Portrait video mode WORKS when reference images are also portrait (9:16)!');
  } else {
    console.log('\n❌ CONCLUSION: Portrait video mode does NOT work even with portrait reference images.');
  }
}

main().catch(console.error);
