// app/api/chat/process/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Chat from "@/models/Chat";
import OpenAI from "openai";
import { saveWebsite as webCloner } from "@/lib/cloner";
import axios from "axios";
import { exec } from "child_process";
import path from "path";

const client = new OpenAI({
  baseURL: process.env.BASE_URL!,
  apiKey: process.env.OPENAI_API_KEY!,
});

// ---------------------
// TOOL DEFINITIONS
// ---------------------
async function getWeatherDetailsByCity(cityname = "") {
  const url = `https://wttr.in/${cityname.toLowerCase()}?format=%C+%t`;
  const { data } = await axios.get(url, { responseType: "text" });
  return `The current weather of ${cityname} is ${data}`;
}

async function executeCommand(cmd = "") {
  return new Promise((res) => {
    exec(cmd, (error, data) => {
      if (error) return res(`Error running command: ${error}`);
      res(data);
    });
  });
}

async function getGithubUserInfoByUsername(username = "") {
  const url = `https://api.github.com/users/${username.toLowerCase()}`;
  const { data } = await axios.get(url);
  return JSON.stringify({
    login: data.login,
    id: data.id,
    name: data.name,
    location: data.location,
    twitter_username: data.twitter_username,
    public_repos: data.public_repos,
    public_gists: data.public_gists,
    followers: data.followers,
    following: data.following,
  });
}

const TOOL_MAP: Record<string, (input: string) => Promise<string | unknown>> = {
  webCloner: async (input: string) => {
    console.log("🛠️ Running webCloner with input:", input);

    const siteId = Date.now().toString(); // unique folder id
    const outputDir = path.join("./public/cloned-sites", siteId);

    const result = await webCloner(input, outputDir);
    console.log("✅ webCloner finished:", result);

    return { siteId, ...result };
  },
  getWeatherDetailsByCity,
  getGithubUserInfoByUsername,
  executeCommand,
};

// ---------------------
// SYSTEM PROMPT
// ---------------------
const SYSTEM_PROMPT = `
You are an AI assistant who works in START, THINK, TOOL, OBSERVE, OUTPUT format.
For any user query, you must first think step by step and break it into smaller steps
before generating the final output.

You also have access to special tools.  
You should only call a tool if it is explicitly required to solve the query.
When calling a tool, output a TOOL step and wait — do NOT generate an OBSERVE step yourself.
The system will insert OBSERVE after running the tool.

Available Tools:
- webCloner(url: string): Clones the given website and saves it locally (pixel-perfect copy) Note: URL FORMET -> https://www.example.com
- getWeatherDetailsByCity(cityname: string): Returns the current weather of a given city.
- getGithubUserInfoByUsername(username: string): Returns public GitHub user info.
- executeCommand(command: string): Executes a Linux/Unix command and returns the output.

Rules:
- Strictly follow JSON output format.
- Always output one step at a time and wait for OBSERVE before continuing.
- Always do multiple THINK steps before OUTPUT.
- Never jump directly to OUTPUT without reasoning.

Output JSON Format:
{ "step": "START | THINK | TOOL | OBSERVE | OUTPUT", "content": "string", "tool_name": "string", "input": "string" }
`;

// ---------------------
// API Route
// ---------------------
export async function POST(req: Request) {
  try {
    const { chatId, prompt } = await req.json();
    if (!chatId || !prompt) {
      return NextResponse.json(
        { success: false, error: "chatId and prompt required" },
        { status: 400 }
      );
    }

    await connectDB();
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return NextResponse.json(
        { success: false, error: "Chat not found" },
        { status: 404 }
      );
    }

    // Initialize conversation
    const messages: any[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...chat.messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
      { role: "user", content: prompt },
    ];

    // Save user message in DB
    chat.messages.push({
      role: "user",
      content: prompt,
      timestamp: new Date(),
    });

    let finalReply = "";
    let lastTool: string | null = null;
    let lastToolResult: any = null;

    while (true) {
      const response = await client.chat.completions.create({
        model: process.env.MODEL_NAME!,
        messages,
      });

      const rawContent = response.choices[0].message?.content;
      if (!rawContent) break;

      let parsed: any;
      try {
        parsed = JSON.parse(rawContent);
      } catch {
        // 🚨 Ignore non-JSON steps like START/THINK text
        console.warn("⚠️ Non-JSON response ignored:", rawContent);
        continue;
      }

      // Always log assistant reasoning
      messages.push({ role: "assistant", content: JSON.stringify(parsed) });

      if (parsed.step === "OUTPUT") {
        finalReply = parsed.content;
        break; // ✅ only break here
      }

      if (parsed.step === "TOOL") {
        const toolToCall = parsed.tool_name;
        if (!TOOL_MAP[toolToCall]) {
          messages.push({
            role: "developer",
            content: JSON.stringify({
              step: "OBSERVE",
              content: `❌ Tool ${toolToCall} not found`,
            }),
          });
          continue;
        }

        const result = await TOOL_MAP[toolToCall](parsed.input);
        lastTool = toolToCall;
        lastToolResult = result;

        messages.push({
          role: "developer",
          content: JSON.stringify({ step: "OBSERVE", content: result }),
        });
        continue;
      }

      // 🚨 Ignore START / THINK / OBSERVE (don’t break)
      if (["START", "THINK", "OBSERVE"].includes(parsed.step)) {
        continue;
      }

      console.warn("⚠️ Unknown step ignored:", parsed);
    }

    // // Save assistant final reply
    // chat.messages.push({
    //   role: "assistant",
    //   content: finalReply,
    //   timestamp: new Date(),
    // });
    chat.lastMessage = finalReply;
    chat.updatedAt = new Date();
    await chat.save();

    // Build extra metadata if webCloner was used
    if (lastTool === "webCloner" && lastToolResult?.siteId) {
      const siteId = lastToolResult.siteId;

      // Append markdown links directly to final reply
      finalReply += `
            \n\n\n<div class="flex gap-3 mt-2">
              <a
                href="/editor/${siteId}" target="_blank"
                class="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg shadow hover:bg-blue-700 transition-transform transform hover:-translate-y-0.5"
              >
                🔍 Preview Site
              </a>
              <a
                href="/api/download-zip?dir=${encodeURIComponent(`./public/cloned-sites/${siteId}`)}" target="_blank"
                class="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg shadow hover:bg-green-700 transition-transform transform hover:-translate-y-0.5"
              >
                ⬇️ Download ZIP
              </a>
            </div>

      `;
    }

    // Save assistant final reply
    chat.messages.push({
      role: "assistant",
      content: finalReply,
      timestamp: new Date(),
    });
    chat.lastMessage = finalReply;
    chat.updatedAt = new Date();
    await chat.save();

    return NextResponse.json({
      success: true,
      reply: finalReply,
    });
  } catch (err) {
    console.error("Error in /chat/process:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
