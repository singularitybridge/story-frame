#!/bin/bash

# Test Veo 3.1 portrait mode with curl
# Set your API key: export GEMINI_API_KEY="your_api_key_here"

API_KEY="${GEMINI_API_KEY:-${NEXT_PUBLIC_GEMINI_API_KEY}}"

if [ -z "$API_KEY" ]; then
  echo "Error: GEMINI_API_KEY or NEXT_PUBLIC_GEMINI_API_KEY environment variable not set"
  exit 1
fi

echo "Testing Veo 3.1 in portrait mode (9:16)..."
echo ""

# Step 1: Generate video
echo "Step 1: Submitting video generation request..."
OPERATION=$(curl -s -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/veo-3.1-generate-preview:generateVideos?key=${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A woman walking on a beach at sunset, slow motion, cinematic",
    "config": {
      "numberOfVideos": 1,
      "aspectRatio": "9:16",
      "resolution": "720p"
    }
  }')

echo "$OPERATION" | jq .

OPERATION_NAME=$(echo "$OPERATION" | jq -r '.name')

if [ -z "$OPERATION_NAME" ] || [ "$OPERATION_NAME" = "null" ]; then
  echo "Error: Failed to start video generation"
  echo "$OPERATION"
  exit 1
fi

echo ""
echo "Operation started: $OPERATION_NAME"
echo ""

# Step 2: Poll for completion
echo "Step 2: Polling for completion..."
DONE="false"
POLL_COUNT=0

while [ "$DONE" != "true" ]; do
  sleep 10
  POLL_COUNT=$((POLL_COUNT + 1))

  STATUS=$(curl -s -X GET \
    "https://generativelanguage.googleapis.com/v1beta/${OPERATION_NAME}?key=${API_KEY}")

  DONE=$(echo "$STATUS" | jq -r '.done // false')

  echo "...Poll #${POLL_COUNT} - Done: $DONE"

  if [ "$POLL_COUNT" -gt 120 ]; then
    echo "Timeout after 20 minutes"
    exit 1
  fi
done

echo ""
echo "✓ Video generation complete!"
echo ""

# Step 3: Extract video URI
VIDEO_URI=$(echo "$STATUS" | jq -r '.response.generatedVideos[0].video.uri')

if [ -z "$VIDEO_URI" ] || [ "$VIDEO_URI" = "null" ]; then
  echo "Error: No video URI found"
  echo "$STATUS" | jq .
  exit 1
fi

echo "Video URI: $VIDEO_URI"
echo ""

# Step 4: Download video
echo "Step 3: Downloading video..."
curl -o "test-portrait-curl-output.mp4" "${VIDEO_URI}&key=${API_KEY}"

echo ""
echo "✓ Video saved to: test-portrait-curl-output.mp4"
echo ""
echo "Video details:"
echo "- Aspect Ratio: 9:16 (Portrait)"
echo "- Resolution: 720p"
echo "- Model: veo-3.1-generate-preview"

# Get file size
FILE_SIZE=$(ls -lh test-portrait-curl-output.mp4 | awk '{print $5}')
echo "- File size: ${FILE_SIZE}"
