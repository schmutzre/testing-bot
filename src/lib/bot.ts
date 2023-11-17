import { bskyAccount, bskyService } from "./config.js";
import type {
  AtpAgentLoginOpts,
  AtpAgentOpts,
  AppBskyFeedPost,
} from "@atproto/api";
import atproto from "@atproto/api";
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

  constructor(service: AtpAgentOpts["service"]) {
    this.#agent = new BskyAgent({ service });
  }

  login(loginOpts: AtpAgentLoginOpts) {
    return this.#agent.login(loginOpts);
  }

  async post(
    text: string,
    embed?: any
  ) {
    const postContent: Partial<AppBskyFeedPost.Record> & Omit<AppBskyFeedPost.Record, "createdAt"> = {
      text: text,
      ...(embed && { embed: embed })
    };
    return this.#agent.post(postContent);
  }

  static async run(
    getPostData: () => Promise<{ text: string; embed?: any }>,
    botOptions?: Partial<BotOptions>
  ) {
    const { service, dryRun } = botOptions
      ? { ...this.defaultOptions, ...botOptions }
      : this.defaultOptions;

    const bot = new Bot(service);
    await bot.login(bskyAccount);
    const postData = await getPostData(); // This is now expecting an object with text and optionally an embed

    if (!dryRun) {
      await bot.post(postData.text, postData.embed);
    }

    return postData;
  }

  // New method to create the embed object
  static createEmbedObject(url: string, title: string, description: string): any {
    const imageRef = 'bafkreiegdbrmr4aredvl55jfyk3xxwndhk2kicg7gxvgpshkusct3wre3m'; // The blob reference

    return {
      "$type": "app.bsky.embed.external",
      "external": {
        "uri": url,
        "title": title,
        "description": description,
        "thumb": {
          "$type": "blob",
          "ref": {
            "$link": imageRef
          },
          "mimeType": "image/png",
          // Add the size if you know it
        }
      }
    };
  }
}
