const fs = require("node:fs");
const path = require("node:path");
const readline = require("node:readline");
const { execSync } = require("node:child_process");

const checkpointsPath = path.join(process.cwd(), "course-checkpoints.json");

if (!fs.existsSync(checkpointsPath)) {
  console.error("course-checkpoints.json not found.");
  process.exit(1);
}

const checkpoints = JSON.parse(fs.readFileSync(checkpointsPath, "utf8"));

if (!Array.isArray(checkpoints) || checkpoints.length === 0) {
  console.error("No checkpoints found in course-checkpoints.json.");
  process.exit(1);
}

function run(command) {
  execSync(command, { stdio: "inherit" });
}

function getCurrentBranch() {
  return execSync("git branch --show-current", { encoding: "utf8" }).trim();
}

const currentBranch = getCurrentBranch();

if (!currentBranch) {
  console.error("You are in detached HEAD state.");
  console.error("Please create or switch to your own branch first.");
  console.error("Example: git checkout -b your-name-lesson-01");
  process.exit(1);
}

if (currentBranch === "main") {
  const rlBranch = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("");
  console.log("You are on the main branch. Let's create your working branch first.");
  console.log("");

  rlBranch.question("Enter your name (e.g. john): ", (name) => {
    rlBranch.close();

    const trimmed = name.trim().toLowerCase().replace(/\s+/g, "-");
    if (!trimmed) {
      console.error("Name cannot be empty.");
      process.exit(1);
    }

    const branchName = `${trimmed}-lesson-01`;
    console.log("");
    console.log(`Creating branch: ${branchName}`);
    execSync(`git checkout -b ${branchName}`, { stdio: "inherit" });
    console.log("");
    console.log(`Switched to branch "${branchName}". Now run npm run reset again.`);
    console.log("");
  });

  return;
}

console.log("");
console.log("Available checkpoints:");
console.log("");

checkpoints.forEach((checkpoint, index) => {
  const label = checkpoint.description || checkpoint.title;
  console.log(`${index + 1}. ${label}`);
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("Choose checkpoint number: ", (answer) => {
  rl.close();

  const selectedIndex = Number(answer) - 1;
  const selected = checkpoints[selectedIndex];

  if (!selected) {
    console.error("Invalid checkpoint number.");
    process.exit(1);
  }

  console.log("");
  console.log(`Current branch: ${currentBranch}`);
  console.log(`Resetting to: ${selected.id} — ${selected.title}`);
  console.log(`Commit: ${selected.commit}`);
  console.log("");

  run("git fetch origin");
  run(`git reset --hard ${selected.commit}`);

  // Restore reset tooling by writing files directly (bypasses git index)
  const toolingFiles = [
    "scripts/course-reset.cjs",
    "package.json",
    "course-checkpoints.json",
  ];
  for (const file of toolingFiles) {
    const content = execSync(`git show origin/main:${file}`, { encoding: "utf8" });
    fs.writeFileSync(path.join(process.cwd(), file), content);
  }
  execSync(`git update-index --assume-unchanged ${toolingFiles.join(" ")}`);

  console.log("");
  console.log(`Done. Branch "${currentBranch}" has been reset to ${selected.commit}.`);
});