import Bot from "./lib/bot.js";
import getPostText from "./lib/getPostText.js";
import { fetchEmbedUrlCard } from "./lib/fetchEmbedUrlCard.js";
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
    for (const paper of papersData) {
      const { title, link } = paper;

      if (!postedPapers.papers.some(p => p.title === title && p.link === link)) {
        const embedCard = await fetchEmbedUrlCard(bot.getAccessToken(), link);

        const postContent = {
          "$type": "app.bsky.feed.post",
          "text": title,
          "createdAt": new Date().toISOString(),
          "embed": embedCard
        };

        await bot.post(postContent);

        postedPapers.papers.push({ title, link });
        fs.writeFileSync(POSTED_PAPERS_PATH, JSON.stringify(postedPapers, null, 2));

        console.log(`[${new Date().toISOString()}] Posted: "${title}"`);
      } else {
        console.log(`[${new Date().toISOString()}] Already posted: "${title}"`);
      }
    }
  } else {
    console.log(`[${new Date().toISOString()}] No new posts to publish.`);
  }
}

main();
