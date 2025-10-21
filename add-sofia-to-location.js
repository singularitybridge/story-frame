/**
 * Add Sofia character to the terrace location image
 */
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!apiKey) {
  console.error('Error: GEMINI_API_KEY or NEXT_PUBLIC_GEMINI_API_KEY not set');
  process.exit(1);
}

const projectId = 'pescara-heritage-2025';

// Sofia's character description
const characterDescription = 'Sofia, a young Mediterranean woman in late 20s, warm brown eyes, shoulder-length wavy dark brown hair, genuine friendly smile, Mediterranean olive skin tone, natural beauty, casual white linen shirt, casual chic style';

const locationImagePath = path.join(process.env.HOME, 'Downloads', '739683426.jpg');
const outputDir = path.join(process.cwd(), 'public', 'generated-refs', projectId);
const outputPath = path.join(outputDir, 'character-ref-portrait-4.png');

async function addCharacterToLocation() {
  console.log('Adding Sofia to the terrace location...\n');

  // Read the location image
  const locationImageBuffer = fs.readFileSync(locationImagePath);
  const locationImageBase64 = locationImageBuffer.toString('base64');

  const ai = new GoogleGenAI({ apiKey });

  // Use Gemini to edit the image by adding Sofia to it
  const prompt = `Add ${characterDescription} standing on this Mediterranean terrace, looking at camera with warm welcoming smile, natural pose gesturing toward the beautiful architecture, photorealistic, high quality, natural lighting, she should be positioned on the left or right side of the terrace walkway`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: locationImageBase64
            }
          }
        ]
      }
    ],
    config: {
      responseModalities: ['IMAGE']
    },
  });

  // Parse response
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

  const imageBase64 = imagePart.inlineData.data;

  // Create directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Save the result
  fs.writeFileSync(outputPath, Buffer.from(imageBase64, 'base64'));
  console.log(`✓ Saved: character-ref-portrait-4.png`);
  console.log(`Location: ${outputPath}`);
}

addCharacterToLocation().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
