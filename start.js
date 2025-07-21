#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Reading Habit Tracker...\n');

// Start backend server
console.log('📚 Starting backend server on port 4000...');
const backend = spawn('npm', ['start'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

// Wait a moment, then start frontend
setTimeout(() => {
  console.log('\n🎨 Starting frontend on port 3000...');
  const frontend = spawn('npm', ['start'], {
    cwd: path.join(__dirname, 'frontend'),
    stdio: 'inherit', 
    shell: true
  });

  frontend.on('error', (error) => {
    console.error('Frontend error:', error);
  });
}, 2000);

backend.on('error', (error) => {
  console.error('Backend error:', error);
});

// Handle cleanup
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down servers...');
  backend.kill();
  process.exit();
});

console.log('\n📖 Reading Habit Tracker');
console.log('🌐 Frontend: http://localhost:3000');
console.log('🔧 Backend API: http://localhost:4000');
console.log('❤️  Health Check: http://localhost:4000/health');
console.log('\n🎯 Features:');
console.log('   • Track daily reading progress');
console.log('   • Trade shares with other readers');  
console.log('   • Import stats from StoryGraph');
console.log('   • View portfolio and statistics');
console.log('   • Unlock features with 90 days of data');
console.log('\n⌨️  Press Ctrl+C to stop\n');