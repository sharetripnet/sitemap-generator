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

var dir = './countries/final_output';
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}
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




  for (const countryHASH in countryTree) {
    let fileName = `hotel_${stringToSlug(countryHASH)}.json`
    let fileNameXML = `hotel_${stringToSlug(countryHASH)}.xml`
    let fileNameGZIP = `${fileNameXML}.gz`;
    let fileNameGZIP_URL = `<sitemap><loc>https://assets.sharetrip.net/sitemap/${fileNameGZIP}</loc></sitemap>`;

    hotelSiteMapListString = hotelSiteMapListString + fileNameGZIP_URL;
    let countryJSON = JSON.parse(fs.readFileSync(path.resolve("countries", fileName)));
    let hotelListString = "";
    for (let i = 0; i < countryJSON.length; i++) {
      let hotel = countryJSON[i];
      let hotelName = stringToSlug(hotel.name);

      
      hotelName = hotelName.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
      

      let hotelUrl = `<url><loc>https://sharetrip.net/hotel-deals/${hotelName}/${hotel.id}</loc></url>`;
      hotelListString = hotelListString + hotelUrl;
    }


    let singleCountrySitemapTemplate = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
          http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">${hotelListString}</urlset>`;
    fs.writeFileSync(`./countries/${fileNameXML}`, singleCountrySitemapTemplate);
    try {
      const source = `./countries/${fileNameXML}`;
      const destination = `./countries/final_output/${fileNameGZIP}`;
      console.log('destination:', destination)
      do_gzip(source, destination).catch((err) => {
        console.error('An error occurred:', err);
        process.exitCode = 1;
      });
    } catch (err) {
      console.error(err);
    }



  }

  let SitemapIndexTemplate = `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://sharetrip.net/sitemap.xml</loc>
  </sitemap>
  ${hotelSiteMapListString}
  </sitemapindex>`;

  fs.writeFileSync(`./countries/final_output/sitemap.xml`, SitemapIndexTemplate);
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
