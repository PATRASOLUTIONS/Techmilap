/**
 * Generates default questions for different form types
 */
export function generateDefaultQuestions(formType: string) {
  const timestamp = Date.now()

  switch (formType) {
    case "attendee":
      return [
        {
          id: `question_name_${timestamp}`,
          type: "text",
          label: "Name",
          placeholder: "Enter your name",
          required: true,
        },
        {
          id: `question_email_${timestamp + 1}`,
          type: "email",
          label: "Email ID",
          placeholder: "Enter your email address",
          required: true,
        },
        {
          id: `question_corporateEmail_${timestamp + 2}`,
          type: "email",
          label: "Corporate Email ID",
          placeholder: "Enter your corporate email address",
          required: true,
        },
        {
          id: `question_designation_${timestamp + 3}`,
          type: "text",
          label: "Designation",
          placeholder: "Enter your designation",
          required: true,
        },
        {
          id: `question_linkedinId_${timestamp + 4}`,
          type: "text",
          label: "LinkedIn ID",
          placeholder: "Enter your LinkedIn profile URL",
          required: true,
        },
        {
          id: `question_mobileNumber_${timestamp + 7}`,
          type: "phone",
          label: "Mobile number",
          placeholder: "Enter your mobile number",
          required: true,
        },
      ]

    case "volunteer":
      return [
        {
          id: `question_name_${timestamp + 10}`,
          type: "text",
          label: "Name",
          placeholder: "Enter your name",
          required: true,
        },
        {
          id: `question_email_${timestamp + 11}`,
          type: "email",
          label: "Email ID",
          placeholder: "Enter your email address",
          required: true,
        },
        {
          id: `question_corporateEmail_${timestamp + 12}`,
          type: "email",
          label: "Corporate Email ID",
          placeholder: "Enter your corporate email address",
          required: true,
        },
        {
          id: `question_designation_${timestamp + 13}`,
          type: "text",
          label: "Designation",
          placeholder: "Enter your designation",
          required: true,
        },
        {
          id: `question_eventOrganizer_${timestamp + 14}`,
          type: "text",
          label: "Event Organizer",
          placeholder: "Enter the event organizer",
          required: true,
        },
        {
          id: `question_isMicrosoftMVP_${timestamp + 15}`,
          type: "checkbox",
          label: "Are you a Microsoft MVP?",
          required: true,
        },
        {
          id: `question_howManyEventsVolunteered_${timestamp + 19}`,
          type: "select",
          label: "How many events have you supported as a volunteer?",
          placeholder: "Select the number of events",
          required: true,
          options: [
            { id: "events_1", value: "1-5" },
            { id: "events_2", value: "6-10" },
            { id: "events_3", value: "11+" },
          ],
        },
        {
          id: `question_meetupEventName_${timestamp + 20}`,
          type: "text",
          label: "Meetup/Event Name",
          placeholder: "Enter the meetup/event name",
          required: true,
        },
        {
          id: `question_mobileNumber_${timestamp + 28}`,
          type: "phone",
          label: "Mobile number",
          placeholder: "Enter your mobile number",
          required: true,
        },
      ]

    case "speaker":
      return [
        {
          id: `question_name_${timestamp + 30}`,
          type: "text",
          label: "Name",
          placeholder: "Enter your name",
          required: true,
        },
        {
          id: `question_email_${timestamp + 31}`,
          type: "email",
          label: "Email ID",
          placeholder: "Enter your email address",
          required: true,
        },
        {
          id: `question_corporateEmail_${timestamp + 32}`,
          type: "email",
          label: "Corporate Email ID",
          placeholder: "Enter your corporate email address",
          required: true,
        },
        {
          id: `question_designation_${timestamp + 33}`,
          type: "text",
          label: "Designation",
          placeholder: "Enter your designation",
          required: true,
        },
        {
          id: `question_eventOrganizer_${timestamp + 34}`,
          type: "text",
          label: "Event Organizer",
          placeholder: "Enter the event organizer",
          required: true,
        },
        {
          id: `question_isMicrosoftMVP_${timestamp + 35}`,
          type: "checkbox",
          label: "Are you a Microsoft MVP?",
          required: true,
        },
        {
          id: `question_meetupEventName_${timestamp + 40}`,
          type: "text",
          label: "Meetup/Event Name",
          placeholder: "Enter the meetup/event name",
          required: true,
        },
        {
          id: `question_topic_${timestamp + 41}`,
          type: "text",
          label: "Presentation Topic",
          placeholder: "Enter your presentation topic",
          required: true,
        },
        {
          id: `question_bio_${timestamp + 42}`,
          type: "textarea",
          label: "Speaker Bio",
          placeholder: "Tell us about yourself",
          required: true,
        },
      ]

    default:
      return []
  }
}
