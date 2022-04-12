const stringToSlug = string => {
  return string
    .trim()
    .toLowerCase()
    // .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-')
    .replaceAll(".", '');


    // .toLowerCase()
    // .trim()
    // .replace(/[^\w\s-]/g, '')
    // .replace(/[\s_-]+/g, '-')
    // .replace(/^-+|-+$/g, '');
};



module.exports = {
  stringToSlug
}