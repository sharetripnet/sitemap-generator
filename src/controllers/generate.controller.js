const httpStatus = require("http-status");
const { promisify } = require("util");
const { createGzip } = require("zlib");
const { pipeline } = require("stream");
const { createReadStream, createWriteStream } = require("fs");
const catchAsync = require("../utils/catchAsync");
const fs = require("fs");
const path = require("path");
const { stringToSlug } = require("../utils/common");
const pipe = promisify(pipeline);
const csvtojson = require("csvtojson");
const { parseAsync } = require("json2csv");

var dir = "./countries/sitemap";
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

let data = {};
let countryTree = {};
const urlsData = [];

async function do_gzip(input, output) {
  const gzip = createGzip();
  const source = createReadStream(input);
  const destination = createWriteStream(output);
  await pipe(source, gzip, destination);
}

const createCountryJsons = async () => {
  for (const countryHASH in countryTree) {
    let fileName = `hotel_${stringToSlug(countryHASH)}.json`;
    fs.writeFileSync(
      `./countries/${fileName}`,
      JSON.stringify(countryTree[countryHASH])
    );
  }
};

const ReadJsonAndWriteGzip = async () => {
  let hotelSiteMapListString = "";

  for (const countryHASH in countryTree) {
    let fileName = `hotel_${stringToSlug(countryHASH)}.json`;
    let fileNameXML = `hotel_${stringToSlug(countryHASH)}.xml`;
    let fileNameGZIP = `${fileNameXML}.gz`;
    let fileNameGZIP_URL = `<sitemap><loc>https://assets.sharetrip.net/sitemap/${fileNameGZIP}</loc></sitemap>`;

    hotelSiteMapListString = hotelSiteMapListString + fileNameGZIP_URL;
    let countryJSON = JSON.parse(
      fs.readFileSync(path.resolve("countries", fileName))
    );
    let hotelListString = "";
    for (let i = 0; i < countryJSON.length; i++) {
      let hotel = countryJSON[i];
      let hotelName = stringToSlug(hotel.hotelName);

      let hotelUrl = `<url><loc>https://sharetrip.net/hotel-deals/${hotelName}/${hotel.hotelId}</loc></url>`;
      hotelListString = hotelListString + hotelUrl;
      urlsData.push({
        "Hotel Url": `https://sharetrip.net/hotel-deals/${hotelName}/${hotel.hotelId}`,
      });
    }

    let singleCountrySitemapTemplate = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
          http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">${hotelListString}</urlset>`;

    fs.writeFileSync(
      `./countries/${fileNameXML}`,
      singleCountrySitemapTemplate
    );

    try {
      const source = `./countries/${fileNameXML}`;
      const destination = `./countries/sitemap/${fileNameGZIP}`;
      await do_gzip(source, destination);
      console.log("📂 Destination:", destination);
    } catch (err) {
      process.exitCode = 1;
      console.error(err);
    }
  }

  let SitemapIndexTemplate = `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://sharetrip.net/sitemap.xml</loc>
  </sitemap>
  ${hotelSiteMapListString}
  </sitemapindex>`;

  fs.writeFileSync(`./countries/sitemap/sitemap.xml`, SitemapIndexTemplate);
};

const createUrlCSV = async () => {
  const fields = ["Hotel Url"];
  parseAsync(urlsData, { fields }).then((csv) => {
    fs.writeFileSync(path.resolve(__dirname, "hotel_urls.csv"), csv);
    console.log("=== ✅ done ===");
  });
};

const init = async () => {
  const csvFilePath = path.resolve(__dirname, "hotel_data.csv");
  data = await csvtojson({
    headers: [
      "id",
      "hotelId",
      "hotelName",
      "kind",
      "cityName",
      "countryName",
      "countryCode",
    ],
  }).fromFile(csvFilePath);

  for (let i = 0; i < data.length; i++) {
    let hotel = data[i];
    let hash = hotel.countryName + "-" + hotel.countryCode;
    if (!countryTree[hash]) {
      countryTree[hash] = [hotel];
    } else {
      countryTree[hash].push(hotel);
    }
  }

  const MAX_XML_LENGTH = 40000;
  const countryKeys = Object.keys(countryTree);

  countryKeys.forEach((item) => {
    const itemLength = countryTree[item].length;
    if (itemLength > MAX_XML_LENGTH) {
      let hashSet = countryTree[item];
      delete countryTree[item];
      const totalParts = Math.ceil(itemLength / MAX_XML_LENGTH);
      for (i = 1; i <= totalParts; i++) {
        const startPoint = i === 1 ? 0 : i * MAX_XML_LENGTH - MAX_XML_LENGTH;
        const endPoint = MAX_XML_LENGTH * i;
        countryTree[`${item}-${i}`] = hashSet.slice(startPoint, endPoint);
      }
    }
  });

  await createCountryJsons();
  await ReadJsonAndWriteGzip();
  await createUrlCSV();
};

init();

const generateSitemap = catchAsync(async (req, res) => {
  res.status(httpStatus.CREATED).send({
    done: true,
  });
});

module.exports = {
  generateSitemap,
};
