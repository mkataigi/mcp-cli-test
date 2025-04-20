import {
  CoreMessage,
  streamText,
  experimental_createMCPClient as createMCPClient,
} from "ai";
import { google } from "@ai-sdk/google";
import { Experimental_StdioMCPTransport as StdioMCPTransport } from "ai/mcp-stdio";
import dotenv from "dotenv";
import * as readline from "node:readline/promises";
import { shellTool } from "./tools/shell";
import { systemPrompt } from "./prompts/system";

// 環境変数を .env ファイルから読み込む
dotenv.config();

// 標準出力と標準入力を使用して、ユーザーとの対話を行うためのインターフェースを作成
const terminal = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const messages: CoreMessage[] = [
  {
    role: "system",
    content: systemPrompt,
  },
];

async function main() {
  const currentDir = process.cwd();
  const mcpClient = await createMCPClient({
    transport: new StdioMCPTransport({
      command: "npx",
      args: [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        currentDir, // ここには読み書きを許可するディレクトリを指定
      ],
    }),
  });

  process.on("SIGINT", () => {
    mcpClient.close();
    process.exit(0);
  });
  process.on("SIGTERM", () => {
    mcpClient.close();
    process.exit(0);
  });

  const tools = await mcpClient.tools();

  while (true) {
    // ユーザーからの入力を待機
    const userInput = await terminal.question("You: ");

    // ユーザー入力をチャットの履歴として追加
    messages.push({ role: "user", content: userInput });

    // streamText 関数はストリーミングで応答を生成する
    const result = streamText({
      model: google("gemini-2.5-pro-exp-03-25"),
      messages,
      tools: {
        ...tools,
        shell: shellTool,
      },
      maxSteps: 20,
      onStepFinish: (step) => {
        console.log("\n\n");
      },
    });

    let fullResponse = "";

    terminal.write("\nAssistant: ");
    // ストリーミングをチャンクごとに処理
    for await (const delta of result.textStream) {
      fullResponse += delta;
      // 受信したチャンクを標準出力に書き込む
      terminal.write(delta);
    }
    terminal.write("\n\n");

    // チャットの履歴に AI の応答を追加
    messages.push({ role: "assistant", content: fullResponse });
  }
}

main().catch(console.error);
