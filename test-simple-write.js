/**
 * Simple test to verify fs.writeFileSync works
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Current working directory:', process.cwd());
console.log('__dirname:', __dirname);
console.log('__filename:', __filename);

// Create some test data
const testData = Buffer.from('This is a test file');
const outputPath = path.join(__dirname, 'test-output.txt');

console.log('Writing to:', outputPath);
fs.writeFileSync(outputPath, testData);

console.log('Write completed');

// Verify it exists
if (fs.existsSync(outputPath)) {
  const stats = fs.statSync(outputPath);
  console.log('✅ File exists! Size:', stats.size, 'bytes');

  // Read it back
  const content = fs.readFileSync(outputPath, 'utf-8');
  console.log('Content:', content);

  // Clean up
  fs.unlinkSync(outputPath);
  console.log('Test file cleaned up');
} else {
  console.log('❌ File does not exist!');
}
