"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
          setError(err instanceof Error ? err.message : "An unknown error occurred");
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
      <div style={styles.container}>
        <p style={styles.loadingText}>Loading Statistics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2>Error Loading Statistics</h2>
          <p>{error}</p>
          <Link href="/dashboard" style={styles.linkButton}>
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2>No Quiz Data Available</h2>
          <p>Take some quizzes to see your statistics!</p>
          <Link href="/quiz" style={styles.linkButton}>
            Start Quiz
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.pageContainer}>
      <header style={styles.header}>
        <h1>📊 Your Quiz Statistics</h1>
        <div style={styles.userInfo}>
          <span>Welcome, {session?.user?.name}!</span>
          <Link href="/dashboard" style={styles.backButton}>
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main style={styles.main}>
        {/* Overall Statistics */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <h3>Total Quizzes</h3>
            <div style={styles.statNumber}>{data.stats.totalQuizzes}</div>
          </div>
          <div style={styles.statCard}>
            <h3>Average Score</h3>
            <div style={{ ...styles.statNumber, color: getScoreColor(data.stats.averageScore) }}>
              {Math.round(data.stats.averageScore)}%
            </div>
            <div style={styles.statGrade}>Grade: {getGrade(data.stats.averageScore)}</div>
          </div>
          <div style={styles.statCard}>
            <h3>Best Score</h3>
            <div style={{ ...styles.statNumber, color: getScoreColor(data.stats.bestScore) }}>
              {data.stats.bestScore}%
            </div>
            <div style={styles.statGrade}>Grade: {getGrade(data.stats.bestScore)}</div>
          </div>
          <div style={styles.statCard}>
            <h3>Total Accuracy</h3>
            <div style={styles.statNumber}>
              {data.stats.totalCorrect}/{data.stats.totalQuestions}
            </div>
            <div style={styles.statSubtext}>
              {Math.round((data.stats.totalCorrect / data.stats.totalQuestions) * 100)}% overall
            </div>
          </div>
        </div>

        {/* Recent Results */}
        <div style={styles.resultsSection}>
          <h2>Recent Quiz Results</h2>
          {data.results.length === 0 ? (
            <p>No quiz results yet. Take your first quiz!</p>
          ) : (
            <div style={styles.resultsList}>
              {data.results.map((result, index) => (
                <div key={result._id} style={styles.resultCard}>
                  <div style={styles.resultHeader}>
                    <div style={styles.resultRank}>#{index + 1}</div>
                    <div style={styles.resultInfo}>
                      <div style={styles.resultDate}>{formatDate(result.date)}</div>
                      <div style={styles.resultTimeRange}>
                        {result.timeRange.replace("_", " ")}
                      </div>
                    </div>
                    <div style={styles.resultScore}>
                      <div
                        style={{
                          ...styles.resultPercentage,
                          color: getScoreColor(result.percentage),
                        }}
                      >
                        {result.percentage}%
                      </div>
                      <div style={styles.resultDetails}>
                        {result.score}/{result.totalQuestions}
                      </div>
                      <div style={styles.resultGrade}>{getGrade(result.percentage)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={styles.actionButtons}>
          <Link href="/quiz" style={styles.primaryButton}>
            Take Another Quiz
          </Link>
          <Link href="/dashboard" style={styles.secondaryButton}>
            Back to Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}

// --- Styling ---
const styles: { [key: string]: React.CSSProperties } = {
  pageContainer: {
    minHeight: "100vh",
    background: "#191414",
    fontFamily: "sans-serif",
    color: "white",
    padding: "20px",
  },
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    background: "#191414",
    fontFamily: "sans-serif",
    color: "white",
    padding: "20px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
    borderBottom: "1px solid #333",
    paddingBottom: "20px",
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
  },
  backButton: {
    padding: "8px 16px",
    backgroundColor: "#333",
    color: "white",
    textDecoration: "none",
    borderRadius: "5px",
    fontSize: "0.9em",
  },
  main: {
    maxWidth: "1200px",
    margin: "0 auto",
  },
  loadingText: {
    fontSize: "2em",
    textAlign: "center",
  },
  card: {
    background: "#282828",
    padding: "2em",
    borderRadius: "10px",
    textAlign: "center",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "20px",
    marginBottom: "40px",
  },
  statCard: {
    background: "#282828",
    padding: "25px",
    borderRadius: "10px",
    textAlign: "center",
    border: "1px solid #333",
  },
  statNumber: {
    fontSize: "2.5em",
    fontWeight: "bold",
    margin: "10px 0",
    color: "#1DB954",
  },
  statGrade: {
    fontSize: "1.1em",
    color: "#aaa",
    marginTop: "5px",
  },
  statSubtext: {
    fontSize: "0.9em",
    color: "#aaa",
    marginTop: "5px",
  },
  resultsSection: {
    marginBottom: "40px",
  },
  resultsList: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    marginTop: "20px",
  },
  resultCard: {
    background: "#282828",
    padding: "20px",
    borderRadius: "8px",
    border: "1px solid #333",
  },
  resultHeader: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },
  resultRank: {
    fontSize: "1.2em",
    fontWeight: "bold",
    color: "#1DB954",
    minWidth: "40px",
  },
  resultInfo: {
    flex: 1,
  },
  resultDate: {
    fontSize: "1em",
    marginBottom: "5px",
  },
  resultTimeRange: {
    fontSize: "0.8em",
    color: "#aaa",
    textTransform: "capitalize",
  },
  resultScore: {
    textAlign: "right",
  },
  resultPercentage: {
    fontSize: "1.5em",
    fontWeight: "bold",
  },
  resultDetails: {
    fontSize: "0.9em",
    color: "#aaa",
    marginTop: "2px",
  },
  resultGrade: {
    fontSize: "0.8em",
    color: "#aaa",
    marginTop: "2px",
  },
  actionButtons: {
    display: "flex",
    justifyContent: "center",
    gap: "20px",
    marginTop: "40px",
  },
  primaryButton: {
    padding: "15px 30px",
    backgroundColor: "#1DB954",
    color: "white",
    textDecoration: "none",
    borderRadius: "50px",
    fontSize: "1.1em",
    fontWeight: "bold",
  },
  secondaryButton: {
    padding: "15px 30px",
    backgroundColor: "#555",
    color: "white",
    textDecoration: "none",
    borderRadius: "50px",
    fontSize: "1.1em",
  },
  linkButton: {
    display: "inline-block",
    padding: "10px 20px",
    backgroundColor: "#1DB954",
    color: "white",
    textDecoration: "none",
    borderRadius: "5px",
    marginTop: "15px",
  },
};
