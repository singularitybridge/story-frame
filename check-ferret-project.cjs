const fs = require('fs');

const db = JSON.parse(fs.readFileSync('data/projects.db.json', 'utf8'));
const ferret = db.projects['ferret-influencer-2025'];

if (ferret) {
  console.log('Ferret Project Scenes:');
  ferret.scenes.forEach((s, idx) => {
    console.log(`\n${idx + 1}. ${s.title} (${s.id})`);
    console.log(`   Generated: ${s.generated}`);
    console.log(`   Has Evaluation: ${!!s.evaluation}`);
    console.log(`   Has lastFrameDataUrl: ${!!s.lastFrameDataUrl}`);
    if (s.lastFrameDataUrl) {
      console.log(`   lastFrameDataUrl length: ${s.lastFrameDataUrl.length}`);
    }
  });
} else {
  console.log('Ferret project not found!');
}
