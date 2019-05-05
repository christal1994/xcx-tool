const fs = require('fs');
const path = require('path');

const listDir = async function (dir, deep, filter) {

  let childs = fs.readdirSync(dir);

  filter = filter || filterNone;

  let res = childs.filter(function (child) {
    let ch = fs.statSync(`${dir}/${child}`);
    return filter(ch, `${dir}/${child}`);
  }).map(function (child) {
    return path.join(dir, child)
  });

  let childDirs = childs.filter(function (child) {
    let ch = fs.statSync(`${dir}/${child}`);
    return filterDir(ch, `${dir}/${child}`);
  });

  if (deep) {
    for (var i = 0; i < childDirs.length; i++) {
      let child = childDirs[i];
      res.push(...await listDir(`${dir}/${child}`, deep, filter))
    }
  }

  return res;
};

const filterFile = function (stats, filePath) {
  return stats && stats.isFile();
};

const filterNone = function (stats, filePath) {
  return true;
};

const filterDir = function (stats, filePath) {
  return stats && stats.isDirectory();
};

const touchDir = async function (dir) {

  if (await fs.existsSync(dir)) {
    return;
  }

  let dirs = dir.split('/');

  let i = 0;
  let dl = dirs.length;
  let current = dir.startsWith('/') ? '/' : './';
  while (i < dl) {
    if (dirs[i]) {
      current += `${dirs[i]}/`;
      if (!await fs.existsSync(current)) {
        fs.mkdirSync(current);
      }
    }
    i++;
  }

};


const touchPatentDir = async function (filePath) {
  await touchDir(filePath.substring(0, filePath.lastIndexOf('/')))
};

const copyFile = async function (source, target) {
  return new Promise(function (resolve, reject) {
    fs.copyFile(source, target, function (err) {
      if (err) {
        return reject(err);
      }
      resolve();
    })
  })
};

const readFile = async function (source) {
  return new Promise(function (resolve, reject) {
    fs.readFile(source, function (err, fileStr) {
      if (err) {
        return reject(err);
      }
      resolve(fileStr.toString());
    })
  })
};

const readJSON = async function (source) {
  let fileStr = await readFile(source);
  return JSON.parse(fileStr);
};

const writeFile = async function (target, fileStr) {
  return new Promise(function (resolve, reject) {
    fs.writeFile(target, fileStr, function (err, fileStr) {
      if (err) {
        return reject(err);
      }
      resolve(fileStr);
    })
  })
};


const existFile = async function (file) {
  return new Promise(function (resolve, reject) {
    resolve(fs.existsSync(file));
  })
};

module.exports = {
  listDir,
  filterFile,
  filterNone,
  filterDir,
  touchDir,
  touchPatentDir,
  copyFile,
  readFile,
  readJSON,
  writeFile,
  existFile
};