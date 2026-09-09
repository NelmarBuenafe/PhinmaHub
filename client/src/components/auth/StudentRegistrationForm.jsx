import FormField from "./FormField.jsx";
import PasswordInput from "./PasswordInput.jsx";
import SelectField from "./SelectField.jsx";

const campuses = [
  "Iloilo",
  "Araullo",
  "Cagayan de Oro",
  "Dagupan",
  "Southwestern University",
];
const programs = [
  "BS Information Technology",
  "BS Computer Science",
  "BS Information Systems",
  "Other program",
];

function StudentRegistrationForm({
  errors,
  googleLocked,
  hidePassword = googleLocked,
  onChange,
  values,
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          error={errors.firstName}
          label="First name"
          name="firstName"
          onChange={onChange}
          placeholder="Enter your first name"
          readOnly={googleLocked}
          required
          value={values.firstName}
        />
        <FormField
          error={errors.middleName}
          label="Middle name"
          name="middleName"
          onChange={onChange}
          optional
          placeholder="Enter your middle name"
          readOnly={googleLocked}
          value={values.middleName}
        />
      </div>
      <FormField
        error={errors.lastName}
        label="Last name"
        name="lastName"
        onChange={onChange}
        placeholder="Enter your last name"
        readOnly={googleLocked}
        required
        value={values.lastName}
      />
      <FormField
        error={errors.email}
        label="PHINMA Email"
        name="email"
        onChange={onChange}
        placeholder="Enter your school email"
        readOnly={googleLocked}
        required
        type="email"
        value={values.email}
      />
      <FormField
        error={errors.studentId}
        label="Student ID"
        name="studentId"
        onChange={onChange}
        placeholder="Enter your student ID"
        required
        value={values.studentId}
      />
      <SelectField
        error={errors.campus}
        label="Campus"
        name="campus"
        onChange={onChange}
        placeholder="Select your PHINMA campus"
        required
        value={values.campus}
      >
        {campuses.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </SelectField>
      <SelectField
        error={errors.program}
        label="Program"
        name="program"
        onChange={onChange}
        placeholder="Select your program"
        required
        value={values.program}
      >
        {programs.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </SelectField>
      <SelectField
        error={errors.yearLevel}
        label="Year level"
        name="yearLevel"
        onChange={onChange}
        placeholder="Select your year level"
        required
        value={values.yearLevel}
      >
        {[
          "First year",
          "Second year",
          "Third year",
          "Fourth year",
          "Fifth year",
        ].map((option) => (
          <option key={option}>{option}</option>
        ))}
      </SelectField>
      <FormField
        error={errors.section}
        label="Section"
        name="section"
        onChange={onChange}
        placeholder="Enter your section"
        required
        value={values.section}
      />
      {!hidePassword && (
        <>
          <PasswordInput
            error={errors.password}
            minLength="8"
            name="password"
            onChange={onChange}
            placeholder="Create a password"
            required
            value={values.password}
          />
          <PasswordInput
            error={errors.confirmPassword}
            label="Confirm password"
            minLength="8"
            name="confirmPassword"
            onChange={onChange}
            placeholder="Confirm your password"
            required
            value={values.confirmPassword}
          />
        </>
      )}
    </div>
  );
}

export default StudentRegistrationForm;
