const { charMap } = require("./replace-char");

const stringToSlug = (string) => {
  const slug = string
    .normalize()
    .split("")
    .reduce((res, char) => {
      let appendChar = charMap[char] ? `-${charMap[char]}-` : char;
      return (
        res +
        appendChar
          .replace(/[`~!@#$%^&*()_|+=?;:'",.<>\{\}\[\]]+/g, "")
          .replace(/[\\\/]+/g, "-")
          .replace(/\s+/g, "-")
          .toLowerCase()
      );
    }, "");
  return slug.replace(/-{2,}/g, "-");
};

module.exports = {
  stringToSlug,
};
