const stringToSlug = string => {
  return string
    .trim()
    .toLowerCase()
    .replaceAll(".", '')
    // .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
};



module.exports = {
  stringToSlug
}