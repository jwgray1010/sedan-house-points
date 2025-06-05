const admin = require('firebase-admin');
const fs = require('fs');
const csv = require('csv-parser');
const serviceAccount = require('./functions/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const students = [];

fs.createReadStream('./students.csv')
  .pipe(csv())
  .on('data', (row) => {
    students.push(row);
  })
  .on('end', async () => {
    console.log('CSV file successfully processed');
    for (const student of students) {
      // Capitalize house name
      if (student.house) {
        student.house = student.house.charAt(0).toUpperCase() + student.house.slice(1).toLowerCase();
      }
      // Add extra fields if you want
      student.musicTeacher = "sherri.durbin@usd286.org";
      student.secretary = "martha.davis@usd286.org";
      student.peTeacher = "kyle.thornton@usd286.org";
      student.principal = "john.gray@usd286.org";
      student.counselor = "jennifer.giles@usd286.org";
      // Use name as doc ID or generate your own
      const docId = student.name.replace(/\s+/g, '_').toLowerCase();
      await db.collection('students').doc(docId).set(student);
      console.log(`Imported: ${student.name}`);
    }
    console.log('All students imported!');
    process.exit(0);
  });