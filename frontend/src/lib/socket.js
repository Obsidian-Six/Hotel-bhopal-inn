import { io } from 'socket.io-client';
import config from '../config';

const SOCKET_URL = config.API_URL;
export const socket = io(SOCKET_URL, {
    autoConnect: true,
    reconnection: true
});

socket.on('connect', () => {
    console.log('Connected to WebSocket Server');
});

socket.on('disconnect', () => {
    console.log('Disconnected from WebSocket Server');
});
