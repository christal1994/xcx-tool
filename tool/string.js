const char0UpperCase = function (str) {
  return `${str[0].toUpperCase()}${str.substring(1)}`;
};


const camelCase = (str) => {
  return str.replace(/[-_](\w)/g, function ($0, $1) {
    return $1.toUpperCase();
  });
};

const CamelCase = (str) => {
  str = camelCase(str);
  return `${str[0].toUpperCase()}${str.substring(1)}`;
};

const underScoreCase = (str) => {
  return str.replace(/([A-Z])/g, "_$1").toLowerCase().substring(1);
};

module.exports = {
  char0UpperCase,
  camelCase,
  CamelCase,
  underScoreCase
};