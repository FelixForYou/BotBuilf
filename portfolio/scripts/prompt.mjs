// Prompt terminal sederhana; input password tidak ditampilkan.
import readline from "node:readline";
import { passwordProblem } from "../db/password.mjs";

let pipedLines = null;
let pipedWaiters = [];

function readPipedLine() {
  if (!pipedLines) {
    pipedLines = [];
    const rl = readline.createInterface({ input: process.stdin, terminal: false });
    rl.on("line", (line) => {
      const waiter = pipedWaiters.shift();
      if (waiter) waiter(line);
      else pipedLines.push(line);
    });
    rl.on("close", () => {
      for (const w of pipedWaiters) w("");
      pipedWaiters = [];
    });
  }
  if (pipedLines.length) return Promise.resolve(pipedLines.shift());
  return new Promise((resolve) => pipedWaiters.push(resolve));
}

export async function ask(question) {
  process.stdout.write(question);
  if (!process.stdin.isTTY) {
    const line = await readPipedLine();
    process.stdout.write("\n");
    return line.trim();
  }
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  return new Promise((resolve) => rl.question("", (a) => { rl.close(); resolve(a.trim()); }));
}

export async function askHidden(question) {
  const stdin = process.stdin;
  process.stdout.write(question);
  if (!stdin.isTTY) {
    const line = await readPipedLine();
    process.stdout.write("\n");
    return line;
  }
  return new Promise((resolve) => {
    let value = "";
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    const onData = (chunk) => {
      for (const ch of chunk) {
        if (ch === "\r" || ch === "\n" || ch === "\u0004") {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.removeListener("data", onData);
          process.stdout.write("\n");
          resolve(value);
          return;
        }
        if (ch === "\u0003") {
          stdin.setRawMode(false);
          process.stdout.write("\nDibatalkan.\n");
          process.exit(130);
        }
        if (ch === "\u007f" || ch === "\b") {
          if (value.length) { value = value.slice(0, -1); process.stdout.write("\b \b"); }
          continue;
        }
        value += ch;
        process.stdout.write("*");
      }
    };
    stdin.on("data", onData);
  });
}

export async function askNewPassword() {
  for (let i = 0; i < 5; i++) {
    const pw = await askHidden("Password admin: ");
    const problem = passwordProblem(pw);
    if (problem) { console.log("  " + problem); continue; }
    const again = await askHidden("Ulangi password: ");
    if (again !== pw) { console.log("  Password tidak sama, coba lagi."); continue; }
    return pw;
  }
  console.log("Terlalu banyak percobaan. Jalankan ulang perintahnya.");
  process.exit(1);
}
