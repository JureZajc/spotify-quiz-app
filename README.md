# 🎵 Spotify Quiz App

A fun interactive quiz application that tests your knowledge of your own Spotify music taste! Built with Next.js 15, this app uses the Spotify API to generate personalized music quizzes based on your top tracks.

## ✨ Features

- 🎧 **Personalized Quizzes**: Quiz questions generated from your actual Spotify listening history
- 🔐 **Spotify Authentication**: Secure OAuth integration with NextAuth.js
- 📊 **Multiple Time Ranges**: Analyzes your top tracks from short, medium, and long-term listening periods
- 🎵 **Audio Previews**: Listen to 30-second previews of songs in the quiz
- 💾 **Quiz History**: Saves your quiz results to MongoDB for tracking progress
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- ⚡ **Modern Stack**: Built with the latest Next.js 15 and React 19 features

## 🛠️ Technologies Used

### Frontend

- **[Next.js 15](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://react.dev/)** - UI library with Server Components
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe development
- **[NextAuth.js](https://next-auth.js.org/)** - Authentication solution

### Backend

- **[Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)** - Serverless API endpoints
- **[MongoDB](https://www.mongodb.com/)** - NoSQL database for user data
- **[Mongoose](https://mongoosejs.com/)** - MongoDB object modeling

### External APIs

- **[Spotify Web API](https://developer.spotify.com/documentation/web-api)** - Access user's top tracks and audio previews
- **[Spotify OAuth](https://developer.spotify.com/documentation/web-api/concepts/authorization)** - User authentication and authorization

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- A Spotify account
- MongoDB database (local or cloud)

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Spotify API Credentials
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# MongoDB Connection
MONGODB_URI=your_mongodb_connection_string
```

### Installation

1. Clone the repository:

```bash
git clone https://github.com/JureZajc/spotify-quiz-app.git
cd spotify-quiz-app
```

2. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up Spotify App:

   - Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Create a new app
   - Add `http://localhost:3000/api/auth/callback/spotify` to Redirect URIs
   - Copy Client ID and Client Secret to `.env.local`

4. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📁 Project Structure

```
spotify-quiz-app/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/         # NextAuth configuration
│   │   └── quiz/         # Quiz generation endpoint
│   ├── dashboard/        # User dashboard page
│   ├── quiz/            # Quiz page
│   └── page.tsx         # Home page
├── lib/                  # Utility functions
│   ├── auth.ts          # NextAuth configuration
│   └── mongodb.ts       # MongoDB connection
├── models/              # Mongoose models
│   └── User.ts         # User schema
└── public/             # Static assets
```

## 🎮 How It Works

1. **Authentication**: Users sign in with their Spotify account using OAuth 2.0
2. **Data Fetching**: The app fetches the user's top tracks from Spotify API across different time ranges
3. **Quiz Generation**: 10 questions are created with 4 multiple-choice options each
4. **Audio Playback**: Each question plays a 30-second preview of a song
5. **Score Tracking**: Results are saved to MongoDB and displayed on the dashboard

## 🔑 API Scopes

The app requests the following Spotify permissions:

- `user-read-email` - Access to user's email address
- `user-top-read` - Access to user's top tracks and artists
- `user-read-private` - Access to user's profile information

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/JureZajc/spotify-quiz-app/issues).

## 👨‍💻 Author

Your Name

- GitHub: [@JureZajc](https://github.com/JureZajc)

## 🙏 Acknowledgments

- [Spotify Web API](https://developer.spotify.com/documentation/web-api) for providing access to music data
- [Next.js](https://nextjs.org/) team for the amazing framework
- [Vercel](https://vercel.com/) for hosting and deployment solutions
