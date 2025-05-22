// StepsPage.js
import React from 'react';
import './StepsPage.css';

const steps = [
  { step: 1, label: 'Reminder', description: 'Give the student a gentle verbal reminder of expectations.' },
  { step: 2, label: 'Reflection Time', description: 'Provide a short time away or think spot for the student to reflect.' },
  { step: 3, label: 'Office Referral', description: 'Student is sent to the office for further intervention.' },
  { step: 4, label: 'Call Home', description: 'Teacher contacts home to inform the parent or guardian.' },
  { step: 5, label: 'Behavior Support or Suspension', description: 'Formal support plan or suspension may be enacted.' }
];

const StepsPage = () => {
  return (
    <div className="steps-page">
      <h1>Behavior Steps</h1>
      <div className="steps-container">
        {steps.map((s) => (
          <div key={s.step} className={`step-card step-${s.step}`}>
            <h2>Step {s.step}: {s.label}</h2>
            <p>{s.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StepsPage;
