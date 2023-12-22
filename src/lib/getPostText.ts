import Parser from 'rss-parser';
import axios from 'axios';
import cheerio from 'cheerio';
import fs from 'fs';

interface Paper {
  title: string;
  link: string;
  metadata?: PaperMetadata;
}

interface PaperMetadata {
  pageTitle: string;
  pageDescription?: string; // Allow pageDescription to be undefined
  pageImage?: string;
}

const FEED_URL = 'https://osfpreprints-feed.herokuapp.com/PsyArXiv.rss';
const POSTED_PAPERS_PATH = './postedPapers.json';
const postedPapers = JSON.parse(fs.readFileSync(POSTED_PAPERS_PATH, 'utf8'));

const ONE_DAY = 24 * 60 * 60 * 1000;  // One day in milliseconds

async function fetchPaperMetadata(url: string): Promise<PaperMetadata> {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    const pageTitle = $('meta[property="og:title"]').attr('content') || $('title').text() || '';
    const pageDescription = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content');
    const pageImage = $('meta[property="og:image"]').attr('content');

    return {
      pageTitle,
      pageDescription, // pageDescription can be undefined
      pageImage,
    };
  } catch (error) {
    console.error(`Error fetching metadata for ${url}:`, error);
    return {
      pageTitle: '', // Provide a default empty string
      // pageDescription is not required to be returned if it's undefined
    };
  }
}

export default async function getPostText() {
  const parser = new Parser();
  const feed = await parser.parseURL(FEED_URL);
  const papersToPost = [];

  for (const item of feed.items) {
    const publicationDate = item.pubDate ? new Date(item.pubDate) : new Date();
    const currentDate = new Date();

    const isAlreadyPosted = postedPapers.papers.some((paper: Paper) => paper.title === item.title && paper.link === item.link);

    if (!isAlreadyPosted && (currentDate.getTime() - publicationDate.getTime() <= ONE_DAY)) {
      if (item.link) {
        const metadata = await fetchPaperMetadata(item.link);
        papersToPost.push({
          title: item.title,
          link: item.link,
          formattedText: `${item.title}: ${item.link}`,
          metadata: metadata
        });
      }
    }
  }

  return papersToPost.length > 0 ? papersToPost : null;
}
