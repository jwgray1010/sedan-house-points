import React, { useEffect, useState } from 'react';
import sedanLogo from '../assets/sedan_logo.png';
import signatureImg from '../assets/signature.png'; // <-- Add this line
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import './CertificatesPage.css';
import { useNavigate } from "react-router-dom";
import html2pdf from "html2pdf.js";
import { getFunctions, httpsCallable } from "firebase/functions";

const CertificatesPage = () => {
  const [stepCounts, setStepCounts] = useState({});
  const [students, setStudents] = useState([]);
  const [visibleCertId, setVisibleCertId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPositiveStepsAndStudents = async () => {
      try {
        const start = startOfWeek(new Date());
        const end = endOfWeek(new Date());

        // Fetch step counts
        const logsRef = collection(db, 'behaviorLogs');
        const qSteps = query(
          logsRef,
          where('step', '==', 0),
          where('timestamp', '>=', start),
          where('timestamp', '<=', end)
        );
        const snapshot = await getDocs(qSteps);
        const counts = {};
        snapshot.forEach(doc => {
          const { studentId } = doc.data();
          counts[studentId] = (counts[studentId] || 0) + 1;
        });
        setStepCounts(counts);

        // Fetch students with comments
        const studentsSnap = await getDocs(collection(db, 'students'));
        const allStudents = await Promise.all(
          studentsSnap.docs.map(async doc => {
            const student = { id: doc.id, ...doc.data() };
            const qComments = query(
              logsRef,
              where('studentId', '==', doc.id),
              where('direction', '==', 'positive'),
              where('timestamp', '>=', start),
              where('timestamp', '<=', end)
            );
            const logsSnap = await getDocs(qComments);
            student.positiveComments = logsSnap.docs
              .map(logDoc => logDoc.data().reason)
              .filter(Boolean);
            return student;
          })
        );
        setStudents(allStudents);
        console.log("Fetched students:", allStudents);
      } catch (err) {
        console.error("Error fetching students or logs:", err);
      }
    };

    fetchPositiveStepsAndStudents();
  }, []);

  const generateCertificate = (student) => {
    const cert = document.getElementById(`cert-${student.id}`);
    if (cert) {
      html2pdf()
        .set({
          margin: 0,
          filename: `${student.name}-certificate.pdf`,
          html2canvas: { scale: 2 },
          jsPDF: { orientation: 'landscape' }
        })
        .from(cert)
        .save();
    }
  };

  const sendCertificateEmail = async (student) => {
    const cert = document.getElementById(`cert-${student.id}`);
    if (!cert) return;
    const certificateHtml = cert.outerHTML;

    const functions = getFunctions();
    const sendEmail = httpsCallable(functions, "sendCertificateEmail");
    try {
      await sendEmail({
        parentEmail: student.parentEmail,
        studentName: student.name,
        certificateHtml,
        weekStart,
        weekEnd,
        count: stepCounts[student.id] || 0,
      });
      alert("Certificate sent to parent!");
    } catch (err) {
      alert("Failed to send email.");
    }
  };

  const weekStart = format(startOfWeek(new Date()), 'MMM d');
  const weekEnd = format(endOfWeek(new Date()), 'MMM d, yyyy');

  console.log("students state:", students);

  return (
    <div className="certificates-page">
      <button
        className="back-button"
        style={{ marginBottom: "1rem" }}
        onClick={() => navigate("/dashboard")}
      >
        ⬅ Back to Dashboard
      </button>
      <h2>Weekly Positive Behavior Certificates</h2>
      <div className="certificate-grid">
        {students.map(student => (
          <div key={student.id} className="student-card">
            <h3>{student.name}</h3>
            <p>{stepCounts[student.id] || 0} positive steps</p>
            <button
              onClick={() => {
                setVisibleCertId(student.id);
                setTimeout(() => {
                  generateCertificate(student);
                  setVisibleCertId(null);
                }, 100); // allow DOM to update
              }}
            >
              Print Certificate
            </button>
            <button
              onClick={() => {
                setVisibleCertId(student.id);
                setTimeout(() => {
                  sendCertificateEmail(student);
                  setVisibleCertId(null);
                }, 100);
              }}
            >
              Send to Parent Email
            </button>
            {visibleCertId === student.id && (
              <div className="certificate" id={`cert-${student.id}`}>
                <img
                  src={sedanLogo}
                  alt="Sedan Elementary Logo"
                  className="certificate-logo"
                />
                <h2 className="diploma-title">Certificate of Achievement</h2>
                <div className="diploma-body">
                  <p>This certifies that</p>
                  <h3 className="student-name">{student.name}</h3>
                  <p>
                    has earned <strong>{stepCounts[student.id] || 0}</strong> positive points<br />
                    for outstanding responsibility, kindness, and effort<br />
                    during the week of {weekStart} – {weekEnd}.
                  </p>
                  {student.positiveComments && student.positiveComments.length > 0 && (
                    <div className="certificate-comments">
                      <h4>Teacher Comments:</h4>
                      <ul>
                        {student.positiveComments.map((comment, idx) => (
                          <li key={idx}>“{comment}”</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="diploma-signature">
                    <div className="sig-line-wrapper">
                      <img src={signatureImg} alt="Principal Signature" className="sig-image" />
                      <div className="sig-line"></div>
                    </div>
                    <div className="sig-label">Mr. Gray, Principal</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CertificatesPage;
