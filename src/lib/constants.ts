export const GENDERS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
] as const;

export const CATEGORIES = [
  { value: "GENERAL", label: "General" },
  { value: "OBC", label: "Other Backward Class (OBC)" },
  { value: "SC", label: "Scheduled Caste (SC)" },
  { value: "ST", label: "Scheduled Tribe (ST)" },
  { value: "EWS", label: "Economically Weaker Section (EWS)" },
  { value: "OTHER", label: "Other" },
] as const;

export const STUDENT_TYPES = [
  { value: "REGULAR", label: "Regular" },
  { value: "PRIVATE", label: "Private" },
  { value: "TRANSFERRED", label: "Transferred" },
  { value: "STUDY_PERMISSION", label: "Study Permission" },
] as const;

export const ADMISSION_TYPES = [
  { value: "JEEP", label: "JEEP" },
  { value: "NON_JEEP", label: "Non-JEEP" },
] as const;

export const AREA_TYPES = [
  { value: "RURAL", label: "Rural" },
  { value: "URBAN", label: "Urban" },
] as const;

export const YEAR_SEMESTERS = [
  { value: "FIRST_YEAR", label: "First Year" },
  { value: "SECOND_YEAR", label: "Second Year" },
] as const;

export const QUALIFICATION_LEVELS = [
  { value: "HIGH_SCHOOL", label: "High School or Equivalent" },
  { value: "INTERMEDIATE", label: "Intermediate or Equivalent" },
  { value: "UNDER_GRADUATE", label: "Under Graduate" },
  { value: "POST_GRADUATE", label: "Post Graduate" },
  { value: "OTHERS", label: "Others" },
] as const;

export const STATES = [
  "ANDHRA PRADESH", "ARUNACHAL PRADESH", "ASSAM", "BIHAR", "CHHATTISGARH",
  "GOA", "GUJARAT", "HARYANA", "HIMACHAL PRADESH", "JHARKHAND",
  "KARNATAKA", "KERALA", "MADHYA PRADESH", "MAHARASHTRA", "MANIPUR",
  "MEGHALAYA", "MIZORAM", "NAGALAND", "ODISHA", "PUNJAB",
  "RAJASTHAN", "SIKKIM", "TAMIL NADU", "TELANGANA", "TRIPURA",
  "UTTAR PRADESH", "UTTARAKHAND", "WEST BENGAL",
  "ANDAMAN AND NICOBAR ISLANDS", "CHANDIGARH", "DADRA AND NAGAR HAVELI AND DAMAN AND DIU",
  "DELHI", "JAMMU AND KASHMIR", "LADAKH", "LAKSHADWEEP", "PUDUCHERRY",
] as const;

export const NATIONALITIES = [
  { value: "INDIAN", label: "Indian" },
  { value: "OTHER", label: "Other" },
] as const;

export const BRANCHES = [
  { value: "D_PHARM", label: "D.Pharm." },
  { value: "CSCE", label: "CScE" },
  { value: "MECHANICAL", label: "Mechanical" },
] as const;

export const YES_NO_OPTIONS = [
  { value: "true", label: "Yes" },
  { value: "false", label: "No" },
] as const;
