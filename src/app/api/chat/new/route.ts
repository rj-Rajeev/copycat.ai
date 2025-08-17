// src/app/api/chat/new/route.ts
import { connectDB } from "@/lib/mongodb";
import Chat from "@/models/Chat";
import User from "@/models/User";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    let { message, userId } = body;

    if (
      !message ||
      typeof message !== "object" ||
      !message.role ||
      !message.content
    ) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // If no valid userId → create one
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      const newUser = await User.create({});
      userId = newUser._id.toString();
    }

    const newChat = await Chat.create({
      userId,
      title: message.content.slice(0, 50),
      messages: [message],
    });

    return NextResponse.json(
      { success: true, chat: newChat, userId },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating chat:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
