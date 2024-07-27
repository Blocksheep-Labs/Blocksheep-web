import { io } from 'socket.io-client';
import { SERVER_BASE } from '../config/constants';

export const socket = io(SERVER_BASE, {
    autoConnect: false,
    transports: ['websocket', 'polling', 'flashsocket']
});