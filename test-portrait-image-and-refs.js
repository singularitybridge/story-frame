/**
 * Test 9:16 portrait image-to-video WITH character references
 * Tests if combining image parameter + character references works in portrait mode
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

// Load starting image (first frame)
function loadStartingImage() {
  const filepath = path.join(process.cwd(), 'public', 'generated-refs', projectId, 'character-ref-portrait-1.png');

  if (!fs.existsSync(filepath)) {
    console.error('Portrait reference image not found:', filepath);
    process.exit(1);
  }

  const imageBuffer = fs.readFileSync(filepath);
  return imageBuffer.toString('base64');
}

// Load character reference images
function loadReferenceImages() {
  const refs = [];
  for (let i = 1; i <= 3; i++) {
    const filepath = path.join(process.cwd(), 'public', 'generated-refs', projectId, `character-ref-portrait-${i}.png`);

    if (fs.existsSync(filepath)) {
      const imageBuffer = fs.readFileSync(filepath);
      refs.push({
        image: {
          imageBytes: imageBuffer.toString('base64'),
          mimeType: 'image/png',
        },
        referenceType: VideoGenerationReferenceType.ASSET,
      });
      console.log(`Loaded reference image ${i}`);
    }
  }
  return refs;
}

async function testPortraitImageWithRefs() {
  console.log('=== Testing 9:16 Portrait Image-to-Video WITH Character References ===\n');

  const ai = new GoogleGenAI({ apiKey });
  const startingImage = loadStartingImage();
  const referenceImages = loadReferenceImages();

  console.log(`Loaded ${referenceImages.length} character reference images`);

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
      referenceImages: referenceImages,
    }
  };

  console.log('\nPayload structure:', JSON.stringify({
    model: payload.model,
    prompt: payload.prompt,
    hasImage: !!payload.image,
    config: {
      ...payload.config,
      hasReferenceImages: !!payload.config.referenceImages,
      numReferenceImages: payload.config.referenceImages.length,
    },
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

    if (operation.error.message.includes('not supported')) {
      console.error('\n📝 Analysis: The combination of image-to-video + character references in portrait mode is not supported.');
      console.error('This means for portrait (9:16) videos, you can EITHER:');
      console.error('  1. Use image-to-video (image parameter) WITHOUT character references, OR');
      console.error('  2. Use character references in landscape mode (16:9)');
      console.error('\nPortrait mode with character consistency may require using the same starting image across scenes.');
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

    const outputPath = path.join(process.cwd(), 'test-portrait-image-and-refs.mp4');
    fs.writeFileSync(outputPath, buffer);
    console.log('✅ Saved to:', outputPath);

    return { success: true, videoPath: outputPath };
  } else {
    throw new Error('Video generation failed - no response');
  }
}

async function main() {
  try {
    console.log('Test: Can we combine image-to-video + character references in portrait mode?\n');

    await testPortraitImageWithRefs();

    console.log('\n=== TEST COMPLETE ===');
    console.log('✅ Portrait image-to-video WITH character references works!');
    console.log('This is the solution for portrait character-consistent videos.');

  } catch (error) {
    console.error('\n=== TEST FAILED ===');
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
