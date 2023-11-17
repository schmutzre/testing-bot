import fetch from 'node-fetch';
import Bot from "./lib/bot.js";
import getPostText from "./lib/getPostText.js";
import fs from 'fs';
import { execSync } from 'child_process';

interface Paper {
  title: string;
  link: string;
}

const POSTED_PAPERS_PATH = './postedPapers.json';
const postedPapers = JSON.parse(fs.readFileSync(POSTED_PAPERS_PATH, 'utf8'));

async function main() {
  const papersData = await getPostText();

  if (papersData && papersData.length > 0) {
    for (const textData of papersData) {
      // Ensure that title, link, and formattedText are always defined
      const { title, link, formattedText } = textData;
      if (title && link && formattedText) {
        if (!postedPapers.papers.some((paper: Paper) => paper.title === title && paper.link === link)) {
          // Create embed object
          const embed = Bot.createEmbedObject(link, title, "A brief description");

          // Prepare postData with text and embed
          const postData = {
            text: formattedText,
            embed: embed
          };

          // Pass a function that resolves to postData to Bot.run
          await Bot.run(() => Promise.resolve(postData));
          
          postedPapers.papers.push({ title, link });
          fs.writeFileSync(POSTED_PAPERS_PATH, JSON.stringify(postedPapers, null, 2));

          console.log(`[${new Date().toISOString()}] Posted: "${formattedText}"`);
        } else {
          console.log(`[${new Date().toISOString()}] Already posted: "${title}"`);
        }
      } else {
        console.error('One of the required fields (title, link, or formattedText) is undefined.');
      }
    }
    execSync('git add ' + POSTED_PAPERS_PATH);
    execSync('git commit -m "Added new posted papers"');
    execSync('git push origin main'); 
  } else {
    console.log(`[${new Date().toISOString()}] No new posts to publish.`);
  }
}

main();
