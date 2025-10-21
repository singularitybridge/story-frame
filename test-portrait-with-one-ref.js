/**
 * Test portrait mode with just ONE reference image (landscape)
 */
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!apiKey) {
  console.error('Error: GEMINI_API_KEY or NEXT_PUBLIC_GEMINI_API_KEY environment variable not set');
  process.exit(1);
}

async function testPortraitWithOneRef() {
  console.log('Testing Veo 3.1 portrait mode with ONE landscape reference image...\n');

  const ai = new GoogleGenAI({ apiKey });

  // Read the first character reference
  const refPath = './public/generated-refs/beach-freedom-2025/character-ref-1.png';
  const refBuffer = fs.readFileSync(refPath);
  const refBase64 = refBuffer.toString('base64');

  console.log(`Reference image: ${refPath}`);
  console.log(`Reference size: ${refBuffer.length} bytes`);
  console.log('Reference dimensions: 1344x768 (landscape)\n');

  const generateVideoPayload = {
    model: 'veo-3.1-generate-preview',
    prompt: 'A woman walking on a beach at sunset, slow motion, cinematic',
    config: {
      numberOfVideos: 1,
      aspectRatio: '9:16',  // Portrait mode
      resolution: '720p',
    },
    referenceImages: [
      {
        imageBytes: refBase64,
        referenceType: 'ASSET',
      },
    ],
  };

  console.log('Request configuration:');
  console.log('- Model: veo-3.1-generate-preview');
  console.log('- Aspect Ratio: 9:16 (portrait)');
  console.log('- Resolution: 720p');
  console.log('- Reference Images: 1 (landscape 1344x768)');
  console.log('\nSubmitting video generation request...\n');

  try {
    let operation = await ai.models.generateVideos(generateVideoPayload);
    console.log('✓ Operation started:', operation.name);

    // Poll for completion
    while (!operation.done) {
      await new Promise((resolve) => setTimeout(resolve, 10000));
      console.log('...Generating...');
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    if (operation?.response) {
      const videos = operation.response.generatedVideos;

      if (!videos || videos.length === 0) {
        throw new Error('No videos were generated.');
      }

      const firstVideo = videos[0];
      if (!firstVideo?.video?.uri) {
        throw new Error('Generated video is missing a URI.');
      }

      const videoUri = decodeURIComponent(firstVideo.video.uri);
      console.log('\n✓ SUCCESS! Video generated with ONE reference image in portrait mode!');
      console.log('Video URI:', videoUri);

      // Download the video
      console.log('\nDownloading video...');
      const res = await fetch(`${videoUri}&key=${apiKey}`);

      if (!res.ok) {
        throw new Error(`Failed to fetch video: ${res.status} ${res.statusText}`);
      }

      const videoBlob = await res.arrayBuffer();
      const outputPath = path.join(process.cwd(), 'test-portrait-one-ref-output.mp4');
      fs.writeFileSync(outputPath, Buffer.from(videoBlob));

      console.log(`✓ Video saved to: ${outputPath}`);
      console.log(`\nVideo details:`);
      console.log(`- Aspect Ratio: 9:16 (Portrait)`);
      console.log(`- Resolution: 720p`);
      console.log(`- Model: veo-3.1-generate-preview`);
      console.log(`- Reference Images: 1 (landscape)`);
      console.log(`- File size: ${(videoBlob.byteLength / 1024 / 1024).toFixed(2)} MB`);

    } else {
      console.error('Operation failed:', operation);
      throw new Error('No videos generated.');
    }
  } catch (error) {
    console.error('\n✗ FAILED:', error.message);
    if (error.message.includes('not supported')) {
      console.log('\nConclusion: Portrait mode does NOT support reference images (even just one)');
    }
    process.exit(1);
  }
}

testPortraitWithOneRef();
