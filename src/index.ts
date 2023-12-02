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
  const bot = new Bot();

  await bot.login();

  if (papersData && papersData.length > 0) {
    for (const textData of papersData) {
      if (!postedPapers.papers.some(p => p.title === textData.title && p.link === textData.link)) {
        const embedCard = await fetchEmbedUrlCard(bot.getAccessToken(), textData.link);

        const postContent = {
          text: textData.formattedText,
          embed: embedCard,
        };

        await Bot.run(() => Promise.resolve(postContent));

        postedPapers.papers.push({ title: textData.title, link: textData.link });
        fs.writeFileSync(POSTED_PAPERS_PATH, JSON.stringify(postedPapers, null, 2));

        console.log(`[${new Date().toISOString()}] Posted: "${textData.formattedText}"`);
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
