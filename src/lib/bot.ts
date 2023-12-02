import axios from 'axios';
import { load } from 'cheerio';
import fs from 'fs';
import path from 'path';
import { bskyService, bskyAccount } from './config.js';
import atproto from '@atproto/api';
const { BskyAgent } = atproto;

// Define types for your content and other custom types as needed
interface Content {
  text: string;
  embed: any; // Define a more specific type if possible
}

interface Card {
  uri: string;
  title: string;
  description: string;
  thumb?: any; // Define a more specific type if possible
}

export default class Bot {
  private agent: BskyAgent;
  private accessToken: string;

  constructor() {
    this.agent = new BskyAgent({ service: bskyService });
  }

  async login() {
    const response = await this.agent.login(bskyAccount);
    if (response.ok) {
      const session = await response.json();
      this.accessToken = session.accessJwt;
    } else {
      throw new Error(`Login failed: ${response.statusText}`);
    }
  }

  async post(content: Content) {
    if (!this.accessToken) {
      throw new Error("Bot must be logged in to post content.");
    }

    const response = await axios.post('https://bsky.social/xrpc/com.atproto.repo.createRecord', content, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status !== 200) {
      throw new Error(`Failed to post content: ${response.statusText}`);
    }

    return response.data;
  }

  async uploadImage(imagePath: string): Promise<any> {
    if (!this.accessToken) {
      throw new Error("Bot must be logged in to upload images.");
    }

    const image = fs.readFileSync(imagePath);
    const mimeType = path.extname(imagePath) === '.png' ? 'image/png' : 'image/jpeg';

    const response = await axios.post('https://bsky.social/xrpc/com.atproto.repo.uploadBlob', image, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': mimeType
      }
    });

    if (response.status !== 200) {
      throw new Error(`Image upload failed: ${response.statusText}`);
    }

    return response.data.blob;
  }

  async fetchEmbedUrlCard(url: string): Promise<Card> {
    const card: Card = {
      uri: url,
      title: '',
      description: ''
    };

    const resp = await axios.get(url);
    if (resp.status !== 200) {
      throw new Error('Failed to fetch HTML for URL card.');
    }

    const $ = load(resp.data);
    const titleTag = $('meta[property="og:title"]').attr('content');
    const descriptionTag = $('meta[property="og:description"]').attr('content');
    const imageTag = $('meta[property="og:image"]').attr('content');

    if (titleTag) card.title = titleTag;
    if (descriptionTag) card.description = descriptionTag;
    if (imageTag) {
      const imgResp = await axios.get(imageTag, { responseType: 'arraybuffer' });
      if (imgResp.status !== 200) {
        throw new Error('Failed to fetch image for URL card.');
      }

      const blobResp = await axios.post(
        'https://bsky.social/xrpc/com.atproto.repo.uploadBlob', 
        imgResp.data, 
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': imgResp.headers['content-type']
          }
        }
      );

      if (blobResp.status !== 200) {
        throw new Error('Failed to upload image blob for URL card.');
      }
      card.thumb = blobResp.data.blob;
    }

    return card;
  }
}
