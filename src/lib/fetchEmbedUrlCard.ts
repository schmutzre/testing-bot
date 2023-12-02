// fetchEmbedUrlCard.ts
import axios from 'axios';
import { load } from 'cheerio';

export const fetchEmbedUrlCard = async (url: string): Promise<string> => {
  const response = await axios.get(url);
  const $ = load(response.data);

  // Extract the necessary meta tags
  const title = $('meta[property="og:title"]').attr('content') || 'Title not found';
  const description = $('meta[property="og:description"]').attr('content') || 'Description not found';

  // Construct the embed card format
  const embedCard = `Title: ${title}\nDescription: ${description}`;
  return embedCard;
};

export default fetchEmbedUrlCard;
