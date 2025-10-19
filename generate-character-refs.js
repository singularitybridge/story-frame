/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load API key from .env.local
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const apiKeyMatch = envContent.match(/GEMINI_API_KEY=(.+)/);
const API_KEY = apiKeyMatch ? apiKeyMatch[1].trim() : null;

if (!API_KEY) {
  console.error('API key not found in .env.local');
  process.exit(1);
}

async function generateImage(prompt, aspectRatio = '16:9') {
  console.log(`Generating image for: ${prompt}`);

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: [prompt],
    config: {
      responseModalities: ['IMAGE'],
      imageConfig: {
        aspectRatio,
      },
    },
  });

  // The response structure has candidates array
  const candidate = response.candidates?.[0];
  if (!candidate) {
    console.error('No candidates in response');
    throw new Error('No image was generated in the response');
  }

  const imagePart = candidate.content?.parts?.find((part) => part.inlineData);

  if (!imagePart?.inlineData) {
    console.error('Candidate content:', JSON.stringify(candidate.content, null, 2));
    throw new Error('No image data found in response');
  }

  return {
    imageBytes: imagePart.inlineData.data,
    mimeType: imagePart.inlineData.mimeType || 'image/png',
  };
}

async function generateCharacterReferences(characterDescription, numberOfImages = 2) {
  const prompts = [
    `Portrait of ${characterDescription}, front-facing, neutral friendly expression, high quality photorealistic, professional lighting`,
    `Portrait of ${characterDescription}, smiling and gesturing expressively, high quality photorealistic, professional lighting`,
    `Full body shot of ${characterDescription}, casual pose, high quality photorealistic, professional lighting`,
  ].slice(0, numberOfImages);

  const images = [];
  const outputDir = path.join(__dirname, 'public', 'generated-refs');

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (let i = 0; i < prompts.length; i++) {
    try {
      const image = await generateImage(prompts[i]);

      // Convert base64 to buffer and save
      const buffer = Buffer.from(image.imageBytes, 'base64');
      const filename = `character-ref-${i + 1}.png`;
      const filepath = path.join(outputDir, filename);

      fs.writeFileSync(filepath, buffer);
      console.log(`✓ Saved: ${filename}`);

      images.push({
        filename,
        filepath,
        prompt: prompts[i],
      });
    } catch (error) {
      console.error(`Failed to generate image ${i + 1}:`, error.message);
      throw error;
    }
  }

  return images;
}

// Character description from the script context
const characterDescription = 'a young creative woman in her late 20s with long dark hair, wearing casual beach attire, warm friendly expression';

console.log('Starting character reference generation...');
console.log(`Character: ${characterDescription}\n`);

generateCharacterReferences(characterDescription, 3)
  .then((images) => {
    console.log('\n✓ All images generated successfully!');
    console.log('\nGenerated files:');
    images.forEach((img) => {
      console.log(`  - ${img.filename}`);
      console.log(`    Path: ${img.filepath}`);
    });
    console.log('\nImages saved to: public/generated-refs/');
  })
  .catch((error) => {
    console.error('\n✗ Generation failed:', error);
    process.exit(1);
  });
