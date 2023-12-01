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

async function uploadImageAndGetBlobRef(imagePath: string) {
  const bot = new Bot(bskyService);
  await bot.login(bskyAccount);

  const image = fs.readFileSync(imagePath);
  const mimeType = 'image/jpeg'; // Change based on your image type

  const response = await bot.#agent.fetch('https://bsky.social/xrpc/com.atproto.repo.uploadBlob', {
    method: 'POST',
    headers: {
      'Content-Type': mimeType,
    },
    body: image,
  });

  if (!response.ok) {
    throw new Error(`Image upload failed: ${response.statusText}`);
  }

  const blobData = await response.json() as { blob: any };
  return blobData.blob;
}

async function main() {
  try {
    const papersData = await getPostText();

    if (papersData && papersData.length > 0) {
      for (const textData of papersData) {
        const imageBlobRef = await uploadImageAndGetBlobRef('pic.png');

        // Rest of the main function code...
      }
    } else {
      console.log(`[${new Date().toISOString()}] No new posts to publish.`);
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] An error occurred:`, error);
    process.exit(1);
  }
}

main();
