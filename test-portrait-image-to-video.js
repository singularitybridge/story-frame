/**
 * Test 9:16 portrait image-to-video (no character references)
 * Tests if portrait mode works with image parameter
 */
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!apiKey) {
  console.error('Error: GEMINI_API_KEY or NEXT_PUBLIC_GEMINI_API_KEY not set');
  process.exit(1);
}

const projectId = 'beach-freedom-2025';
const prompt = 'Young woman on beach smiling and turning head slowly, ocean background, bright daylight, gentle movement';

// Load a portrait reference image to use as starting frame
function loadStartingImage() {
  const filepath = path.join(process.cwd(), 'public', 'generated-refs', projectId, 'character-ref-portrait-1.png');

  if (!fs.existsSync(filepath)) {
    console.error('Portrait reference image not found:', filepath);
    console.log('Available files in directory:');
    const dir = path.join(process.cwd(), 'public', 'generated-refs', projectId);
    if (fs.existsSync(dir)) {
      fs.readdirSync(dir).forEach(file => console.log(' -', file));
    }
    process.exit(1);
  }

  const imageBuffer = fs.readFileSync(filepath);
  return imageBuffer.toString('base64');
}

async function testPortraitImageToVideo() {
  console.log('=== Testing 9:16 Portrait Image-to-Video (NO references) ===\n');

  const ai = new GoogleGenAI({ apiKey });
  const startingImage = loadStartingImage();

  const payload = {
    model: 'veo-3.1-generate-preview',
    prompt,
    image: {
      imageBytes: startingImage,
      mimeType: 'image/png',
    },
    config: {
      numberOfVideos: 1,
      aspectRatio: '9:16',
      resolution: '720p',
    }
  };

  console.log('Payload structure:', JSON.stringify({
    model: payload.model,
    prompt: payload.prompt,
    hasImage: !!payload.image,
    config: payload.config,
  }, null, 2));

  console.log('\nStarting video generation...');
  let operation = await ai.models.generateVideos(payload);
  console.log('Operation started:', operation.name);

  while (!operation.done) {
    await new Promise((resolve) => setTimeout(resolve, 10000));
    console.log('...Generating...');
    operation = await ai.operations.getVideosOperation({ operation });
  }

  console.log('\nOperation completed.');
  console.log('Operation status:', operation.done ? 'DONE' : 'IN PROGRESS');
  console.log('Has response:', !!operation.response);
  console.log('Has error:', !!operation.error);

  if (operation?.error) {
    console.error('\n❌ Operation failed with error:');
    console.error(JSON.stringify(operation.error, null, 2));
    throw new Error(`Video generation failed: ${JSON.stringify(operation.error)}`);
  }

  if (operation?.response) {
    const videos = operation.response.generatedVideos;

    if (!videos || videos.length === 0) {
      console.error('No videos in response. Response structure:', operation.response);
      throw new Error('No videos generated');
    }

    const videoUri = videos[0].video.uri;
    console.log('\n✅ SUCCESS! Video generated:', videoUri);

    // Download video
    const url = decodeURIComponent(videoUri);
    const res = await fetch(`${url}&key=${apiKey}`);
    const videoBlob = await res.blob();
    const buffer = Buffer.from(await videoBlob.arrayBuffer());

    const outputPath = path.join(process.cwd(), 'test-portrait-image-to-video.mp4');
    fs.writeFileSync(outputPath, buffer);
    console.log('✅ Saved to:', outputPath);

    return { success: true, videoPath: outputPath };
  } else {
    throw new Error('Video generation failed - no response');
  }
}

async function main() {
  try {
    console.log('Test: Can we generate 9:16 portrait videos using image-to-video mode?\n');

    await testPortraitImageToVideo();

    console.log('\n=== TEST COMPLETE ===');
    console.log('✅ Portrait image-to-video works!');
    console.log('This means portrait mode is supported, but may not work with pure character references.');

  } catch (error) {
    console.error('\n=== TEST FAILED ===');
    console.error('Error:', error.message);
    if (error.message.includes('not supported')) {
      console.error('\nThis suggests portrait mode itself may not be available for your account/region.');
    }
    process.exit(1);
  }
}

main();
