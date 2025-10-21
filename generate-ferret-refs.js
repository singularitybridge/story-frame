/**
 * Generate portrait (9:16) character references for ferret-influencer project
 */
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!apiKey) {
  console.error('Error: GEMINI_API_KEY or NEXT_PUBLIC_GEMINI_API_KEY not set');
  process.exit(1);
}

const projectId = 'ferret-influencer-2025';
const characterDescription = 'Bandit - a sable ferret with cream face markings and dark brown body, small rounded ears, bright curious eyes, long flexible body, playful and energetic expression, influencer-worthy photogenic features';

const prompts = [
  `Portrait of ${characterDescription}, front-facing, neutral friendly expression, high quality photorealistic, professional lighting`,
  `Portrait of ${characterDescription}, smiling and looking at camera with curious expression, high quality photorealistic, professional lighting`,
  `Full body shot of ${characterDescription}, standing pose showing full ferret body, high quality photorealistic, professional lighting`,
];

async function generateImage(prompt, aspectRatio = '9:16') {
  console.log(`Generating image for: ${prompt.substring(0, 80)}...`);

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
  console.log('Generating 3 portrait (9:16) reference images for Bandit the ferret...\n');

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

  console.log('Done! All ferret portrait references generated successfully.');
  console.log(`Saved to: ${outputDir}`);
}

main();
