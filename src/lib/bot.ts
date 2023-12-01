import { bskyAccount, bskyService } from "./config.js";
import atproto from "@atproto/api";
import fs from 'fs'; // Added to handle file system operations
const { BskyAgent, RichText } = atproto;

type BotOptions = {
  service: string | URL;
  dryRun: boolean;
};

export default class Bot {
  #agent;

  static defaultOptions: BotOptions = {
    service: bskyService,
    dryRun: false,
  } as const;

  constructor(service: string | URL) {
    this.#agent = new BskyAgent({ service });
  }

  login(loginOpts: any) {
    return this.#agent.login(loginOpts);
  }

  async post(content: { text: string; embed: any }) {
    const record = {
      text: content.text,
      embed: content.embed, // Include the embed in the record
      // Add other necessary fields as required by the Bluesky API
    };
    return this.#agent.post(record);
  }

  // New method for image upload
  async uploadImage(imagePath: string, mimeType: string) {
    const image = fs.readFileSync(imagePath);

    const response = await this.#agent.fetch('https://bsky.social/xrpc/com.atproto.repo.uploadBlob', {
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

  static async run(getPostContent: () => Promise<{ text: string; embed: any }>, botOptions?: Partial<BotOptions>) {
    const { service, dryRun } = botOptions
      ? Object.assign({}, this.defaultOptions, botOptions)
      : this.defaultOptions;
    const bot = new Bot(service);
    await bot.login(bskyAccount);
    const content = await getPostContent();
    if (!dryRun) {
      await bot.post(content);
    }
    return content;
  }
}
