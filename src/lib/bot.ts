import { bskyAccount, bskyService } from "./config.js";
import atproto from "@atproto/api";
import axios from 'axios';
import { load } from 'cheerio';
import fs from 'fs';
import path from 'path';
const { BskyAgent } = atproto;

export default class Bot {
  #agent;
  #accessToken = '';

  constructor() {
    this.#agent = new BskyAgent({ service: bskyService });
  }

  async login() {
    const session = await this.#agent.login(bskyAccount);
    this.#accessToken = session.accessJwt; // Store the access token
  }

  async post(content) {
    if (!this.#accessToken) {
      throw new Error("Bot must be logged in to post content.");
    }

    const response = await fetch('https://bsky.social/xrpc/com.atproto.repo.createRecord', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.#accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(content)
    });

    if (!response.ok) {
      throw new Error(`Failed to post content: ${response.statusText}`);
    }

    return await response.json();
  }

  async fetchEmbedUrlCard(url: string): Promise<any> {
    // the required fields for every embed card
    const card = {
      uri: url,
      title: '',
      description: '',
    };

    // fetch the HTML
    const resp = await axios.get(url);
    const $ = load(resp.data);

    // parse out the "og:title" and "og:description" HTML meta tags
    const titleTag = $('meta[property="og:title"]').attr('content');
    if (titleTag) card.title = titleTag;

    const descriptionTag = $('meta[property="og:description"]').attr('content');
    if (descriptionTag) card.description = descriptionTag;

    // if there is an "og:image" HTML meta tag, fetch and upload that image
    const imageTag = $('meta[property="og:image"]').attr('content');
    if (imageTag) {
      const imgResp = await axios.get(imageTag, { responseType: 'arraybuffer' });
      const blobResp = await axios.post(
        'https://bsky.social/xrpc/com.atproto.repo.uploadBlob',
        imgResp.data,
        {
          headers: {
            'Content-Type': 'image/jpeg', // Adjust as necessary
            Authorization: `Bearer ${this.#accessToken}`
          },
        }
      );
      card.thumb = blobResp.data.blob;
    }

    return {
      $type: 'app.bsky.embed.external',
      external: card,
    };
  }
}
