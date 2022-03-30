const httpStatus = require('http-status');
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

// let rawdata = fs.readFileSync(path.resolve(__dirname, 'hotel_data.json'));
// console.log('rawdata:', rawdata.toString())



const generateSitemap = catchAsync(async (req, res) => {

  let rawdata = fs.readFileSync(path.resolve(__dirname, 'hotel_data.json'));
  let data = JSON.parse(rawdata);


  let countryTree = {

  }

  for (let i = 0; i < data.length; i++) {
    let hotel = data[i];
    let hash = hotel.countryName + "_" + hotel.countryCode
    if (!countryTree[hash]) {
      countryTree[hash] = [hotel];
    } else {
      countryTree[hash].push(hotel)
    }
  }
  res.status(httpStatus.CREATED).send({
    countryTree,
  });
});
module.exports = {
  generateSitemap,
};
