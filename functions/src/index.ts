import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";
import * as nodemailer from "nodemailer";
import * as admin from "firebase-admin";

// Initialize Firebase Admin to access the Database
admin.initializeApp();
const db = admin.firestore();

// 1. Setup the Email Sender
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "gautamrawat0502@gmail.com", 
    pass: "ohlj qsul rxvl eqfq"
  },
});

// ==========================================
// TRIGGER 1: Send Welcome Email & Start Counter
// ==========================================
export const sendWelcomeEmail = onDocumentCreated("users/{userId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const userData = snapshot.data();
  const userEmail = userData.email;
  const userName = userData.name || "User";

  if (!userEmail) {
    logger.warn(`User created without email. No email sent.`);
    return;
  }

  const mailOptions = {
    from: '"Platter POS Team" <gautamrawat0502@gmail.com>',
    to: userEmail,
    subject: "Welcome to Platter POS! 🚀",
    html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>Welcome aboard, ${userName}!</h2>
        <p>Your account has been successfully created.</p>
      </div>
    `,
  };

  try {
    // 1. Send the Welcome Mail
    await transporter.sendMail(mailOptions);
    logger.info(`✅ Welcome email sent to ${userEmail}`);

    // 2. IMPORTANT: Set the counter to 0 so the Scheduler picks it up later
    await snapshot.ref.update({ mailSequenceCount: 0 });
    logger.info(`Create sequence started for ${userEmail}`);

  } catch (error) {
    logger.error("❌ Error sending email:", error);
  }
});

// ==========================================
// TRIGGER 2: Scheduler (Every 5 Mins - INFINITE LOOP)
// Sends Mail 1, Mail 2, Mail 3... forever
// ==========================================
export const sendFollowUpSequence = onSchedule("every 5 minutes", async (event) => {
  
  // Query: Find ALL users who have started the sequence (Count 0 or higher)
  // This removes the limit. It will pick up 0, 1, 2, 100, 1000...
  const usersRef = db.collection("users");
  const snapshot = await usersRef.where("mailSequenceCount", ">=", 0).get();

  if (snapshot.empty) {
    return;
  }

  const emailPromises = snapshot.docs.map(async (doc) => {
    const userData = doc.data();
    const currentCount = userData.mailSequenceCount;
    const nextCount = currentCount + 1; // Always adds +1 (1, 2, 3...)
    
    const mailOptions = {
      from: '"Auto Bot 🤖" <gautamrawat0502@gmail.com>',
      to: userData.email,
      subject: `Dummy Mail ${nextCount}: System Check`,
      html: `
        <div style="font-family: Arial; padding: 20px; border: 1px solid #ddd;">
          <h2 style="color: blue;">Auto Sequence: Mail #${nextCount}</h2>
          <p>This is automatic dummy mail number <strong>${nextCount}</strong>.</p>
          <p>We will send another one in 5 minutes.</p>
          <p>Server Time: ${new Date().toLocaleString()}</p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      
      // Update the database to the new number so next time it sends (nextCount + 1)
      await doc.ref.update({ mailSequenceCount: nextCount });
      logger.info(`✅ Sent Infinite Mail #${nextCount} to ${userData.email}`);
      
    } catch (error) {
      logger.error(`❌ Failed to send mail to ${userData.email}`, error);
    }
  });

  await Promise.all(emailPromises);
});