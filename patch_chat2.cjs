const fs = require('fs');
const file = 'src/components/ChatBox.tsx';
let code = fs.readFileSync(file, 'utf-8');

// If offline, don't use chat
code = code.replace(/export const ChatBox = \(\) => {/m, 
`import { isLocalDb } from '../lib/dbAdapter';

export const ChatBox = () => {
  if (isLocalDb()) return null; // Nonaktifkan chat di mode offline
`);

// Increase interval from 30s to 5 minutes (300000ms) to save quota
code = code.replace(/setInterval\(updatePresence, 30000\)/m, `setInterval(updatePresence, 300000)`);

fs.writeFileSync(file, code);
