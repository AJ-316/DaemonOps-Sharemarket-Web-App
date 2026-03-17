import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const navigate = useNavigate();
  
  // ---------- State ----------
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    mobile: "",
    pan: "",
    dob: "",
    aadhaar: "",
    aadhaarName: "",
    ifsc: "",
    accountNumber: "",
    bankName: "",
    branchName: "",
    chequeFile: null,
    nomineeFirstName: "",
    nomineeMiddleName: "",
    nomineeLastName: "",
    nomineeRelationship: "",
    nomineeEmail: "",
    nomineePan: "",
    nomineeDob: "",
    password: "",
    confirmPassword: "",
  });

  const [verified, setVerified] = useState({ email: false, aadhaar: false });
  const [passwordStrength, setPasswordStrength] = useState(0);

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

  const getStrengthLabel = () => {
    const labels = ["Very Weak", "Weak", "Fair", "Good", "Strong", "Very Strong"];
    return labels[passwordStrength];
  };

  const getStrengthColor = () => {
    const colors = [
      "bg-red-500",
      "bg-orange-500",
      "bg-yellow-500",
      "bg-blue-500",
      "bg-green-500",
      "bg-green-600",
    ];
    return colors[passwordStrength];
  };

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validateMobile = (mobile) => /^\d{10}$/.test(mobile);
  const validatePAN = (pan) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan);
  const validateAadhaar = (aadhaar) => /^\d{12}$/.test(aadhaar);
  const validateIFSC = (ifsc) => ifsc.trim().length > 0;
  const validateAccount = (acc) => acc.trim().length > 0;
  const validateBankName = (name) => name.trim().length > 0;
  const validateBranch = (branch) => branch.trim().length > 0;
  const validateFile = (file) => file !== null;
  const validateFirstName = (name) => name.trim().length > 0;
  const validateNomineeFirstName = (name) => name.trim().length > 0;
  const validateNomineeRelationship = (rel) => rel.trim().length > 0;
  const validateNomineeEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validateNomineePAN = (pan) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan);
  const validatePassword = (pwd) => passwordStrength >= 4;
  const validateConfirmPassword = (pwd, confirm) => pwd === confirm && pwd !== "";

  const isAge18OrAbove = (dob) => {
    if (!dob) return false;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age >= 18;
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return (
          validateFirstName(formData.firstName) &&
          validateEmail(formData.email) &&
          validateMobile(formData.mobile)
        );
      case 2:
        return (
          validatePAN(formData.pan) &&
          formData.dob.trim() !== "" &&
          isAge18OrAbove(formData.dob)
        );
      case 3:
        return validateAadhaar(formData.aadhaar);
      case 4:
        return (
          validateIFSC(formData.ifsc) &&
          validateAccount(formData.accountNumber) &&
          validateBankName(formData.bankName) &&
          validateBranch(formData.branchName) &&
          validateFile(formData.chequeFile)
        );
      case 5:
        return (
          validateNomineeFirstName(formData.nomineeFirstName) &&
          validateNomineeRelationship(formData.nomineeRelationship) &&
          validateNomineeEmail(formData.nomineeEmail) &&
          validateNomineePAN(formData.nomineePan) &&
          formData.nomineeDob.trim() !== "" &&
          isAge18OrAbove(formData.nomineeDob)
        );
      case 6:
        return (
          validatePassword(formData.password) &&
          validateConfirmPassword(formData.password, formData.confirmPassword)
        );
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (isStepValid()) setStep((prev) => Math.min(prev + 1, 6));
  };
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const verifyEmail = () => setVerified((prev) => ({ ...prev, email: true }));
  const verifyAadhaar = () => setVerified((prev) => ({ ...prev, aadhaar: true }));

  const handleFileChange = (e) => {
    updateForm("chequeFile", e.target.files[0] || null);
  };

  const handleSubmit = () => {
    console.log("Form Submitted:", formData);
    navigate("/login");
  };

  const stepNames = [
    "Basic Details",
    "Identity Details",
    "Aadhaar Details",
    "Bank Details",
    "Nominee Details",
    "Set Password",
  ];

  const inputClass =
    "w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981] focus:ring-opacity-30 outline-none transition bg-white";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";
  const errorClass = "text-sm text-red-500 mt-1";

  const getError = (field) => {
    switch (field) {
      case "firstName":
        return formData.firstName.trim() === "" && "First name is required";
      case "email":
        return !validateEmail(formData.email) && "Valid email required";
      case "mobile":
        return !validateMobile(formData.mobile) && "10-digit mobile required";
      case "pan":
        return !validatePAN(formData.pan) && "PAN format: ABCDE1234F";
      case "dob":
        if (formData.dob.trim() === "") return "Date of birth required";
        if (!isAge18OrAbove(formData.dob)) return "You must be 18 or older";
        return null;
      case "aadhaar":
        return !validateAadhaar(formData.aadhaar) && "12-digit Aadhaar required";
      case "ifsc":
        return formData.ifsc.trim() === "" && "IFSC required";
      case "accountNumber":
        return formData.accountNumber.trim() === "" && "Account number required";
      case "bankName":
        return formData.bankName.trim() === "" && "Bank name required";
      case "branchName":
        return formData.branchName.trim() === "" && "Branch required";
      case "chequeFile":
        return !formData.chequeFile && "File required";
      case "nomineeFirstName":
        return formData.nomineeFirstName.trim() === "" && "First name required";
      case "nomineeRelationship":
        return formData.nomineeRelationship.trim() === "" && "Relationship required";
      case "nomineeEmail":
        return !validateNomineeEmail(formData.nomineeEmail) && "Valid email required";
      case "nomineePan":
        return !validateNomineePAN(formData.nomineePan) && "PAN format: ABCDE1234F";
      case "nomineeDob":
        if (formData.nomineeDob.trim() === "") return "Date of birth required";
        if (!isAge18OrAbove(formData.nomineeDob)) return "Nominee must be 18 or older";
        return null;
      case "password":
        return !validatePassword(formData.password) && "Password must be at least Strong (4/5)";
      case "confirmPassword":
        return !validateConfirmPassword(formData.password, formData.confirmPassword) && "Passwords must match";
      default:
        return null;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className={labelClass}>First Name *</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => updateForm("firstName", e.target.value)}
                className={inputClass}
                placeholder="John"
              />
              {getError("firstName") && <p className={errorClass}>{getError("firstName")}</p>}
            </div>
            <div>
              <label className={labelClass}>Middle Name</label>
              <input
                type="text"
                value={formData.middleName}
                onChange={(e) => updateForm("middleName", e.target.value)}
                className={inputClass}
                placeholder="(Optional)"
              />
            </div>
            <div>
              <label className={labelClass}>Last Name</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => updateForm("lastName", e.target.value)}
                className={inputClass}
                placeholder="Doe (Optional)"
              />
            </div>
            <div>
              <label className={labelClass}>Email *</label>
              <div className="flex gap-3">
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateForm("email", e.target.value)}
                  className={`${inputClass} flex-1`}
                  placeholder="john@example.com"
                />
                <button
                  type="button"
                  onClick={verifyEmail}
                  disabled={verified.email}
                  className={`px-6 py-3 rounded-xl font-medium transition ${
                    verified.email
                      ? "bg-green-100 text-green-700 border border-green-300 cursor-not-allowed"
                      : "bg-[#10B981] hover:bg-[#059669] text-white"
                  }`}
                >
                  {verified.email ? "Verified ✓" : "Verify"}
                </button>
              </div>
              {getError("email") && <p className={errorClass}>{getError("email")}</p>}
            </div>
            <div>
              <label className={labelClass}>Mobile *</label>
              <input
                type="tel"
                value={formData.mobile}
                onChange={(e) => updateForm("mobile", e.target.value)}
                className={inputClass}
                placeholder="9876543210"
              />
              {getError("mobile") && <p className={errorClass}>{getError("mobile")}</p>}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className={labelClass}>PAN Card Number *</label>
              <input
                type="text"
                value={formData.pan}
                onChange={(e) => updateForm("pan", e.target.value.toUpperCase())}
                className={inputClass}
                placeholder="ABCDE1234F"
              />
              {getError("pan") && <p className={errorClass}>{getError("pan")}</p>}
            </div>
            <div>
              <label className={labelClass}>Date of Birth *</label>
              <input
                type="date"
                value={formData.dob}
                onChange={(e) => updateForm("dob", e.target.value)}
                className={inputClass}
              />
              {getError("dob") && <p className={errorClass}>{getError("dob")}</p>}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className={labelClass}>Aadhaar Number *</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={formData.aadhaar}
                  onChange={(e) => updateForm("aadhaar", e.target.value)}
                  className={`${inputClass} flex-1`}
                  placeholder="1234 5678 9012"
                />
                <button
                  type="button"
                  onClick={verifyAadhaar}
                  disabled={verified.aadhaar}
                  className={`px-6 py-3 rounded-xl font-medium transition ${
                    verified.aadhaar
                      ? "bg-green-100 text-green-700 border border-green-300 cursor-not-allowed"
                      : "bg-[#10B981] hover:bg-[#059669] text-white"
                  }`}
                >
                  {verified.aadhaar ? "Verified ✓" : "Verify"}
                </button>
              </div>
              {getError("aadhaar") && <p className={errorClass}>{getError("aadhaar")}</p>}
            </div>
            <div>
              <label className={labelClass}>Name as per Aadhaar</label>
              <input
                type="text"
                value={formData.aadhaarName}
                onChange={(e) => updateForm("aadhaarName", e.target.value)}
                className={inputClass}
                placeholder="Enter name as on Aadhaar"
              />
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <div>
              <label className={labelClass}>IFSC Code *</label>
              <input
                type="text"
                value={formData.ifsc}
                onChange={(e) => updateForm("ifsc", e.target.value.toUpperCase())}
                className={inputClass}
                placeholder="SBIN0001234"
              />
              {getError("ifsc") && <p className={errorClass}>{getError("ifsc")}</p>}
            </div>
            <div>
              <label className={labelClass}>Account Number *</label>
              <input
                type="text"
                value={formData.accountNumber}
                onChange={(e) => updateForm("accountNumber", e.target.value)}
                className={inputClass}
                placeholder="1234567890"
              />
              {getError("accountNumber") && <p className={errorClass}>{getError("accountNumber")}</p>}
            </div>
            <div>
              <label className={labelClass}>Bank Name *</label>
              <input
                type="text"
                value={formData.bankName}
                onChange={(e) => updateForm("bankName", e.target.value)}
                className={inputClass}
                placeholder="State Bank of India"
              />
              {getError("bankName") && <p className={errorClass}>{getError("bankName")}</p>}
            </div>
            <div>
              <label className={labelClass}>Branch Name *</label>
              <input
                type="text"
                value={formData.branchName}
                onChange={(e) => updateForm("branchName", e.target.value)}
                className={inputClass}
                placeholder="MG Road"
              />
              {getError("branchName") && <p className={errorClass}>{getError("branchName")}</p>}
            </div>
            <div>
              <label className={labelClass}>Upload Cancelled Cheque / Bank Statement *</label>
              <div className="mt-2 flex items-center gap-4">
                <label className="cursor-pointer bg-[#10B981] hover:bg-[#059669] text-white px-6 py-3 rounded-xl font-medium transition">
                  Choose File
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                {formData.chequeFile && (
                  <span className="text-sm text-gray-600 truncate max-w-xs">
                    {formData.chequeFile.name}
                  </span>
                )}
              </div>
              {getError("chequeFile") && <p className={errorClass}>{getError("chequeFile")}</p>}
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6">
            <div>
              <label className={labelClass}>Nominee First Name *</label>
              <input
                type="text"
                value={formData.nomineeFirstName}
                onChange={(e) => updateForm("nomineeFirstName", e.target.value)}
                className={inputClass}
                placeholder="Jane"
              />
              {getError("nomineeFirstName") && <p className={errorClass}>{getError("nomineeFirstName")}</p>}
            </div>
            <div>
              <label className={labelClass}>Nominee Middle Name</label>
              <input
                type="text"
                value={formData.nomineeMiddleName}
                onChange={(e) => updateForm("nomineeMiddleName", e.target.value)}
                className={inputClass}
                placeholder="(Optional)"
              />
            </div>
            <div>
              <label className={labelClass}>Nominee Last Name</label>
              <input
                type="text"
                value={formData.nomineeLastName}
                onChange={(e) => updateForm("nomineeLastName", e.target.value)}
                className={inputClass}
                placeholder="Doe (Optional)"
              />
            </div>
            <div>
              <label className={labelClass}>Relationship *</label>
              <input
                type="text"
                value={formData.nomineeRelationship}
                onChange={(e) => updateForm("nomineeRelationship", e.target.value)}
                className={inputClass}
                placeholder="Spouse"
              />
              {getError("nomineeRelationship") && <p className={errorClass}>{getError("nomineeRelationship")}</p>}
            </div>
            <div>
              <label className={labelClass}>Email *</label>
              <input
                type="email"
                value={formData.nomineeEmail}
                onChange={(e) => updateForm("nomineeEmail", e.target.value)}
                className={inputClass}
                placeholder="jane@example.com"
              />
              {getError("nomineeEmail") && <p className={errorClass}>{getError("nomineeEmail")}</p>}
            </div>
            <div>
              <label className={labelClass}>PAN *</label>
              <input
                type="text"
                value={formData.nomineePan}
                onChange={(e) => updateForm("nomineePan", e.target.value.toUpperCase())}
                className={inputClass}
                placeholder="ABCDE1234F"
              />
              {getError("nomineePan") && <p className={errorClass}>{getError("nomineePan")}</p>}
            </div>
            <div>
              <label className={labelClass}>Date of Birth *</label>
              <input
                type="date"
                value={formData.nomineeDob}
                onChange={(e) => updateForm("nomineeDob", e.target.value)}
                className={inputClass}
              />
              {getError("nomineeDob") && <p className={errorClass}>{getError("nomineeDob")}</p>}
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-6">
            <div>
              <label className={labelClass}>Password *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => updateForm("password", e.target.value)}
                className={inputClass}
                placeholder="Enter strong password"
              />
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full">
                      <div
                        className={`h-2 rounded-full ${getStrengthColor()}`}
                        style={{ width: `${(passwordStrength / 5) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-medium text-gray-600">
                      {getStrengthLabel()}
                    </span>
                  </div>
                </div>
              )}
              {getError("password") && <p className={errorClass}>{getError("password")}</p>}
            </div>
            <div>
              <label className={labelClass}>Confirm Password *</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => updateForm("confirmPassword", e.target.value)}
                className={inputClass}
                placeholder="Re-enter password"
              />
              {getError("confirmPassword") && <p className={errorClass}>{getError("confirmPassword")}</p>}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#ECFDF5] flex items-center justify-center p-4">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-step {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl p-8 border border-[#A7F3D0]">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-2xl font-semibold text-gray-800">
              Step {step} of 6: {stepNames[step - 1]}
            </h2>
            <span className="text-sm font-medium text-[#10B981] bg-[#ECFDF5] px-4 py-2 rounded-full">
              {step}/6
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-[#10B981] h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${(step / 6) * 100}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-3 text-xs text-gray-500">
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <span
                key={num}
                className={`w-8 h-8 flex items-center justify-center rounded-full border-2 transition ${
                  num === step
                    ? "border-[#10B981] bg-[#ECFDF5] text-[#10B981] font-bold"
                    : "border-gray-300 text-gray-400"
                }`}
              >
                {num}
              </span>
            ))}
          </div>
        </div>
        <div key={step} className="fade-step">
          {renderStep()}
        </div>
        <div className="flex justify-between mt-10">
          <button
            type="button"
            onClick={prevStep}
            disabled={step === 1}
            className={`px-8 py-3 rounded-xl font-medium transition ${
              step === 1
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-[#ECFDF5] text-[#10B981] border border-[#10B981] hover:bg-[#D1FAE5]"
            }`}
          >
            ← Previous
          </button>
          <button
            type="button"
            onClick={step === 6 ? handleSubmit : nextStep}
            disabled={!isStepValid()}
            className={`px-8 py-3 rounded-xl font-medium transition ${
              isStepValid()
                ? "bg-[#10B981] hover:bg-[#059669] text-white"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            {step === 6 ? "Submit" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;