import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

const prompt = 'Portrait of a young woman with long dark hair, front-facing, professional lighting';

try {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: [prompt],
    config: {
      responseModalities: ['IMAGE'],
      imageConfig: {
        aspectRatio: '9:16',
      },
    },
  });

  console.log('Full response:', JSON.stringify(response, null, 2));
  console.log('\nParts:', response.parts);
} catch (error) {
  console.error('Error:', error.message);
  console.error('Full error:', error);
}
