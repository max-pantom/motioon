#!/usr/bin/env node
import { main } from "../packages/cli/main.mjs";
try {
  await main();
} catch (error) {
  console.error(`motioon: ${error.message}`);
  process.exitCode = 1;
}
