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
    const session = await response.json();
    this.#accessToken = session.accessJwt; // Store the access token
  }

  getAccessToken() {
    return this.#accessToken;
  }

  async post(content: { text: string; embed: any }) {
    if (!this.#accessToken) {
      throw new Error("Bot must be logged in to post content.");
    }

    const record = {
      text: content.text,
      embed: content.embed,
    };

    return this.#agent.post(record);
  }
}
