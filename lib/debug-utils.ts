export function logEventData(eventData: any, label = "Event Data") {
  console.log(`----- ${label} -----`)

  // Basic event details
  console.log("Basic Details:", {
    id: eventData._id,
    title: eventData.title,
    displayName: eventData.displayName,
    slug: eventData.slug,
    location: eventData.location,
  })

  // Form status
  console.log("Form Status:", {
    attendeeForm: eventData.attendeeForm?.status,
    volunteerForm: eventData.volunteerForm?.status,
    speakerForm: eventData.speakerForm?.status,
  })

  // Custom questions counts
  console.log("Custom Questions Counts:", {
    attendee: eventData.customQuestions?.attendee?.length || 0,
    volunteer: eventData.customQuestions?.volunteer?.length || 0,
    speaker: eventData.customQuestions?.speaker?.length || 0,
  })
}

export function logFormData(formData: any, label = "Form Data") {
  console.log(`----- ${label} -----`)

  // Basic form details
  console.log("Basic Form Details:", {
    title: formData.title,
    displayName: formData.displayName,
    location: formData.location,
  })

  // Form status
  console.log("Form Status:", {
    attendeeForm: formData.attendeeForm?.status,
    volunteerForm: formData.volunteerForm?.status,
    speakerForm: formData.speakerForm?.status,
  })
}
