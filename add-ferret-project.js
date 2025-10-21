/**
 * Add the ferret influencer project to projects.db.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dbPath = path.join(__dirname, 'data', 'projects.db.json');
const ferretStoryPath = '/tmp/ferret-story.json';

// Read existing database
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// Read ferret story
const ferretStory = JSON.parse(fs.readFileSync(ferretStoryPath, 'utf8'));

// Add ferret story to projects
db.projects[ferretStory.id] = ferretStory;

// Write back to database
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');

console.log(`✅ Added "${ferretStory.title}" to projects database`);
console.log(`   ID: ${ferretStory.id}`);
console.log(`   Scenes: ${ferretStory.scenes.length}`);
console.log(`\nStory concept:`);
console.log(`  Scene 1: ${ferretStory.scenes[0].title}`);
console.log(`  Scene 2: ${ferretStory.scenes[1].title}`);
console.log(`  Scene 3: ${ferretStory.scenes[2].title}`);
console.log(`  Scene 4: ${ferretStory.scenes[3].title}`);
console.log(`\nTotal duration: ${ferretStory.scenes.reduce((sum, s) => sum + s.duration, 0)} seconds`);
