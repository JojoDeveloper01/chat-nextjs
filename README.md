# Real-Time Chat Application with Next.js

A modern, real-time chat application built with Next.js 15.3, Socket.IO, and Prisma. Features include user authentication, real-time messaging, and a responsive UI.

![image](https://github.com/user-attachments/assets/281513d5-6d20-4169-80cc-cd46abd5fa0a)

## Features

- User authentication (Register/Login)
- Real-time messaging
- User presence detection
- Message deletion and editing
- Responsive design
- Dark mode UI

## Tech Stack & Architecture

### Frontend
- **Next.js 15.3**: App router for server-side rendering and API routes
- **React**: UI components and hooks for state management
- **TypeScript**: Type safety and better developer experience
- **TailwindCSS**: Utility-first CSS for responsive design
- **Socket.IO Client**: Real-time bidirectional communication
- **Zustand**: Lightweight state management with hooks

### Backend
- **Next.js API Routes**: RESTful API endpoints
- **Socket.IO Server**: WebSocket server for real-time features
- **Prisma ORM**: Type-safe database access
- **PostgreSQL**: Relational database for data persistence
- **JWT Authentication**: Secure user authentication
- **bcryptjs**: Password hashing for security

### Database Schema
```prisma
// prisma/schema.prisma

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password      String
  name          String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relationships
  sentChats     Chat[]    @relation("UserToChat")
  receivedChats Chat[]    @relation("ReceiverToChat")

  messages Message[]
}

model Chat {
  id            String    @id @default(cuid())
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Relationships
  userId        String
  user          User      @relation("UserToChat", fields: [userId], references: [id], onDelete: Cascade)
  receiverId    String
  receiver      User      @relation("ReceiverToChat", fields: [receiverId], references: [id], onDelete: Cascade)
  messages      Message[]

  // Visibility controls
  deletedForUser      Boolean   @default(false)
  deletedForReceiver  Boolean   @default(false)

  @@unique([userId, receiverId])
}

model Message {
  id            String    @id @default(cuid())
  content       String
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Relationships
  chatId        String
  chat          Chat      @relation(fields: [chatId], references: [id], onDelete: Cascade)
  senderId      String
  sender    User     @relation(fields: [senderId], references: [id])
  
  // Flags for editing and deletion
  isEdited      Boolean   @default(false)
  deletedForSender    Boolean   @default(false)
  deletedForReceiver  Boolean   @default(false)
}
```

## Prerequisites

- Node.js 16.x or higher
- PostgreSQL database
- Bun (recommended) or npm/pnpm/yarn

## Setup Instructions

1. **Clone the repository**
```bash
git clone https://github.com/JojoDeveloper01/chat-nextjs
cd chat-nextjs
```

2. **Install dependencies**
```bash
# Using bun (recommended)
bun install

# Or using npm
npm install
```

3. **Environment Setup**
Create a `.env` file in the root directory with:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"

# Authentication
JWT_SECRET="your-jwt-secret"

# Server (optional)
PORT=3000
HOST=localhost

# Socket.IO (optional)
NEXT_PUBLIC_SOCKET_URL="http://localhost:3000"
```

4. **Database Setup**
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev
```

5. **Run the development server**
```bash
# Using bun
bun run dev

# Or using npm
npm run dev
```

The application will be available at `http://localhost:3000`

## Project Structure

```
chat-nextjs/
├── src/
│   ├── app/              # Next.js 15.3 App Router
│   │   ├── api/         # API routes
│   │   ├── chat/       # Chat page
│   │   ├── hooks/      # Custom hooks
│   │   └── ...
│   ├── components/      # React components
│   │   ├── auth/       # Authentication components
│   │   └── ...
│   ├── lib/            # Utility functions
│   ├── store/          # State management
│   └── middleware.ts   # Next.js middleware
├── prisma/             # Database schema and migrations
├── public/            # Static assets
└── server.ts         # Custom server setup
```

## Available Scripts

- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run start` - Start production server
- `bun run lint` - Run ESLint
