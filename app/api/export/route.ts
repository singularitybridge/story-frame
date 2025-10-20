/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { existsSync, mkdirSync, writeFileSync, unlinkSync, readFileSync } from 'fs';
import ffmpeg from 'fluent-ffmpeg';

const VIDEOS_DIR = join(process.cwd(), 'public', 'videos');
const TEMP_DIR = join(process.cwd(), 'temp');

// Ensure temp directory exists
if (!existsSync(TEMP_DIR)) {
  mkdirSync(TEMP_DIR, { recursive: true });
}

export async function POST(request: NextRequest) {
  try {
    const { projectId, sceneIds } = await request.json();

    if (!projectId || !sceneIds || !Array.isArray(sceneIds) || sceneIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: projectId and sceneIds are required' },
        { status: 400 }
      );
    }

    // Get video file paths
    const videoPaths: string[] = [];
    for (const sceneId of sceneIds) {
      const videoPath = join(VIDEOS_DIR, projectId, `${sceneId}.mp4`);
      if (existsSync(videoPath)) {
        videoPaths.push(videoPath);
      }
    }

    if (videoPaths.length === 0) {
      return NextResponse.json(
        { error: 'No video files found' },
        { status: 404 }
      );
    }

    // Create a temporary file list for FFmpeg concat demuxer
    const timestamp = Date.now();
    const listFilePath = join(TEMP_DIR, `concat-list-${timestamp}.txt`);
    const outputFilePath = join(TEMP_DIR, `output-${timestamp}.mp4`);

    // Write file list for concat demuxer
    const fileListContent = videoPaths.map(path => `file '${path}'`).join('\n');
    writeFileSync(listFilePath, fileListContent);

    // Use FFmpeg to concatenate videos
    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(listFilePath)
        .inputOptions(['-f concat', '-safe 0'])
        .outputOptions(['-c copy']) // Copy codec for faster processing
        .output(outputFilePath)
        .on('end', () => {
          console.log('Video concatenation completed');
          resolve();
        })
        .on('error', (err: Error) => {
          console.error('FFmpeg error:', err);
          reject(err);
        })
        .run();
    });

    // Read the concatenated video file
    const videoBuffer = readFileSync(outputFilePath);

    // Clean up temporary files
    try {
      unlinkSync(listFilePath);
      unlinkSync(outputFilePath);
    } catch (err) {
      console.error('Failed to clean up temporary files:', err);
    }

    // Return the video file as a response
    return new NextResponse(videoBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="${projectId}-full.mp4"`,
      },
    });
  } catch (error) {
    console.error('Error exporting video:', error);
    return NextResponse.json(
      { error: 'Failed to export video' },
      { status: 500 }
    );
  }
}
