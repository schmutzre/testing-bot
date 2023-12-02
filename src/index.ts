import Bot from "./lib/bot.js";
import getPostText from "./lib/getPostText.js";
import fetchEmbedUrlCard from './fetchEmbedUrlCard.js';
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
  const bot = new Bot(); // Instantiate Bot class

  // Log in to the Bluesky API
  await bot.login();

  if (papersData && papersData.length > 0) {
    for (const textData of papersData) {
      const { title, link, formattedText } = textData;

      if (!postedPapers.papers.some((p: Paper) => p.title === title && p.link === link)) {
        const embedCard = await fetchEmbedUrlCard(bot.getAccessToken(), link);

        const postContent = {
          text: formattedText,
          embed: embedCard,
        };

        await bot.post(postContent);

        postedPapers.papers.push({ title, link });
        fs.writeFileSync(POSTED_PAPERS_PATH, JSON.stringify(postedPapers, null, 2));

        console.log(`[${new Date().toISOString()}] Posted: "${formattedText}"`);
      } else {
        console.log(`[${new Date().toISOString()}] Already posted: "${title}"`);
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
