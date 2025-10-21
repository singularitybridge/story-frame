/**
 * Test 9:16 portrait with SINGLE character reference
 * Tests if using just 1 reference image works in portrait mode
 */
import { GoogleGenAI, VideoGenerationReferenceType } from '@google/genai';
import fs from 'fs';
import path from 'path';

const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!apiKey) {
  console.error('Error: GEMINI_API_KEY or NEXT_PUBLIC_GEMINI_API_KEY not set');
  process.exit(1);
}

const projectId = 'beach-freedom-2025';
const prompt = 'Young woman on beach smiling and turning head slowly, ocean background, bright daylight, gentle movement';

// Load SINGLE reference image
function loadSingleReference() {
  const filepath = path.join(process.cwd(), 'public', 'generated-refs', projectId, 'character-ref-portrait-1.png');

  if (!fs.existsSync(filepath)) {
    console.error('Portrait reference image not found:', filepath);
    process.exit(1);
  }

  const imageBuffer = fs.readFileSync(filepath);
  return {
    image: {
      imageBytes: imageBuffer.toString('base64'),
      mimeType: 'image/png',
    },
    referenceType: VideoGenerationReferenceType.ASSET,
  };
}

async function testPortraitSingleRef() {
  console.log('=== Testing 9:16 Portrait with SINGLE Character Reference ===\n');

  const ai = new GoogleGenAI({ apiKey });
  const singleRef = loadSingleReference();

  const payload = {
    model: 'veo-3.1-generate-preview',
    prompt,
    config: {
      numberOfVideos: 1,
      aspectRatio: '9:16',
      resolution: '720p',
      referenceImages: [singleRef], // Only 1 reference image
    }
  };

  console.log('Payload structure:', JSON.stringify({
    model: payload.model,
    prompt: payload.prompt,
    config: {
      ...payload.config,
      numReferenceImages: payload.config.referenceImages.length,
    },
  }, null, 2));

  console.log('\nStarting video generation with 1 reference image...');
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

    if (operation.error.message.includes('not supported')) {
      console.error('\n📝 Analysis: Even a SINGLE reference image is not supported in portrait mode.');
      console.error('The limitation applies to config.referenceImages regardless of count.');
    }

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

    const outputPath = path.join(process.cwd(), 'test-portrait-single-ref.mp4');
    fs.writeFileSync(outputPath, buffer);
    console.log('✅ Saved to:', outputPath);

    return { success: true, videoPath: outputPath };
  } else {
    throw new Error('Video generation failed - no response');
  }
}

async function main() {
  try {
    console.log('Test: Does portrait mode work with just 1 character reference?\n');

    await testPortraitSingleRef();

    console.log('\n=== TEST COMPLETE ===');
    console.log('✅ Portrait mode with single reference works!');
    console.log('You can use 1 reference image in portrait mode.');

  } catch (error) {
    console.error('\n=== TEST FAILED ===');
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
