import axios from 'axios';
import { load } from 'cheerio';

export const fetchEmbedUrlCard = async (access_token: string, url: string) => {
  // Required fields for every embed card
  const card = {
    uri: url,
    title: '',
    description: '',
  };

  // Fetch the HTML
  const resp = await axios.get(url);
  const $ = load(resp.data);

  // Parse out the "og:title" and "og:description" HTML meta tags
  const titleTag = $('meta[property="og:title"]').attr('content');
  if (titleTag) card.title = titleTag;

  const descriptionTag = $('meta[property="og:description"]').attr('content');
  if (descriptionTag) card.description = descriptionTag;

  // Fetch and upload the image if there's an "og:image" tag
  const imageTag = $('meta[property="og:image"]').attr('content');
  if (imageTag) {
    // Turn a relative URL into a full URL, if needed
    const imgUrl = imageTag.includes('://') ? imageTag : new URL(imageTag, url).toString();
    const imgResp = await axios.get(imgUrl, { responseType: 'arraybuffer' });

    const blobResp = await axios.post(
      'https://bsky.social/xrpc/com.atproto.repo.uploadBlob',
      imgResp.data,
      {
        headers: {
          'Content-Type': imgResp.headers['content-type'],
          'Authorization': `Bearer ${access_token}`,
        },
      }
    );
    card.thumb = blobResp.data.blob;
  }

  return {
    $type: 'app.bsky.embed.external',
    external: card,
  };
};

export default fetchEmbedUrlCard;

