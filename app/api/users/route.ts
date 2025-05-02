import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import User from "@/models/User"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { z } from "zod" // Add zod for validation

// Define a schema for query parameters
const QuerySchema = z.object({
  role: z.string().optional(),
  limit: z
    .string()
    .transform((val) => Number.parseInt(val, 10))
    .optional(),
  page: z
    .string()
    .transform((val) => Number.parseInt(val, 10))
    .optional(),
  sort: z.enum(["asc", "desc"]).optional().default("desc"),
})

export async function GET(req: NextRequest) {
  try {
    // Authenticate the request
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only super-admin can list all users
    if (session.user.role !== "super-admin") {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 })
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(req.url)
    const queryResult = QuerySchema.safeParse(Object.fromEntries(searchParams.entries()))

    if (!queryResult.success) {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          details: queryResult.error.format(),
        },
        { status: 400 },
      )
    }

    const { role, limit = 50, page = 1, sort } = queryResult.data

    // Connect to database with error handling
    try {
      await connectToDatabase()
    } catch (dbError) {
      console.error("Database connection error:", dbError)
      return NextResponse.json(
        {
          error: "Database connection failed",
          details: "Unable to connect to the database. Please try again later.",
        },
        { status: 503 },
      )
    }

    // Build query
    const query: any = {}
    if (role) query.role = role

    // Calculate pagination
    const skip = (page - 1) * limit

    // Execute query with pagination and sorting
    const users = await User.find(query)
      .select("-password -verificationCode -resetPasswordToken -resetPasswordOTP")
      .sort({ createdAt: sort === "asc" ? 1 : -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    // Get total count for pagination
    const totalUsers = await User.countDocuments(query)

    // Return paginated results with metadata
    return NextResponse.json({
      users,
      pagination: {
        total: totalUsers,
        page,
        limit,
        pages: Math.ceil(totalUsers / limit),
      },
    })
  } catch (error: any) {
    console.error("Error fetching users:", error)

    // Provide appropriate error response based on error type
    if (error.name === "ValidationError") {
      return NextResponse.json(
        {
          error: "Validation error",
          details: error.message,
        },
        { status: 400 },
      )
    }

    return NextResponse.json(
      {
        error: "An error occurred while fetching users",
        message: error.message || "Unknown error",
      },
      { status: 500 },
    )
  }
}
