import React, { useState } from 'react';
import { User, FileText, Activity, Pill, Users, Search, Bell, Brain, Sparkles, AlertCircle, TrendingUp } from 'lucide-react';
import './Dashboard.css';

function Dashboard({ userRole, userName, onLogout }) {
  const [currentView, setCurrentView] = useState('dashboard');
  const [aiAnalyzing, setAiAnalyzing] = useState(false);

  const DashboardView = () => (
    <div className="space-y-4">
      {/* AI Insights Banner */}
      <div className="ai-insights-banner">
        <div className="flex items-center gap-3 mb-3">
          <Brain size={32} className="text-purple-600" />
          <h3 className="font-bold text-lg">AI Health Insights</h3>
        </div>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">High Risk Patients</div>
            <div className="stat-value text-red-600">3</div>
            <div className="stat-sublabel">AI flagged for attention</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Diagnosis Accuracy</div>
            <div className="stat-value text-green-600">94%</div>
            <div className="stat-sublabel">AI predictions this week</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Treatment Success</div>
            <div className="stat-value text-blue-600">89%</div>
            <div className="stat-sublabel">AI-assisted treatments</div>
          </div>
        </div>
      </div>

      <div className="dashboard-stats">
        <div className="stat-box">
          <Users className="mx-auto mb-2" size={32} />
          <div className="stat-number">248</div>
          <div className="stat-text">Total Patients</div>
        </div>
        <div className="stat-box">
          <Activity className="mx-auto mb-2" size={32} />
          <div className="stat-number">15</div>
          <div className="stat-text">Today's Appointments</div>
        </div>
        <div className="stat-box">
          <FileText className="mx-auto mb-2" size={32} />
          <div className="stat-number">8</div>
          <div className="stat-text">Pending Diagnoses</div>
        </div>
        <div className="stat-box">
          <Pill className="mx-auto mb-2" size={32} />
          <div className="stat-number">23</div>
          <div className="stat-text">Prescriptions</div>
        </div>
      </div>

      <div className="activity-section">
        <h3 className="section-title">AI Alerts & Recommendations</h3>
        <div className="alerts-list">
          {[
            { text: 'Patient J.Doe - AI detected abnormal biomarkers', priority: 'high' },
            { text: 'AI suggests alternative treatment for Patient M.Smith', priority: 'medium' },
            { text: 'Drug interaction warning for prescription #2847', priority: 'high' },
            { text: 'AI pattern analysis: Flu outbreak predicted in 2 weeks', priority: 'low' }
          ].map((item, i) => (
            <div key={i} className={`alert-item priority-${item.priority}`}>
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
          <div className="input-column">
            <div className="input-group">
              <label>Patient ID / Name</label>
              <div className="input-field">[Select Patient]</div>
            </div>
            <div className="input-group">
              <label>Symptoms</label>
              <div className="input-field textarea">[Enter symptoms...]</div>
            </div>
            <div className="input-group">
              <label>Vital Signs</label>
              <div className="input-field">[BP, Temp, Heart Rate...]</div>
            </div>
          </div>
          <div className="input-column">
            <div className="input-group">
              <label>Lab Results</label>
              <div className="input-field textarea">[Upload/Enter results...]</div>
            </div>
            <div className="input-group">
              <label>Medical Imaging</label>
              <div className="image-upload">[Upload X-ray, CT, MRI]</div>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setAiAnalyzing(true)}
          className="ai-button"
        >
          <Sparkles size={20} />
          RUN AI ANALYSIS
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
              <div key={i} className="disease-card">
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
                  <div className="progress-fill" style={{width: item.probability}}></div>
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
            <button className="primary-button">CONFIRM & CREATE DIAGNOSIS</button>
            <button className="secondary-button">REQUEST 2ND AI OPINION</button>
          </div>
        </div>
      )}
    </div>
  );

  const AITreatmentView = () => (
    <div className="space-y-4">
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
            <strong>Primary:</strong> Hypertension (Essential)<br/>
            <strong>Secondary:</strong> Type 2 Diabetes<br/>
            <strong>Risk Factors:</strong> High BMI, Family History
          </div>
          
          <button className="ai-button full-width">
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
            <div className="interaction-item">
              <span>Lisinopril + Metformin</span>
              <span className="badge-safe">SAFE</span>
            </div>
            <div className="interaction-item">
              <span>Aspirin + Ibuprofen</span>
              <span className="badge-warning">WARNING</span>
            </div>
            <div className="interaction-item">
              <span>Metformin + Atorvastatin</span>
              <span className="badge-safe">SAFE</span>
            </div>
          </div>
        </div>
      </div>

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
              <div key={i} className="medication-card">
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
            <div className="outcome-card">
              <div className="outcome-value">85%</div>
              <div className="outcome-label">BP Control Success</div>
            </div>
            <div className="outcome-card">
              <div className="outcome-value">78%</div>
              <div className="outcome-label">HbA1c Improvement</div>
            </div>
            <div className="outcome-card">
              <div className="outcome-value">-12%</div>
              <div className="outcome-label">Cardiovascular Risk</div>
            </div>
          </div>
        </div>

        <div className="action-buttons">
          <button className="primary-button">APPROVE & SEND TO PHARMACIST</button>
          <button className="secondary-button">MODIFY TREATMENT</button>
          <button className="tertiary-button">REGENERATE AI PLAN</button>
        </div>
      </div>
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
            <button className="icon-button">
              <Search size={20} />
            </button>
            <button className="icon-button">
              <Bell size={20} />
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