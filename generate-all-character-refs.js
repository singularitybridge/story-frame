/**
 * Generate character references for all projects
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

/**
 * Generate a single character reference image
 */
async function generateCharacterImage(characterDescription, prompt, projectId, index) {
  console.log(`\nGenerating image ${index} for ${projectId}...`);
  console.log(`Prompt: ${prompt}`);

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

    // Extract the image from the response
    const imagePart = response.candidates?.[0]?.content?.parts?.find((part) => part.inlineData);

    if (!imagePart?.inlineData) {
      throw new Error('No image was generated in the response');
    }

    const imageBytes = imagePart.inlineData.data;

    // Convert base64 to buffer
    const buffer = Buffer.from(imageBytes, 'base64');

    // Create directory if it doesn't exist
    const outputDir = path.join(__dirname, 'public', 'generated-refs', projectId);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save the image
    const outputPath = path.join(outputDir, `character-ref-${index}.png`);
    fs.writeFileSync(outputPath, buffer);

    console.log(`✅ Saved: ${outputPath}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to generate image ${index}:`, error.message);
    if (error.response) {
      console.error('API Response:', JSON.stringify(error.response, null, 2));
    }
    return false;
  }
}

/**
 * Generate character references for a project
 */
async function generateProjectCharacterRefs(project) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Project: ${project.title} (${project.id})`);
  console.log(`Character: ${project.character}`);
  console.log(`${'='.repeat(60)}`);

  // Check if character refs already exist
  const outputDir = path.join(__dirname, 'public', 'generated-refs', project.id);
  const existingRefs = [];
  for (let i = 1; i <= 3; i++) {
    const refPath = path.join(outputDir, `character-ref-${i}.png`);
    if (fs.existsSync(refPath)) {
      existingRefs.push(i);
    }
  }

  if (existingRefs.length === 3) {
    console.log('✅ All 3 character references already exist. Skipping.');
    return true;
  }

  if (existingRefs.length > 0) {
    console.log(`⚠️  Found ${existingRefs.length} existing references: ${existingRefs.join(', ')}`);
    console.log('Generating missing references...');
  }

  const prompts = [
    `Portrait of ${project.character}, front-facing, neutral friendly expression, high quality photorealistic, professional lighting`,
    `Portrait of ${project.character}, smiling and gesturing expressively, high quality photorealistic, professional lighting`,
    `Full body shot of ${project.character}, casual pose, high quality photorealistic, professional lighting`,
  ];

  const results = [];

  for (let i = 0; i < prompts.length; i++) {
    const success = await generateCharacterImage(
      project.character,
      prompts[i],
      project.id,
      i + 1
    );
    results.push(success);

    // Wait between generations to avoid rate limits
    if (i < prompts.length - 1) {
      console.log('Waiting 2 seconds before next generation...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  const successCount = results.filter(r => r).length;
  console.log(`\n✅ Generated ${successCount}/${prompts.length} images for ${project.id}`);

  return successCount === prompts.length;
}

/**
 * Main function
 */
async function main() {
  console.log('Starting character reference generation for all projects...');
  console.log('API Key:', API_KEY.substring(0, 10) + '...');

  // Load projects index
  const projectsIndexPath = path.join(__dirname, 'data', 'projects.json');
  const projectsIndex = JSON.parse(fs.readFileSync(projectsIndexPath, 'utf-8'));

  const results = [];

  // Process each project
  for (const projectRef of projectsIndex.projects) {
    const projectPath = path.join(__dirname, 'data', projectRef.file);
    const project = JSON.parse(fs.readFileSync(projectPath, 'utf-8'));

    if (!project.character) {
      console.log(`⚠️  Skipping ${project.id} - no character description`);
      continue;
    }

    const success = await generateProjectCharacterRefs(project);
    results.push({ projectId: project.id, success });

    // Wait between projects
    if (projectsIndex.projects.indexOf(projectRef) < projectsIndex.projects.length - 1) {
      console.log('\nWaiting 5 seconds before next project...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('SUMMARY');
  console.log(`${'='.repeat(60)}`);
  results.forEach(({ projectId, success }) => {
    console.log(`${projectId}: ${success ? '✅ Success' : '❌ Failed'}`);
  });
}

main().catch(console.error);
