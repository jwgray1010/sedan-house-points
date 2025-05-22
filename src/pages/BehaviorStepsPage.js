import React from 'react';
import './BehaviorStepsPage.css';

const BehaviorStepsPage = () => {
  return (
    <div className="steps-container">
      <h2>Sedan Elem. Behavior Steps</h2>
      <p className="subtext">Teach self-regulation through gentle guidance, repair, and routine.</p>

      <div className="step remind">STEP 1 – REMIND
        <p>Teacher gives a verbal reminder and uses proximity/redirection.<br />No office involvement.</p>
      </div>

      <div className="step pause">STEP 2 – PAUSE
        <p>Student is moved to a calm spot or “take a break” space.<br />Quick reflection with teacher or aide. Behavior is logged.</p>
      </div>

      <div className="step office">STEP 3 – OFFICE
        <p>Call Mr. Gray and talk to teacher. Quick office chat to reflect. Return to class with apology letter.</p>
      </div>

      <div className="step call">STEP 4 – CALL
        <p>Student/Mr. Gray calls home to share what step they are on.<br />Brief behavior contract or goal set for next day.</p>
      </div>

      <div className="step suspend">STEP 5 – SUSPEND
        <p>Possible half-day ISS.<br />Re-entry plan created with student and Mr. Gray.</p>
      </div>

      <div className="reset">
        <strong>Daily Reset for Steps 1–3:</strong><br />
        These are teachable moments and build trust.<br />
        Students get to start with a clean slate.
      </div>

      <div className="note">
        Every day is a new opportunity to make great choices. If a student reaches a higher step, it’s noted — but we always give them a fresh chance the next day unless a formal plan is in place.
      </div>

      <div className="escalation">
        <strong>Misbehaviors that escalate to Step 4 or 5 immediately:</strong>
        <ul>
          <li>Physical Aggression</li>
          <li>Threats of Harm</li>
          <li>Weapons/Dangerous Objects</li>
          <li>Sexual Misconduct</li>
          <li>Severe Defiance/Disrespect</li>
          <li>Vandalism or Property Damage</li>
          <li>Bullying or Harassment (Severe or Repeated)</li>
        </ul>
      </div>
    </div>
  );
};

export default BehaviorStepsPage;
