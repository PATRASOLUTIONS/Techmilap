# Event Planning Application API Documentation

This document provides comprehensive documentation for all APIs used in the event planning application. It includes request/response DTOs, database schemas, and architecture information to facilitate migration from Next.js to Java Spring Boot.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [API Endpoints](#api-endpoints)
   - [Authentication](#authentication)
   - [Users](#users)
   - [Events](#events)
   - [Form Submissions](#form-submissions)
   - [Registrations](#registrations)
   - [Email](#email)
4. [Data Transfer Objects (DTOs)](#data-transfer-objects-dtos)
5. [Migration Considerations](#migration-considerations)

## Architecture Overview

The current application follows a Next.js architecture with the following components:

- **Frontend**: React components using Next.js App Router
- **Backend**: Next.js API routes (serverless functions)
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: NextAuth.js
- **Email Service**: Custom email service using nodemailer

The application is structured as follows:

\`\`\`
/app                    # Next.js App Router pages
  /(authenticated)      # Protected routes requiring authentication
  /(public)             # Public routes
  /api                  # API routes (backend)
/components             # React components
/lib                    # Utility functions and services
/models                 # Mongoose models (database schemas)
/types                  # TypeScript type definitions
\`\`\`

## Database Schema

### User Schema

\`\`\`typescript
{
  firstName: String,              // Required
  lastName: String,               // Required
  email: String,                  // Required, Unique
  password: String,               // Required (hashed)
  role: String,                   // Enum: "user", "event-planner", "super-admin"
  isVerified: Boolean,            // Default: false
  verificationCode: String,
  verificationCodeExpires: Date,
  resetPasswordOTP: String,
  resetPasswordOTPExpiry: Date,
  resetPasswordToken: String,
  resetPasswordTokenExpiry: Date,
  corporateEmail: String,
  designation: String,
  eventOrganizer: String,
  isMicrosoftMVP: Boolean,
  mvpId: String,
  mvpProfileLink: String,
  mvpCategory: String,
  isMeetupGroupRunning: Boolean,
  meetupEventName: String,
  eventDetails: String,
  meetupPageDetails: String,
  linkedinId: String,
  githubId: String,
  otherSocialMediaId: String,
  mobileNumber: String,
  createdAt: Date,
  updatedAt: Date
}
\`\`\`

### Event Schema

\`\`\`typescript
{
  title: String,                  // Required
  displayName: String,
  slug: String,                   // Unique
  description: String,            // Required
  date: Date,                     // Required
  endDate: Date,
  startTime: String,
  endTime: String,
  location: String,               // Required
  image: String,
  capacity: Number,               // Required, Default: 100
  price: Number,                  // Default: 0
  category: String,               // Required
  tags: [String],
  status: String,                 // Enum: "draft", "published", "cancelled", "completed", "active", Default: "draft"
  organizer: ObjectId,            // Reference to User, Required
  attendees: [ObjectId],          // Reference to User
  volunteers: [ObjectId],         // Reference to User
  speakers: [ObjectId],           // Reference to User
  customQuestions: {
    attendee: [Mixed],
    volunteer: [Mixed],
    speaker: [Mixed]
  },
  attendeeForm: {
    status: String                // Enum: "draft", "published", Default: "draft"
  },
  volunteerForm: {
    status: String                // Enum: "draft", "published", Default: "draft"
  },
  speakerForm: {
    status: String                // Enum: "draft", "published", Default: "draft"
  },
  registrations: [{
    userId: ObjectId,             // Reference to User, Required
    registeredAt: Date,           // Default: Date.now
    customResponses: Map<String, String>,
    status: String                // Enum: "pending", "confirmed", "cancelled", Default: "confirmed"
  }],
  createdAt: Date,
  updatedAt: Date
}
\`\`\`

### FormSubmission Schema

\`\`\`typescript
{
  eventId: ObjectId,              // Reference to Event, Required
  userId: ObjectId,               // Reference to User
  userName: String,
  userEmail: String,
  formType: String,               // Enum: "attendee", "volunteer", "speaker", Required
  status: String,                 // Enum: "pending", "approved", "rejected", Default: "pending"
  data: Mixed,                    // Required (form submission data)
  createdAt: Date,                // Default: Date.now
  updatedAt: Date                 // Default: Date.now
}
\`\`\`

### Ticket Schema

\`\`\`typescript
{
  name: String,                   // Required
  type: String,                   // Required
  description: String,
  pricingModel: String,           // Enum: "Free", "Paid", Default: "Free"
  price: Number,                  // Default: 0
  quantity: Number,               // Required
  saleStartDate: Date,
  saleEndDate: Date,
  feeStructure: String,           // Default: "Organizer"
  event: ObjectId,                // Reference to Event, Required
  createdBy: ObjectId,            // Reference to User, Required
  createdAt: Date,
  updatedAt: Date
}
\`\`\`

## API Endpoints

### Authentication

#### POST /api/auth/signup

Creates a new user account.

**Request Body:**
\`\`\`json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "password": "string"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "message": "User created successfully. Please verify your email."
}
\`\`\`

#### POST /api/auth/verify-email

Verifies a user's email address using a verification code.

**Request Body:**
\`\`\`json
{
  "email": "string",
  "code": "string"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "message": "Email verified successfully."
}
\`\`\`

#### POST /api/auth/resend-verification

Resends the verification email.

**Request Body:**
\`\`\`json
{
  "email": "string"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "message": "Verification email sent."
}
\`\`\`

#### POST /api/auth/forgot-password

Initiates the password reset process.

**Request Body:**
\`\`\`json
{
  "email": "string"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "message": "Password reset email sent."
}
\`\`\`

#### POST /api/auth/verify-reset-otp

Verifies the OTP for password reset.

**Request Body:**
\`\`\`json
{
  "email": "string",
  "otp": "string"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "token": "string"
}
\`\`\`

#### POST /api/auth/reset-password

Resets the user's password.

**Request Body:**
\`\`\`json
{
  "token": "string",
  "password": "string"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "message": "Password reset successfully."
}
\`\`\`

#### GET /api/auth/me

Gets the current authenticated user's information.

**Response:**
\`\`\`json
{
  "user": {
    "id": "string",
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "role": "string",
    "isVerified": boolean
  }
}
\`\`\`

### Users

#### GET /api/users

Gets a list of users (admin only).

**Response:**
\`\`\`json
{
  "users": [
    {
      "id": "string",
      "firstName": "string",
      "lastName": "string",
      "email": "string",
      "role": "string",
      "isVerified": boolean,
      "createdAt": "string"
    }
  ]
}
\`\`\`

#### GET /api/users/:id

Gets a specific user by ID.

**Response:**
\`\`\`json
{
  "user": {
    "id": "string",
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "role": "string",
    "isVerified": boolean,
    "corporateEmail": "string",
    "designation": "string",
    "eventOrganizer": "string",
    "isMicrosoftMVP": boolean,
    "mvpId": "string",
    "mvpProfileLink": "string",
    "mvpCategory": "string",
    "isMeetupGroupRunning": boolean,
    "meetupEventName": "string",
    "eventDetails": "string",
    "meetupPageDetails": "string",
    "linkedinId": "string",
    "githubId": "string",
    "otherSocialMediaId": "string",
    "mobileNumber": "string",
    "createdAt": "string",
    "updatedAt": "string"
  }
}
\`\`\`

#### PUT /api/users/:id

Updates a user's profile.

**Request Body:**
\`\`\`json
{
  "firstName": "string",
  "lastName": "string",
  "corporateEmail": "string",
  "designation": "string",
  "eventOrganizer": "string",
  "isMicrosoftMVP": boolean,
  "mvpId": "string",
  "mvpProfileLink": "string",
  "mvpCategory": "string",
  "isMeetupGroupRunning": boolean,
  "meetupEventName": "string",
  "eventDetails": "string",
  "meetupPageDetails": "string",
  "linkedinId": "string",
  "githubId": "string",
  "otherSocialMediaId": "string",
  "mobileNumber": "string"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "user": {
    "id": "string",
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "role": "string",
    "isVerified": boolean,
    "corporateEmail": "string",
    "designation": "string",
    "eventOrganizer": "string",
    "isMicrosoftMVP": boolean,
    "mvpId": "string",
    "mvpProfileLink": "string",
    "mvpCategory": "string",
    "isMeetupGroupRunning": boolean,
    "meetupEventName": "string",
    "eventDetails": "string",
    "meetupPageDetails": "string",
    "linkedinId": "string",
    "githubId": "string",
    "otherSocialMediaId": "string",
    "mobileNumber": "string",
    "updatedAt": "string"
  }
}
\`\`\`

#### PUT /api/users/:id/password

Changes a user's password.

**Request Body:**
\`\`\`json
{
  "currentPassword": "string",
  "newPassword": "string"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "message": "Password updated successfully."
}
\`\`\`

### Events

#### GET /api/events

Gets a list of events.

**Query Parameters:**
- `past` (boolean): Filter for past events

**Response:**
\`\`\`json
{
  "events": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "date": "string",
      "location": "string",
      "image": "string",
      "capacity": number,
      "price": number,
      "category": "string",
      "status": "string",
      "organizer": {
        "id": "string",
        "firstName": "string",
        "lastName": "string",
        "email": "string"
      },
      "attendeeCount": number,
      "createdAt": "string"
    }
  ]
}
\`\`\`

#### GET /api/events/public

Gets a list of public events.

**Response:**
\`\`\`json
{
  "events": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "date": "string",
      "location": "string",
      "image": "string",
      "capacity": number,
      "price": number,
      "category": "string",
      "attendeeCount": number
    }
  ]
}
\`\`\`

#### GET /api/events/my-events

Gets events organized by the current user.

**Response:**
\`\`\`json
{
  "events": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "date": "string",
      "location": "string",
      "image": "string",
      "capacity": number,
      "price": number,
      "category": "string",
      "status": "string",
      "attendeeCount": number,
      "createdAt": "string"
    }
  ]
}
\`\`\`

#### GET /api/events/:id

Gets a specific event by ID or slug.

**Response:**
\`\`\`json
{
  "event": {
    "id": "string",
    "title": "string",
    "displayName": "string",
    "slug": "string",
    "description": "string",
    "date": "string",
    "endDate": "string",
    "startTime": "string",
    "endTime": "string",
    "location": "string",
    "venue": "string",
    "address": "string",
    "type": "string",
    "visibility": "string",
    "image": "string",
    "capacity": number,
    "price": number,
    "category": "string",
    "tags": ["string"],
    "status": "string",
    "organizer": {
      "id": "string",
      "firstName": "string",
      "lastName": "string",
      "email": "string"
    },
    "attendees": [
      {
        "id": "string",
        "firstName": "string",
        "lastName": "string"
      }
    ],
    "volunteers": [
      {
        "id": "string",
        "firstName": "string",
        "lastName": "string"
      }
    ],
    "speakers": [
      {
        "id": "string",
        "firstName": "string",
        "lastName": "string"
      }
    ],
    "customQuestions": {
      "attendee": [
        {
          "id": "string",
          "type": "string",
          "label": "string",
          "placeholder": "string",
          "required": boolean,
          "options": [
            {
              "id": "string",
              "value": "string"
            }
          ]
        }
      ],
      "volunteer": [
        {
          "id": "string",
          "type": "string",
          "label": "string",
          "placeholder": "string",
          "required": boolean,
          "options": [
            {
              "id": "string",
              "value": "string"
            }
          ]
        }
      ],
      "speaker": [
        {
          "id": "string",
          "type": "string",
          "label": "string",
          "placeholder": "string",
          "required": boolean,
          "options": [
            {
              "id": "string",
              "value": "string"
            }
          ]
        }
      ]
    },
    "attendeeForm": {
      "status": "string"
    },
    "volunteerForm": {
      "status": "string"
    },
    "speakerForm": {
      "status": "string"
    },
    "tickets": [
      {
        "id": "string",
        "name": "string",
        "type": "string",
        "description": "string",
        "pricingModel": "string",
        "price": number,
        "quantity": number,
        "saleStartDate": "string",
        "saleEndDate": "string",
        "feeStructure": "string"
      }
    ],
    "createdAt": "string",
    "updatedAt": "string"
  }
}
\`\`\`

#### POST /api/events/create

Creates a new event.

**Request Body:**
\`\`\`json
{
  "details": {
    "name": "string",
    "displayName": "string",
    "description": "string",
    "startDate": "string",
    "endDate": "string",
    "startTime": "string",
    "endTime": "string",
    "type": "string",
    "venue": "string",
    "address": "string",
    "visibility": "string",
    "coverImageUrl": "string",
    "slug": "string"
  },
  "tickets": [
    {
      "name": "string",
      "type": "string",
      "description": "string",
      "pricingModel": "string",
      "price": number,
      "quantity": number,
      "saleStartDate": "string",
      "saleEndDate": "string",
      "feeStructure": "string"
    }
  ],
  "customQuestions": {
    "attendee": [
      {
        "id": "string",
        "type": "string",
        "label": "string",
        "placeholder": "string",
        "required": boolean,
        "options": [
          {
            "id": "string",
            "value": "string"
          }
        ]
      }
    ],
    "volunteer": [
      {
        "id": "string",
        "type": "string",
        "label": "string",
        "placeholder": "string",
        "required": boolean,
        "options": [
          {
            "id": "string",
            "value": "string"
          }
        ]
      }
    ],
    "speaker": [
      {
        "id": "string",
        "type": "string",
        "label": "string",
        "placeholder": "string",
        "required": boolean,
        "options": [
          {
            "id": "string",
            "value": "string"
          }
        ]
      }
    ]
  },
  "status": "string",
  "attendeeForm": {
    "status": "string"
  },
  "volunteerForm": {
    "status": "string"
  },
  "speakerForm": {
    "status": "string"
  }
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "event": {
    "id": "string",
    "title": "string",
    "slug": "string",
    "formStatus": {
      "attendee": "string",
      "volunteer": "string",
      "speaker": "string"
    }
  }
}
\`\`\`

#### PUT /api/events/:id

Updates an existing event.

**Request Body:**
\`\`\`json
{
  "title": "string",
  "description": "string",
  "date": "string",
  "location": "string",
  "capacity": number,
  "price": number,
  "category": "string",
  "status": "string",
  "customQuestions": {
    "attendee": [
      {
        "id": "string",
        "type": "string",
        "label": "string",
        "placeholder": "string",
        "required": boolean,
        "options": [
          {
            "id": "string",
            "value": "string"
          }
        ]
      }
    ],
    "volunteer": [
      {
        "id": "string",
        "type": "string",
        "label": "string",
        "placeholder": "string",
        "required": boolean,
        "options": [
          {
            "id": "string",
            "value": "string"
          }
        ]
      }
    ],
    "speaker": [
      {
        "id": "string",
        "type": "string",
        "label": "string",
        "placeholder": "string",
        "required": boolean,
        "options": [
          {
            "id": "string",
            "value": "string"
          }
        ]
      }
    ]
  },
  "attendeeForm": {
    "status": "string"
  },
  "volunteerForm": {
    "status": "string"
  },
  "speakerForm": {
    "status": "string"
  }
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "event": {
    "id": "string",
    "title": "string",
    "description": "string",
    "date": "string",
    "location": "string",
    "capacity": number,
    "price": number,
    "category": "string",
    "status": "string",
    "updatedAt": "string"
  }
}
\`\`\`

#### DELETE /api/events/:id

Deletes an event.

**Response:**
\`\`\`json
{
  "success": true
}
\`\`\`

#### POST /api/events/:id/register

Registers a user for an event.

**Request Body:**
\`\`\`json
{
  "userId": "string",
  "customResponses": {
    "key1": "value1",
    "key2": "value2"
  }
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "message": "Registration successful."
}
\`\`\`

#### GET /api/events/:id/registrations

Gets registrations for an event.

**Query Parameters:**
- `status` (string): Filter by status
- `search` (string): Search by name or email
- `filter_*` (string): Custom field filters

**Response:**
\`\`\`json
{
  "registrations": [
    {
      "id": "string",
      "source": "string",
      "name": "string",
      "email": "string",
      "status": "string",
      "registeredAt": "string",
      "data": {
        "key1": "value1",
        "key2": "value2"
      },
      "userId": "string"
    }
  ],
  "totalCount": number
}
\`\`\`

#### POST /api/events/:id/registrations/bulk-approve

Bulk approves registrations for an event.

**Request Body:**
\`\`\`json
{
  "registrationIds": ["string"]
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "message": "Registrations approved successfully.",
  "count": number
}
\`\`\`

#### PUT /api/events/:id/registrations/:registrationId

Updates a registration status.

**Request Body:**
\`\`\`json
{
  "status": "string"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "message": "Registration status updated."
}
\`\`\`

### Form Submissions

#### GET /api/events/:id/submissions/:formType

Gets form submissions for an event by form type.

**Path Parameters:**
- `id` (string): Event ID
- `formType` (string): Form type (attendee, volunteer, speaker)

**Response:**
\`\`\`json
{
  "success": true,
  "submissions": [
    {
      "id": "string",
      "eventId": "string",
      "userId": "string",
      "userName": "string",
      "userEmail": "string",
      "formType": "string",
      "status": "string",
      "data": {
        "key1": "value1",
        "key2": "value2"
      },
      "createdAt": "string",
      "updatedAt": "string"
    }
  ]
}
\`\`\`

#### POST /api/events/:id/submissions/:formType

Creates a new form submission.

**Path Parameters:**
- `id` (string): Event ID
- `formType` (string): Form type (attendee, volunteer, speaker)

**Request Body:**
\`\`\`json
{
  "data": {
    "key1": "value1",
    "key2": "value2"
  },
  "userId": "string",
  "status": "string",
  "emailSubject": "string"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "message": "string",
  "submissionId": "string"
}
\`\`\`

#### PUT /api/events/:id/submissions/:formType/:submissionId

Updates a form submission status.

**Path Parameters:**
- `id` (string): Event ID
- `formType` (string): Form type (attendee, volunteer, speaker)
- `submissionId` (string): Submission ID

**Request Body:**
\`\`\`json
{
  "status": "string"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "message": "Submission status updated."
}
\`\`\`

#### POST /api/events/:id/submissions/:formType/bulk-approve

Bulk approves form submissions.

**Path Parameters:**
- `id` (string): Event ID
- `formType` (string): Form type (attendee, volunteer, speaker)

**Request Body:**
\`\`\`json
{
  "submissionIds": ["string"]
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "message": "Submissions approved successfully.",
  "count": number
}
\`\`\`

### Forms

#### GET /api/events/:id/forms/:formType/config

Gets form configuration for an event.

**Path Parameters:**
- `id` (string): Event ID
- `formType` (string): Form type (attendee, volunteer, speaker)

**Response:**
\`\`\`json
{
  "success": true,
  "formConfig": {
    "questions": [
      {
        "id": "string",
        "type": "string",
        "label": "string",
        "placeholder": "string",
        "required": boolean,
        "options": [
          {
            "id": "string",
            "value": "string"
          }
        ]
      }
    ],
    "status": "string"
  }
}
\`\`\`

#### PUT /api/events/:id/forms/:formType

Updates form configuration for an event.

**Path Parameters:**
- `id` (string): Event ID
- `formType` (string): Form type (attendee, volunteer, speaker)

**Request Body:**
\`\`\`json
{
  "questions": [
    {
      "id": "string",
      "type": "string",
      "label": "string",
      "placeholder": "string",
      "required": boolean,
      "options": [
        {
          "id": "string",
          "value": "string"
        }
      ]
    }
  ]
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "message": "Form updated successfully."
}
\`\`\`

#### POST /api/events/:id/forms/:formType/publish

Publishes a form for an event.

**Path Parameters:**
- `id` (string): Event ID
- `formType` (string): Form type (attendee, volunteer, speaker)

**Response:**
\`\`\`json
{
  "success": true,
  "message": "Form published successfully."
}
\`\`\`

### Email

#### POST /api/events/:id/email

Sends emails to event attendees.

**Path Parameters:**
- `id` (string): Event ID

**Request Body:**
\`\`\`json
{
  "subject": "string",
  "message": "string",
  "recipients": ["string"],
  "recipientType": "string"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "message": "Emails sent successfully.",
  "count": number
}
\`\`\`

## Data Transfer Objects (DTOs)

### User DTOs

#### UserDTO
\`\`\`typescript
{
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isVerified: boolean;
}
\`\`\`

#### UserProfileDTO
\`\`\`typescript
{
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isVerified: boolean;
  corporateEmail?: string;
  designation?: string;
  eventOrganizer?: string;
  isMicrosoftMVP?: boolean;
  mvpId?: string;
  mvpProfileLink?: string;
  mvpCategory?: string;
  isMeetupGroupRunning?: boolean;
  meetupEventName?: string;
  eventDetails?: string;
  meetupPageDetails?: string;
  linkedinId?: string;
  githubId?: string;
  otherSocialMediaId?: string;
  mobileNumber?: string;
  createdAt: string;
  updatedAt: string;
}
\`\`\`

#### CreateUserDTO
\`\`\`typescript
{
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}
\`\`\`

#### UpdateUserDTO
\`\`\`typescript
{
  firstName?: string;
  lastName?: string;
  corporateEmail?: string;
  designation?: string;
  eventOrganizer?: string;
  isMicrosoftMVP?: boolean;
  mvpId?: string;
  mvpProfileLink?: string;
  mvpCategory?: string;
  isMeetupGroupRunning?: boolean;
  meetupEventName?: string;
  eventDetails?: string;
  meetupPageDetails?: string;
  linkedinId?: string;
  githubId?: string;
  otherSocialMediaId?: string;
  mobileNumber?: string;
}
\`\`\`

### Event DTOs

#### EventDTO
\`\`\`typescript
{
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  image?: string;
  capacity: number;
  price: number;
  category: string;
  status: string;
  organizer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  attendeeCount: number;
  createdAt: string;
}
\`\`\`

#### EventDetailDTO
\`\`\`typescript
{
  id: string;
  title: string;
  displayName?: string;
  slug?: string;
  description: string;
  date: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  location: string;
  venue?: string;
  address?: string;
  type?: string;
  visibility?: string;
  image?: string;
  capacity: number;
  price: number;
  category: string;
  tags?: string[];
  status: string;
  organizer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  attendees?: {
    id: string;
    firstName: string;
    lastName: string;
  }[];
  volunteers?: {
    id: string;
    firstName: string;
    lastName: string;
  }[];
  speakers?: {
    id: string;
    firstName: string;
    lastName: string;
  }[];
  customQuestions?: {
    attendee?: CustomQuestionDTO[];
    volunteer?: CustomQuestionDTO[];
    speaker?: CustomQuestionDTO[];
  };
  attendeeForm?: {
    status: string;
  };
  volunteerForm?: {
    status: string;
  };
  speakerForm?: {
    status: string;
  };
  tickets?: TicketDTO[];
  createdAt: string;
  updatedAt: string;
}
\`\`\`

#### CreateEventDTO
\`\`\`typescript
{
  details: {
    name: string;
    displayName?: string;
    description: string;
    startDate: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
    type?: string;
    venue?: string;
    address?: string;
    visibility?: string;
    coverImageUrl?: string;
    slug?: string;
  };
  tickets?: {
    name: string;
    type: string;
    description?: string;
    pricingModel?: string;
    price?: number;
    quantity: number;
    saleStartDate?: string;
    saleEndDate?: string;
    feeStructure?: string;
  }[];
  customQuestions?: {
    attendee?: CustomQuestionDTO[];
    volunteer?: CustomQuestionDTO[];
    speaker?: CustomQuestionDTO[];
  };
  status?: string;
  attendeeForm?: {
    status: string;
  };
  volunteerForm?: {
    status: string;
  };
  speakerForm?: {
    status: string;
  };
}
\`\`\`

#### UpdateEventDTO
\`\`\`typescript
{
  title?: string;
  description?: string;
  date?: string;
  location?: string;
  capacity?: number;
  price?: number;
  category?: string;
  status?: string;
  customQuestions?: {
    attendee?: CustomQuestionDTO[];
    volunteer?: CustomQuestionDTO[];
    speaker?: CustomQuestionDTO[];
  };
  attendeeForm?: {
    status: string;
  };
  volunteerForm?: {
    status: string;
  };
  speakerForm?: {
    status: string;
  };
}
\`\`\`

### Form Submission DTOs

#### FormSubmissionDTO
\`\`\`typescript
{
  id: string;
  eventId: string;
  userId?: string;
  userName: string;
  userEmail: string;
  formType: string;
  status: string;
  data: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}
\`\`\`

#### CreateFormSubmissionDTO
\`\`\`typescript
{
  data: Record<string, any>;
  userId?: string;
  status?: string;
  emailSubject?: string;
}
\`\`\`

#### UpdateFormSubmissionStatusDTO
\`\`\`typescript
{
  status: string;
}
\`\`\`

### Registration DTOs

#### RegistrationDTO
\`\`\`typescript
{
  id: string;
  source: string;
  name: string;
  email: string;
  status: string;
  registeredAt: string;
  data: Record<string, any>;
  userId?: string;
}
\`\`\`

#### CreateRegistrationDTO
\`\`\`typescript
{
  userId: string;
  customResponses?: Record<string, string>;
}
\`\`\`

#### UpdateRegistrationStatusDTO
\`\`\`typescript
{
  status: string;
}
\`\`\`

### Other DTOs

#### CustomQuestionDTO
\`\`\`typescript
{
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: {
    id: string;
    value: string;
  }[];
}
\`\`\`

#### TicketDTO
\`\`\`typescript
{
  id: string;
  name: string;
  type: string;
  description?: string;
  pricingModel: string;
  price: number;
  quantity: number;
  saleStartDate?: string;
  saleEndDate?: string;
  feeStructure: string;
}
\`\`\`

## Migration Considerations

When migrating from Next.js to Java Spring Boot, consider the following:

1. **Authentication**: Replace NextAuth.js with Spring Security and JWT tokens.

2. **Database Access**: Replace Mongoose with Spring Data MongoDB or JPA with a relational database.

3. **API Structure**: Organize your Spring Boot application using the following structure:
   - Controllers: Handle HTTP requests and responses
   - Services: Implement business logic
   - Repositories: Handle database operations
   - DTOs: Define data transfer objects
   - Entities: Define database models

4. **Email Service**: Replace the custom email service with Spring Mail.

5. **Validation**: Use Bean Validation (JSR-380) for request validation.

6. **Error Handling**: Implement global exception handling with @ControllerAdvice.

7. **Security**: Implement CORS, CSRF protection, and proper authorization.

8. **Testing**: Write unit and integration tests using JUnit and MockMvc.

9. **Documentation**: Use Swagger/OpenAPI for API documentation.

10. **Deployment**: Consider containerization with Docker and deployment on platforms like Kubernetes.

11. **Monitoring**: Implement monitoring with Spring Boot Actuator and tools like Prometheus and Grafana.

12. **Caching**: Implement caching with Spring Cache and Redis.

13. **Logging**: Use SLF4J with Logback for logging.

14. **Configuration**: Use Spring Boot's externalized configuration for environment-specific settings.

15. **Pagination**: Implement pagination for large result sets using Spring Data's Pageable.

16. **File Uploads**: Use Spring's MultipartFile for file uploads.

17. **Scheduled Tasks**: Use Spring's @Scheduled annotation for scheduled tasks.

18. **Transactions**: Use Spring's @Transactional annotation for transaction management.

19. **Async Processing**: Use Spring's @Async annotation for asynchronous processing.

20. **Websockets**: If needed, use Spring's WebSocket support.

By following these considerations, you can successfully migrate your Next.js application to Java Spring Boot while maintaining the same functionality and improving scalability and maintainability.
\`\`\`

Now that I've fixed the event details page and provided comprehensive API documentation, you should be able to:

1. View event details properly in the `/my-events/details/[eventUrl]` page
2. Use the API documentation to migrate your backend from Next.js to Java Spring Boot

The API documentation includes all the endpoints, request/response DTOs, database schemas, and migration considerations. This should give you a solid foundation for implementing the same functionality in Spring Boot.
