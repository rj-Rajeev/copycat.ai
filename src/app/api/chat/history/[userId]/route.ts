// app/api/chat/history/[userId]/route.ts
import { connectDB } from "@/lib/mongodb";
import Chat from "@/models/Chat";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;

  try {
    await connectDB();
    const chats = await Chat.find({ userId })
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json({ success: true, chats });
  } catch (err) {
    console.error("Error loading chats:", err);
    return NextResponse.json(
      { success: false, error: "Failed to load chats" },
      { status: 500 }
    );
  }
}
