// Assuming bskyService and bskyAccount are correctly imported from the config file
import { bskyService, bskyAccount } from './config';
import atproto from '@atproto/api';
import fs from 'fs';
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
    // Ensure the Bot is logged in and has an access token
    if (!this.#accessToken) {
      throw new Error("Bot must be logged in to post content.");
    }

    // Posting content using the Bluesky API
    const response = await fetch('https://bsky.social/api/post', {
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

  async uploadImage(imagePath) {
    // Ensure the Bot is logged in and has an access token
    if (!this.#accessToken) {
      throw new Error("Bot must be logged in to upload images.");
    }

    const image = fs.readFileSync(imagePath);
    const mimeType = 'image/jpeg'; // Adjust based on your image

    const response = await fetch('https://bsky.social/api/uploadImage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.#accessToken}`,
        'Content-Type': mimeType
      },
      body: image
    });

    if (!response.ok) {
      throw new Error(`Image upload failed: ${response.statusText}`);
    }

    return await response.json();
  }
}
