import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import UserModel from "@/models/User";
import QuizResultModel from "@/models/QuizResult";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { score, totalQuestions, timeRange, tracks } = await req.json();

    if (typeof score !== 'number' || typeof totalQuestions !== 'number') {
      return NextResponse.json({ error: "Invalid score data" }, { status: 400 });
    }

    await dbConnect();

    // Find the user to get their ID and name
    const user = await UserModel.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate percentage
    const percentage = Math.round((score / totalQuestions) * 100);

    // Create new quiz result document
    const quizResult = new QuizResultModel({
      userId: user._id,
      userEmail: user.email,
      userName: user.name,
      score,
      totalQuestions,
      percentage,
      timeRange: timeRange || 'medium_term',
      tracks: tracks || [], // Optional detailed track results
    });

    await quizResult.save();

    console.log(`Quiz result saved for user ${user.email}: ${score}/${totalQuestions} (${percentage}%)`);

    return NextResponse.json({
      message: "Quiz result saved successfully",
      result: {
        id: quizResult._id,
        score,
        totalQuestions,
        percentage,
        date: quizResult.date,
      }
    });

  } catch (error) {
    console.error("Error saving quiz result:", error);
    return NextResponse.json(
      { error: "Failed to save quiz result" },
      { status: 500 }
    );
  }
}
