import { bskyAccount, bskyService } from "./config.js";
import atproto from "@atproto/api";
const { BskyAgent, RichText } = atproto;

type BotOptions = {
  service: string | URL;
  dryRun: boolean;
};

export default class Bot {
  #agent;
  #accessToken = '';

  static defaultOptions: BotOptions = {
    service: bskyService,
    dryRun: false,
  } as const;

  constructor(service = bskyService) {
    this.#agent = new BskyAgent({ service });
  }

  async login() {
    try {
      const response = await this.#agent.login(bskyAccount);
      this.#accessToken = response.accessJwt; // Assuming the response has an accessJwt property
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  getAccessToken() {
    return this.#accessToken;
  }

  async post(content) {
    if (!this.#accessToken) {
      throw new Error("Bot must be logged in to post content.");
    }

    const record = {
      text: content.text,
      embed: content.embed,
    };

    return this.#agent.post(record);
  }

  static async run(getPostContent, botOptions = {}) {
    const options = { ...this.defaultOptions, ...botOptions };
    const bot = new Bot(options.service);
    await bot.login();
    const content = await getPostContent();
    if (!options.dryRun) {
      await bot.post(content);
    }
    return content;
  }
}
