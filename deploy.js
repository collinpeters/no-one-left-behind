const exec = require("child_process").execSync;

const lexec = function(command) {
  console.log(`> ${command}`);
  const out = exec(command).toString("utf8");
  console.log(out);
  return out;
};

const startHash = exec("git rev-parse HEAD");
const fromBranch = "develop";
const toBranch = "master";
try {
  lexec("git diff-index --quiet HEAD --");
  lexec(`git checkout ${fromBranch}`);
  lexec("git diff-index --quiet HEAD --");
} catch (e) {
  console.log("Invalid State. Repository has uncommited changes. Aborting...");
  process.exit(1);
}

try {
  lexec("npm run update-packages");
  try {
    lexec('git add package.json');
    lexec('git commit -m "Update dependencies"')
    lexec(`git push -f origin ${fromBranch}:${toBranch}`);
    lexec("npm publish");
  } catch (e) {
    console.log(e.message);
  }
} catch (e) {
  console.log(e.message);
}

lexec("git reset --hard " + startHash);
