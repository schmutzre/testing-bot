// index.ts
import Bot from "./lib/bot.js";
import getPostText from "./lib/getPostText.js";
import fetchEmbedUrlCard from "./lib/fetchEmbedUrlCard.js"; // Assuming this function is in a separate file
import fs from 'fs';
import { execSync } from 'child_process';

interface Paper {
  title: string;
  link: string;
}

const POSTED_PAPERS_PATH = './postedPapers.json';
const postedPapers = JSON.parse(fs.readFileSync(POSTED_PAPERS_PATH, 'utf8'));

async function main() {
  const papersData = await getPostText();

  if (papersData && papersData.length > 0) {
    for (const textData of papersData) {
      if (!postedPapers.papers.some((paper: Paper) => paper.title === textData.title && paper.link === textData.link)) {
        // Fetch and prepare website card data
        const embedCard = await fetchEmbedUrlCard(textData.link);

        // Combine text and embed card for posting
        const combinedPost = `${textData.formattedText}\n${embedCard}`;
        await Bot.run(() => Promise.resolve(combinedPost));

        postedPapers.papers.push({ title: textData.title, link: textData.link });
        fs.writeFileSync(POSTED_PAPERS_PATH, JSON.stringify(postedPapers, null, 2));

        console.log(`[${new Date().toISOString()}] Posted: "${combinedPost}"`);
      } else {
        console.log(`[${new Date().toISOString()}] Already posted: "${textData.title}"`);
      }
    }
    execSync('git add ' + POSTED_PAPERS_PATH);
    execSync('git commit -m "Added new posted papers"');
    execSync('git push origin main');
  } else {
    console.log(`[${new Date().toISOString()}] No new posts to publish.`);
  }
}

main();
