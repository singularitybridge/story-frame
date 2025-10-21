/**
 * Add Sofia character to the balcony view image (crop to portrait and composite)
 */
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!apiKey) {
  console.error('Error: GEMINI_API_KEY or NEXT_PUBLIC_GEMINI_API_KEY not set');
  process.exit(1);
}

const projectId = 'pescara-heritage-2025';

// Sofia's character description
const characterDescription = 'Sofia, a young Mediterranean woman in late 20s, warm brown eyes, shoulder-length wavy dark brown hair, genuine friendly smile, Mediterranean olive skin tone, natural beauty, casual white linen shirt, casual chic style';

const locationImagePath = path.join(process.env.HOME, 'Downloads', '739408399.jpg');
const outputDir = path.join(process.cwd(), 'public', 'generated-refs', projectId);
const outputPath = path.join(outputDir, 'character-ref-portrait-3.png');

async function processBalconyImage() {
  console.log('Processing balcony view image...\\n');

  // Read and get image info
  const imageBuffer = fs.readFileSync(locationImagePath);
  const metadata = await sharp(imageBuffer).metadata();
  console.log(`Original image: ${metadata.width}x${metadata.height}`);

  // Target portrait dimensions (9:16)
  const targetWidth = 768;
  const targetHeight = 1344;

  // Crop to center and resize to portrait
  // Calculate crop area to get 9:16 aspect ratio from center
  const sourceAspect = metadata.width / metadata.height;
  const targetAspect = targetWidth / targetHeight;

  let cropWidth, cropHeight, left, top;

  if (sourceAspect > targetAspect) {
    // Source is wider - crop width
    cropHeight = metadata.height;
    cropWidth = Math.floor(cropHeight * targetAspect);
    left = Math.floor((metadata.width - cropWidth) / 2);
    top = 0;
  } else {
    // Source is taller - crop height
    cropWidth = metadata.width;
    cropHeight = Math.floor(cropWidth / targetAspect);
    left = 0;
    top = Math.floor((metadata.height - cropHeight) / 2);
  }

  console.log(`Cropping to: ${cropWidth}x${cropHeight} from (${left}, ${top})`);

  // Crop and resize to target portrait dimensions
  const croppedBuffer = await sharp(imageBuffer)
    .extract({ left, top, width: cropWidth, height: cropHeight })
    .resize(targetWidth, targetHeight, { fit: 'fill' })
    .jpeg()
    .toBuffer();

  const croppedBase64 = croppedBuffer.toString('base64');

  console.log('Adding Sofia to the balcony scene...\\n');

  const ai = new GoogleGenAI({ apiKey });

  // Use Gemini to add Sofia to the cropped image
  const prompt = `Add ${characterDescription} standing in the doorway looking out at the beautiful balcony view, positioned on the left side in the interior, looking toward camera with warm welcoming smile, natural pose gesturing toward the scenic Mediterranean balcony and view, photorealistic, high quality, natural lighting`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: croppedBase64
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
  console.log(`✓ Saved: character-ref-portrait-3.png`);
  console.log(`Location: ${outputPath}`);
}

processBalconyImage().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
