import { tool } from "ai";
import z from "zod";
import fs from "fs/promises";
import path from "path";
import * as readline from "node:readline/promises";

// ユーザーに確認を求める関数
const confirm = async (message: string): Promise<string> => {
  const terminal = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const answer = await terminal.question(`${message} (y/n) `);

  terminal.close();
  return answer;
};

export const list_directory = tool({
  description:
    "指定されたディレクトリの内容（ファイルとサブディレクトリ）のリストを取得します。",
  parameters: z.object({
    path: z.string().describe("内容をリストするディレクトリのパス"),
  }),
  execute: async ({ path: dirPath }) => {
    const answer = await confirm(
      `次のディレクトリのリストを取得しますか？ ${dirPath}`
    );
    if (answer.toLowerCase() !== "y") {
      return "Directory listing cancelled by user.";
    }
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const result = entries.map((entry) => ({
        name: entry.name,
        isDirectory: entry.isDirectory(),
      }));
      return result;
    } catch (error: any) {
      return `Error listing directory ${dirPath}: ${error.message}`;
    }
  },
});

export const read_file = tool({
  description: "指定されたファイルのコンテンツを読み取ります。",
  parameters: z.object({
    path: z.string().describe("読み取るファイルのパス"),
  }),
  execute: async ({ path: filePath }) => {
    const answer = await confirm(`次のファイルを読み込みますか？ ${filePath}`);
    if (answer.toLowerCase() !== "y") {
      return "File reading cancelled by user.";
    }
    try {
      const content = await fs.readFile(filePath, "utf-8");
      return content;
    } catch (error: any) {
      return `Error reading file ${filePath}: ${error.message}`;
    }
  },
});

export const write_file = tool({
  description:
    "指定されたパスにファイルを作成または上書きします。必要な親ディレクトリも作成されます。",
  parameters: z.object({
    path: z.string().describe("書き込むファイルのパス"),
    content: z.string().describe("ファイルに書き込むコンテンツ"),
  }),
  execute: async ({ path: filePath, content }) => {
    const answer = await confirm(
      `次のファイルの作成を許可しますか？ ${filePath}
      コンテンツ: ${content} (y/n) `
    );
    if (answer.toLowerCase() !== "y") {
      return "File writing cancelled by user.";
    }
    try {
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });

      await fs.writeFile(filePath, content, "utf-8");
      return `File written successfully to ${filePath}`;
    } catch (error: any) {
      return `Error writing file ${filePath}: ${error.message}`;
    }
  },
});

export const create_directory = tool({
  description:
    "指定されたパスに新しいディレクトリを作成します。必要に応じて親ディレクトリも作成します。",
  parameters: z.object({
    path: z.string().describe("作成するディレクトリのパス"),
  }),
  execute: async ({ path: dirPath }) => {
    const answer = await confirm(`次のディレクトリを作成しますか？ ${dirPath}`);
    if (answer.toLowerCase() !== "y") {
      return "Directory creation cancelled by user.";
    }
    try {
      await fs.mkdir(dirPath, { recursive: true });
      return `Directory created successfully at ${dirPath}`;
    } catch (error: any) {
      if (error.code === "EEXIST") {
        return `Directory already exists at ${dirPath}`;
      }
      return `Error creating directory ${dirPath}: ${error.message}`;
    }
  },
});

export const edit_file = tool({
  description:
    "指定されたファイル内のテキストを検索し、指定された新しいテキストで置き換えます。削除する場合は、replace_with を空文字列にします。",
  parameters: z.object({
    path: z.string().describe("編集するファイルのパス"),
    search_text: z.string().describe("検索して置き換える対象のテキスト"),
    replace_with: z.string().describe("search_text を置き換える新しいテキスト"),
  }),
  execute: async ({ path: filePath, search_text, replace_with }) => {
    const answer = await confirm(
      `次のファイルの編集を許可しますか？ ${filePath}
      search_text: ${search_text}
      replace_with: ${replace_with}`
    );

    // 「y」以外の入力があった場合は、ユーザーからコードを修正すべきフィードバックがあったという想定
    if (answer.toLowerCase() !== "y") {
      return `File editing cancelled by user.
      feedback: ${answer}
      `;
    }
    try {
      let content = await fs.readFile(filePath, "utf-8");

      const originalContent = content;
      content = content.replace(search_text, replace_with);

      if (content === originalContent) {
        return `Warning: search_text "${search_text}" not found in ${filePath}. File not modified.`;
      }

      await fs.writeFile(filePath, content, "utf-8");
      return `File ${filePath} edited successfully.`;
    } catch (error: any) {
      return `Error editing file ${filePath}: ${error.message}`;
    }
  },
});
