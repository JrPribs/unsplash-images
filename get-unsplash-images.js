const dotenv = require('dotenv');
const fetch = require('node-fetch');
const { createApi } = require('unsplash-js');
const readline = require('readline');
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// Load environment variables from .env file
dotenv.config();

// Initialize Unsplash API
const unsplash = createApi({
  accessKey: process.env.UNSPLASH_ACCESS_KEY,
  fetch: fetch,
});

// Setup readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Function to create a CSV file from image URLs
const createCSV = (imageUrls, searchTerm) => {
  const csvWriter = createCsvWriter({
    path: `${searchTerm}.csv`,
    header: [{ id: 'url', title: 'Image URLs' }],
  });

  const records = imageUrls.map((url) => ({ url }));

  return csvWriter
    .writeRecords(records)
    .then(() => {
      console.log(`CSV file '${searchTerm}.csv' has been created.`);
    })
    .catch((error) => {
      console.error('Error writing CSV file:', error);
    });
};

// Prompt the user for a search term
rl.question('Enter a search term: ', async (query) => {
  try {
    let allImageUrls = [];
    for (let page = 1; page <= 5; page++) {
      const result = await unsplash.search.getPhotos({
        query: query,
        page: page,
        perPage: 10,
      });

      if (result.response && result.response.results) {
        const pageImageUrls = result.response.results.map(
          (photo) => photo.urls.small
        );
        allImageUrls = allImageUrls.concat(pageImageUrls);
      } else {
        console.log(`No results found for page ${page}.`);
      }
    }

    if (allImageUrls.length > 0) {
      console.log('Image URLs:');
      allImageUrls.forEach((url) => console.log(url));

      // Create CSV with the image URLs
      await createCSV(allImageUrls, query);
    } else {
      console.log('No results found across all pages.');
    }
  } catch (error) {
    console.error('Error fetching images:', error);
  } finally {
    rl.close();
  }
});
