"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// --- Type Definitions ---
interface QuizResult {
  _id: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  timeRange: string;
  date: string;
  createdAt: string;
}

interface QuizStats {
  totalQuizzes: number;
  averageScore: number;
  bestScore: number;
  totalCorrect: number;
  totalQuestions: number;
}

interface ResultsData {
  results: QuizResult[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  stats: QuizStats;
}

export default function StatisticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If not authenticated, redirect to home page
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }

    if (status === "authenticated") {
      const fetchStats = async () => {
        setLoading(true);
        setError(null);
        try {
          const res = await fetch("/api/quiz/results?limit=10", {
            credentials: "include",
          });
          if (!res.ok) {
            throw new Error("Failed to fetch quiz results");
          }
          const result: ResultsData = await res.json();
          setData(result);
        } catch (err: unknown) {
          setError(
            err instanceof Error ? err.message : "An unknown error occurred"
          );
        } finally {
          setLoading(false);
        }
      };
      fetchStats();
    }
  }, [status, router]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "#28a745"; // Green
    if (percentage >= 60) return "#ffc107"; // Yellow
    return "#dc3545"; // Red
  };

  const getGrade = (percentage: number) => {
    if (percentage >= 90) return "A+";
    if (percentage >= 80) return "A";
    if (percentage >= 70) return "B";
    if (percentage >= 60) return "C";
    if (percentage >= 50) return "D";
    return "F";
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black text-white flex items-center justify-center p-4">
        <p className="text-xl">Loading Statistics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black text-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-center">
              Error Loading Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-red-500">{error}</p>
            <Button asChild className="bg-green-600 hover:bg-green-700">
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black text-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-center">
              No Quiz Data Available
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p>Take some quizzes to see your statistics!</p>
            <Button asChild className="bg-green-600 hover:bg-green-700">
              <Link href="/quiz">Start Quiz</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black text-white p-4 md:p-6">
      <header className="max-w-6xl mx-auto mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-zinc-800">
          <h1 className="text-2xl md:text-3xl font-bold">
            📊 Your Quiz Statistics
          </h1>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm md:text-base text-muted-foreground">
              Welcome, {session?.user?.name}!
            </span>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto space-y-8">
        {/* Overall Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium text-muted-foreground">
                Total Quizzes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl md:text-4xl font-bold text-green-600">
                {data.stats.totalQuizzes}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium text-muted-foreground">
                Average Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="text-3xl md:text-4xl font-bold"
                style={{ color: getScoreColor(data.stats.averageScore) }}
              >
                {Math.round(data.stats.averageScore)}%
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Grade: {getGrade(data.stats.averageScore)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium text-muted-foreground">
                Best Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="text-3xl md:text-4xl font-bold"
                style={{ color: getScoreColor(data.stats.bestScore) }}
              >
                {data.stats.bestScore}%
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Grade: {getGrade(data.stats.bestScore)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium text-muted-foreground">
                Total Accuracy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl md:text-4xl font-bold text-green-600">
                {data.stats.totalCorrect}/{data.stats.totalQuestions}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {Math.round(
                  (data.stats.totalCorrect / data.stats.totalQuestions) * 100
                )}
                % overall
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Results */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl">
              Recent Quiz Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.results.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No quiz results yet. Take your first quiz!
              </p>
            ) : (
              <div className="space-y-3">
                {data.results.map((result, index) => (
                  <div
                    key={result._id}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-lg bg-accent/50 hover:bg-accent transition-colors"
                  >
                    <Badge
                      variant="outline"
                      className="text-green-600 border-green-600 shrink-0"
                    >
                      #{index + 1}
                    </Badge>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="text-sm md:text-base">
                        {formatDate(result.date)}
                      </div>
                      <div className="text-xs md:text-sm text-muted-foreground capitalize">
                        {result.timeRange.replace("_", " ")}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div
                        className="text-xl md:text-2xl font-bold"
                        style={{ color: getScoreColor(result.percentage) }}
                      >
                        {result.percentage}%
                      </div>
                      <div className="text-xs md:text-sm text-muted-foreground">
                        {result.score}/{result.totalQuestions}
                      </div>
                      <Badge variant="secondary" className="mt-1">
                        {getGrade(result.percentage)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pb-8">
          <Button asChild size="lg" className="bg-green-600 hover:bg-green-700">
            <Link href="/quiz">Take Another Quiz</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
