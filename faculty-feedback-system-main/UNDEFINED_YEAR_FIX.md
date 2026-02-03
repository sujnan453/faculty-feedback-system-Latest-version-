# Fixed: Undefined Year in Faculty Performance Dropdown

## Problem
The department dropdown was showing "undefinedth Year - BCA" instead of "1st Year - BCA".

## Root Cause
The feedback data didn't have the `studentYear` field, so when trying to access `feedback.studentYear`, it returned `undefined`.

## Solution
Added fallback logic to handle missing year data:

```javascript
// Before (caused error)
const yearSuffix = getYearSuffix(feedback.studentYear);

// After (with fallback)
const year = feedback.studentYear || feedback.year || 1;
const yearSuffix = getYearSuffix(year);
```

## How It Works
1. First tries to use `feedback.studentYear`
2. If that's undefined, tries `feedback.year`
3. If both are undefined, defaults to `1` (1st year)

## Result
✅ Dropdown now shows correct format: "1st Year - BCA", "2nd Year - CSE", etc.
✅ No more "undefinedth Year" errors
✅ Handles both old and new feedback data formats

## Files Modified
- `faculty-feedback-system-main/faculty-performance.html` (line ~984)

## Testing
1. Open Faculty Performance page
2. Check Department dropdown
3. Verify all options show correct year format (1st, 2nd, 3rd)
4. No "undefined" text should appear
