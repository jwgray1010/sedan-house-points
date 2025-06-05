import React, { useEffect, useState, useMemo } from 'react';
import sedanLogo from '../assets/sedan_logo.png';
import signatureImg from '../assets/signature.png';
import { db } from '../firebase.js';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';
import './CertificatesPage.css';
import { useNavigate } from "react-router-dom";
import html2pdf from "html2pdf.js";
import { getFunctions, httpsCallable } from "firebase/functions";

const Certificate = React.forwardRef(({ student, stepCount, weekStart, weekEnd }, ref) => (
  <div className="certificate" id={`cert-${student.id}`} ref={ref} aria-live="polite">
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
        has earned <strong>{stepCount}</strong> positive points<br />
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
));

const CertificatesPage = () => {
  const [stepCounts, setStepCounts] = useState({});
  const [students, setStudents] = useState([]);
  const [loadingId, setLoadingId] = useState(null);
  const [sendingId, setSendingId] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkSending, setBulkSending] = useState(false);
  const [search, setSearch] = useState('');
  const [weekOffset, setWeekOffset] = useState(0);
  const navigate = useNavigate();

  // Calculate week range based on offset
  const { weekStart, weekEnd, weekStartDate, weekEndDate } = useMemo(() => {
    const base = addWeeks(new Date(), weekOffset);
    const start = startOfWeek(base);
    const end = endOfWeek(base);
    return {
      weekStart: format(start, 'MMM d'),
      weekEnd: format(end, 'MMM d, yyyy'),
      weekStartDate: start,
      weekEndDate: end
    };
  }, [weekOffset]);

  useEffect(() => {
    const fetchPositiveStepsAndStudents = async () => {
      try {
        // Fetch step counts
        const logsRef = collection(db, 'behaviorLogs');
        const qSteps = query(
          logsRef,
          where('step', '==', 0),
          where('timestamp', '>=', weekStartDate),
          where('timestamp', '<=', weekEndDate)
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
              where('timestamp', '>=', weekStartDate),
              where('timestamp', '<=', weekEndDate)
            );
            const logsSnap = await getDocs(qComments);
            student.positiveComments = logsSnap.docs
              .map(logDoc => logDoc.data().reason)
              .filter(Boolean);
            return student;
          })
        );
        setStudents(allStudents);
      } catch (err) {
        console.error("Error fetching students or logs:", err);
      }
    };

    fetchPositiveStepsAndStudents();
  }, [weekStartDate, weekEndDate]);

  // Filtered students
  const filteredStudents = students.filter(s =>
    !search || (s.name && s.name.toLowerCase().includes(search.toLowerCase()))
  );

  // PDF generation using hidden certificate
  const generateCertificate = (student) => {
    setLoadingId(student.id);
    setTimeout(() => {
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
          .save()
          .finally(() => setLoadingId(null));
      } else {
        setLoadingId(null);
      }
    }, 100);
  };

  // Bulk print
  const printAllCertificates = () => {
    setBulkLoading(true);
    setTimeout(async () => {
      for (const student of filteredStudents) {
        const cert = document.getElementById(`cert-${student.id}`);
        if (cert) {
          await html2pdf()
            .set({
              margin: 0,
              filename: `${student.name}-certificate.pdf`,
              html2canvas: { scale: 2 },
              jsPDF: { orientation: 'landscape' }
            })
            .from(cert)
            .save();
        }
      }
      setBulkLoading(false);
    }, 100);
  };

  // Email sending using hidden certificate
  const sendCertificateEmail = async (student) => {
    setSendingId(student.id);
    setTimeout(async () => {
      const cert = document.getElementById(`cert-${student.id}`);
      if (!cert) {
        setSendingId(null);
        return;
      }
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
      } finally {
        setSendingId(null);
      }
    }, 100);
  };

  // Bulk email
  const sendAllCertificates = async () => {
    setBulkSending(true);
    for (const student of filteredStudents) {
      await sendCertificateEmail(student);
    }
    setBulkSending(false);
  };

  return (
    <div className="certificates-page">
      <button
        className="back-button"
        style={{ marginBottom: "1rem" }}
        onClick={() => navigate("/dashboard")}
        aria-label="Back to Dashboard"
      >
        ⬅ Back to Dashboard
      </button>
      <h2>Weekly Positive Behavior Certificates</h2>
      <div style={{ marginBottom: "1rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <button onClick={() => setWeekOffset(weekOffset - 1)} aria-label="Previous Week">⬅ Previous Week</button>
        <span style={{ alignSelf: "center" }}>
          {weekStart} – {weekEnd}
        </span>
        <button onClick={() => setWeekOffset(weekOffset + 1)} aria-label="Next Week">Next Week ➡</button>
        <input
          type="text"
          placeholder="Search student"
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Search student"
        />
        <button onClick={printAllCertificates} disabled={bulkLoading}>
          {bulkLoading ? "Printing All..." : "Print All"}
        </button>
        <button onClick={sendAllCertificates} disabled={bulkSending}>
          {bulkSending ? "Sending All..." : "Email All"}
        </button>
      </div>
      <div className="certificate-grid">
        {filteredStudents.map(student => (
          <div key={student.id} className="student-card">
            <h3>{student.name}</h3>
            <p>{stepCounts[student.id] || 0} positive steps</p>
            <button
              onClick={() => generateCertificate(student)}
              disabled={loadingId === student.id || bulkLoading}
              aria-label={`Print certificate for ${student.name}`}
            >
              {loadingId === student.id ? "Generating..." : "Print Certificate"}
            </button>
            <button
              onClick={() => sendCertificateEmail(student)}
              disabled={sendingId === student.id || bulkSending}
              aria-label={`Send certificate to parent of ${student.name}`}
            >
              {sendingId === student.id ? "Sending..." : "Send to Parent Email"}
            </button>
          </div>
        ))}
      </div>
      {/* Hidden certificates for PDF/Email generation */}
      <div style={{ display: "none" }}>
        {filteredStudents.map(student => (
          <Certificate
            key={student.id}
            student={student}
            stepCount={stepCounts[student.id] || 0}
            weekStart={weekStart}
            weekEnd={weekEnd}
          />
        ))}
      </div>
    </div>
  );
};

export default CertificatesPage;
