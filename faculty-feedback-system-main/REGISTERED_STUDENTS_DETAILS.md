# Registered Students Details

## Student Registration Form Fields

The student registration form collects the following information:

### 1. **Full Name** (Required)
- **Field ID**: `fullName`
- **Type**: Text input
- **Placeholder**: "Enter your full name"
- **Validation**: Required, non-empty
- **Autocomplete**: name
- **Example**: "John Doe"

### 2. **Email Address** (Required)
- **Field ID**: `email`
- **Type**: Email input
- **Placeholder**: "Enter your email address"
- **Validation**: Required, valid email format (user@example.com)
- **Autocomplete**: email
- **Example**: "john.doe@example.com"
- **Note**: Email must be unique (no duplicates allowed)

### 3. **Roll Number** (Required)
- **Field ID**: `rollNumber`
- **Type**: Text input
- **Placeholder**: "Enter your roll number"
- **Validation**: Required, unique (no duplicates)
- **Autocomplete**: off (for security)
- **Format**: Typically like "21CS001" (year + branch + number)
- **Example**: "21CS001"

### 4. **Department** (Required)
- **Field ID**: `department`
- **Type**: Dropdown select
- **Options**: 
  - BCA (Bachelor of Computer Applications)
  - BSC (Bachelor of Science)
  - BCOM (Bachelor of Commerce)
  - BBA (Bachelor of Business Administration)
  - BA (Bachelor of Arts)
- **Validation**: Required, must select a department
- **Autocomplete**: organization
- **Example**: "BCA"

### 5. **Academic Year** (Required)
- **Field ID**: `year`
- **Type**: Dropdown select
- **Options**:
  - 1st Year
  - 2nd Year
  - 3rd Year
  - 4th Year
- **Validation**: Required, must select a year
- **Autocomplete**: off
- **Example**: "2"

### 6. **Password** (Required)
- **Field ID**: `password`
- **Type**: Password input
- **Placeholder**: "Create a strong password"
- **Validation**: Required, minimum 6 characters
- **Autocomplete**: new-password
- **Features**: 
  - Password visibility toggle (eye icon)
  - Stored as plain text (development only)
- **Example**: "SecurePass123"

### 7. **Confirm Password** (Required)
- **Field ID**: `confirmPassword`
- **Type**: Password input
- **Placeholder**: "Confirm your password"
- **Validation**: Required, must match password field
- **Autocomplete**: new-password
- **Features**: 
  - Password visibility toggle (eye icon)
  - Must match the password field exactly
- **Example**: "SecurePass123"

---

## Student Data Structure (Stored in localStorage)

When a student registers, the following data is stored:

```javascript
{
  id: "unique_id_timestamp_random",
  firstName: "John",
  fullName: "John Doe",
  email: "john.doe@example.com",
  rollNumber: "21CS001",
  department: "BCA",
  year: "2",
  password: "SecurePass123",
  role: "student",
  registeredAt: "2024-01-31T10:30:00.000Z"
}
```

---

## Registration Validation Rules

### Email Validation
- ✅ Required (cannot be empty)
- ✅ Must be valid email format (contains @ and .)
- ✅ Must be unique (no duplicate emails)
- ❌ Error: "Email already registered! Please use a different email or login."

### Roll Number Validation
- ✅ Required (cannot be empty)
- ✅ Must be unique (no duplicate roll numbers)
- ❌ Error: "Roll number already registered! Please check your roll number."

### Password Validation
- ✅ Required (cannot be empty)
- ✅ Minimum 6 characters
- ✅ Must match confirm password field
- ❌ Error: "Passwords do not match!"

### Full Name Validation
- ✅ Required (cannot be empty)
- ✅ No special characters allowed

### Department Validation
- ✅ Required (must select from dropdown)
- ✅ Must be one of: BCA, BSC, BCOM, BBA, BA

### Academic Year Validation
- ✅ Required (must select from dropdown)
- ✅ Must be one of: 1, 2, 3, 4

---

## Registration Flow

```
1. User fills in Full Name
   ↓
2. User enters Email Address
   ↓
3. User enters Roll Number
   ↓
4. User selects Department
   ↓
5. User selects Academic Year
   ↓
6. User creates Password
   ↓
7. User confirms Password
   ↓
8. User clicks "Register" button
   ↓
9. Form validation checks all fields
   ↓
10. If valid → Student account created
    If invalid → Error messages displayed
   ↓
11. Success message shown
   ↓
12. Redirect to login page
```

---

## Security Considerations

### Current Implementation
- ⚠️ Passwords stored as plain text (development only)
- ⚠️ No email verification
- ⚠️ No CAPTCHA protection
- ⚠️ No rate limiting on registration

### Recommended Improvements
- 🔒 Hash passwords using SHA-256 or bcrypt
- 🔒 Add email verification step
- 🔒 Implement CAPTCHA for bot prevention
- 🔒 Add rate limiting (max 5 registrations per IP per hour)
- 🔒 Add phone number verification
- 🔒 Implement two-factor authentication (2FA)

---

## Data Storage

### Storage Location
- **Type**: Browser localStorage
- **Key**: `students`
- **Format**: JSON array of student objects

### Storage Limits
- **Max Size**: ~5MB per domain
- **Persistence**: Until manually cleared
- **Scope**: Same origin only

### Accessing Stored Data
```javascript
// Get all students
const students = JSON.parse(localStorage.getItem('students')) || [];

// Find specific student
const student = students.find(s => s.email === 'john.doe@example.com');

// Add new student
students.push(newStudent);
localStorage.setItem('students', JSON.stringify(students));
```

---

## Sample Registered Students

### Example 1: Computer Science Student
```json
{
  "id": "1706700600000_abc123_1",
  "firstName": "John",
  "fullName": "John Doe",
  "email": "john.doe@example.com",
  "rollNumber": "21CS001",
  "department": "BCA",
  "year": "2",
  "password": "SecurePass123",
  "role": "student",
  "registeredAt": "2024-01-31T10:30:00.000Z"
}
```

### Example 2: Commerce Student
```json
{
  "id": "1706700700000_def456_2",
  "firstName": "Jane",
  "fullName": "Jane Smith",
  "email": "jane.smith@example.com",
  "rollNumber": "21COM002",
  "department": "BCOM",
  "year": "3",
  "password": "Password456",
  "role": "student",
  "registeredAt": "2024-01-31T11:00:00.000Z"
}
```

---

## Registration Statistics

### Typical Registration Data
- **Average Registration Time**: 2-3 minutes
- **Most Common Department**: BCA (Computer Applications)
- **Most Common Year**: 2nd Year
- **Email Format**: Usually institutional email (college domain)

---

## Troubleshooting Registration Issues

### Issue: "Email already registered"
**Solution**: Use a different email address or login if you already have an account

### Issue: "Roll number already registered"
**Solution**: Check your roll number or contact admin if it's incorrect

### Issue: "Passwords do not match"
**Solution**: Ensure both password fields contain exactly the same text

### Issue: "Invalid email format"
**Solution**: Use format like: name@example.com

### Issue: "Password too short"
**Solution**: Password must be at least 6 characters long

---

## Future Enhancements

- [ ] Email verification before account activation
- [ ] Phone number registration
- [ ] Student ID card upload
- [ ] Parent/Guardian contact information
- [ ] Emergency contact details
- [ ] Address information
- [ ] Date of birth
- [ ] Gender/Pronouns
- [ ] Hostel/Day scholar status
- [ ] Blood group
- [ ] Medical conditions
- [ ] Dietary preferences
- [ ] Extracurricular interests
