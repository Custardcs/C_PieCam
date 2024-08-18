const WebSocket = require('ws');
const { exec } = require('child_process');
require('dotenv').config();

const serverIp = process.env.SERVER_IP || 'localhost';
const serverPort = process.env.SERVER_PORT || 3000;

let ws;
let stream;

function connect() {
    ws = new WebSocket(`ws://${serverIp}:${serverPort}/stream`);

    ws.on('open', () => {
        console.log('Connected to the server');
        startStreaming();
    });

    ws.on('close', () => {
        console.log('Disconnected from the server');
        stopStreaming();
        setTimeout(connect, 5000); // Reconnect after 5 seconds
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        ws.close();
    });
}

function startStreaming() {
    if (stream) return;

    const command = 'ffmpeg -f dshow -i video="NexiGO N60 FHD Webcam" -r 20 -s 640x360 -b:v 200k -f mpegts pipe:1';

    stream = exec(command);

    stream.stdout.on('data', (data) => {
        console.log(`Client sending chunk of size: ${data.length}`);
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(data, { binary: true });
        }
    });

    stream.stderr.on('data', (data) => {
        console.error(`FFmpeg error: ${data}`);
    });

    stream.on('close', () => {
        console.log('FFmpeg process closed');
        stream = null;
    });
}

function stopStreaming() {
    if (stream) {
        stream.kill();
        stream = null;
        console.log('Stopped streaming');
    }
}

connect();
