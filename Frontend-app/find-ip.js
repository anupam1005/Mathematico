#!/usr/bin/env node

// Simple script to find your computer's IP address
const os = require('os');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push({
          interface: name,
          address: iface.address,
          netmask: iface.netmask
        });
      }
    }
  }

  return addresses;
}

console.log('🔍 Finding your computer\'s IP address...\n');

const addresses = getLocalIP();

if (addresses.length === 0) {
  console.log('❌ No network interfaces found');
  process.exit(1);
}

console.log('📱 Use one of these IP addresses in your mobile app:\n');

addresses.forEach((addr, index) => {
  console.log(`${index + 1}. ${addr.address} (${addr.interface})`);
});

console.log('\n📝 Next steps:');
console.log('1. Copy one of the IP addresses above');
console.log('2. Open src/config.ts in your project');
console.log('3. Update the localIp variable with the copied address');
console.log('4. Make sure the unified backend is running on port 5000');
console.log('5. Save the file and restart your Expo app');
console.log('\n💡 Make sure your mobile device and computer are on the same WiFi network!');
console.log('\n🔧 Backend Setup:');
console.log('1. Navigate to the Backend folder');
console.log('2. Run: npm run dev');
console.log('3. The server will start on port 5000');
