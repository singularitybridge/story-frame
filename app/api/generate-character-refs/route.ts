/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {NextRequest, NextResponse} from 'next/server';
import {writeFile, mkdir} from 'fs/promises';
import {existsSync} from 'fs';
import path from 'path';

/**
 * POST /api/generate-character-refs
 * Generate 3 character reference images for a new project
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {projectId, characterDescription, aspectRatio} = body;

    if (!projectId || !characterDescription || !aspectRatio) {
      return NextResponse.json(
        {error: 'Missing required fields: projectId, characterDescription, aspectRatio'},
        {status: 400},
      );
    }

    console.log(`Generating character refs for project: ${projectId}`);
    console.log(`Character: ${characterDescription}`);
    console.log(`Aspect ratio: ${aspectRatio}`);

    // Determine image dimensions based on aspect ratio
    const isPortrait = aspectRatio === '9:16';
    const imageWidth = isPortrait ? 1024 : 1792;
    const imageHeight = isPortrait ? 1792 : 1024;

    // Create project directory if it doesn't exist
    const projectDir = path.join(process.cwd(), 'public', 'generated-refs', projectId);
    if (!existsSync(projectDir)) {
      await mkdir(projectDir, {recursive: true});
    }

    // Generate 3 character reference images with different variations
    const variations = [
      'front view, neutral expression',
      '3/4 view, slight smile',
      'side profile view, confident expression',
    ];

    const imagePromises = variations.map(async (variation, index) => {
      const imageIndex = index + 1;
      const prompt = buildCharacterReferencePrompt(
        characterDescription,
        variation,
        aspectRatio,
      );

      console.log(`Generating reference ${imageIndex}...`);

      // Generate image using fal.ai Flux model
      const response = await fetch('https://fal.run/fal-ai/flux/dev', {
        method: 'POST',
        headers: {
          Authorization: `Key ${process.env.FAL_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          image_size: {width: imageWidth, height: imageHeight},
          num_inference_steps: 28,
          guidance_scale: 3.5,
          num_images: 1,
          enable_safety_checker: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate image ${imageIndex}: ${response.statusText}`);
      }

      const result = await response.json();
      const imageUrl = result.images[0].url;

      // Download the generated image
      const imageResponse = await fetch(imageUrl);
      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

      // Save to file with proper naming convention
      const filename = isPortrait
        ? `character-ref-portrait-${imageIndex}.png`
        : `character-ref-${imageIndex}.png`;
      const filepath = path.join(projectDir, filename);

      await writeFile(filepath, imageBuffer);
      console.log(`Saved reference ${imageIndex}: ${filename}`);

      return filename;
    });

    await Promise.all(imagePromises);

    console.log(`Successfully generated ${variations.length} character references`);

    return NextResponse.json({
      success: true,
      projectId,
      count: variations.length,
      aspectRatio,
    });
  } catch (error) {
    console.error('Error generating character references:', error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to generate character references',
      },
      {status: 500},
    );
  }
}

/**
 * Build a character reference prompt optimized for consistency
 */
function buildCharacterReferencePrompt(
  characterDescription: string,
  variation: string,
  aspectRatio: string,
): string {
  const orientation = aspectRatio === '9:16' ? 'portrait' : 'landscape';

  return `A high-quality character reference sheet of ${characterDescription}, ${variation}.
${orientation} orientation, professional character design,
consistent character appearance, clean white background, centered composition,
studio lighting, highly detailed, animation-ready reference,
flat design with solid colors only (no gradients),
large expressive eyes, appealing character design,
Pixar animation style, professional quality illustration.`;
}
