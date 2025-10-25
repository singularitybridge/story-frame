/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {NextRequest} from 'next/server';
import {refineStory} from '../../../../services/storyGenerationService';
import {StoryDraft} from '../../../../types/story-creation';

/**
 * POST /api/story/refine-chat
 * Chat endpoint for story refinement using Vercel AI SDK
 */
export async function POST(request: NextRequest) {
  try {
    const {messages, storyDraft} = await request.json();

    // Get the latest user message
    const userMessage = messages[messages.length - 1];
    if (!userMessage || userMessage.role !== 'user') {
      return new Response('Invalid message format', {status: 400});
    }

    const refinementFeedback = userMessage.content;
    const existingStory: StoryDraft = storyDraft;

    console.log('Refining story with feedback:', refinementFeedback);

    // Refine the story
    const result = await refineStory(existingStory, refinementFeedback);

    // Return streaming response in Vercel AI SDK format
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        // Send the AI response with changes summary
        const response = result.changesSummary || 'Story updated successfully.';
        controller.enqueue(encoder.encode(`0:${JSON.stringify(response)}\n`));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Story-Draft': JSON.stringify(result.story),
      },
    });
  } catch (error) {
    console.error('Error refining story:', error);
    return new Response(
      error instanceof Error ? error.message : 'Failed to refine story',
      {status: 500},
    );
  }
}
