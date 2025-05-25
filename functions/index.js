/* eslint-disable max-len */
/* eslint-disable indent */
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

// Configure transporter (use an App Password for Gmail, not your main password)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "john.gray@usd286.org",
    pass: "wvmijubycicvnagc",
  },
});

// Example HTTP function
exports.helloWorld = functions.https.onRequest((req, res) => {
  res.send("Hello from your Firebase backend!");
});

// Scheduled function to send weekly certificates
exports.sendWeeklyCertificates = functions
  .region("us-central1")
  .pubsub.schedule("every friday 16:00")
  .timeZone("America/Chicago")
  .onRun(async (context) => {
    const db = admin.firestore();
    const studentsSnap = await db.collection("students").get();

    // Calculate week start and end
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const weekStartStr = weekStart.toLocaleDateString();
    const weekEndStr = weekEnd.toLocaleDateString();

    for (const studentDoc of studentsSnap.docs) {
      const student = studentDoc.data();
      if (!student.parentEmail) continue;

      // Fetch positive points for the week
      const logsSnap = await db.collection("behaviorLogs")
          .where("studentId", "==", studentDoc.id)
          .where("direction", "==", "positive")
          .where("timestamp", ">=", weekStart)
          .where("timestamp", "<=", weekEnd)
          .get();

      const count = logsSnap.size;

      // Compose certificate HTML
      const certificateHtml = `
      <div style="font-family: 'Georgia', serif; text-align: center; background: #fffbe7; border-radius: 18px; border: 4px double #4a418a; max-width: 600px; margin: 2rem auto; padding: 2rem;">
        <h2>Way to Go, ${student.name}!</h2>
        <p>You earned <strong>${count}</strong> positive points this week!</p>
        <p>Positive points are awarded for showing responsibility, kindness, and effort at school.</p>
        <p>Keep up the great work!</p>
        <p style="margin-top:1.5rem; font-family: 'Pacifico', cursive, 'Georgia', serif; font-size: 1.1rem; color: #888;">– Mr. Gray, Principal</p>
        <p style="font-size:1rem; color:#555;">Week of ${weekStartStr} – ${weekEndStr}</p>
      </div>
    `;

      const msg = {
        to: student.parentEmail,
        from: "john.gray@usd286.org",
        subject: `Way to Go, ${student.name}!`,
        html: certificateHtml,
      };

      await transporter.sendMail(msg);
    }
    return null;
  });

// Scheduled function to send weekly certificates with comments
exports.sendWeeklyCertificatesWithComments = functions.pubsub.schedule("every friday 15:00")
    .timeZone("America/Chicago")
    .onRun(async (context) => {
      const db = admin.firestore();
      const studentsSnap = await db.collection("students").get();

      // Calculate week start and end
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      for (const studentDoc of studentsSnap.docs) {
        const student = studentDoc.data();
        if (!student.parentEmail) continue;

        // Fetch positive points for the week
        const logsSnap = await db.collection("behaviorLogs")
            .where("studentId", "==", studentDoc.id)
            .where("direction", "==", "positive")
            .where("timestamp", ">=", weekStart)
            .where("timestamp", "<=", weekEnd)
            .get();

        const count = logsSnap.size;
        const comments = logsSnap.docs
            .map((doc) => doc.get("reason"))
            .filter(Boolean);

        // Compose certificate HTML
        const certificateHtml = `
        <div style="font-family: 'Georgia', serif; text-align: center; background: #fff; border-radius: 18px; border: 4px double #4a418a; max-width: 700px; margin: 2rem auto; padding: 2rem;">
          <h2>Way to Go, ${student.name}!</h2>
          <p>You earned <strong>${count}</strong> positive points this week!</p>
          <p>Positive points are awarded for showing responsibility, kindness, and effort at school.</p>
          ${comments.length > 0 ? `
            <div style="margin:1.5rem auto;max-width:500px;text-align:left;">
              <h4 style="color:#ff9800;">Teacher Comments:</h4>
              <ul>
                ${comments.map((c) => `<li>“${c}”</li>`).join("")}
              </ul>
            </div>
          ` : ""}
          <p style="margin-top:1.5rem; font-family: 'Pacifico', cursive, 'Georgia', serif; font-size: 1.1rem; color: #888;">– Mr. Gray, Principal</p>
          <p style="font-size:1rem; color:#555;">Week of ${weekStart.toLocaleDateString()} – ${weekEnd.toLocaleDateString()}</p>
        </div>
      `;

        const msg = {
          to: student.parentEmail,
          from: "john.gray@usd286.org",
          subject: `Way to Go, ${student.name}!`,
          html: certificateHtml,
        };

        await transporter.sendMail(msg);
      }
      return null;
    });

// Scheduled function to update behavior streaks and badges
exports.updateBehaviorStreaks = functions.pubsub.schedule("every day 01:00")
    .timeZone("America/Chicago")
    .onRun(async (context) => {
      const db = admin.firestore();
      const studentsSnap = await db.collection("students").get();

      for (const studentDoc of studentsSnap.docs) {
        const student = studentDoc.data();
        const studentId = studentDoc.id;

        // Get all logs for this student, sorted descending by timestamp
        const logsSnap = await db.collection("behaviorLogs")
            .where("studentId", "==", studentId)
            .orderBy("timestamp", "desc")
            .get();

        let streak = 0;
        const currentDate = new Date();

        for (let i = 0; i < 30; i++) {
          const dateStr = currentDate.toISOString().slice(0, 10);
          const dayLogs = logsSnap.docs.filter((doc) => {
            const ts = doc.get("timestamp");
            let logDate;
            if (ts && ts.toDate) logDate = ts.toDate().toISOString().slice(0, 10);
            else if (typeof ts === "string") logDate = ts.slice(0, 10);
            else return false;
            return logDate === dateStr;
          });
          if (dayLogs.length === 0) break;
          if (dayLogs.some((l) => l.get("step") > 0)) break;
          streak++;
          currentDate.setDate(currentDate.getDate() - 1);
        }

        const newBadges = [];
        if (streak >= 20) {
          newBadges.push("Blue Devil Champion");
        } else if (streak >= 10) {
          newBadges.push("Self Manager");
        } else if (streak >= 5) {
          newBadges.push("Consistency Star");
        }

        if (
          student.streakCount !== streak ||
        student.lastStreakDate !== new Date().toISOString().slice(0, 10) ||
        JSON.stringify(student.badges || []) !== JSON.stringify(newBadges)
        ) {
          await db.collection("students").doc(studentId).update({
            streakCount: streak,
            lastStreakDate: new Date().toISOString().slice(0, 10),
            badges: newBadges,
          });
        }
      }
      return null;
    });

// Test email endpoint
exports.sendTestEmail = functions.https.onRequest(async (req, res) => {
  const mailOptions = {
    from: "john.gray@usd286.org",
    to: "recipient@email.com",
    subject: "Test Email from Nodemailer",
    html: "<h1>Hello from Firebase Functions!</h1>",
  };

  try {
    await transporter.sendMail(mailOptions);
    res.send("Email sent!");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error sending email");
  }
});
