import { bskyService, bskyAccount } from './config.js';
import atproto from '@atproto/api';
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
    try {
      const session = await this.#agent.login(bskyAccount);
      // Check if session contains the accessJwt
      if (session && session.accessJwt) {
        this.#accessToken = session.accessJwt; // Store the access token
      } else {
        throw new Error("Login response does not contain accessJwt");
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      throw new Error(`Login failed: ${errorMsg}`);
    }
  }

  async post(content: { text: string; embed: any }) {
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

  async uploadImage(imagePath: string): Promise<any> {
    if (!this.#accessToken) {
      throw new Error("Bot must be logged in to upload images.");
    }

    const image = fs.readFileSync(imagePath);
    const mimeType = path.extname(imagePath) === '.png' ? 'image/png' : 'image/jpeg';

    const response = await fetch('https://bsky.social/xrpc/com.atproto.repo.uploadBlob', {
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

    const blobData = await response.json();
    return blobData.blob;
  }
}
