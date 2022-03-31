const httpStatus = require('http-status');
var format = require('xml-formatter');

const { promisify } = require('util');
const { createGzip } = require('zlib');
const { pipeline } = require('stream');
const {
  createReadStream,
  createWriteStream
} = require('fs');

const catchAsync = require('../utils/catchAsync');
const fs = require('fs');
const path = require('path');
const { json } = require('express');
const { JsonWebTokenError } = require('jsonwebtoken');
const { stringToSlug } = require('../utils/common');
const gzip = createGzip();
const pipe = promisify(pipeline);

let SitemapIndexTemplateExmaple = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>http://www.example.com/sitemap1.xml.gz</loc>
  </sitemap>
  <sitemap>
    <loc>http://www.example.com/sitemap2.xml.gz</loc>
  </sitemap>
</sitemapindex>
`

async function do_gzip(input, output) {
  const gzip = createGzip();
  const source = createReadStream(input);
  const destination = createWriteStream(output);
  await pipe(source, gzip, destination);
}

let singleSitemapTemplateExmaple = `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
                                  <url>
                                  <loc>https://sharetrip.net/</loc>
                                  </url>
                                  </urlset>
                                  `


// let data = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'hotel_data.json')));
let data = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'hotel_data_copy.json')));

let countryTree = {}

for (let i = 0; i < data.length; i++) {
  let hotel = data[i];
  let hash = hotel.countryName + "_" + hotel.countryCode
  if (!countryTree[hash]) {
    countryTree[hash] = [hotel];
  } else {
    countryTree[hash].push(hotel)
  }
}

const createCountryJsons = async () => {

  for (const countryHASH in countryTree) {
    let fileName = `hotel_${stringToSlug(countryHASH)}.json`
    fs.writeFileSync(`./countries/${fileName}`, JSON.stringify(countryTree[countryHASH]));
  }
}
const ReadJsonAndWriteGzip = async () => {
  let hotelSiteMapListString = "";

  //   <sitemap>
  //   <loc>http://www.example.com/sitemap1.xml.gz</loc>
  // </sitemap>



  for (const countryHASH in countryTree) {
    let fileName = `hotel_${stringToSlug(countryHASH)}.json`
    let fileNameXML = `hotel_${stringToSlug(countryHASH)}.xml`
    let fileNameGZIP = `${fileNameXML}.gz`;
    let fileNameGZIP_URL = `<sitemap><loc>http://www.sharetrip.net/sitemap/${fileNameGZIP}</loc></sitemap>`;

    hotelSiteMapListString = hotelSiteMapListString + fileNameGZIP_URL;
    let countryJSON = JSON.parse(fs.readFileSync(path.resolve("countries", fileName)));
    let hotelListString = "";
    for (let i = 0; i < countryJSON.length; i++) {
      let hotel = countryJSON[i];
      let hotelUrl = `<url><loc>https://sharetrip.net/hotel-deals/${stringToSlug(hotel.name)}/${hotel.id}</loc></url>`;
      hotelListString = hotelListString + hotelUrl;
    }


    let singleCountrySitemapTemplate = `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${hotelListString}</urlset>`;
    fs.writeFileSync(`./countries/${fileNameXML}`, format(singleCountrySitemapTemplate));
    try {
      const source = `./countries/${fileNameXML}`;
      const destination = `./countries/${fileNameGZIP}`;
      console.log('destination:', destination)
      do_gzip(source, destination).catch((err) => {
        console.error('An error occurred:', err);
        process.exitCode = 1;
      });
    } catch (err) {
      console.error(err);
    }



  }

  let SitemapIndexTemplate = `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${hotelSiteMapListString}</sitemapindex>`;

  fs.writeFileSync(`./countries/sitemap.xml`, format(SitemapIndexTemplate));
}


const init = async () => {
  await createCountryJsons();
  await ReadJsonAndWriteGzip();

}

init();




const generateSitemap = catchAsync(async (req, res) => {


  res.status(httpStatus.CREATED).send({
    done: true,
  });
});
module.exports = {
  generateSitemap,
};
