// CouchDB configuration script
const http = require('http');

const couchdbConfig = {
  host: 'localhost',
  port: 5984,
  auth: 'admin:password'
};

const corsSettings = [
  {
    section: 'httpd',
    key: 'enable_cors',
    value: 'true'
  },
  {
    section: 'cors',
    key: 'origins',
    value: '*'
  },
  {
    section: 'cors',
    key: 'credentials',
    value: 'true'
  },
  {
    section: 'cors',
    key: 'methods',
    value: 'GET, PUT, POST, HEAD, DELETE'
  },
  {
    section: 'cors',
    key: 'headers',
    value: 'accept, authorization, content-type, origin, referer, x-csrf-token'
  }
];

async function updateConfig(setting) {
  return new Promise((resolve, reject) => {
    const options = {
      host: couchdbConfig.host,
      port: couchdbConfig.port,
      path: `/_node/_local/_config/${setting.section}/${setting.key}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(couchdbConfig.auth).toString('base64')
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`✓ Set ${setting.section}/${setting.key} to ${setting.value}`);
        resolve(data);
      });
    });

    req.on('error', (error) => {
      console.error(`✗ Error setting ${setting.section}/${setting.key}:`, error.message);
      reject(error);
    });

    req.write(JSON.stringify(setting.value));
    req.end();
  });
}

async function configureCouchDB() {
  console.log('📝 Configuring CouchDB CORS settings...\n');
  
  try {
    for (const setting of corsSettings) {
      await updateConfig(setting);
    }
    console.log('\n✅ CouchDB CORS configuration completed successfully!');
  } catch (error) {
    console.error('\n❌ Configuration failed:', error.message);
    process.exit(1);
  }
}

configureCouchDB();