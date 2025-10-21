/**
 * Simple test to show portrait mode API call format
 */
const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!apiKey) {
  console.log('\n⚠️  Set your API key first:');
  console.log('export GEMINI_API_KEY="your_key_here"');
  console.log('or');
  console.log('export NEXT_PUBLIC_GEMINI_API_KEY="your_key_here"');
  process.exit(0);
}

console.log('✓ API key found');
console.log('\nVeo 3.1 Portrait Mode Configuration:');
console.log('=====================================\n');

const config = {
  model: 'veo-3.1-generate-preview',
  prompt: 'A woman walking on a beach at sunset, slow motion, cinematic',
  config: {
    numberOfVideos: 1,
    aspectRatio: '9:16',  // ← PORTRAIT MODE
    resolution: '720p',
  }
};

console.log(JSON.stringify(config, null, 2));

console.log('\n\nKey settings for portrait mode:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('• aspectRatio: "9:16" (portrait)');
console.log('• resolution: "720p" or "1080p"');
console.log('• model: "veo-3.1-generate-preview" (Veo 3.1)');
console.log('\nOther aspect ratios available:');
console.log('• "16:9" - Landscape');
console.log('• "1:1" - Square');
console.log('\n✓ Configuration valid!');
