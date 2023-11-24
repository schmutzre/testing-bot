// node-fetch configuration
import fetch, { Headers, Request, Response } from 'node-fetch';
import { BskyAgent } from '@atproto/api';

if (typeof globalThis.fetch === 'undefined') {
  globalThis.fetch = fetch as any;
  globalThis.Headers = Headers as any;
  globalThis.Request = Request as any;
  globalThis.Response = Response as any;
}

BskyAgent.configure({
  fetch: async (httpUri, httpMethod, httpHeaders, httpReqBody) => {
    const requestOptions = {
      method: httpMethod,
      headers: new Headers(httpHeaders),
      body: httpReqBody,
    };
    try {
      const response = await fetch(httpUri, requestOptions);
      const responseBody = await response.text(); // or response.json() based on your requirements
      return {
        status: response.status,
        headers: Object.fromEntries(response.headers),
        body: responseBody,
      };
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  },
});

// Rest of your script
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

const imageBlobRef = {
  "$type": "blob",
  "ref": {
    "$link": "bafkreiegdbrmr4aredvl55jfyk3xxwndhk2kicg7gxvgpshkusct3wre3m"
  },
  "mimeType": "image/jpeg",
  "size": 760898  // Update with the actual size of your image
};

async function main() {
  const papersData = await getPostText();

  if (papersData && papersData.length > 0) {
    for (const textData of papersData) {
      const { title, link, formattedText } = textData;

      const imageEmbed = {
        "$type": "app.bsky.embed.images",
        "images": [{
          "alt": "Description of image", // Add appropriate alt text
          "image": imageBlobRef
        }]
      };

      const postContent = {
        text: formattedText,
        embed: imageEmbed
      };

      if (!postedPapers.papers.some((paper: Paper) => paper.title === title && paper.link === link)) {
        await Bot.run(() => Promise.resolve(postContent));
        
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
