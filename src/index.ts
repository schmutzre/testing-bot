// node-fetch configuration
import fetch, { Headers, Request, Response } from 'node-fetch';

// Import the Bot class and configuration details
import Bot from "./lib/bot.js";
import getPostText from "./lib/getPostText.js";
import fs from 'fs';
import { execSync } from 'child_process';

interface Paper {
  title: string;
  link: string;
}

const POSTED_PAPERS_PATH = './postedPapers.json';
const postedPapers = JSON.parse(fs.readFileSync(POSTED_PAPERS_PATH, 'utf8'));

if (typeof globalThis.fetch === 'undefined') {
  globalThis.fetch = fetch as any;
  globalThis.Headers = Headers as any;
  globalThis.Request = Request as any;
  globalThis.Response = Response as any;
}

async function main() {
  try {
    const papersData = await getPostText();
    const bot = new Bot(); // Instantiate Bot class

    // Log in to the Bluesky API
    await bot.login();

    if (papersData && papersData.length > 0) {
      for (const textData of papersData) {
        // Use the bot to upload the image and get the blob reference
        const imageBlobRef = await bot.uploadImage('./image.png');

        const websiteCardEmbed = {
          "$type": "app.bsky.embed.external",
          "external": {
            "uri": textData.link,
            "title": textData.title,
            "description": "Your description here",
            "thumb": imageBlobRef
          }
        };

        const postContent = {
          "$type": "app.bsky.feed.post",
          "text": textData.formattedText,
          "createdAt": new Date().toISOString(),
          "embed": websiteCardEmbed
        };

        if (!postedPapers.papers.some((paper: Paper) => paper.title === textData.title && paper.link === textData.link)) {
          await bot.post(postContent);
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
  } catch (error) {
    console.error(`[${new Date().toISOString()}] An error occurred:`, error);
    process.exit(1);
  }
}

main();
