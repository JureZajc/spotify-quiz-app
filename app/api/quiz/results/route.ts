import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import QuizResultModel from "@/models/QuizResult";
import UserModel from "@/models/User";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const page = parseInt(searchParams.get("page") || "1");
    const userId = searchParams.get("userId"); // Optional: get results for specific user

    await dbConnect();

    let query = {};

    if (userId) {
      // Get results for specific user (for admin/comparison features)
      query = { userId };
    } else {
      // Get results for current user
      const user = await UserModel.findOne({ email: session.user.email });
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      query = { userId: user._id };
    }

    // Get paginated results sorted by date (newest first)
    const results = await QuizResultModel
      .find(query)
      .sort({ date: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .select('-tracks') // Exclude detailed track results for performance
      .lean();

    // Get total count for pagination
    const totalResults = await QuizResultModel.countDocuments(query);

    // Calculate user stats
    const stats = await QuizResultModel.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalQuizzes: { $sum: 1 },
          averageScore: { $avg: "$percentage" },
          bestScore: { $max: "$percentage" },
          totalCorrect: { $sum: "$score" },
          totalQuestions: { $sum: "$totalQuestions" }
        }
      }
    ]);

    return NextResponse.json({
      results,
      pagination: {
        page,
        limit,
        total: totalResults,
        pages: Math.ceil(totalResults / limit)
      },
      stats: stats[0] || {
        totalQuizzes: 0,
        averageScore: 0,
        bestScore: 0,
        totalCorrect: 0,
        totalQuestions: 0
      }
    });

  } catch (error) {
    console.error("Error fetching quiz results:", error);
    return NextResponse.json(
      { error: "Failed to fetch quiz results" },
      { status: 500 }
    );
  }
}
