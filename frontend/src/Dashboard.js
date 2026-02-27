import React, { useState, useRef } from 'react';
import { User, FileText, Activity, Pill, Users, Search, Bell, Brain, Sparkles, AlertCircle, TrendingUp, X, Check, Upload, Paperclip } from 'lucide-react';
import './Dashboard.css';

function Dashboard({ userRole, userName, onLogout }) {
  const [currentView, setCurrentView] = useState('dashboard');
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [vitalSigns, setVitalSigns] = useState('');
  const [labResults, setLabResults] = useState('');
  const [labFile, setLabFile] = useState(null);
  const [imagingFile, setImagingFile] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [treatmentGenerated, setTreatmentGenerated] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [prognosisResult, setPrognosisResult] = useState(null);
  const [apiError, setApiError] = useState('');

  const labFileRef = useRef();
  const imagingFileRef = useRef();

  const patients = [
    { id: 'P001', name: 'John Doe' },
    { id: 'P002', name: 'Jane Smith' },
    { id: 'P003', name: 'Michael Brown' },
    { id: 'P004', name: 'Sarah Johnson' }
  ];

  const handleLabFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLabFile(file);
      // If it's a text-based file, read its contents into the textarea
      if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.csv')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setLabResults(ev.target.result);
        };
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

  const handleRunAIAnalysis = async () => {
    if (!selectedPatient || !symptoms) {
      alert('Please select a patient and enter symptoms before running AI analysis');
      return;
    }
    setIsLoading(true);
    setApiError('');
    setPrognosisResult(null);

    try {
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

      // Build request matching PrognosisRequest model exactly
      const requestBody = {
        patient_id: selectedPatient,
        role: (userRole || 'general').toLowerCase(),
        current_details: {
          symptoms: symptoms,
          vital_signs: vitalSigns,
          lab_results: labResults,
          lab_file: labFileBase64 ? {
            name: labFileName,
            type: labFileType,
            data: labFileBase64,
          } : null,
        },
        image_base64: imageBase64 || null,
      };

      const response = await fetch('/generate-prognosis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'role': (userRole || 'general').toLowerCase(),
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(err || 'Server error');
      }

      const data = await response.json();
      setPrognosisResult(data);
      setAiAnalyzing(true); // show results section
    } catch (error) {
      console.error('API Error:', error);
      setApiError(error.message || 'Failed to connect to AI backend. Is your server running?');
      // Still show mock results so UI is usable during dev
      setAiAnalyzing(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDiagnosis = () => {
    setShowSuccessMessage(true);
    setTimeout(() => {
      setShowSuccessMessage(false);
      setAiAnalyzing(false);
      setSelectedPatient('');
      setSymptoms('');
      setVitalSigns('');
      setLabResults('');
      setLabFile(null);
      setImagingFile(null);
    }, 2000);
  };

  const handleRequest2ndOpinion = () => {
    alert('Requesting 2nd AI Opinion... This will analyze the data with alternative models.');
  };

  const handleGenerateTreatment = async () => {
    if (!selectedPatient) {
      alert('Please select a patient first');
      return;
    }
    setIsLoading(true);
    setApiError('');
    try {
      const requestBody = {
        patient_id: selectedPatient,
        role: (userRole || 'general').toLowerCase(),
        confirmed_diagnosis: 'Hypertension (Essential)',
        current_details: {
          symptoms: symptoms,
          vital_signs: vitalSigns,
          lab_results: labResults,
        },
      };

      const response = await fetch('/generate-treatment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'role': (userRole || 'general').toLowerCase(),
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) throw new Error(await response.text());
      setTreatmentGenerated(true);
    } catch (error) {
      setApiError(error.message || 'Failed to connect to AI backend.');
      setTreatmentGenerated(true); // still show mock UI during dev
    } finally {
      setIsLoading(false);
    }
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
    setTimeout(() => setTreatmentGenerated(true), 1500);
  };

  const DashboardView = () => (
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

  const AIPrognosisView = () => (
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
                id="selectedPatient" name="selectedPatient"
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
                id="symptoms" name="symptoms"
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
                id="vitalSigns" name="vitalSigns"
                className="input-field"
                placeholder="BP: 145/95, Temp: 98.6°F, HR: 85 bpm"
                value={vitalSigns}
                onChange={(e) => setVitalSigns(e.target.value)}
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="input-column">
            {/* Lab Results - split left type / right upload */}
            <div className="input-group">
              <label>Lab Results</label>
              <div className="lab-split-box">
                <textarea
                  id="labResults" name="labResults"
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
                    <div
                      className="lab-upload-zone"
                      onClick={() => labFileRef.current.click()}
                    >
                      <Upload size={22} color="#9333ea" />
                      <span className="lab-upload-title">Upload File</span>
                      <span className="lab-upload-hint">PDF, image, CSV, TXT</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Medical Imaging */}
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
                <div
                  className="image-upload clickable"
                  onClick={() => imagingFileRef.current.click()}
                >
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
            <>
              <span className="spinner" /> Analyzing...
            </>
          ) : (
            <>
              <Sparkles size={20} />
              RUN AI ANALYSIS
            </>
          )}
        </button>
      </div>

      {aiAnalyzing && (
        <div className="results-section">
          <div className="results-header">
            <Brain size={28} className="brain-pulse" />
            <h3 className="section-title">AI Prognosis Results</h3>
            <span className="confidence-badge">CONFIDENCE: 87%</span>
          </div>

          <div className="diseases-list">
            {[
              { disease: 'Hypertension (Essential)', probability: '92%', confidence: 'High' },
              { disease: 'Type 2 Diabetes Mellitus', probability: '78%', confidence: 'High' },
              { disease: 'Chronic Kidney Disease', probability: '65%', confidence: 'Medium' },
              { disease: 'Coronary Artery Disease', probability: '54%', confidence: 'Medium' },
              { disease: 'Hyperlipidemia', probability: '48%', confidence: 'Medium' },
              { disease: 'Metabolic Syndrome', probability: '41%', confidence: 'Low' },
              { disease: 'Peripheral Artery Disease', probability: '32%', confidence: 'Low' }
            ].map((item, i) => (
              <div
                key={i}
                className="disease-card clickable"
                onClick={() => alert(`Viewing detailed information for: ${item.disease}`)}
              >
                <div className="disease-header">
                  <div className="disease-name">#{i + 1} {item.disease}</div>
                  <div className="disease-badges">
                    <span className="probability-badge">{item.probability}</span>
                    <span className={`confidence-badge-${item.confidence.toLowerCase()}`}>
                      {item.confidence} Confidence
                    </span>
                  </div>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: item.probability }}></div>
                </div>
                <div className="ai-reasoning">
                  <strong>AI Reasoning:</strong> Based on elevated BP (145/95), BMI 31.2, family history, age 54...
                </div>
              </div>
            ))}
          </div>

          <div className="recommendations-box">
            <div className="recommendations-header">
              <AlertCircle className="text-yellow-700" />
              <strong>AI Recommendations:</strong>
            </div>
            <ul className="recommendations-list">
              <li>Recommend comprehensive metabolic panel</li>
              <li>Consider ECG and cardiac stress test</li>
              <li>Refer to endocrinologist for diabetes management</li>
              <li>Lifestyle intervention program recommended</li>
            </ul>
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

  const AITreatmentView = () => (
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

          <button
            className="ai-button full-width"
            onClick={handleGenerateTreatment}
            disabled={!selectedPatient}
          >
            <Sparkles size={20} />
            GENERATE AI TREATMENT PLAN
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

      {treatmentGenerated && (
        <div className="treatment-plan">
          <h3 className="section-title flex-header">
            <Sparkles className="text-purple-600" size={24} />
            AI-Recommended Treatment Plan
          </h3>

          <div className="medication-protocol">
            <div className="protocol-header">
              <div className="protocol-title">Medication Protocol</div>
              <span className="ai-optimized-badge">AI OPTIMIZED</span>
            </div>

            <div className="medications-list">
              {[
                { drug: 'Lisinopril 10mg', dosage: '1x daily (morning)', reason: 'First-line for hypertension', effectiveness: '94%' },
                { drug: 'Metformin 500mg', dosage: '2x daily (with meals)', reason: 'Diabetes management + weight control', effectiveness: '89%' },
                { drug: 'Atorvastatin 20mg', dosage: '1x daily (evening)', reason: 'Cardiovascular risk reduction', effectiveness: '91%' }
              ].map((med, i) => (
                <div
                  key={i}
                  className="medication-card clickable"
                  onClick={() => alert(`Viewing full details for ${med.drug}`)}
                >
                  <div className="medication-header">
                    <div>
                      <div className="medication-name">{med.drug}</div>
                      <div className="medication-dosage">{med.dosage}</div>
                    </div>
                    <span className="effectiveness-badge">{med.effectiveness} effective</span>
                  </div>
                  <div className="medication-reason">
                    <strong>AI Rationale:</strong> {med.reason}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="recommendations-grid">
            <div className="recommendation-box">
              <h4 className="recommendation-title">AI Lifestyle Recommendations</h4>
              <ul className="recommendation-list">
                <li>DASH diet (AI predicts 15% BP reduction)</li>
                <li>150 min/week moderate exercise</li>
                <li>Target weight loss: 10 lbs in 3 months</li>
                <li>Sodium restriction: &lt;2000mg/day</li>
              </ul>
            </div>
            <div className="recommendation-box">
              <h4 className="recommendation-title">AI Monitoring Schedule</h4>
              <ul className="recommendation-list">
                <li>Blood pressure: Daily at home</li>
                <li>Lab work: Every 3 months</li>
                <li>Follow-up visit: 6 weeks</li>
                <li>AI risk reassessment: Monthly</li>
              </ul>
            </div>
          </div>

          <div className="outcomes-prediction">
            <div className="outcomes-header">
              <TrendingUp className="text-blue-600" />
              <strong>AI Predicted Outcomes (6 months):</strong>
            </div>
            <div className="outcomes-grid">
              <div className="outcome-card clickable" onClick={() => alert('Viewing detailed BP control metrics...')}>
                <div className="outcome-value">85%</div>
                <div className="outcome-label">BP Control Success</div>
              </div>
              <div className="outcome-card clickable" onClick={() => alert('Viewing HbA1c improvement trajectory...')}>
                <div className="outcome-value">78%</div>
                <div className="outcome-label">HbA1c Improvement</div>
              </div>
              <div className="outcome-card clickable" onClick={() => alert('Viewing cardiovascular risk analysis...')}>
                <div className="outcome-value">-12%</div>
                <div className="outcome-label">Cardiovascular Risk</div>
              </div>
            </div>
          </div>

          <div className="action-buttons">
            <button className="primary-button" onClick={handleApproveAndSend}>
              APPROVE & SEND TO PHARMACIST
            </button>
            <button className="secondary-button" onClick={handleModifyTreatment}>
              MODIFY TREATMENT
            </button>
            <button className="tertiary-button" onClick={handleRegeneratePlan}>
              REGENERATE AI PLAN
            </button>
          </div>
        </div>
      )}
    </div>
  );

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
        {currentView === 'dashboard' && <DashboardView />}
        {currentView === 'prognosis' && <AIPrognosisView />}
        {currentView === 'treatment' && <AITreatmentView />}
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