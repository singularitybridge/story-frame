/**
 * Test portrait vs landscape character reference application
 * Generates videos in both aspect ratios and evaluates first/last frames
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
const prompt = 'Young woman standing on beach looking surprised and intrigued, reading invisible phone, eyebrows raised, curious expression, ocean background, bright daylight';

// Load reference images
function loadReferenceImage(filename) {
  const filepath = path.join(process.cwd(), 'public', 'generated-refs', projectId, filename);
  const imageBuffer = fs.readFileSync(filepath);
  return imageBuffer.toString('base64');
}

async function generateVideo(aspectRatio, referenceFiles) {
  console.log(`\n=== Generating ${aspectRatio} video ===`);

  const ai = new GoogleGenAI({ apiKey });

  const payload = {
    model: 'veo-3.1-generate-preview',
    prompt,
    config: {
      numberOfVideos: 1,
      aspectRatio,
      resolution: '720p',
    }
  };

  const isPortrait = aspectRatio === '9:16';
  const referenceImages = [];

  for (const filename of referenceFiles) {
    const imageBytes = loadReferenceImage(filename);
    referenceImages.push({
      image: {
        imageBytes,
        mimeType: 'image/png',
      },
      referenceType: VideoGenerationReferenceType.ASSET,
    });
  }

  // BOTH portrait and landscape use config.referenceImages
  payload.config.referenceImages = referenceImages;
  console.log(`Using ${aspectRatio} format: config.referenceImages`);

  console.log(`Added ${referenceImages.length} reference images`);
  console.log('Payload structure:', JSON.stringify({
    model: payload.model,
    prompt: payload.prompt.substring(0, 50) + '...',
    config: payload.config,
    hasTopLevelRefs: !!payload.referenceImages,
    hasConfigRefs: !!payload.config.referenceImages,
  }, null, 2));

  console.log('Starting video generation...');
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
    console.error('Operation failed with error:', JSON.stringify(operation.error, null, 2));
    throw new Error(`Video generation failed: ${JSON.stringify(operation.error)}`);
  }

  if (operation?.response) {
    const videos = operation.response.generatedVideos;

    if (!videos || videos.length === 0) {
      console.error('No videos in response. Response structure:', operation.response);
      throw new Error('No videos generated');
    }

    const videoUri = videos[0].video.uri;
    console.log('✓ Video generated:', videoUri);

    // Download video
    const url = decodeURIComponent(videoUri);
    const res = await fetch(`${url}&key=${apiKey}`);
    const videoBlob = await res.blob();
    const buffer = Buffer.from(await videoBlob.arrayBuffer());

    const outputPath = path.join(process.cwd(), `test-${aspectRatio.replace(':', 'x')}.mp4`);
    fs.writeFileSync(outputPath, buffer);
    console.log('✓ Saved to:', outputPath);

    return { videoPath: outputPath, videoBlob: buffer };
  } else {
    throw new Error('Video generation failed');
  }
}

async function extractFrame(videoBuffer, frameType) {
  // Use Gemini vision to analyze the frame
  console.log(`\nExtracting ${frameType} frame for analysis...`);

  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-exp',
    contents: [
      {
        parts: [
          { text: `Analyze this ${frameType} frame from a video. Describe the person's appearance in detail, focusing on: hair color/style, facial features, clothing, accessories. Be specific about what you see.` },
          {
            inlineData: {
              data: videoBuffer.toString('base64'),
              mimeType: 'video/mp4',
            },
          },
        ],
      },
    ],
  });

  const text = response.candidates[0].content.parts[0].text;
  return text;
}

async function compareVideos(landscapeBuffer, portraitBuffer) {
  console.log('\n=== EVALUATION ===');

  // Analyze landscape first frame
  console.log('\n16:9 Landscape - First Frame:');
  const landscapeFirst = await extractFrame(landscapeBuffer, 'first');
  console.log(landscapeFirst);

  // Analyze portrait first frame
  console.log('\n9:16 Portrait - First Frame:');
  const portraitFirst = await extractFrame(portraitBuffer, 'first');
  console.log(portraitFirst);

  // Compare
  console.log('\n=== COMPARISON ===');
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-exp',
    contents: [
      {
        parts: [
          { text: `Compare these two video frame descriptions. Do they show the same person with consistent appearance (same hair, facial features, clothing)?

Landscape description:
${landscapeFirst}

Portrait description:
${portraitFirst}

Answer: Are these the same character? List similarities and differences.` },
        ],
      },
    ],
  });

  const comparison = response.candidates[0].content.parts[0].text;
  console.log(comparison);
}

async function main() {
  try {
    // Use landscape refs for 16:9, portrait refs for 9:16
    console.log('Starting test: Portrait vs Landscape character reference application\n');

    console.log('Reference images:');
    console.log('- Landscape: character-ref-landscape-1.png, character-ref-landscape-2.png, character-ref-landscape-3.png');
    console.log('- Portrait: character-ref-portrait-1.png, character-ref-portrait-2.png, character-ref-portrait-3.png');

    const landscapeRefs = ['character-ref-landscape-1.png', 'character-ref-landscape-2.png', 'character-ref-landscape-3.png'];
    const portraitRefs = ['character-ref-portrait-1.png', 'character-ref-portrait-2.png', 'character-ref-portrait-3.png'];

    // Generate landscape
    const landscapeResult = await generateVideo('16:9', landscapeRefs);

    // Generate portrait
    const portraitResult = await generateVideo('9:16', portraitRefs);

    // Compare results
    await compareVideos(landscapeResult.videoBlob, portraitResult.videoBlob);

    console.log('\n=== TEST COMPLETE ===');
    console.log('Videos saved:');
    console.log('- test-16x9.mp4');
    console.log('- test-9x16.mp4');

  } catch (error) {
    console.error('Test failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();
