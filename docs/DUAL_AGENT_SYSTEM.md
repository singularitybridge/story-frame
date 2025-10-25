# Dual-Agent Story Editing System

## Overview

The dual-agent system uses two specialized AI agents working sequentially to provide intelligent story modifications with user-friendly feedback. This implementation demonstrates proper tool calling patterns and streaming responses for AI-powered interfaces.

## Architecture

```
User Request
    ↓
Chat API (/api/chat)
    ↓
Script Editing Agent (Gemini 2.0 Flash Thinking Exp)
    → Modifies story structure
    → Returns refined story
    ↓
Review Agent (Gemini 2.0 Flash Exp)
    → Analyzes changes
    → Generates user-friendly response
    ↓
Streaming Response (Tool Call + Text)
    → X-Story-Draft header (base64-encoded)
    → Tool invocation (type 9)
    → Assistant message (type 0)
```

## Agent Specifications

### Script Editing Agent
- **Model**: `gemini-2.0-flash-thinking-exp-01-21`
- **Temperature**: 0.2 (precise edits)
- **Max Tokens**: 3000
- **Purpose**: Execute story modifications based on user feedback
- **Capabilities**:
  - Add/remove/modify scenes
  - Rename characters globally
  - Reorder scenes
  - Adjust tone and content
  - Maintain story structure integrity

### Review Agent
- **Model**: `gemini-2.0-flash-exp`
- **Temperature**: 0.7 (natural language)
- **Max Tokens**: 200
- **Purpose**: Generate conversational feedback about changes
- **Capabilities**:
  - Analyze changes (scenes added/removed/modified)
  - Detect title and character name changes
  - Generate friendly, specific responses

## API Endpoint

**Route**: `POST /api/chat`

**Request Body**:
```json
{
  "messages": [
    {
      "role": "user",
      "parts": [
        {
          "type": "text",
          "text": "remove last scene"
        }
      ]
    }
  ],
  "storyDraft": {
    "projectMetadata": { ... },
    "scenes": [ ... ]
  }
}
```

**Response Format**:
- **Headers**:
  - `Content-Type: text/plain; charset=utf-8`
  - `X-Story-Draft: <base64-encoded story JSON>`
  - `X-Story-Draft-Encoding: base64`

- **Body** (streaming):
  ```
  9:{"toolCallId":"call_123","toolName":"edit_script","state":"result","result":{...}}
  0:"I've removed the last scene as you requested..."
  ```

## Testing Results

### Curl Testing ✅
Both test scenarios passed successfully:

**Test 1: Remove Scene**
```bash
curl -X POST http://localhost:3039/api/chat \
  -H "Content-Type: application/json" \
  -d @test-chat-remove-scene.json
```
- Result: Scene removed successfully
- Tool invocation: `{"scenesRemoved":1,"scenesModified":0}`
- Response time: ~5s
- PM2 logs confirmed both agents executed

**Test 2: Add Scene**
```bash
curl -X POST http://localhost:3039/api/chat \
  -H "Content-Type: application/json" \
  -d @test-chat-add-scene.json
```
- Result: New scene added with proper structure
- Tool invocation: `{"scenesAdded":1,"scenesModified":0}`
- Response: "I've added a new Scene 3 where Eliza discovers a mysterious note..."
- Processing time: 4478ms

### Browser Testing ✅
End-to-end test using `/public/test-chat-ui.html`:

**Test Scenario 1**: "remove last scene" from 4-scene horror story
- Result: 4 scenes → 3 scenes ✅
- Tool invocation displayed correctly
- PM2 execution time: 5209ms

**Test Scenario 2**: "make it shorter" from 4-scene horror story
- Result: 4 scenes → 3 scenes ✅
- Tool invocation: "Script Edit: make it shorter • Removed 1 scene(s)"
- Assistant response: "I removed one scene, specifically Scene 4, to tighten up the narrative"
- Story preview updated dynamically (title, description, scenes list)
- PM2 execution time: 5069ms

**Screenshot Evidence**: `/public/docs/dual-agent-test-success.png`

## Error Handling

### Streaming Response Parsing Bug (Fixed)
**Issue**: Test HTML was using `line.split(':', 2)` which broke when JSON data contained colons
```javascript
// ❌ BROKEN: splits on ALL colons
const [type, data] = line.split(':', 2);

// ✅ FIXED: splits only on FIRST colon
const colonIndex = line.indexOf(':');
const type = line.substring(0, colonIndex);
const data = line.substring(colonIndex + 1);
```

**Symptoms**:
- Error: "Expected ':' after property name in JSON at position 13"
- Chat messages not displaying
- Story preview not updating

**Resolution**: Changed from `split()` to `indexOf()` + `substring()` to preserve colons in JSON payloads

