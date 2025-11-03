const https = require('https');
const http = require('http');

const options = {
  hostname: '10.24.2.131',
  port: 5984,
  path: '/member_management',
  method: 'GET',
  headers: {
    'Authorization': 'Basic ' + Buffer.from('admin:password').toString('base64'),
    'Origin': 'http://localhost:3001'
  }
};

console.log('\n🔍 Checking CORS Headers from CouchDB...\n');
console.log('URL: http://10.24.2.131:5984/member_management');
console.log('Origin: http://localhost:3001\n');

const req = http.request(options, (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('\n📋 Response Headers:');
  console.log('═══════════════════════════════════════════\n');
  
  let corsFound = false;
  for (const [key, value] of Object.entries(res.headers)) {
    if (key.toLowerCase().includes('access-control')) {
      console.log(`✅ ${key}: ${value}`);
      corsFound = true;
    }
  }
  
  if (!corsFound) {
    console.log('❌ No Access-Control headers found!');
    console.log('\nThis means CORS is not properly configured.');
    console.log('The browser will block requests from http://localhost:3001');
  } else {
    console.log('\n═══════════════════════════════════════════');
    console.log('✅ CORS headers are present!');
  }
  
  console.log('\nAll Headers:');
  console.log(res.headers);
});

req.on('error', (e) => {
  console.error('❌ Error:', e.message);
});

req.end();
