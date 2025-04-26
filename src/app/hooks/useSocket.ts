import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = (url: string) => {
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        const setupSocket = () => {
            if (socketRef.current?.connected) {
                console.log('Socket is already connected');
                return;
            }

            // Disconnect existing socket if it exists
            if (socketRef.current) {
                console.log('Desconectando socket existente...');
                socketRef.current.disconnect();
            }

            // Ensures the base URL is correct
            let socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || url || 
                (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
            
            // Remove any additional path from the URL (like /chat)
            socketUrl = socketUrl.split('/').slice(0, 3).join('/');
            
            console.log('Connecting to socket:', socketUrl);
            
            socketRef.current = io(socketUrl, {
                reconnection: true,
                reconnectionAttempts: Infinity,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                timeout: 20000,
                autoConnect: true,
                transports: ['websocket', 'polling'],
                withCredentials: true
            });

            socketRef.current.on('connect_error', (error) => {
                console.error('Socket connection error:', error);
            });
        };

        setupSocket();

        return () => {
            if (socketRef.current) {
                console.log('Clearing socket connection...');
                socketRef.current.disconnect();
            }
        };
    }, [url]);

    return socketRef.current;
};