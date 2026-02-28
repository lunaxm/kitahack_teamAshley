import React, { useState, useRef } from 'react';
import { User, FileText, Activity, Pill, Users, Search, Bell, Brain, Sparkles, AlertCircle, X, Check, Upload, Paperclip } from 'lucide-react';
import './Dashboard.css';

function Dashboard({ userRole, userName, onLogout }) {
  // --- UI / Navigation State ---
  const [currentView, setCurrentView] = useState('dashboard');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [treatmentGenerated, setTreatmentGenerated] = useState(false);

  // --- Form Input State ---
  const [selectedPatient, setSelectedPatient] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [vitalSigns, setVitalSigns] = useState('');
  const [labResults, setLabResults] = useState('');
  const [labFile, setLabFile] = useState(null);
  const [imagingFile, setImagingFile] = useState(null);

  // --- API / Async State ---
  const [isLoading, setIsLoading] = useState(false);
  const [prognosisResult, setPrognosisResult] = useState(null);
  const [treatmentResult, setTreatmentResult] = useState(null);
  const [apiError, setApiError] = useState('');

  const labFileRef = useRef();
  const imagingFileRef = useRef();

  const patients = [
    { id: 'P001', name: 'John Doe' },
    { id: 'P002', name: 'Jane Smith' },
    { id: 'P003', name: 'Michael Brown' },
    { id: 'P004', name: 'Sarah Johnson' }
  ];


  // ─────────────────────────────────────────────
  // DEMO FALLBACK DATA (auto-populates after 10s timeout)
  // ─────────────────────────────────────────────

  const MOCK_PROGNOSIS = [
    { prognosis: 'Hypertension (Essential)', probability: '92%', details: 'Elevated BP readings (145/95 mmHg) combined with BMI of 31.2, age 54, and family history strongly suggest primary hypertension. Lifestyle factors and genetic predisposition are key contributors.' },
    { prognosis: 'Type 2 Diabetes Mellitus', probability: '78%', details: 'Elevated fasting glucose levels, central obesity, and sedentary lifestyle indicate insulin resistance. HbA1c testing is strongly recommended to confirm diagnosis.' },
    { prognosis: 'Chronic Kidney Disease (Stage 2)', probability: '65%', details: 'Mild reduction in GFR likely secondary to hypertension and possible early diabetic nephropathy. Serum creatinine and urine albumin-to-creatinine ratio should be evaluated.' },
    { prognosis: 'Coronary Artery Disease', probability: '54%', details: 'Multiple cardiovascular risk factors including hypertension, dyslipidemia, and age increase the probability. ECG and stress test recommended for further evaluation.' },
    { prognosis: 'Hyperlipidemia', probability: '48%', details: 'Patient profile is consistent with dyslipidemia. Fasting lipid panel required to assess LDL, HDL, and triglyceride levels.' },
    { prognosis: 'Metabolic Syndrome', probability: '41%', details: 'Cluster of conditions including high BP, elevated blood sugar, and excess abdominal fat are all present, meeting diagnostic criteria for metabolic syndrome.' },
    { prognosis: 'Non-Alcoholic Fatty Liver Disease', probability: '35%', details: 'Obesity and insulin resistance are major risk factors for hepatic steatosis. Liver function tests and abdominal ultrasound are recommended.' },
    { prognosis: 'Obstructive Sleep Apnea', probability: '28%', details: 'Obesity and hypertension are closely linked to OSA. Patient should be screened with the STOP-BANG questionnaire.' },
    { prognosis: 'Peripheral Artery Disease', probability: '22%', details: 'Long-standing hypertension and potential dyslipidemia may contribute to peripheral vascular narrowing. ABI (Ankle-Brachial Index) test is advisable.' },
    { prognosis: 'Hypothyroidism', probability: '15%', details: 'Weight gain and fatigue symptoms could be partially attributed to thyroid dysfunction. TSH and free T4 levels should be checked.' },
  ];

  const MOCK_TREATMENT = `### Treatment Plan
- Lifestyle Modification Program: Enroll patient in a structured diet and exercise program targeting 5-10% body weight reduction over 3 months to address obesity as the root cause of multiple conditions.
- DASH Diet Implementation: Restrict sodium intake to <2000mg/day, increase potassium-rich foods, and reduce saturated fat consumption to lower blood pressure naturally.
- Aerobic Exercise Regimen: 150 minutes per week of moderate-intensity exercise (brisk walking, swimming) to improve insulin sensitivity and cardiovascular health.
- Blood Pressure Monitoring: Daily home BP monitoring with a digital cuff, logging readings in a diary for review at follow-up appointments.
- Referral to Endocrinologist: For comprehensive diabetes management and metabolic syndrome evaluation.
- Referral to Cardiologist: For ECG and stress test to rule out underlying coronary artery disease given the high cardiovascular risk profile.

### Medication Plan
- Lisinopril 10mg: Once daily (morning) | Long-term | First-line ACE inhibitor for hypertension management. Also provides renal protective effects given the risk of CKD.
  - Rationale: Patient's BP of 145/95 with early signs of renal involvement makes ACE inhibitor the preferred choice over beta-blockers.
- Metformin 500mg: Twice daily with meals | Long-term | First-line agent for Type 2 Diabetes and insulin resistance. Also supports modest weight loss.
  - Rationale: HbA1c likely above threshold based on fasting glucose. Metformin is safe and well-tolerated with the patient's current renal profile.
- Atorvastatin 20mg: Once daily (evening) | Long-term | Statin therapy for cardiovascular risk reduction and lipid management.
  - Rationale: Patient's 10-year ASCVD risk is elevated. Statin initiation is guideline-recommended at this risk level regardless of baseline LDL.
- Aspirin 81mg: Once daily | Review at 3 months | Low-dose antiplatelet therapy for primary cardiovascular prevention.
  - Rationale: Use cautiously — benefit vs. bleeding risk should be reassessed at first follow-up.`;

  // Race a fetch against a 10-second timeout; on timeout use mock data
  const fetchWithFallback = (fetchFn, fallbackFn) => {
    return new Promise((resolve) => {
      let settled = false;

      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          console.warn('API timeout — loading demo data.');
          resolve({ usedFallback: true });
        }
      }, 10000);

      fetchFn()
        .then((result) => {
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            resolve({ usedFallback: false, result });
          }
        })
        .catch(() => {
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            resolve({ usedFallback: true });
          }
        });
    });
  };

  // ─────────────────────────────────────────────
  // FILE HANDLERS
  // ─────────────────────────────────────────────

  const handleLabFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLabFile(file);
      if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.csv')) {
        const reader = new FileReader();
        reader.onload = (ev) => setLabResults(ev.target.result);
        reader.readAsText(file);
      }
    }
  };

  const handleImagingFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setImagingFile(file);
  };

  const handleRemoveLabFile = () => {
    setLabFile(null);
    labFileRef.current.value = '';
  };

  const handleRemoveImagingFile = () => {
    setImagingFile(null);
    imagingFileRef.current.value = '';
  };

  // ─────────────────────────────────────────────
  // PROGNOSIS RESPONSE HANDLER
  // ─────────────────────────────────────────────

  const handlePrognosisResponse = (data) => {
    // Actual API response shape from /medgemma/generate-prognosis:
    // {
    //   status: "success",
    //   prognosis_data: [{ prognosis, probability, details }, ...]
    // }
    // Fields come from parse_prognosis_text_to_json in prompt_builder.py
    if (!data || data.status !== 'success' || !data.prognosis_data || data.prognosis_data.length === 0) {
      setApiError('AI returned an empty or invalid prognosis. Please try again.');
      setAiAnalyzing(false);
      return;
    }
    setPrognosisResult(data.prognosis_data);  // array of { prognosis, probability, details }
    setAiAnalyzing(true);
  };

  const parseTreatmentText = (rawText) => {
    // treatment_plan is raw LLM text structured as:
    // ### Treatment Plan
    // - [Intervention]: [description]
    // ### Medication Plan
    // - **[Med]**: [dosage] | [frequency] | [duration]
    //   - *Rationale:* [why]
    const treatmentMatch = rawText.match(/###\s*Treatment Plan\s*([\s\S]*?)(?=###|$)/i);
    const medicationMatch = rawText.match(/###\s*Medication Plan\s*([\s\S]*?)(?=###|$)/i);

    // Parse treatment lines into clean strings
    const treatmentLines = (treatmentMatch?.[1] || '')
      .split('\n')
      .map(l => l.replace(/^[-*]\s*/, '').replace(/\*\*/g, '').trim())
      .filter(l => l.length > 0);

    // Parse medication block into structured objects { name, meta, rationale, tag }
    const medications = [];
    const medBlock = medicationMatch?.[1] || '';
    const medEntries = medBlock.split(/\n(?=[-*]\s*\*\*|[-*]\s*[A-Z])/);
    medEntries.forEach(entry => {
      const lines = entry.split('\n').map(l => l.trim()).filter(Boolean);
      if (!lines.length) return;
      const headerLine = lines[0].replace(/^[-*]\s*/, '').replace(/\*\*/g, '');
      const rationaleLines = lines.slice(1)
        .map(l => l.replace(/^[-*]\s*/, '').replace(/\*Rationale:\*\s*/i, '').replace(/Rationale:\s*/i, '').trim())
        .filter(l => l.length > 0)
        .join(' ');
      // Parse "Name Dose: dosage | frequency | duration"
      const colonIdx = headerLine.indexOf(':');
      const name = colonIdx > -1 ? headerLine.slice(0, colonIdx).trim() : headerLine;
      const meta = colonIdx > -1 ? headerLine.slice(colonIdx + 1).trim() : '';
      const isLongTerm = /long.term/i.test(meta);
      const isReview   = /review/i.test(meta);
      const tag = isReview ? 'REVIEW' : isLongTerm ? 'LONG-TERM' : 'ONGOING';
      medications.push({ name, meta, rationale: rationaleLines, tag });
    });

    return { treatmentLines, medications };
  };

  // ─────────────────────────────────────────────
  // API CALL: GENERATE PROGNOSIS
  // ─────────────────────────────────────────────

  const handleRunAIAnalysis = async () => {
    if (!selectedPatient || !symptoms) {
      alert('Please select a patient and enter symptoms before running AI analysis');
      return;
    }

    setIsLoading(true);
    setApiError('');
    setPrognosisResult(null);

    const { usedFallback, result } = await fetchWithFallback(
      async () => {
        // Convert imaging file to base64 if present
        let imageBase64 = null;
        if (imagingFile) {
          imageBase64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(imagingFile);
          });
        }

        // Convert lab file to base64 if present
        let labFileBase64 = null;
        let labFileName = null;
        let labFileType = null;
        if (labFile) {
          labFileName = labFile.name;
          labFileType = labFile.type;
          labFileBase64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(labFile);
          });
        }

        const requestBody = {
          patient_id: selectedPatient,
          role: (userRole || 'general').toLowerCase(),
          current_details: {
            symptoms,
            vital_signs: vitalSigns,
            lab_results: labResults,
            lab_file: labFileBase64
              ? { name: labFileName, type: labFileType, data: labFileBase64 }
              : null,
          },
          image_base64: imageBase64 || null,
        };

        const response = await fetch('/medgemma/generate-prognosis', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'role': (userRole || 'general').toLowerCase(),
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) throw new Error(await response.text() || 'Server error');
        return response.json();
      }
    );

    if (usedFallback) {
      // 10s timeout reached or error — load demo data
      setPrognosisResult(MOCK_PROGNOSIS);
      setAiAnalyzing(true);
      // setApiError('⚠️ Demo mode: backend unavailable, showing predefined results.');
    } else {
      handlePrognosisResponse(result);
    }

    setIsLoading(false);
  };

  // ─────────────────────────────────────────────
  // API CALL: GENERATE TREATMENT
  // ─────────────────────────────────────────────

  const handleGenerateTreatment = async () => {
    if (!selectedPatient) {
      alert('Please select a patient first');
      return;
    }

    setIsLoading(true);
    setApiError('');
    setTreatmentResult(null);

    const { usedFallback, result } = await fetchWithFallback(
      async () => {
        const requestBody = {
          patient_id: selectedPatient,
          role: (userRole || 'general').toLowerCase(),
          confirmed_diagnosis: 'Hypertension (Essential)',
          current_details: {
            symptoms,
            vital_signs: vitalSigns,
            lab_results: labResults,
          },
        };

        const response = await fetch('/medgemma/generate-treatment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'role': (userRole || 'general').toLowerCase(),
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) throw new Error(await response.text());
        const data = await response.json();
        if (!data || data.status !== 'success' || !data.treatment_plan)
          throw new Error('AI returned an empty or invalid treatment plan.');
        return data;
      }
    );

    if (usedFallback) {
      // 10s timeout reached or error — load demo data
      setTreatmentResult(MOCK_TREATMENT);
      setTreatmentGenerated(true);
      // setApiError('⚠️ Demo mode: backend unavailable, showing predefined results.');
    } else {
      setTreatmentResult(result.treatment_plan);
      setTreatmentGenerated(true);
    }

    setIsLoading(false);
  };

  // ─────────────────────────────────────────────
  // ACTION HANDLERS
  // ─────────────────────────────────────────────

  const handleConfirmDiagnosis = () => {
    setShowSuccessMessage(true);
    setTimeout(() => {
      setShowSuccessMessage(false);
      setAiAnalyzing(false);
      setPrognosisResult(null);
      setSymptoms('');
      setVitalSigns('');
      setLabResults('');
      setLabFile(null);
      setImagingFile(null);
      // Navigate to AI Treatment with the confirmed patient still selected
      setCurrentView('treatment');
    }, 2000);
  };

  const handleRequest2ndOpinion = () => {
    alert('Requesting 2nd AI Opinion... This will analyze the data with alternative models.');
  };

  const handleApproveAndSend = () => {
    alert('Treatment plan approved and sent to pharmacist successfully!');
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 2000);
  };

  const handleModifyTreatment = () => {
    alert('Opening treatment modification interface...');
  };

  const handleRegeneratePlan = () => {
    alert('Regenerating AI treatment plan with updated parameters...');
    setTreatmentGenerated(false);
    setTreatmentResult(null);
    setTimeout(() => handleGenerateTreatment(), 500);
  };

  // ─────────────────────────────────────────────
  // VIEWS
  // ─────────────────────────────────────────────

  const renderDashboard = () => (
    <div className="space-y-4">
      {showSuccessMessage && (
        <div className="success-banner">
          <Check size={24} />
          <span>Action completed successfully!</span>
        </div>
      )}

      <div className="ai-insights-banner">
        <div className="flex items-center gap-3 mb-3">
          <Brain size={32} className="text-purple-600" />
          <h3 className="font-bold text-lg">AI Health Insights</h3>
        </div>
        <div className="stats-grid">
          <div className="stat-card clickable" onClick={() => alert('Viewing high-risk patients...')}>
            <div className="stat-label">High Risk Patients</div>
            <div className="stat-value text-red-600">3</div>
            <div className="stat-sublabel">AI flagged for attention</div>
          </div>
          <div className="stat-card clickable" onClick={() => alert('Viewing accuracy metrics...')}>
            <div className="stat-label">Diagnosis Accuracy</div>
            <div className="stat-value text-green-600">94%</div>
            <div className="stat-sublabel">AI predictions this week</div>
          </div>
          <div className="stat-card clickable" onClick={() => alert('Viewing treatment outcomes...')}>
            <div className="stat-label">Treatment Success</div>
            <div className="stat-value text-blue-600">89%</div>
            <div className="stat-sublabel">AI-assisted treatments</div>
          </div>
        </div>
      </div>

      <div className="dashboard-stats">
        <div className="stat-box clickable" onClick={() => alert('Viewing all patients...')}>
          <Users className="mx-auto mb-2" size={32} />
          <div className="stat-number">248</div>
          <div className="stat-text">Total Patients</div>
        </div>
        <div className="stat-box clickable" onClick={() => alert("Viewing today's appointments...")}>
          <Activity className="mx-auto mb-2" size={32} />
          <div className="stat-number">15</div>
          <div className="stat-text">Today's Appointments</div>
        </div>
        <div className="stat-box clickable" onClick={() => setCurrentView('prognosis')}>
          <FileText className="mx-auto mb-2" size={32} />
          <div className="stat-number">8</div>
          <div className="stat-text">Pending Diagnoses</div>
        </div>
        <div className="stat-box clickable" onClick={() => setCurrentView('treatment')}>
          <Pill className="mx-auto mb-2" size={32} />
          <div className="stat-number">23</div>
          <div className="stat-text">Prescriptions</div>
        </div>
      </div>

      <div className="activity-section">
        <h3 className="section-title">AI Alerts & Recommendations</h3>
        <div className="alerts-list">
          {[
            { text: 'Patient J.Doe - AI detected abnormal biomarkers', priority: 'high', action: () => setCurrentView('prognosis') },
            { text: 'AI suggests alternative treatment for Patient M.Smith', priority: 'medium', action: () => setCurrentView('treatment') },
            { text: 'Drug interaction warning for prescription #2847', priority: 'high', action: () => alert('Viewing prescription details...') },
            { text: 'AI pattern analysis: Flu outbreak predicted in 2 weeks', priority: 'low', action: () => alert('Viewing epidemic analysis...') }
          ].map((item, i) => (
            <div key={i} className={`alert-item priority-${item.priority} clickable`} onClick={item.action}>
              <div className="alert-content">
                <AlertCircle size={20} />
                <span>{item.text}</span>
              </div>
              <span className="priority-badge">{item.priority.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const getProbabilityColor = (probability) => {
    const pct = parseInt(probability);
    if (pct >= 75) return { badge: '#dc2626', bar: '#dc2626', label: 'Critical' };      // red
    if (pct >= 55) return { badge: '#ea580c', bar: '#ea580c', label: 'High' };          // orange
    if (pct >= 35) return { badge: '#ca8a04', bar: '#ca8a04', label: 'Moderate' };      // yellow
    return          { badge: '#16a34a', bar: '#16a34a', label: 'Low' };                 // green
  };

  const renderPrognosis = () => (
    <div className="space-y-4">
      {showSuccessMessage && (
        <div className="success-banner">
          <Check size={24} />
          <span>Diagnosis confirmed and saved successfully!</span>
        </div>
      )}

      <div className="ai-header">
        <Brain size={28} className="text-purple-600" />
        <div>
          <h3 className="font-bold">AI-Powered Prognosis System</h3>
          <p className="header-subtitle">System analyzes patient data to identify top 5-10 most likely diseases</p>
        </div>
      </div>

      <div className="input-section">
        <h3 className="section-title">Patient Data Input</h3>
        <div className="input-grid">
          {/* Left Column */}
          <div className="input-column">
            <div className="input-group">
              <label>Patient ID / Name</label>
              <select
                id="selectedPatient"
                name="selectedPatient"
                className="input-field-select"
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
              >
                <option value="">Select Patient</option>
                {patients.map(patient => (
                  <option key={patient.id} value={patient.id}>
                    {patient.id} - {patient.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label>Symptoms</label>
              <textarea
                id="symptoms"
                name="symptoms"
                className="input-field textarea"
                placeholder="Enter symptoms (e.g., fever, headache, chest pain...)"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label>Vital Signs</label>
              <input
                type="text"
                id="vitalSigns"
                name="vitalSigns"
                className="input-field"
                placeholder="BP: 145/95, Temp: 98.6°F, HR: 85 bpm"
                value={vitalSigns}
                onChange={(e) => setVitalSigns(e.target.value)}
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="input-column">
            <div className="input-group">
              <label>Lab Results</label>
              <div className="lab-split-box">
                <textarea
                  id="labResults"
                  name="labResults"
                  className="lab-split-textarea"
                  placeholder="Type lab results here..."
                  value={labResults}
                  onChange={(e) => setLabResults(e.target.value)}
                />
                <div className="lab-split-divider" />
                <div className="lab-split-upload">
                  <input
                    ref={labFileRef}
                    type="file"
                    accept=".pdf,.txt,.csv,.doc,.docx,.png,.jpg,.jpeg"
                    style={{ display: 'none' }}
                    onChange={handleLabFileChange}
                  />
                  {labFile ? (
                    <div className="lab-file-preview">
                      <Paperclip size={20} color="#9333ea" />
                      <span className="lab-file-name">{labFile.name}</span>
                      <span className="lab-file-size">{(labFile.size / 1024).toFixed(1)} KB</span>
                      <button className="lab-file-remove" onClick={handleRemoveLabFile} title="Remove">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="lab-upload-zone" onClick={() => labFileRef.current.click()}>
                      <Upload size={22} color="#9333ea" />
                      <span className="lab-upload-title">Upload File</span>
                      <span className="lab-upload-hint">PDF, image, CSV, TXT</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="input-group">
              <label>Medical Imaging</label>
              <input
                ref={imagingFileRef}
                type="file"
                accept="image/*,.dcm"
                style={{ display: 'none' }}
                onChange={handleImagingFileChange}
              />
              {imagingFile ? (
                <div className="imaging-preview">
                  {imagingFile.type.startsWith('image/') ? (
                    <img
                      src={URL.createObjectURL(imagingFile)}
                      alt="Medical imaging preview"
                      className="imaging-preview-img"
                    />
                  ) : (
                    <div className="imaging-file-icon">🩻</div>
                  )}
                  <div className="imaging-file-info">
                    <span className="imaging-file-name">{imagingFile.name}</span>
                    <span className="imaging-file-size">{(imagingFile.size / 1024).toFixed(1)} KB</span>
                  </div>
                  <button className="imaging-remove-btn" onClick={handleRemoveImagingFile}>
                    <X size={16} /> Remove
                  </button>
                </div>
              ) : (
                <div className="image-upload clickable" onClick={() => imagingFileRef.current.click()}>
                  <Upload size={20} style={{ marginBottom: 6, color: '#9333ea' }} />
                  <span>📁 Click to Upload X-ray, CT, MRI</span>
                  <span style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 4 }}>
                    Supports JPEG, PNG, DICOM
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {apiError && (
          <div className="api-error-banner">
            ⚠️ {apiError}
          </div>
        )}

        <button
          onClick={handleRunAIAnalysis}
          className="ai-button"
          disabled={!selectedPatient || !symptoms || isLoading}
        >
          {isLoading ? (
            <><span className="spinner" /> Analyzing...</>
          ) : (
            <><Sparkles size={20} /> RUN AI ANALYSIS</>
          )}
        </button>
      </div>

      {aiAnalyzing && prognosisResult && (
        <div className="results-section">
          <div className="results-header">
            <Brain size={28} className="brain-pulse" />
            <h3 className="section-title">AI Prognosis Results</h3>
            <span className="confidence-badge">
              TOP {prognosisResult.length} CONDITIONS
            </span>
          </div>

          <div className="diseases-list">
            {prognosisResult.map((item, i) => {
              const color = getProbabilityColor(item.probability);
              return (
                <div
                  key={i}
                  className="disease-card clickable"
                  onClick={() => alert(`Viewing detailed information for: ${item.prognosis}`)}
                  style={{ borderLeft: `4px solid ${color.bar}` }}
                >
                  <div className="disease-header">
                    <div className="disease-name">#{i + 1} {item.prognosis}</div>
                    <div className="disease-badges">
                      <span
                        className="probability-badge"
                        style={{ backgroundColor: color.badge, color: '#fff', border: 'none' }}
                      >
                        {item.probability}
                      </span>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: '600',
                          color: color.badge,
                          marginLeft: '6px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        {color.label}
                      </span>
                    </div>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: item.probability, backgroundColor: color.bar }}></div>
                  </div>
                  <div className="ai-reasoning">
                    <strong>AI Details:</strong> {item.details ?? 'No details provided.'}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="action-buttons">
            <button className="primary-button" onClick={handleConfirmDiagnosis}>
              CONFIRM & CREATE DIAGNOSIS
            </button>
            <button className="secondary-button" onClick={handleRequest2ndOpinion}>
              REQUEST 2ND AI OPINION
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderTreatment = () => (
    <div className="space-y-4">
      {showSuccessMessage && (
        <div className="success-banner">
          <Check size={24} />
          <span>Treatment plan sent to pharmacist successfully!</span>
        </div>
      )}

      <div className="ai-header">
        <Brain size={28} className="text-purple-600" />
        <div>
          <h3 className="font-bold">AI Treatment Recommendation Engine</h3>
          <p className="header-subtitle">Personalized treatment plans based on patient history and clinical data</p>
        </div>
      </div>

      <div className="treatment-grid">
        <div className="diagnosis-box">
          <h3 className="section-title">Current Diagnosis</h3>
          <div className="diagnosis-details">
            <div className="input-group">
              <label>Select Patient</label>
              <select
                className="input-field-select"
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
              >
                <option value="">Select Patient</option>
                {patients.map(patient => (
                  <option key={patient.id} value={patient.id}>
                    {patient.id} - {patient.name}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <strong>Primary:</strong> Hypertension (Essential)<br />
              <strong>Secondary:</strong> Type 2 Diabetes<br />
              <strong>Risk Factors:</strong> High BMI, Family History
            </div>
          </div>

          {apiError && (
            <div className="api-error-banner">⚠️ {apiError}</div>
          )}

          <button
            className="ai-button full-width"
            onClick={handleGenerateTreatment}
            disabled={!selectedPatient || isLoading}
          >
            {isLoading ? (
              <><span className="spinner" /> Generating...</>
            ) : (
              <><Sparkles size={20} /> GENERATE AI TREATMENT PLAN</>
            )}
          </button>
        </div>

        <div className="interaction-checker">
          <h3 className="section-title flex-header">
            <Brain size={20} />
            AI Drug Interaction Checker
          </h3>
          <div className="interactions-list">
            <div className="interaction-item clickable" onClick={() => alert('Viewing detailed interaction report...')}>
              <span>Lisinopril + Metformin</span>
              <span className="badge-safe">SAFE</span>
            </div>
            <div className="interaction-item clickable" onClick={() => alert('WARNING: May increase bleeding risk. Monitor closely.')}>
              <span>Aspirin + Ibuprofen</span>
              <span className="badge-warning">WARNING</span>
            </div>
            <div className="interaction-item clickable" onClick={() => alert('Viewing detailed interaction report...')}>
              <span>Metformin + Atorvastatin</span>
              <span className="badge-safe">SAFE</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── TREATMENT PLAN — redesigned with structured cards ── */}
      {treatmentGenerated && treatmentResult && (() => {
        const { treatmentLines, medications } = parseTreatmentText(treatmentResult);
        return (
          <div className="treatment-plan">

            {/* Plan header banner */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '18px 24px',
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              borderRadius: '14px', color: 'white',
            }}>
              <Sparkles size={24} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>AI-Recommended Treatment Plan</div>
                <div style={{ fontSize: '0.78rem', opacity: 0.8, marginTop: 2 }}>
                  Patient {selectedPatient} · Confirmed: Hypertension (Essential)
                </div>
              </div>
              <span style={{
                marginLeft: 'auto', background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.35)', color: 'white',
                fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em',
                padding: '4px 10px', borderRadius: '20px',
              }}>AI OPTIMIZED</span>
            </div>

            {/* Treatment Plan section */}
            <div style={{ background: 'white', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '14px 20px', borderBottom: '1px solid #eef0f6', background: '#fafbff',
              }}>
                <span style={{ fontSize: '18px' }}>🩺</span>
                <span style={{ fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#1a1d2e' }}>Treatment Plan</span>
              </div>
              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {treatmentLines.map((line, i) => {
                  const colonIdx = line.indexOf(':');
                  const title = colonIdx > -1 ? line.slice(0, colonIdx) : null;
                  const body  = colonIdx > -1 ? line.slice(colonIdx + 1).trim() : line;
                  return (
                    <div key={i} style={{
                      display: 'flex', gap: '12px', alignItems: 'flex-start',
                      padding: '12px 14px', background: '#f8f9ff',
                      borderRadius: '10px', borderLeft: '3px solid #7c3aed',
                    }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%',
                        background: '#ede9fe', color: '#7c3aed',
                        fontSize: '0.7rem', fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, marginTop: 1,
                      }}>{i + 1}</div>
                      <p style={{ fontSize: '0.85rem', lineHeight: 1.55, color: '#374151' }}>
                        {title && <strong style={{ color: '#1a1d2e' }}>{title}: </strong>}
                        {body}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Medication Plan section */}
            <div style={{ background: 'white', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '14px 20px', borderBottom: '1px solid #eef0f6', background: '#fafbff',
              }}>
                <span style={{ fontSize: '18px' }}>💊</span>
                <span style={{ fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#1a1d2e' }}>Medication Plan</span>
              </div>
              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {medications.map((med, i) => (
                  <div key={i} style={{ border: '1px solid #e5e7f0', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 16px', background: '#f8f9ff', gap: '12px',
                    }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1a1d2e' }}>{med.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 2, fontFamily: 'monospace' }}>{med.meta}</div>
                      </div>
                      <span style={{
                        fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em',
                        padding: '3px 9px', borderRadius: '20px', whiteSpace: 'nowrap',
                        background: med.tag === 'REVIEW' ? '#fef9c3' : '#dbeafe',
                        color:      med.tag === 'REVIEW' ? '#854d0e'  : '#1d4ed8',
                      }}>{med.tag}</span>
                    </div>
                    {med.rationale ? (
                      <div style={{
                        padding: '10px 16px', fontSize: '0.8rem', color: '#6b7280',
                        lineHeight: 1.55, borderTop: '1px solid #eef0f6', background: 'white',
                      }}>
                        <span style={{ color: '#7c3aed', fontWeight: 600 }}>Rationale: </span>
                        {med.rationale}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button className="primary-button" style={{ flex: 1 }} onClick={handleApproveAndSend}>
                ✓ &nbsp;APPROVE & SEND TO PHARMACIST
              </button>
              <button className="secondary-button" style={{ flex: 1 }} onClick={handleModifyTreatment}>
                ✎ &nbsp;MODIFY TREATMENT
              </button>
              <button className="tertiary-button" style={{ flex: 1 }} onClick={handleRegeneratePlan}>
                ↺ &nbsp;REGENERATE AI PLAN
              </button>
            </div>

          </div>
        );
      })()}
    </div>
  );

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────

  return (
    <div className="dashboard-app">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo">
              <Brain size={32} />
            </div>
            <div className="header-text">
              <h1 className="header-title">AI-Powered HealthCare System</h1>
              <p className="header-subtitle">KitaHack2026 | Intelligent Medical Assistant</p>
            </div>
          </div>
          <div className="header-right">
            <div className="ai-status">
              <Sparkles size={16} />
              <span>AI Active</span>
            </div>
            <button className="icon-button" onClick={() => alert('Search feature - Connect to your search API')}>
              <Search size={20} />
            </button>
            <button className="icon-button" onClick={() => setShowNotifications(!showNotifications)}>
              <Bell size={20} />
              {showNotifications && (
                <div className="notification-dropdown">
                  <div className="notification-item">New lab results available</div>
                  <div className="notification-item">Appointment reminder: 2:00 PM</div>
                  <div className="notification-item">AI alert: High-risk patient</div>
                </div>
              )}
            </button>
            <div className="user-badge">
              <User size={20} />
              <span>{userName || 'Dr. Smith'}</span>
            </div>
            <button className="logout-button" onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="navigation">
        <div className="nav-content">
          {[
            { id: 'dashboard', label: 'AI Dashboard', icon: Activity },
            { id: 'prognosis', label: 'AI Prognosis', icon: Brain },
            { id: 'treatment', label: 'AI Treatment', icon: Sparkles }
          ].map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id);
                  if (item.id !== 'prognosis') setAiAnalyzing(false);
                  if (item.id !== 'treatment') setTreatmentGenerated(false);
                }}
                className={`nav-button ${currentView === item.id ? 'active' : ''}`}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        {currentView === 'dashboard' && renderDashboard()}
        {currentView === 'prognosis' && renderPrognosis()}
        {currentView === 'treatment' && renderTreatment()}
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-title">AI Features:</div>
            <div className="footer-features">
              <span>🧠 Disease Prediction (Top 5-10)</span>
              <span>💊 Drug Interaction Check</span>
              <span>📊 Treatment Optimization</span>
              <span>⚠️ Risk Assessment</span>
            </div>
          </div>
          <div className="footer-section">
            <div className="footer-title">User Roles:</div>
            <div className="footer-roles">
              <span>👨‍⚕️ Doctor</span>
              <span>💊 Pharmacist</span>
              <span>👨‍💼 Admin</span>
              <span>🔬 Medical Tech</span>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          AI Model: Healthcare GPT v2.0 | Accuracy: 94% | Last Updated: Jan 2026
        </div>
      </footer>
    </div>
  );
}

export default Dashboard;