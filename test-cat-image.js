/**
 * Test image generation for cat character
 */

import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error('Error: GEMINI_API_KEY not found in environment');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

async function testCatImage() {
  const prompt = 'Portrait of Mr. Whiskers - an orange tabby cat with attitude, front-facing, neutral friendly expression, high quality photorealistic, professional lighting';

  console.log('Testing cat image generation...');
  console.log('Prompt:', prompt);
  console.log('\nSending request...\n');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [prompt],
      config: {
        responseModalities: ['IMAGE'],
        imageConfig: {
          aspectRatio: '16:9',
        },
      },
    });

    console.log('Response received!');
    console.log('Response structure:', JSON.stringify(response, null, 2));

    // Extract the image from the response
    const imagePart = response.parts?.find((part) => part.inlineData);

    if (!imagePart?.inlineData) {
      console.error('❌ No image data found in response');
      console.log('Available parts:', response.parts);
      return false;
    }

    const imageBytes = imagePart.inlineData.data;
    const mimeType = imagePart.inlineData.mimeType;

    console.log('✅ Image found!');
    console.log('MIME type:', mimeType);
    console.log('Data length:', imageBytes.length);

    // Debug path information
    console.log('\n=== Path debugging ===');
    console.log('Current working directory:', process.cwd());
    console.log('__dirname:', __dirname);
    console.log('__filename:', __filename);

    // Save the image
    const buffer = Buffer.from(imageBytes, 'base64');
    console.log('Buffer size:', buffer.length, 'bytes');

    const outputPath = path.join(__dirname, 'test-cat-image.png');
    console.log('Output path:', outputPath);
    console.log('Writing file...');

    fs.writeFileSync(outputPath, buffer);

    console.log('fs.writeFileSync completed');

    // Verify file exists
    if (fs.existsSync(outputPath)) {
      const stats = fs.statSync(outputPath);
      console.log(`✅ File verified! Size: ${stats.size} bytes`);
    } else {
      console.log('❌ File does not exist after write!');
    }

    console.log(`Saved to: ${outputPath}`);
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('API Response:', JSON.stringify(error.response, null, 2));
    }
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    return false;
  }
}

testCatImage();
