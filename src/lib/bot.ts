import { bskyAccount, bskyService } from "./config.js";
import atproto from "@atproto/api";
const { BskyAgent } = atproto;

export default class Bot {
  #agent;
  #accessToken = '';

  constructor() {
    this.#agent = new BskyAgent({ service: bskyService });
  }

  async login() {
    const response = await this.#agent.login(bskyAccount);
    this.#accessToken = response.accessJwt; // Store the access token
  }

  getAccessToken() {
    return this.#accessToken;
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

  // Add other methods as needed
}
