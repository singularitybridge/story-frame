/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;
    const filename = formData.get('filename') as string;

    if (!file || !projectId || !filename) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create directory if it doesn't exist
    const refsDir = path.join(process.cwd(), 'public', 'generated-refs', projectId);
    await mkdir(refsDir, { recursive: true });

    // Convert file to buffer and write
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = path.join(refsDir, filename);

    await writeFile(filePath, buffer);

    return NextResponse.json({
      success: true,
      path: `/generated-refs/${projectId}/${filename}`,
    });
  } catch (error) {
    console.error('Error saving reference:', error);
    return NextResponse.json(
      { error: 'Failed to save reference' },
      { status: 500 }
    );
  }
}
