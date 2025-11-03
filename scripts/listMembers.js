const PouchDB = require('pouchdb');
const PouchDBFind = require('pouchdb-find');

PouchDB.plugin(PouchDBFind);

const db = new PouchDB('http://admin:password@astworkbench03:5984/member_management');

db.find({
  selector: { type: 'member' },
  limit: 10
}).then(result => {
  console.log('\n📋 First 10 Members:\n');
  result.docs.forEach((m, i) => {
    console.log(`${i + 1}. ${m.firstName} ${m.lastName}`);
    console.log(`   📧 ${m.email}`);
    console.log(`   📱 ${m.mobile}`);
    console.log('');
  });
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
