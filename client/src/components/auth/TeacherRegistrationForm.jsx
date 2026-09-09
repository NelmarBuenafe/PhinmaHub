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
const departments = [
  "Information Technology",
  "Computer Science",
  "General Education",
  "Engineering",
  "Other department",
];

function TeacherRegistrationForm({
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
        error={errors.employeeId}
        label="Employee ID"
        name="employeeId"
        onChange={onChange}
        placeholder="Enter your employee ID"
        required
        value={values.employeeId}
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
        error={errors.department}
        label="Department"
        name="department"
        onChange={onChange}
        placeholder="Select your department"
        required
        value={values.department}
      >
        {departments.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </SelectField>
      <FormField
        error={errors.position}
        label="Position"
        name="position"
        onChange={onChange}
        optional
        placeholder="Enter your position"
        value={values.position}
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

export default TeacherRegistrationForm;
