// @ts-nocheck
import { io } from 'socket.io-client';
import { SERVER_BASE } from '../config/constants';

export const socket = io(SERVER_BASE, {
    autoConnect: false,
    transports: ['websocket', 'polling', 'webtransport']
});

socket.on("disconnect", (reason, details) => {
    console.log("disconnect event got:")
    // the reason of the disconnection, for example "transport error"
    console.log(reason);
  
    // the low-level reason of the disconnection, for example "xhr post error"
    console.log(details.message);
  
    // some additional description, for example the status code of the HTTP response
    console.log(details.description);
  
    // some additional context, for example the XMLHttpRequest object
    console.log(details.context);
});

socket.on("connect_error", (err) => {
    console.log("connect_error event got:")
    // the reason of the error, for example "xhr poll error"
    console.log(err.message);
  
    // some additional description, for example the status code of the initial HTTP response
    console.log(err.description);
  
    // some additional context, for example the XMLHttpRequest object
    console.log(err.context);
});