import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = (url: string) => {
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        if (!socketRef.current) {
            // Garante que a URL base está correta
            let socketUrl = process.env.NEXT_PUBLIC_RAILWAY_STATIC_URL || url || 
                (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
            
            // Remove qualquer path adicional da URL (como /chat)
            socketUrl = socketUrl.split('/').slice(0, 3).join('/');
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