### Malformed JSON from AI Responses (FIXED ✅)
**Issue**: Gemini occasionally returned JSON with unescaped quotes and malformed syntax in voiceover fields:
```json
"voiceover":"'Eleanor says, \"dialogue\""
```

**Initial Approach (Deprecated)**: Two-tier parsing with regex-based quote fixing - unreliable for complex dialogue

**Final Solution**: Implemented Gemini's structured JSON response feature with JSON Schema validation
1. Created comprehensive `storyDraftSchema` with all required fields and types
2. Added `responseSchema` parameter to `GenerateTextParams` interface
3. Configured `responseMimeType: 'application/json'` when schema provided
4. Gemini now enforces valid JSON structure during generation

**Implementation**:
```typescript
// geminiService.ts - Enable structured JSON output
if (params.responseSchema) {
  generationConfig.responseMimeType = 'application/json';
  generationConfig.responseSchema = params.responseSchema;
  console.log('Using structured JSON output with response schema');
}

// scriptEditingAgent.ts - Define schema and use it
const storyDraftSchema = {
  type: 'OBJECT' as const,
  properties: {
    projectMetadata: { /* full schema */ },
    scenes: {
      type: 'ARRAY' as const,
      items: { /* scene schema with all required fields */ }
    }
  },
  required: ['projectMetadata', 'scenes']
};

const response = await generateText({
  prompt,
  temperature: 0.2,
  maxTokens: 3000,
  model: 'gemini-2.0-flash-thinking-exp-01-21',
  responseSchema: storyDraftSchema, // Enforce structure
});

// Now safe to parse directly
const refinedStory = JSON.parse(response) as StoryDraft;
```

**Testing Results**:
- ✅ Tested with complex dialogue including quotes: `"I can't believe this is happening!"`
- ✅ No malformed JSON errors
- ✅ Execution time: ~6 seconds (unchanged)
- ✅ Schema validation prevents structural errors at generation time

### Input Story Validation
**Issue**: Story data passed to API may have malformed structure

**Solution**: Added try-catch in `editScript` for JSON.stringify:
```typescript
let storyJson: string;
try {
  storyJson = JSON.stringify(existingStory, null, 2);
} catch (error) {
  throw new Error('Invalid story format - unable to serialize story data');
}
```

## File Structure

```
/services/
  scriptEditingAgent.ts     # Script modification agent
  reviewAgent.ts            # Change analysis + response generation
  geminiService.ts          # Gemini API integration

/app/api/
  chat/route.ts             # Main API endpoint

/public/
  test-chat-ui.html         # Standalone test interface

/test-*.json                # Test data files
```

## Key Implementation Details

### Streaming Response Format
The API uses Vercel AI SDK v5 streaming format:
- Type `9:` prefix for tool invocations
- Type `0:` prefix for text messages
- Each line is a separate chunk

### Base64 Story Encoding
Story data is base64-encoded in the `X-Story-Draft` header to avoid Unicode encoding issues:
```typescript
const storyBase64 = Buffer.from(JSON.stringify(refinedStory), 'utf-8').toString('base64');
```

Client decodes with:
```javascript
const storyJson = atob(storyBase64);
const updatedStory = JSON.parse(storyJson);
```

### Message Format Flexibility
The API handles multiple message content formats:
```typescript
if (typeof userMessage.content === 'string') {
  userFeedback = userMessage.content;
} else if (userMessage.parts && Array.isArray(userMessage.parts)) {
  const textPart = userMessage.parts.find((p: any) => p.type === 'text');
  userFeedback = textPart?.text || '';
}
```

## Performance Metrics

- **Script Editing Agent**: 3-5 seconds average
- **Review Agent**: < 1 second
- **Total API response**: 4-6 seconds
- **Story size**: Handles stories with 1-10+ scenes efficiently

## Future Enhancements

1. **Prompt Optimization**: Refine agent prompts for better JSON generation
2. **Caching**: Cache similar edit patterns to reduce API calls
3. **Batch Operations**: Support multiple edits in one request
4. **Undo/Redo**: Track story history for rollback capability
5. **Validation Layer**: Pre-validate AI responses before parsing
6. **UI Integration**: Replace test HTML with full React UI using Vercel AI SDK hooks

## Testing Checklist

- [x] Curl test: Add scene
- [x] Curl test: Remove scene
- [x] Browser test: End-to-end with UI
- [x] Browser test: Multiple modifications
- [x] Error handling: Malformed JSON from AI
- [x] Error handling: Invalid input story
- [x] PM2 logs: Confirm both agents execute
- [x] Response streaming: Tool calls + text
- [x] Story persistence: Base64 header encoding
- [x] Message format: Multiple content types

## References

- **Vercel AI SDK v5**: https://sdk.vercel.ai/docs
- **Gemini API**: https://ai.google.dev/
- **Tool Calling Pattern**: https://sdk.vercel.ai/docs/concepts/tools
- **Next.js API Routes**: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
