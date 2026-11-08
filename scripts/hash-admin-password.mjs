import { randomBytes, scryptSync } from "node:crypto";

if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== "function") {
  console.error("Ejecutá este script desde una terminal interactiva.");
  process.exit(1);
}

process.stdout.write("Nueva contraseña (entrada oculta): ");
process.stdin.setRawMode(true);
process.stdin.resume();

let password = "";
const finish = () => {
  process.stdin.setRawMode(false);
  process.stdin.pause();
  process.stdin.removeAllListeners("data");
  process.stdout.write("\n");
};

process.stdin.on("data", (chunk) => {
  for (const byte of chunk) {
    if (byte === 3) {
      finish();
      process.exit(1);
    }
    if (byte === 10 || byte === 13) {
      finish();
      if (password.length < 14) {
        console.error("Usá una contraseña de al menos 14 caracteres.");
        process.exit(1);
      }
      const salt = randomBytes(16);
      const hash = scryptSync(password, salt, 64);
      password = "";
      console.log(`ADMIN_PASSWORD_HASH=scrypt$${salt.toString("hex")}$${hash.toString("hex")}`);
      process.exit(0);
    }
    if (byte === 8 || byte === 127) {
      password = password.slice(0, -1);
    } else if (byte >= 32 && byte <= 126 && password.length < 256) {
      password += String.fromCharCode(byte);
    }
  }
});
