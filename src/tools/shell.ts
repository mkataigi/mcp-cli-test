import { tool } from "ai";
import z from "zod";
import { exec } from "child_process";
import { promisify } from "util";
import * as readline from "node:readline/promises";

const execAsync = promisify(exec);

export const shellTool = tool({
  // ツールの説明
  description:
    "A shell command executor. You can use it to run shell commands. Returns the output of the command.",
  // ツールの引数を定義
  // Zod スキーマを使用して引数の型を定義する
  parameters: z.object({
    command: z.string().min(1, "Command is required"),
    args: z.array(z.string()).optional(),
    cwd: z.string().optional(),
  }),
  execute: async ({ command, args, cwd }) => {
    // 注意: os ごとのコマンドの違いは考慮していません
    const fullCommand = [command, ...(args || [])].join(" ");
    const terminal = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    const confirmation = await terminal.question(
      `Are you sure you want to run this command? ${fullCommand} (y/n) `
    );
    if (confirmation.toLowerCase() !== "y") {
      return "Command execution cancelled because of user confirmation.";
    }

    terminal.close();

    try {
      const { stdout, stderr } = await execAsync(fullCommand, { cwd });
      return stdout || stderr;
    } catch (error) {
      return `Error executing command: ${error}`;
    }
  },
});
