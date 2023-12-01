// node-fetch configuration
import fetch, { Headers, Request, Response } from 'node-fetch';
import pkg from '@atproto/api';
const { BskyAgent } = pkg;

if (typeof globalThis.fetch === 'undefined') {
  globalThis.fetch = fetch as any;
  globalThis.Headers = Headers as any;
  globalThis.Request = Request as any;
  globalThis.Response = Response as any;
}

BskyAgent.configure({
  fetch: async (httpUri, httpMethod, httpHeaders, httpReqBody) => {
    console.log('API Request Details:');
    console.log('URI:', httpUri);
    console.log('Method:', httpMethod);
    console.log('Headers:', httpHeaders);
    console.log('Body:', httpReqBody);

    const requestOptions = {
      method: httpMethod,
      headers: new Headers(httpHeaders),
      body: JSON.stringify(httpReqBody),
    };

    console.log('Final Request Body:', requestOptions.body);

    try {
      const response = await fetch(httpUri, requestOptions);
      const responseBody = await response.text();

      console.log('API Response Details:');
      console.log('Status:', response.status);
      console.log('Headers:', response.headers);
      console.log('Body:', responseBody);

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
  "size": 27565
};

async function main() {
  try {
    const papersData = await getPostText();

    if (papersData && papersData.length > 0) {
      for (const textData of papersData) {
        const { title, link, formattedText } = textData;

        const websiteCardEmbed = {
          "$type": "app.bsky.embed.external",
          "external": {
            "uri": link,
            "title": title,
            "description": "Your description here",
            "thumb": imageBlobRef
          }
        };

        const postContent = {
          "$type": "app.bsky.feed.post",
          "text": formattedText,
          "createdAt": new Date().toISOString(),
          "embed": websiteCardEmbed
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
  } catch (error) {
    console.error(`[${new Date().toISOString()}] An error occurred:`, error);
    process.exit(1);
  }
}

main();
