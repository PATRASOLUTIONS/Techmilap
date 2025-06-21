// Validation patterns
export const validationPatterns = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  corporateEmail:
    /^[a-zA-Z0-9._%+-]+@(?!gmail\.com)(?!yahoo\.com)(?!hotmail\.com)(?!outlook\.com)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  phone: /^\+?[0-9]{10,15}$/,
  url: /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/,
  linkedinUrl: /^(https?:\/\/)?(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?$/,
  githubUrl: /^(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9_-]+\/?$/,
  mvpUrl: /^https?:\/\/mvp\.microsoft\.com\/[a-zA-Z-]+\/MVP\/profile\/[a-fA-F0-9-]+\/?$/,
}

// Validation messages
export const validationMessages = {
  required: "This field is required",
  email: "Please enter a valid email address",
  corporateEmail: "Please enter a valid corporate email address (not gmail, yahoo, etc.)",
  phone: "Please enter a valid phone number (10-15 digits)",
  url: "Please enter a valid URL",
  linkedinUrl: "Please enter a valid LinkedIn profile URL",
  githubUrl: "Please enter a valid GitHub profile URL",
  mvpUrl: "Please enter a valid MVP Profile URL",
}

// Function to validate a field based on its type and value
export function validateField(type: string, value: string, required = false): string | null {
  // Check required fields
  if (required && (!value || value.trim() === "")) {
    return validationMessages.required
  }

  // If not required and empty, it's valid
  if (!required && (!value || value.trim() === "")) {
    return null
  }

  // Validate based on type
  switch (type) {
    case "email":
      return validationPatterns.email.test(value) ? null : validationMessages.email

    case "corporateEmail":
      return validationPatterns.email.test(value) ? null : validationMessages.email

    case "phone":
      return validationPatterns.phone.test(value) ? null : validationMessages.phone

    case "linkedinUrl":
      return validationPatterns.linkedinUrl.test(value) ? null : validationMessages.linkedinUrl

    case "githubUrl":
      return validationPatterns.githubUrl.test(value) ? null : validationMessages.githubUrl

    case "mvpUrl":
      return validationPatterns.mvpUrl.test(value) ? null : validationMessages.mvpUrl

    case "url":
      return validationPatterns.url.test(value) ? null : validationMessages.url

    default:
      return null
  }
}

// Function to determine validation type based on question label
export function getValidationType(question: any): string {
  const label = question.label.toLowerCase()

  if (label.includes("email")) {
    if (label.includes("corporate")) {
      return "corporateEmail"
    }
    return "email"
  }

  if (label.includes("linkedin")) {
    return "linkedinUrl"
  }

  if (label.includes("github")) {
    return "githubUrl"
  }

  if(label.includes("mvpUrl")) {
    return "mvpUrl"
  }

  if (label.includes("mobile") || label.includes("phone")) {
    return "phone"
  }

  if (label.includes("url") || label.includes("link") || label.includes("profile")) {
    return "url"
  }

  return question.type
}
