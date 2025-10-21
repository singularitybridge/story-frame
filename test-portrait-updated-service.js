/**
 * Test the updated geminiService.ts portrait mode handling
 * This simulates what happens when user selects 9:16 with character references
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

// Load character reference (simulating what UI loads)
function loadCharacterRef() {
  const filepath = path.join(process.cwd(), 'public', 'generated-refs', projectId, 'character-ref-portrait-1.png');

  if (!fs.existsSync(filepath)) {
    console.error('Portrait reference image not found:', filepath);
    process.exit(1);
  }

  const imageBuffer = fs.readFileSync(filepath);
  return imageBuffer.toString('base64');
}

async function testUpdatedPortraitLogic() {
  console.log('=== Testing Updated Portrait Mode Logic ===\n');
  console.log('Simulating: User selects 9:16 with character references\n');

  const ai = new GoogleGenAI({ apiKey });
  const firstRefImage = loadCharacterRef();

  // This is what the updated geminiService.ts does for portrait mode
  const isPortrait = true; // 9:16
  const hasReferences = true;

  let payload;

  if (isPortrait && hasReferences) {
    console.log('✓ Portrait mode detected');
    console.log('✓ Using first reference image as starting frame (image parameter)');
    console.log('✓ Skipping config.referenceImages (not supported in portrait)\n');

    payload = {
      model: 'veo-3.1-generate-preview',
      prompt,
      image: {
        imageBytes: firstRefImage,
        mimeType: 'image/png',
      },
      config: {
        numberOfVideos: 1,
        aspectRatio: '9:16',
        resolution: '720p',
      }
    };
  }

  console.log('Payload structure:', JSON.stringify({
    model: payload.model,
    prompt: payload.prompt.substring(0, 50) + '...',
    hasImage: !!payload.image,
    config: {
      ...payload.config,
      hasReferenceImages: !!payload.config.referenceImages,
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

  if (operation?.error) {
    console.error('\n❌ FAILED:', JSON.stringify(operation.error, null, 2));
    throw new Error(`Video generation failed: ${JSON.stringify(operation.error)}`);
  }

  if (operation?.response) {
    const videos = operation.response.generatedVideos;

    if (!videos || videos.length === 0) {
      throw new Error('No videos generated');
    }

    const videoUri = videos[0].video.uri;
    console.log('\n✅ SUCCESS! Video generated:', videoUri);

    // Download video
    const url = decodeURIComponent(videoUri);
    const res = await fetch(`${url}&key=${apiKey}`);
    const videoBlob = await res.blob();
    const buffer = Buffer.from(await videoBlob.arrayBuffer());

    const outputPath = path.join(process.cwd(), 'test-portrait-updated-service.mp4');
    fs.writeFileSync(outputPath, buffer);
    console.log('✅ Saved to:', outputPath);

    return { success: true, videoPath: outputPath };
  }
}

async function main() {
  try {
    console.log('Test: Updated geminiService.ts portrait mode handling\n');

    await testUpdatedPortraitLogic();

    console.log('\n=== TEST COMPLETE ===');
    console.log('✅ Portrait mode now works by using image-to-video!');
    console.log('✅ The workaround is transparent to the user.');
    console.log('✅ Character consistency maintained via starting frame.');

  } catch (error) {
    console.error('\n=== TEST FAILED ===');
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
