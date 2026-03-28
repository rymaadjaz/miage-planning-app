const command = process.argv[2];

if (!command) {
  throw new Error("Missing react-scripts command (start|build|test|eject)");
}

const allowed = new Set(["start", "build", "test", "eject"]);
if (!allowed.has(command)) {
  throw new Error(`Unsupported react-scripts command: ${command}`);
}

if (!process.env.NODE_NO_WARNINGS) {
  process.env.NODE_NO_WARNINGS = "1";
}

require(`react-scripts/scripts/${command}`);
