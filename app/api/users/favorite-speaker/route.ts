import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import User from "@/models/User";
import { connectToDatabase } from "@/lib/mongodb";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { speakerId } = await request.json();

    if (!speakerId) {
      return NextResponse.json({ error: "Missing speakerId" }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Add speakerId to favoriteSpeakers if not already present
    if (!user.favoriteSpeakers) {
      user.favoriteSpeakers = [];
    }
    if (!user.favoriteSpeakers.includes(speakerId)) {
      user.favoriteSpeakers.push(speakerId);
      await user.save();
    }

    return NextResponse.json({ message: "Speaker added to favorites" });
  } catch (error) {
    console.error("Error adding favorite speaker:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
