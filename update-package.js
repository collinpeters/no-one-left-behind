const http = require("http");
const fs = require("fs");
const path = require("path");

function getJSON(URL, cb) {
  http.get(URL, res => {
    let body = "";

    res.on("data", function(chunk) {
      body += chunk;
    });

    res.on("end", function() {
      try {
        cb(null, JSON.parse(body));
      } catch (e) {
        cb(e);
      }
    });
  });
}

const scopedPackagePattern = new RegExp('^(?:@([^/]+?)[/])?([^/]+?)$')
function urlFriendly(name) {
  return name === encodeURIComponent(name);
}
function validScopedName(name) {
  const nameMatch = name.match(scopedPackagePattern)
  if (nameMatch) {
    return urlFriendly(nameMatch[1]) && urlFriendly(nameMatch[1])
  }
}

function validName(name) {
  return name.length > 0 && (urlFriendly(name) || validScopedName(name));
}

function sanitize(name) {
  return name.trim(); // validName will filter out anything else that is a problem
}

function getPackageList(cb) {
  getJSON(
    "http://anvaka.github.io/npmrank/online/npmrank.json",
    (err, json) => {
      if (err) {
        return cb(err);
      }

      if (json && json.rank) {
        cb(null, Object.keys(json.rank).map(sanitize).filter(validName));
      } else {
        cb(new Error("Malformed data"));
      }
    }
  );
}

function getVersion() {
  const date = new Date();
  const monthS = ("" + (date.getMonth() + 1)).padStart(2, "0");
  const dayS = ("" + date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}.${monthS}.${dayS}`;
}

function packageEntry(name) {
  return `        "${name}": "latest"`;
}

function buildJSON(packageList) {
  // Some packages had to be left behind, to cirumvent
  // npm ERR! code E400
  // npm ERR! Too many dependencies. : no-one-left-behind
  return `
{
    "name": "no-one-left-behind",
    "version": "${getVersion()}",
    "description": "Every package is invited",
    "repository": "Zalastax/no-one-left-behind",
    "scripts": {
        "update-packages": "node update-package.js",
        "deploy": "node deploy.js"
    },
    "license": "MIT",
    "dependencies": {
${packageList.slice(0, 1000).map(packageEntry).join(",\n")}
    }
}
`;
}

getPackageList((err, packageList) => {
  if (err) {
    console.log(err);
    process.exit(1);
  }

  const out = buildJSON(packageList);

  const file = path.join(__dirname, "package.json");
  fs.writeFileSync(file, out);
});
