import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

const Register = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: "", middleName: "", lastName: "",
    email: "", mobile: "", pan: "", dob: "", aadhaar: "", panName: "",
    ifsc: "", accountNumber: "", bankName: "", branchName: "", chequeFile: null,
    nomineeFirstName: "", nomineeMiddleName: "", nomineeLastName: "",
    nomineeRelationship: "", nomineeEmail: "", nomineePan: "", nomineeDob: "",
    password: "", confirmPassword: "",
  });

  const [verified, setVerified] = useState({ email: false, aadhaar: false });
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const updateForm = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === "password") evaluatePasswordStrength(value);
  };

  const evaluatePasswordStrength = (pwd) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++;
    setPasswordStrength(strength);
  };

  const getStrengthLabel = () => ["Very Weak","Weak","Fair","Good","Strong","Very Strong"][passwordStrength];
  const getStrengthColor = () => ["#EF4444","#F97316","#EAB308","#3B82F6","#22C55E","#16A34A"][passwordStrength];

  const validateEmail    = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const validateMobile   = (v) => /^\d{10}$/.test(v);
  const validatePAN      = (v) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v);
  const validateAadhaar  = (v) => /^\d{12}$/.test(v);
  const isAge18OrAbove   = (dob) => {
    if (!dob) return false;
    const today = new Date(), birth = new Date(dob);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age >= 18;
  };
  const validatePassword        = () => passwordStrength >= 4;
  const validateConfirmPassword = (pwd, confirm) => pwd === confirm && pwd !== "";

  const isStepValid = () => {
    switch (step) {
      case 1: return formData.firstName.trim() !== "" && validateEmail(formData.email) && validateMobile(formData.mobile);
      case 2: return validatePAN(formData.pan) && formData.dob.trim() !== "" && isAge18OrAbove(formData.dob);
      case 3: return validateAadhaar(formData.aadhaar);
      case 4: return formData.ifsc.trim() !== "" && formData.accountNumber.trim() !== "" && formData.bankName.trim() !== "" && formData.branchName.trim() !== "" && formData.chequeFile !== null;
      case 5: return formData.nomineeFirstName.trim() !== "" && formData.nomineeRelationship.trim() !== "" && validateEmail(formData.nomineeEmail) && validatePAN(formData.nomineePan) && formData.nomineeDob.trim() !== "" && isAge18OrAbove(formData.nomineeDob);
      case 6: return validatePassword() && validateConfirmPassword(formData.password, formData.confirmPassword);
      default: return true;
    }
  };

  const nextStep = () => { if (isStepValid()) setStep((p) => Math.min(p + 1, 6)); };
  const prevStep = () => setStep((p) => Math.max(p - 1, 1));
  const handleFileChange = (e) => updateForm("chequeFile", e.target.files[0] || null);

  const handleSubmit = async () => {
    setSubmitError(""); setLoading(true);
    try {
      await axiosInstance.post("/auth/register", {
        firstName: formData.firstName, middleName: formData.middleName, lastName: formData.lastName,
        email: formData.email, mobile: formData.mobile, pan: formData.pan, dob: formData.dob,
        aadhaar: formData.aadhaar, panName: formData.panName,
        ifsc: formData.ifsc, accountNumber: formData.accountNumber,
        bankName: formData.bankName, branchName: formData.branchName,
        nomineeFirstName: formData.nomineeFirstName, nomineeMiddleName: formData.nomineeMiddleName,
        nomineeLastName: formData.nomineeLastName, nomineeRelationship: formData.nomineeRelationship,
        nomineeEmail: formData.nomineeEmail, nomineePan: formData.nomineePan, nomineeDob: formData.nomineeDob,
        password: formData.password,
      });
      navigate("/login");
    } catch (err) {
      setSubmitError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally { setLoading(false); }
  };

  const stepNames = ["Basic Details","Identity Details","Aadhaar Details","Bank Details","Nominee Details","Set Password"];

  // Shared input style helpers
  const inputStyle = {
    width: "100%", padding: "11px 16px", borderRadius: 12,
    border: "1px solid #2A2A2A", background: "#1C1C1C", color: "#F5F5F5",
    fontSize: 14, outline: "none", transition: "border 0.2s, box-shadow 0.2s",
    fontFamily: "inherit", boxSizing: "border-box",
  };
  const onFocus = (e) => { e.target.style.border = "1px solid #F59E0B"; e.target.style.boxShadow = "0 0 0 3px rgba(245,158,11,0.1)"; };
  const onBlur  = (e) => { e.target.style.border = "1px solid #2A2A2A"; e.target.style.boxShadow = "none"; };
  const Label   = ({ children }) => <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 600, color: "#A3A3A3", textTransform: "uppercase", letterSpacing: "0.05em" }}>{children}</p>;
  const FieldError = ({ msg }) => msg ? <p style={{ margin: "5px 0 0", fontSize: 12, color: "#EF4444" }}>{msg}</p> : null;

  const getError = (field) => {
    switch (field) {
      case "firstName":          return formData.firstName.trim() === "" ? "First name is required" : null;
      case "email":              return !validateEmail(formData.email) ? "Valid email required" : null;
      case "mobile":             return !validateMobile(formData.mobile) ? "10-digit mobile required" : null;
      case "pan":                return !validatePAN(formData.pan) ? "PAN format: ABCDE1234F" : null;
      case "dob":                return formData.dob.trim() === "" ? "Date of birth required" : !isAge18OrAbove(formData.dob) ? "You must be 18 or older" : null;
      case "aadhaar":            return !validateAadhaar(formData.aadhaar) ? "12-digit Aadhaar required" : null;
      case "ifsc":               return formData.ifsc.trim() === "" ? "IFSC required" : null;
      case "accountNumber":      return formData.accountNumber.trim() === "" ? "Account number required" : null;
      case "bankName":           return formData.bankName.trim() === "" ? "Bank name required" : null;
      case "branchName":         return formData.branchName.trim() === "" ? "Branch required" : null;
      case "chequeFile":         return !formData.chequeFile ? "File required" : null;
      case "nomineeFirstName":   return formData.nomineeFirstName.trim() === "" ? "First name required" : null;
      case "nomineeRelationship":return formData.nomineeRelationship.trim() === "" ? "Relationship required" : null;
      case "nomineeEmail":       return !validateEmail(formData.nomineeEmail) ? "Valid email required" : null;
      case "nomineePan":         return !validatePAN(formData.nomineePan) ? "PAN format: ABCDE1234F" : null;
      case "nomineeDob":         return formData.nomineeDob.trim() === "" ? "Date of birth required" : !isAge18OrAbove(formData.nomineeDob) ? "Nominee must be 18 or older" : null;
      case "password":           return !validatePassword() ? "Password must be at least Strong (4/5)" : null;
      case "confirmPassword":    return !validateConfirmPassword(formData.password, formData.confirmPassword) ? "Passwords must match" : null;
      default: return null;
    }
  };

  const renderStep = () => {
    const Field = ({ label, field, children }) => (
      <div style={{ marginBottom: 20 }}>
        <Label>{label}</Label>
        {children}
        <FieldError msg={getError(field)} />
      </div>
    );

    switch (step) {
      case 1: return (
        <div>
          <Field label="First Name *" field="firstName">
            <input style={inputStyle} type="text" value={formData.firstName} onChange={(e) => updateForm("firstName", e.target.value)} placeholder="John" onFocus={onFocus} onBlur={onBlur} />
          </Field>
          <Field label="Middle Name" field="">
            <input style={inputStyle} type="text" value={formData.middleName} onChange={(e) => updateForm("middleName", e.target.value)} placeholder="(Optional)" onFocus={onFocus} onBlur={onBlur} />
          </Field>
          <Field label="Last Name" field="">
            <input style={inputStyle} type="text" value={formData.lastName} onChange={(e) => updateForm("lastName", e.target.value)} placeholder="Doe (Optional)" onFocus={onFocus} onBlur={onBlur} />
          </Field>
          <Field label="Email *" field="email">
            <input style={inputStyle} type="email" value={formData.email} onChange={(e) => updateForm("email", e.target.value)} placeholder="john@example.com" onFocus={onFocus} onBlur={onBlur} />
          </Field>
          <Field label="Mobile *" field="mobile">
            <input style={inputStyle} type="tel" value={formData.mobile} onChange={(e) => updateForm("mobile", e.target.value)} placeholder="9876543210" onFocus={onFocus} onBlur={onBlur} />
          </Field>
        </div>
      );

      case 2: return (
        <div>
          <Field label="PAN Card Number *" field="pan">
            <input style={inputStyle} type="text" value={formData.pan} onChange={(e) => updateForm("pan", e.target.value.toUpperCase())} placeholder="ABCDE1234F" onFocus={onFocus} onBlur={onBlur} />
          </Field>
          <Field label="Date of Birth *" field="dob">
            <input style={{ ...inputStyle, colorScheme: "dark" }} type="date" value={formData.dob} onChange={(e) => updateForm("dob", e.target.value)} onFocus={onFocus} onBlur={onBlur} />
          </Field>
        </div>
      );

      case 3: return (
        <div>
          <Field label="Aadhaar Number *" field="aadhaar">
            <input style={inputStyle} type="text" value={formData.aadhaar} onChange={(e) => updateForm("aadhaar", e.target.value)} placeholder="1234 5678 9012" onFocus={onFocus} onBlur={onBlur} />
          </Field>
          <Field label="Name as on PAN" field="">
            <input style={inputStyle} type="text" value={formData.panName} onChange={(e) => updateForm("panName", e.target.value)} placeholder="Enter name as on PAN" onFocus={onFocus} onBlur={onBlur} />
          </Field>
        </div>
      );

      case 4: return (
        <div>
          <Field label="IFSC Code *" field="ifsc">
            <input style={inputStyle} type="text" value={formData.ifsc} onChange={(e) => updateForm("ifsc", e.target.value.toUpperCase())} placeholder="SBIN0001234" onFocus={onFocus} onBlur={onBlur} />
          </Field>
          <Field label="Account Number *" field="accountNumber">
            <input style={inputStyle} type="text" value={formData.accountNumber} onChange={(e) => updateForm("accountNumber", e.target.value)} placeholder="1234567890" onFocus={onFocus} onBlur={onBlur} />
          </Field>
          <Field label="Bank Name *" field="bankName">
            <input style={inputStyle} type="text" value={formData.bankName} onChange={(e) => updateForm("bankName", e.target.value)} placeholder="State Bank of India" onFocus={onFocus} onBlur={onBlur} />
          </Field>
          <Field label="Branch Name *" field="branchName">
            <input style={inputStyle} type="text" value={formData.branchName} onChange={(e) => updateForm("branchName", e.target.value)} placeholder="MG Road" onFocus={onFocus} onBlur={onBlur} />
          </Field>
          <div style={{ marginBottom: 20 }}>
            <Label>Upload Cancelled Cheque / Bank Statement *</Label>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
              <label style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "10px 20px", borderRadius: 10, cursor: "pointer",
                background: "linear-gradient(135deg, #F59E0B, #D97706)",
                color: "#000", fontSize: 13, fontWeight: 700,
                boxShadow: "0 4px 12px rgba(245,158,11,0.25)"
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Choose File
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} style={{ display: "none" }} />
              </label>
              {formData.chequeFile && (
                <span style={{ fontSize: 12, color: "#22C55E", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  ✓ {formData.chequeFile.name}
                </span>
              )}
            </div>
            <FieldError msg={getError("chequeFile")} />
          </div>
        </div>
      );

      case 5: return (
        <div>
          <Field label="Nominee First Name *" field="nomineeFirstName">
            <input style={inputStyle} type="text" value={formData.nomineeFirstName} onChange={(e) => updateForm("nomineeFirstName", e.target.value)} placeholder="Jane" onFocus={onFocus} onBlur={onBlur} />
          </Field>
          <Field label="Nominee Middle Name" field="">
            <input style={inputStyle} type="text" value={formData.nomineeMiddleName} onChange={(e) => updateForm("nomineeMiddleName", e.target.value)} placeholder="(Optional)" onFocus={onFocus} onBlur={onBlur} />
          </Field>
          <Field label="Nominee Last Name" field="">
            <input style={inputStyle} type="text" value={formData.nomineeLastName} onChange={(e) => updateForm("nomineeLastName", e.target.value)} placeholder="Doe (Optional)" onFocus={onFocus} onBlur={onBlur} />
          </Field>
          <Field label="Relationship *" field="nomineeRelationship">
            <input style={inputStyle} type="text" value={formData.nomineeRelationship} onChange={(e) => updateForm("nomineeRelationship", e.target.value)} placeholder="Spouse" onFocus={onFocus} onBlur={onBlur} />
          </Field>
          <Field label="Nominee Email *" field="nomineeEmail">
            <input style={inputStyle} type="email" value={formData.nomineeEmail} onChange={(e) => updateForm("nomineeEmail", e.target.value)} placeholder="jane@example.com" onFocus={onFocus} onBlur={onBlur} />
          </Field>
          <Field label="Nominee PAN *" field="nomineePan">
            <input style={inputStyle} type="text" value={formData.nomineePan} onChange={(e) => updateForm("nomineePan", e.target.value.toUpperCase())} placeholder="ABCDE1234F" onFocus={onFocus} onBlur={onBlur} />
          </Field>
          <Field label="Nominee Date of Birth *" field="nomineeDob">
            <input style={{ ...inputStyle, colorScheme: "dark" }} type="date" value={formData.nomineeDob} onChange={(e) => updateForm("nomineeDob", e.target.value)} onFocus={onFocus} onBlur={onBlur} />
          </Field>
        </div>
      );

      case 6: return (
        <div>
          <div style={{ marginBottom: 20 }}>
            <Label>Password *</Label>
            <input style={inputStyle} type="password" value={formData.password} onChange={(e) => updateForm("password", e.target.value)} placeholder="Enter strong password" onFocus={onFocus} onBlur={onBlur} />
            {formData.password && (
              <div style={{ marginTop: 12 }}>
                {/* Strength bar */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <div style={{ flex: 1, height: 4, background: "#2A2A2A", borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ width: `${(passwordStrength / 5) * 100}%`, height: "100%", background: getStrengthColor(), borderRadius: 999, transition: "width 0.3s, background 0.3s" }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: getStrengthColor(), minWidth: 64 }}>{getStrengthLabel()}</span>
                </div>
                {/* Checklist */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px" }}>
                  {[
                    { label: "8+ characters",    pass: formData.password.length >= 8 },
                    { label: "Uppercase letter",  pass: /[A-Z]/.test(formData.password) },
                    { label: "Lowercase letter",  pass: /[a-z]/.test(formData.password) },
                    { label: "Number",            pass: /[0-9]/.test(formData.password) },
                    { label: "Special character", pass: /[^a-zA-Z0-9]/.test(formData.password) },
                  ].map(({ label, pass }) => (
                    <span key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: pass ? "#22C55E" : "#525252", transition: "color 0.2s" }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        {pass
                          ? <path d="M2 6l3 3 5-5" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          : <circle cx="6" cy="6" r="4" stroke="#525252" strokeWidth="1.2"/>
                        }
                      </svg>
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <FieldError msg={getError("password")} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <Label>Confirm Password *</Label>
            <input style={inputStyle} type="password" value={formData.confirmPassword} onChange={(e) => updateForm("confirmPassword", e.target.value)} placeholder="Re-enter password" onFocus={onFocus} onBlur={onBlur} />
            {formData.confirmPassword && (
              <p style={{ margin: "5px 0 0", fontSize: 12, fontWeight: 600, color: formData.password === formData.confirmPassword ? "#22C55E" : "#EF4444" }}>
                {formData.password === formData.confirmPassword ? "✓ Passwords match" : "✕ Passwords do not match"}
              </p>
            )}
            <FieldError msg={getError("confirmPassword")} />
          </div>
        </div>
      );

      default: return null;
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0A0A0A",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "40px 16px",
      position: "relative",
    }}>
      {/* Grid texture */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none",
        backgroundImage: `linear-gradient(rgba(245,158,11,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.03) 1px, transparent 1px)`,
        backgroundSize: "40px 40px"
      }} />
      {/* Ambient glow */}
      <div style={{ position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", width: 600, height: 250, pointerEvents: "none", background: "radial-gradient(ellipse, rgba(245,158,11,0.06) 0%, transparent 70%)" }} />

      <style>{`
        @keyframes fadeSlide { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .fade-step { animation: fadeSlide 0.25s ease-out; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.5) sepia(1) saturate(3) hue-rotate(5deg); }
      `}</style>

      <div style={{ width: "100%", maxWidth: 560, position: "relative", zIndex: 10 }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: "0 auto 16px",
            background: "linear-gradient(135deg, #F59E0B, #D97706)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 24px rgba(245,158,11,0.35)"
          }}>
            <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="#000" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#F5F5F5", margin: 0 }}>Create your account</h1>
          <p style={{ fontSize: 13, color: "#737373", marginTop: 6 }}>{stepNames[step - 1]} — Step {step} of 6</p>
        </div>

        {/* Card */}
        <div style={{
          background: "#161616", borderRadius: 20, padding: 32,
          border: "1px solid #2A2A2A",
          boxShadow: "0 0 0 1px rgba(245,158,11,0.06), 0 24px 48px rgba(0,0,0,0.5)",
          position: "relative"
        }}>
          {/* Gold top accent */}
          <div style={{ position: "absolute", top: 0, left: 32, right: 32, height: 1, background: "linear-gradient(90deg, transparent, #F59E0B, transparent)", opacity: 0.5 }} />

          {/* Stepper */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              {stepNames.map((name, i) => {
                const num = i + 1;
                const done    = num < step;
                const current = num === step;
                return (
                  <div key={num} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 700,
                      border: done || current ? "none" : "1.5px solid #2A2A2A",
                      background: done ? "linear-gradient(135deg, #F59E0B, #D97706)"
                                : current ? "rgba(245,158,11,0.12)"
                                : "#1C1C1C",
                      color: done ? "#000" : current ? "#F59E0B" : "#525252",
                      boxShadow: current ? "0 0 0 3px rgba(245,158,11,0.15)" : "none",
                      transition: "all 0.3s"
                    }}>
                      {done ? (
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                        </svg>
                      ) : num}
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 600, color: current ? "#F59E0B" : "#525252", display: window.innerWidth < 400 ? "none" : "block" }}>
                      {name.split(" ")[0]}
                    </span>
                  </div>
                );
              })}
            </div>
            {/* Progress bar */}
            <div style={{ width: "100%", height: 3, background: "#2A2A2A", borderRadius: 999, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${((step - 1) / 5) * 100}%`, background: "linear-gradient(90deg, #F59E0B, #FBBF24)", borderRadius: 999, transition: "width 0.5s ease" }} />
            </div>
          </div>

          {/* Form body */}
          <div key={step} className="fade-step">
            {renderStep()}
          </div>

          {/* Navigation */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24, paddingTop: 20, borderTop: "1px solid #1E1E1E" }}>
            {submitError && <p style={{ fontSize: 12, color: "#EF4444", marginBottom: 12 }}>{submitError}</p>}
            <button type="button" onClick={prevStep} disabled={step === 1} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 500,
              border: "1px solid #2A2A2A", background: step === 1 ? "transparent" : "#1C1C1C",
              color: step === 1 ? "#3A3A3A" : "#A3A3A3", cursor: step === 1 ? "not-allowed" : "pointer",
              transition: "all 0.2s"
            }}
              onMouseEnter={(e) => { if (step > 1) { e.currentTarget.style.borderColor = "#3A3A3A"; e.currentTarget.style.color = "#F5F5F5"; } }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2A2A2A"; e.currentTarget.style.color = step === 1 ? "#3A3A3A" : "#A3A3A3"; }}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
              </svg>
              Back
            </button>

            <button type="button" onClick={step === 6 ? handleSubmit : nextStep} disabled={!isStepValid() || loading} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "10px 24px", borderRadius: 10, fontSize: 13, fontWeight: 700, border: "none",
              background: isStepValid() ? "linear-gradient(135deg, #F59E0B, #D97706)" : "#1C1C1C",
              color: isStepValid() ? "#000" : "#3A3A3A",
              cursor: isStepValid() ? "pointer" : "not-allowed",
              boxShadow: isStepValid() ? "0 4px 16px rgba(245,158,11,0.3)" : "none",
              transition: "box-shadow 0.2s, transform 0.1s",
              opacity: loading ? 0.7 : 1,
            }}
              onMouseEnter={(e) => { if (isStepValid()) e.currentTarget.style.boxShadow = "0 6px 22px rgba(245,158,11,0.45)"; }}
              onMouseLeave={(e) => { if (isStepValid()) e.currentTarget.style.boxShadow = "0 4px 16px rgba(245,158,11,0.3)"; }}
              onMouseDown={(e) => { if (isStepValid()) e.currentTarget.style.transform = "scale(0.98)"; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            >
              {loading ? "Submitting…" : step === 6 ? "Submit" : "Continue"}
              {step < 6 && !loading && (
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p style={{ textAlign: "center", fontSize: 13, color: "#525252", marginTop: 24 }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#F59E0B", fontWeight: 600, textDecoration: "none" }}
            onMouseEnter={(e) => e.target.style.color = "#FBBF24"}
            onMouseLeave={(e) => e.target.style.color = "#F59E0B"}
          >Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;