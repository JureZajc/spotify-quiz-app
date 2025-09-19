"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// --- Type Definitions ---
interface QuizOption {
    id: string;
    name: string;
    artist: string;
}

interface QuizQuestion {
    preview_url: string;
    correct_answer_id: string;
    options: QuizOption[];
}

type GameState = "loading" | "ready" | "playing" | "finished" | "error";

export default function QuizPage() {
    const router = useRouter();
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [gameState, setGameState] = useState<GameState>("loading");
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);
    const [topTracks, setTopTracks] = useState<any[]>([]);
    const [selectedTimeRange, setSelectedTimeRange] = useState<string>("medium_term");

    // --- Fetch quiz data on mount ---
    useEffect(() => {
        // Get time range from URL params if provided
        const urlParams = new URLSearchParams(window.location.search);
        const timeRangeParam = urlParams.get('time_range');
        let currentTimeRange = "medium_term"; // default

        if (timeRangeParam && ['short_term', 'medium_term', 'long_term'].includes(timeRangeParam)) {
            currentTimeRange = timeRangeParam;
            setSelectedTimeRange(timeRangeParam);
        }

        const fetchQuizData = async () => {
            setGameState("loading");
            try {
                const res = await fetch("/api/quiz", { credentials: "include" });
                if (!res.ok) {
                    setGameState("error");
                    return;
                }
                const data: QuizQuestion[] = await res.json();
                setQuestions(data);
                setGameState("ready"); // Wait for user to start
            } catch (error) {
                setGameState("error");
            }
        };

        const fetchTopTracks = async () => {
            try {
                console.log(`Fetching tracks for time range: ${currentTimeRange}`);
                const res = await fetch(`/api/spotify/top-items?time_range=${currentTimeRange}`, { credentials: "include" });
                if (res.ok) {
                    const data = await res.json();
                    console.log(`Fetched ${data.tracks?.length || 0} tracks for ${currentTimeRange}`);
                    setTopTracks(data.tracks || []);
                }
            } catch {}
        };

        fetchQuizData();
        fetchTopTracks();
    }, [router]); // Remove selectedTimeRange from dependencies to avoid double fetch

    // --- Play audio when question changes ---
    useEffect(() => {
        if (gameState !== "playing") return;

        const audio = audioRef.current;
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
            audio.load();
            audio
                .play()
                .catch((err) => console.error("Audio playback failed:", err));
        }
    }, [currentQuestionIndex, gameState]);

    const handleStartQuiz = () => {
        setGameState("playing");
    };

    const handleAnswerClick = (answerId: string) => {
        if (isAnswered) return;

        setSelectedAnswer(answerId);
        setIsAnswered(true);

        if (answerId === questions[currentQuestionIndex].correct_answer_id) {
            setScore((prev) => prev + 1);
        }
    };

    const handleNextQuestion = () => {
        setIsAnswered(false);
        setSelectedAnswer(null);

        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex((prev) => prev + 1);
        } else {
            setGameState("finished");
        }
    };

    const handlePlayAgain = () => {
        setQuestions([]);
        setCurrentQuestionIndex(0);
        setScore(0);
        setGameState("loading");
        setIsAnswered(false);
        setSelectedAnswer(null);

        const fetchQuizData = async () => {
            try {
                const res = await fetch("/api/quiz", { credentials: "include" });
                if (!res.ok) throw new Error("Failed to load quiz.");
                const data = await res.json();
                setQuestions(data);
                setGameState("ready");
            } catch (error) {
                router.push("/dashboard");
            }
        };
        fetchQuizData();
    };

    // --- Preview Checker UI ---
    function PreviewChecker() {
        const [song, setSong] = useState("");
        const [artist, setArtist] = useState("");
        const [result, setResult] = useState<{ preview_url: string; track: string; artist: string } | null>(null);
        const [error, setError] = useState<string | null>(null);
        const [loading, setLoading] = useState(false);

        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            setResult(null);
            setError(null);
            setLoading(true);
            try {
                const res = await fetch("/api/preview-check", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ song, artist }),
                });
                const data = await res.json();
                if (res.ok) {
                    setResult(data);
                } else {
                    setError(data.error || "No preview found.");
                }
            } catch (err) {
                setError("Error checking preview.");
            } finally {
                setLoading(false);
            }
        };

        return (
            <div style={{ background: "#222", padding: 20, borderRadius: 10, marginBottom: 30 }}>
                <h3>Check Spotify Preview for Any Song</h3>
                <form onSubmit={handleSubmit} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <input
                        type="text"
                        placeholder="Song Title"
                        value={song}
                        onChange={e => setSong(e.target.value)}
                        style={{ flex: 1, padding: 8, borderRadius: 5, border: "1px solid #444" }}
                        required
                    />
                    <input
                        type="text"
                        placeholder="Artist"
                        value={artist}
                        onChange={e => setArtist(e.target.value)}
                        style={{ flex: 1, padding: 8, borderRadius: 5, border: "1px solid #444" }}
                        required
                    />
                    <button type="submit" style={{ padding: "8px 20px", borderRadius: 5, background: "#1DB954", color: "white", border: "none" }} disabled={loading}>
                        {loading ? "Checking..." : "Check Preview"}
                    </button>
                </form>
                {result && (
                    <div style={{ marginTop: 15 }}>
                        <div><b>Track:</b> {result.track} <b>Artist:</b> {result.artist}</div>
                        <audio src={result.preview_url} controls style={{ marginTop: 10 }} />
                    </div>
                )}
                {error && <div style={{ color: "#f55", marginTop: 10 }}>{error}</div>}
            </div>
        );
    }

    // --- Top Tracks List UI ---
    function TopTracksList({ tracks }: { tracks: any[] }) {
        const [enhancedTracks, setEnhancedTracks] = useState<any[]>([]);
        const [enhancing, setEnhancing] = useState(false);

        useEffect(() => {
            setEnhancedTracks(tracks);
        }, [tracks]);

        const enhanceTrackPreviews = async () => {
            setEnhancing(true);
            const enhanced = [];
            for (const track of tracks) {
                if (track.preview_url) {
                    enhanced.push(track);
                } else {
                    try {
                        const res = await fetch("/api/preview-check", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                song: track.name,
                                artist: track.artists.map((a: any) => a.name).join(", ")
                            }),
                        });
                        if (res.ok) {
                            const previewData = await res.json();
                            enhanced.push({ ...track, preview_url: previewData.preview_url });
                        } else {
                            enhanced.push(track);
                        }
                    } catch {
                        enhanced.push(track);
                    }
                }
            }
            setEnhancedTracks(enhanced);
            setEnhancing(false);
        };

        return (
            <div style={{ background: "#222", padding: 20, borderRadius: 10, marginBottom: 30 }}>
                <h3>Your Top Tracks (with Preview)</h3>
                <button
                    onClick={enhanceTrackPreviews}
                    disabled={enhancing}
                    style={{ padding: "8px 15px", marginBottom: 15, borderRadius: 5, background: "#1DB954", color: "white", border: "none" }}
                >
                    {enhancing ? "Finding Previews..." : "Find Missing Previews"}
                </button>
                <ol style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                    {enhancedTracks.map((track, idx) => (
                        <li key={track.id} style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ minWidth: 24, color: '#aaa' }}>{idx + 1}.</span>
                            <span><b>{track.name}</b> <span style={{ color: '#aaa' }}>by</span> {track.artists.map((a: any) => a.name).join(", ")}</span>
                            {track.preview_url ? (
                                <audio src={track.preview_url} controls style={{ height: 24, marginLeft: 10 }} />
                            ) : (
                                <span style={{ color: '#f55', marginLeft: 10 }}>No Preview</span>
                            )}
                        </li>
                    ))}
                </ol>
            </div>
        );
    }

    // --- Free Text Quiz State ---
    const [freeTextMode, setFreeTextMode] = useState(true); // Enable free text mode
    const [userArtist, setUserArtist] = useState("");
    const [userTitle, setUserTitle] = useState("");
    const [freeTextFeedback, setFreeTextFeedback] = useState<string | null>(null);
    const [currentTrack, setCurrentTrack] = useState<any | null>(null);
    const [loadingNextTrack, setLoadingNextTrack] = useState(false);
    const [availableTracks, setAvailableTracks] = useState<any[]>([]);
    const [usedTrackIds, setUsedTrackIds] = useState<Set<string>>(new Set());

    // Helper: Normalize string for comparison
    function normalize(str: string) {
        return str.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ");
    }
    // Helper: Simple typo-tolerant check (Levenshtein distance <= 2)
    function isClose(a: string, b: string) {
        if (normalize(a) === normalize(b)) return true;
        // Levenshtein distance
        const m = a.length, n = b.length;
        const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
        for (let i = 0; i <= m; i++) dp[i][0] = i;
        for (let j = 0; j <= n; j++) dp[0][j] = j;
        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                dp[i][j] = Math.min(
                    dp[i - 1][j] + 1,
                    dp[i][j - 1] + 1,
                    dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
                );
            }
        }
        return dp[m][n] <= 2;
    }

    // Helper: Get a random track with preview
    const getRandomTrackWithPreview = async (): Promise<any | null> => {
        // First, try tracks that already have preview_url
        const tracksWithPreview = topTracks.filter(t => t.preview_url && !usedTrackIds.has(t.id));
        if (tracksWithPreview.length > 0) {
            const randomTrack = tracksWithPreview[Math.floor(Math.random() * tracksWithPreview.length)];
            return randomTrack;
        }

        // If no tracks with preview_url, try to find one using spotify-preview-finder
        const tracksWithoutPreview = topTracks.filter(t => !t.preview_url && !usedTrackIds.has(t.id));
        for (const track of tracksWithoutPreview) {
            try {
                const res = await fetch("/api/preview-check", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        song: track.name,
                        artist: track.artists.map((a: any) => a.name).join(", ")
                    }),
                });
                if (res.ok) {
                    const previewData = await res.json();
                    return { ...track, preview_url: previewData.preview_url };
                }
            } catch {
                continue;
            }
        }
        return null; // No more tracks with previews
    };

    // Load first track when topTracks is available
    useEffect(() => {
        if (topTracks.length > 0 && !currentTrack && freeTextMode) {
            const loadFirstTrack = async () => {
                setLoadingNextTrack(true);
                const track = await getRandomTrackWithPreview();
                if (track) {
                    setCurrentTrack(track);
                    setUsedTrackIds(prev => new Set(prev).add(track.id));
                }
                setLoadingNextTrack(false);
            };
            loadFirstTrack();
        }
    }, [topTracks, currentTrack, freeTextMode]);

    const [freeTextScore, setFreeTextScore] = useState(0);
    const [totalQuestions, setTotalQuestions] = useState(0);
    const [maxQuestions] = useState(3); // Limit to 3 songs for testing
    const [savingResult, setSavingResult] = useState(false);
    const [quizTracks, setQuizTracks] = useState<any[]>([]); // Store tracks and answers for saving

    function handleFreeTextSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!currentTrack) return;

        setFreeTextFeedback(null);
        const correctArtist = currentTrack.artists.map((a: any) => a.name).join(", ");
        const correctTitle = currentTrack.name;
        const artistCorrect = isClose(userArtist, correctArtist);
        const titleCorrect = isClose(userTitle, correctTitle);
        const isCorrect = artistCorrect && titleCorrect;

        setTotalQuestions(prev => prev + 1);

        // Store track result for saving later
        const trackResult = {
            trackId: currentTrack.id,
            trackName: currentTrack.name,
            artist: correctArtist,
            correct: isCorrect,
            userAnswer: {
                artist: userArtist,
                title: userTitle
            }
        };
        setQuizTracks(prev => [...prev, trackResult]);

        if (isCorrect) {
            setFreeTextFeedback("✅ Correct!");
            setFreeTextScore(s => s + 1);
        } else {
            setFreeTextFeedback(
                `❌ Wrong. Artist: ${correctArtist}, Title: ${correctTitle}`
            );
        }

        // Check if quiz should end (3 questions completed)
        const newTotalQuestions = totalQuestions + 1;
        if (newTotalQuestions >= maxQuestions) {
            // Save result to database with track details
            setTimeout(async () => {
                setSavingResult(true);
                try {
                    const finalScore = isCorrect ? freeTextScore + 1 : freeTextScore;
                    const finalTracks = [...quizTracks, trackResult];
                    await fetch("/api/quiz/save-result", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            score: finalScore,
                            totalQuestions: newTotalQuestions,
                            timeRange: selectedTimeRange, // Use the actual selected time range
                            tracks: finalTracks
                        }),
                        credentials: "include"
                    });
                } catch (error) {
                    console.error("Failed to save quiz result:", error);
                }
                setSavingResult(false);
                setCurrentTrack(null); // This will trigger the quiz finished state
            }, 1800);
            return;
        }

        // Load next track after showing feedback
        setTimeout(async () => {
            setUserArtist("");
            setUserTitle("");
            setFreeTextFeedback(null);
            setLoadingNextTrack(true);

            const nextTrack = await getRandomTrackWithPreview();
            if (nextTrack) {
                setCurrentTrack(nextTrack);
                setUsedTrackIds(prev => new Set(prev).add(nextTrack.id));
            } else {
                // No more tracks available
                setCurrentTrack(null);
            }
            setLoadingNextTrack(false);
        }, 1800);
    }

    function handleFreeTextRestart() {
        setFreeTextScore(0);
        setTotalQuestions(0);
        setUserArtist("");
        setUserTitle("");
        setFreeTextFeedback(null);
        setUsedTrackIds(new Set());
        setCurrentTrack(null);
        setQuizTracks([]); // Reset tracks array
        // Will trigger useEffect to load first track
    }

    // --- Rendering States ---
    if (freeTextMode) {
        // Show quiz finished if no more tracks
        if (totalQuestions > 0 && !currentTrack && !loadingNextTrack) {
            return (
                <div style={styles.container}>
                    <div style={{ width: "100%", maxWidth: 500 }}>
                        <PreviewChecker />
                        <div style={styles.quizCard}>
                            <h2>Quiz Finished!</h2>
                            <p style={styles.scoreText}>
                                Your Final Score: {freeTextScore} / {totalQuestions}
                            </p>
                            <button onClick={handleFreeTextRestart} style={styles.actionButton}>
                                Play Again
                            </button>
                            <Link href="/dashboard" style={styles.linkButton}>
                                Back to Dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            );
        }

        // Show current track quiz or loading
        if (currentTrack) {
            return (
                <div style={styles.container}>
                    <div style={{ width: "100%", maxWidth: 500 }}>
                        <PreviewChecker />
                        <div style={styles.quizCard}>
                            <h2>Type the Artist and Title</h2>
                            <p>Question {totalQuestions + 1} - Score: {freeTextScore}/{totalQuestions}</p>
                            <audio src={currentTrack.preview_url} controls autoPlay loop style={{ marginBottom: 20 }} />
                            <form onSubmit={handleFreeTextSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <input
                                    type="text"
                                    placeholder="Artist"
                                    value={userArtist}
                                    onChange={e => setUserArtist(e.target.value)}
                                    style={{ padding: 10, borderRadius: 5, border: '1px solid #444' }}
                                    autoFocus
                                    required
                                    disabled={!!freeTextFeedback}
                                />
                                <input
                                    type="text"
                                    placeholder="Title"
                                    value={userTitle}
                                    onChange={e => setUserTitle(e.target.value)}
                                    style={{ padding: 10, borderRadius: 5, border: '1px solid #444' }}
                                    required
                                    disabled={!!freeTextFeedback}
                                />
                                <button type="submit" style={{ ...styles.actionButton, marginTop: 0 }} disabled={!!freeTextFeedback}>
                                    Submit
                                </button>
                            </form>
                            {freeTextFeedback && <div style={{ marginTop: 15, fontWeight: 'bold' }}>{freeTextFeedback}</div>}
                            {loadingNextTrack && <div style={{ marginTop: 15, color: '#aaa' }}>Loading next track...</div>}
                        </div>
                    </div>
                </div>
            );
        }

        // Loading first track
        if (loadingNextTrack || topTracks.length === 0) {
            return (
                <div style={styles.container}>
                    <div style={{ width: "100%", maxWidth: 500 }}>
                        <PreviewChecker />
                        <div style={styles.quizCard}>
                            <h2>Loading Quiz...</h2>
                            <p>Finding a track with preview...</p>
                        </div>
                    </div>
                </div>
            );
        }

        // No tracks available
        return (
            <div style={styles.container}>
                <div style={{ width: "100%", maxWidth: 500 }}>
                    <PreviewChecker />
                    <div style={styles.quizCard}>
                        <h2>No Playable Tracks</h2>
                        <p>Couldn't find any of your top tracks with previews.</p>
                        <Link href="/dashboard" style={styles.linkButton}>
                            Back to Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // --- Rendering States ---
    if (gameState === "loading") {
        return (
            <div style={styles.container}>
                <p style={styles.loadingText}>Loading Your Quiz...</p>
            </div>
        );
    }

    if (gameState === "ready") {
        return (
            <div style={styles.container}>
                <div style={styles.quizCard}>
                    <h2>🎧 Ready to play?</h2>
                    <p>This quiz will play song previews from your Spotify top tracks.</p>
                    <button onClick={handleStartQuiz} style={styles.actionButton}>
                        Start Quiz
                    </button>
                </div>
            </div>
        );
    }

    if (gameState === "finished") {
        return (
            <div style={styles.container}>
                <div style={styles.resultsCard}>
                    <h1>Quiz Finished!</h1>
                    <p style={styles.scoreText}>
                        Your Final Score: {score} / {questions.length}
                    </p>
                    <button onClick={handlePlayAgain} style={styles.actionButton}>
                        Play Again
                    </button>
                    <Link href="/dashboard" style={styles.linkButton}>
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    if (gameState === "error") {
        return (
            <div style={styles.container}>
                <div style={{ width: "100%", maxWidth: 500 }}>
                    <PreviewChecker />
                    <div style={styles.quizCard}>
                        <h2>Quiz Unavailable</h2>
                        <p>Failed to load quiz. Do you have enough listening history?</p>
                        <p>You can still check for Spotify previews below, or see your top tracks above.</p>
                        <Link href="/dashboard" style={styles.linkButton}>
                            Back to Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) {
        return (
            <div style={styles.container}>
                <p style={styles.loadingText}>Preparing questions...</p>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={{ width: "100%", maxWidth: 500 }}>
                <PreviewChecker />
                <div style={styles.quizCard}>
                    <h2>
                        Question {currentQuestionIndex + 1} of {questions.length}
                    </h2>
                    <p>Guess the song!</p>

                    {/* Audio Player */}
                    <audio
                        ref={audioRef}
                        src={currentQuestion.preview_url}
                        autoPlay
                        loop
                    />

                    <div style={styles.optionsContainer}>
                        {currentQuestion.options.map((option) => {
                            const isCorrect = option.id === currentQuestion.correct_answer_id;
                            let backgroundColor = "#f0f0f0";
                            if (isAnswered) {
                                if (isCorrect) backgroundColor = "#28a745";
                                else if (selectedAnswer === option.id)
                                    backgroundColor = "#dc3545";
                            }

                            return (
                                <button
                                    key={option.id}
                                    onClick={() => handleAnswerClick(option.id)}
                                    disabled={isAnswered}
                                    style={{
                                        ...styles.optionButton,
                                        backgroundColor,
                                        color: isAnswered ? "white" : "black",
                                    }}
                                >
                                    <strong>{option.name}</strong>
                                    <br />
                                    <small>{option.artist}</small>
                                </button>
                            );
                        })}
                    </div>

                    {isAnswered && (
                        <button onClick={handleNextQuestion} style={styles.actionButton}>
                            {currentQuestionIndex < questions.length - 1
                                ? "Next Question"
                                : "Finish Quiz"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- Styling ---
const styles: { [key: string]: React.CSSProperties } = {
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
    loadingText: { fontSize: "2em" },
    quizCard: {
        background: "#282828",
        padding: "2em",
        borderRadius: "10px",
        width: "90%",
        maxWidth: "500px",
        textAlign: "center",
    },
    resultsCard: {
        background: "#282828",
        padding: "2em",
        borderRadius: "10px",
        textAlign: "center",
    },
    scoreText: { fontSize: "1.5em", margin: "20px 0" },
    optionsContainer: {
        margin: "20px 0",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
    },
    optionButton: {
        padding: "15px",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
        textAlign: "left",
        transition: "background-color 0.3s",
    },
    actionButton: {
        padding: "15px 30px",
        marginTop: "20px",
        border: "none",
        borderRadius: "50px",
        background: "#1DB954",
        color: "white",
        fontSize: "1em",
        cursor: "pointer",
        fontWeight: "bold",
    },
    linkButton: {
        display: "inline-block",
        padding: "15px 30px",
        marginTop: "10px",
        textDecoration: "none",
        borderRadius: "50px",
        background: "#555",
        color: "white",
        fontSize: "1em",
        cursor: "pointer",
    },
};
