/**
 * Generate portrait (9:16) character references for beach-freedom project
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
const characterDescription = 'a young creative woman in her late 20s with long dark hair, wearing casual beach attire, warm friendly expression';

const prompts = [
  `Portrait of ${characterDescription}, front-facing, neutral friendly expression, high quality photorealistic, professional lighting`,
  `Portrait of ${characterDescription}, smiling and gesturing expressively, high quality photorealistic, professional lighting`,
  `Full body shot of ${characterDescription}, casual pose, high quality photorealistic, professional lighting`,
];

async function generateImage(prompt, aspectRatio = '9:16') {
  console.log(`Generating image for: ${prompt}`);

  const ai = new GoogleGenAI({ apiKey });

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

  // Parse response structure: candidates[0].content.parts
  const candidates = response.candidates;
  if (!candidates || candidates.length === 0) {
    throw new Error('No candidates in response');
  }

  const parts = candidates[0].content?.parts;
  if (!parts || parts.length === 0) {
    throw new Error('No parts in candidate response');
  }

  const imagePart = parts.find((part) => part.inlineData);

  if (!imagePart?.inlineData) {
    throw new Error('No image was generated in the response');
  }

  return imagePart.inlineData.data;
}

async function main() {
  console.log('Generating 3 portrait (9:16) reference images...\n');

  const outputDir = path.join(process.cwd(), 'public', 'generated-refs', projectId);
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (let i = 0; i < prompts.length; i++) {
    try {
      const imageBase64 = await generateImage(prompts[i], '9:16');
      const filename = `character-ref-portrait-${i + 1}.png`;
      const filepath = path.join(outputDir, filename);
      
      fs.writeFileSync(filepath, Buffer.from(imageBase64, 'base64'));
      console.log(`✓ Saved: ${filename}\n`);
    } catch (error) {
      console.error(`✗ Failed to generate image ${i + 1}:`, error.message);
      process.exit(1);
    }
  }

  console.log('Done! All portrait references generated successfully.');
}

main();
