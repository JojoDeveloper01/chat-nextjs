import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = (url: string) => {
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        if (!socketRef.current) {
            // Se estivermos no Railway, use a URL do Railway
            const socketUrl = process.env.NEXT_PUBLIC_RAILWAY_STATIC_URL || url || 
                (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
            socketRef.current = io(socketUrl, {
                reconnection: true,
                reconnectionAttempts: Infinity,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                timeout: 20000,
                autoConnect: true,
                transports: ['websocket', 'polling'],
                withCredentials: false
            });
        }
    }, [url]);

    return socketRef.current;
};