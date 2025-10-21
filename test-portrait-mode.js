/**
 * Test script for Veo 3.1 portrait mode video generation
 */
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!apiKey) {
  console.error('Error: GEMINI_API_KEY or NEXT_PUBLIC_GEMINI_API_KEY environment variable not set');
  process.exit(1);
}

async function testPortraitMode() {
  console.log('Testing Veo 3.1 in portrait mode (9:16)...\n');

  const ai = new GoogleGenAI({ apiKey });

  const generateVideoPayload = {
    model: 'veo-3.1-generate-preview',
    prompt: 'A woman walking on a beach at sunset, slow motion, cinematic',
    config: {
      numberOfVideos: 1,
      aspectRatio: '9:16',  // Portrait mode
      resolution: '720p',
    },
  };

  console.log('Request payload:');
  console.log(JSON.stringify(generateVideoPayload, null, 2));
  console.log('\nSubmitting video generation request...');

  try {
    let operation = await ai.models.generateVideos(generateVideoPayload);
    console.log('Video generation operation started:', operation.name);

    // Poll for completion
    while (!operation.done) {
      await new Promise((resolve) => setTimeout(resolve, 10000));
      console.log('...Generating (portrait 9:16)...');
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
      console.log('\n✓ Video generated successfully!');
      console.log('Video URI:', videoUri);

      // Download the video
      console.log('\nDownloading video...');
      const res = await fetch(`${videoUri}&key=${apiKey}`);

      if (!res.ok) {
        throw new Error(`Failed to fetch video: ${res.status} ${res.statusText}`);
      }

      const videoBlob = await res.arrayBuffer();
      const outputPath = path.join(process.cwd(), 'test-portrait-output.mp4');
      fs.writeFileSync(outputPath, Buffer.from(videoBlob));

      console.log(`✓ Video saved to: ${outputPath}`);
      console.log(`\nVideo details:`);
      console.log(`- Aspect Ratio: 9:16 (Portrait)`);
      console.log(`- Resolution: 720p`);
      console.log(`- Model: veo-3.1-generate-preview`);
      console.log(`- File size: ${(videoBlob.byteLength / 1024 / 1024).toFixed(2)} MB`);

    } else {
      console.error('Operation failed:', operation);
      throw new Error('No videos generated.');
    }
  } catch (error) {
    console.error('Error generating video:', error);
    process.exit(1);
  }
}

testPortraitMode();
