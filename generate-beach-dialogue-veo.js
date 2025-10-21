#!/usr/bin/env node
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!apiKey) {
  console.error('Error: GEMINI_API_KEY or NEXT_PUBLIC_GEMINI_API_KEY not set');
  process.exit(1);
}

const projectId = 'beach-freedom-2025';
const prompt = `Young woman standing on beach looking surprised and intrigued, reading invisible phone/email, eyebrows raised, curious expression, ocean background, bright daylight. A woman says, "Then I get this email from Sam: 'Hey Sarah, I'm here to free you from the daily grind. How do you want to connect?'" (no subtitles). Medium close-up`;

// Load character references
function loadCharacterRefs() {
  const refs = [];
  for (let i = 1; i <= 3; i++) {
    const filepath = path.join(process.cwd(), 'public', 'generated-refs', projectId, `character-ref-${i}.png`);
    if (fs.existsSync(filepath)) {
      const imageBuffer = fs.readFileSync(filepath);
      refs.push({
        imageBytes: imageBuffer.toString('base64'),
        mimeType: 'image/png',
      });
    }
  }
  return refs;
}

async function generateVeoVideo(aspectRatio, label) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🎬 Generating ${label}`);
  console.log('='.repeat(60));
  console.log(`\n📝 Prompt: ${prompt}`);
  console.log(`📐 Aspect Ratio: ${aspectRatio}\n`);

  const ai = new GoogleGenAI({ apiKey });
  const refs = loadCharacterRefs();

  console.log(`✓ Loaded ${refs.length} character references`);

  let payload;
  const isPortrait = aspectRatio === '9:16';

  if (isPortrait) {
    console.log('✓ Portrait mode detected - using image-to-video approach');
    console.log('✓ Using first reference as starting frame\n');

    payload = {
      model: 'veo-3.1-generate-preview',
      prompt,
      image: refs[0], // Use first ref as starting frame
      config: {
        numberOfVideos: 1,
        aspectRatio: '9:16',
        resolution: '720p',
      }
    };
  } else {
    console.log('✓ Landscape mode - using character references');
    console.log('✓ Including all 3 references\n');

    payload = {
      model: 'veo-3.1-generate-preview',
      prompt,
      config: {
        numberOfVideos: 1,
        aspectRatio: '16:9',
        resolution: '720p',
        referenceImages: refs,
      }
    };
  }

  try {
    console.log('Starting video generation...');
    let operation = await ai.models.generateVideos(payload);
    console.log('Operation started:', operation.name);

    while (!operation.done) {
      await new Promise((resolve) => setTimeout(resolve, 10000));
      console.log('...Generating...');
      operation = await ai.operations.getVideosOperation({ operation });
    }

    console.log('\n✅ Operation completed.');

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

      const filename = `veo-beach-dialogue-${isPortrait ? 'portrait' : 'landscape'}.mp4`;
      const outputPath = path.join(process.cwd(), 'public', filename);
      fs.writeFileSync(outputPath, buffer);

      console.log(`💾 Saved to: public/${filename}`);
      console.log(`📁 File size: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);

      return {
        success: true,
        filename,
        videoPath: outputPath,
        size: buffer.length
      };
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║   Veo 3.1 Beach Dialogue Test with Audio                 ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  const results = {
    landscape: null,
    portrait: null,
  };

  // Generate landscape version
  console.log('\n🖥️  LANDSCAPE MODE (16:9)');
  results.landscape = await generateVeoVideo('16:9', 'Landscape Mode');

  // Wait before next request
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Generate portrait version
  console.log('\n\n📱 PORTRAIT MODE (9:16)');
  results.portrait = await generateVeoVideo('9:16', 'Portrait Mode');

  // Summary
  console.log('\n\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║   Test Summary                                            ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  if (results.landscape?.success) {
    console.log('✅ Landscape (16:9):');
    console.log(`   File: ${results.landscape.filename}`);
    console.log(`   Size: ${(results.landscape.size / 1024 / 1024).toFixed(2)} MB`);
  } else {
    console.log('❌ Landscape generation failed');
  }

  if (results.portrait?.success) {
    console.log('\n✅ Portrait (9:16):');
    console.log(`   File: ${results.portrait.filename}`);
    console.log(`   Size: ${(results.portrait.size / 1024 / 1024).toFixed(2)} MB`);
  } else {
    console.log('\n❌ Portrait generation failed');
  }

  console.log('\n💡 Next Steps:');
  console.log('   1. Videos saved to public/ directory');
  console.log('   2. Copy Sora videos to public/');
  console.log('   3. Update test-results.html\n');
}

main();
