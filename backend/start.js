#!/usr/bin/env node

/**
 * QuranAkh Backend Startup Script
 * Handles initialization and graceful startup
 */

const cluster = require('cluster');
const os = require('os');

// Development single process mode
if (process.env.NODE_ENV !== 'production' || process.env.DISABLE_CLUSTER === 'true') {
  require('./server.js');
} else {
  // Production cluster mode
  if (cluster.isMaster) {
    const numCPUs = os.cpus().length;
    console.log(`Starting ${numCPUs} worker processes...`);
    
    // Fork workers
    for (let i = 0; i < numCPUs; i++) {
      cluster.fork();
    }
    
    cluster.on('exit', (worker, code, signal) => {
      console.log(`Worker ${worker.process.pid} died. Restarting...`);
      cluster.fork();
    });
    
    cluster.on('online', (worker) => {
      console.log(`Worker ${worker.process.pid} is online`);
    });
    
  } else {
    require('./server.js');
  }
}