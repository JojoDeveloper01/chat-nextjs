# Chat NextJS Application

A real-time chat application built with Next.js, Socket.IO, and Prisma.

## Prerequisites

- Node.js 16.x or higher
- PostgreSQL database
- npm or yarn package manager

## Setup Instructions

1. **Clone the repository**
```bash
git clone https://github.com/JojoDeveloper01/chat-nextjs
cd chat-nextjs
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
Create a `.env` file in the root directory with:
```env
DATABASE_URL="postgresql://username:password@localhost:3000/database_name"
JWT_SECRET="your-jwt-secret"
```

4. **Database Setup**
```bash
# Run Prisma migrations
npx prisma migrate dev
# Generate Prisma client
npx prisma generate
```

5. **Development Server**
```bash
npm run dev
```
The application will be available at `http://localhost:3000`

## Features

- Real-time messaging
- User authentication
- Chat history
- Message editing and deletion
- Online/offline status
- Soft delete for chats and messages

## Tech Stack

- Next.js 15.3.1
- Socket.IO
- Prisma (PostgreSQL)
- TypeScript
- TailwindCSS
- Zustand for state management

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint