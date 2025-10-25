/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {NextRequest} from 'next/server';
import {streamText, convertToCoreMessages} from 'ai';
import {google} from '@ai-sdk/google';
import {z} from 'zod';
import {editScript} from '../../../services/scriptEditingAgent';
import {generateReview} from '../../../services/reviewAgent';
import {StoryDraft} from '../../../types/story-creation';

/**
 * POST /api/chat
 * Dual-agent story refinement endpoint using AI SDK v5 native streaming
 * Uses Script Editing Agent + Review Agent to modify stories
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[Chat API] Request received');

    const {messages, storyDraft} = body;

    // Validate story draft exists and has required structure
    if (!storyDraft || !storyDraft.projectMetadata || !storyDraft.scenes) {
      console.log('[Chat API] Validation failed - missing story draft');
      return new Response('Invalid or missing story draft', {status: 400});
    }

    // Validate messages array exists
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.log('[Chat API] Validation failed - missing or empty messages array');
      return new Response('Invalid or missing messages array', {status: 400});
    }

    // Store story draft for tool execution context
    const originalStory: StoryDraft = storyDraft;

    // Define the edit_script tool with execute function
    const tools = {
      edit_script: {
        description: 'Use this tool to modify the current story when the user requests changes. This includes adding/removing scenes, renaming characters, changing dialogue, adjusting tone, or any other story modifications. You MUST use this tool for all story editing requests - do not attempt to edit the story yourself.',
        parameters: z.object({
          action: z.string().describe('The user\'s exact editing request, such as "rename hero to Maria", "add a new scene", or "remove last scene"'),
        }),
        execute: async ({action}: {action: string}) => {
          console.log('[Chat API] Tool execute: edit_script with action:', action);

          // Step 1: Script Editing Agent - Modify the story
          console.log('[Chat API] Calling Script Editing Agent...');
          const refinedStory = await editScript(originalStory, action);

          // Step 2: Review Agent - Generate user response
          console.log('[Chat API] Calling Review Agent...');
          const reviewResult = await generateReview(originalStory, refinedStory, action);

          console.log('[Chat API] Tool execution complete:', {
            scenesAdded: reviewResult.changesSummary.scenesAdded,
            scenesRemoved: reviewResult.changesSummary.scenesRemoved,
            scenesModified: reviewResult.changesSummary.scenesModified,
          });

          // Return tool result with updated story and change summary
          return {
            scenesAdded: reviewResult.changesSummary.scenesAdded,
            scenesRemoved: reviewResult.changesSummary.scenesRemoved,
            scenesModified: reviewResult.changesSummary.scenesModified,
            titleChanged: reviewResult.changesSummary.titleChanged,
            updatedStory: refinedStory,
            reviewResponse: reviewResult.response,
          };
        },
      },
    };

    // Convert UI messages to Core messages format required by streamText
    const coreMessages = convertToCoreMessages(messages);
    console.log('[Chat API] Converted messages:', JSON.stringify(coreMessages, null, 2));

    // Get API key from environment (Next.js makes NEXT_PUBLIC_ vars available on server)
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      console.log('[Chat API] ERROR: API key not configured');
      return new Response('Gemini API key not configured', {status: 500});
    }
    console.log('[Chat API] API key configured, length:', apiKey.length);

    // Use AI SDK's streamText with tools for proper Data Stream Protocol formatting
    console.log('[Chat API] Calling streamText with maxSteps: 3');

    // Build system prompt with story context
    const systemPrompt = `You are a story editing assistant. When the user requests changes to a story, use the edit_script tool to modify it.

CURRENT STORY:
${JSON.stringify(originalStory, null, 2)}

INSTRUCTIONS:
- ALWAYS use the edit_script tool for any story modifications
- Pass the user's request as the 'action' parameter
- The tool will handle modifying the story structure and generating a response`;

    const result = streamText({
      model: google('gemini-2.0-flash-exp', {apiKey}),
      messages: coreMessages,
      tools,
      maxSteps: 5, // Allow up to 5 steps for tool calling and response generation
      system: systemPrompt,
      onStepFinish: async ({stepType, toolCalls}) => {
        console.log('[Chat API] Step finished - type:', stepType, 'tool calls:', toolCalls?.length || 0);
      },
    });
    console.log('[Chat API] streamText called, returning response');

    // Encode story as base64 to avoid header encoding issues with Unicode
    // Note: This includes the ORIGINAL story. The updated story comes from the tool result.
    const storyJson = JSON.stringify(originalStory);
    const storyBase64 = Buffer.from(storyJson, 'utf-8').toString('base64');

    // Convert to Text Stream Response with custom headers
    // This uses AI SDK v5's correct streaming method for tool invocations
    return result.toTextStreamResponse({
      headers: {
        'X-Story-Draft': storyBase64,
        'X-Story-Draft-Encoding': 'base64',
      },
    });
  } catch (error) {
    console.error('[Chat API] Error:', error);
    return new Response(
      error instanceof Error ? error.message : 'Failed to process request',
      {status: 500},
    );
  }
}
