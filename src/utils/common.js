const stringToSlug = string => {
  return string
    .trim()
    .toLowerCase()
    // .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-')
    .replaceAll(".", '');
};



module.exports = {
  stringToSlug
}