import { io } from 'socket.io-client';

export const socket = io('http://localhost:3001', {
  autoConnect: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});
