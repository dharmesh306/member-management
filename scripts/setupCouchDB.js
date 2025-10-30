const http = require('http');
const { execSync } = require('child_process');

// Stop CouchDB service
console.log('Stopping CouchDB service...');
try {
  execSync('net stop "Apache CouchDB"');
} catch (error) {
  console.log('CouchDB service was not running');
}

// Start CouchDB service
console.log('Starting CouchDB service...');
try {
  execSync('net start "Apache CouchDB"');
} catch (error) {
  console.error('Error starting CouchDB:', error);
  process.exit(1);
}

// Wait for CouchDB to be ready
console.log('Waiting for CouchDB to be ready...');
setTimeout(async () => {
  // Create admin user
  const options = {
    host: 'localhost',
    port: 5984,
    path: '/_node/_local/_config/admins/admin',
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    console.log('Admin user created or already exists');
    
    // Create database
    const dbOptions = {
      host: 'localhost',
      port: 5984,
      path: '/member_management',
      method: 'PUT',
      headers: {
        'Authorization': 'Basic ' + Buffer.from('admin:password').toString('base64')
      }
    };

    const dbReq = http.request(dbOptions, (dbRes) => {
      console.log('Database created or already exists');
      console.log('Setup complete!');
    });

    dbReq.on('error', (error) => {
      console.error('Error creating database:', error);
    });

    dbReq.end();
  });

  req.on('error', (error) => {
    console.error('Error creating admin:', error);
  });

  req.write(JSON.stringify('password'));
  req.end();
}, 5000); // Wait 5 seconds for CouchDB to start