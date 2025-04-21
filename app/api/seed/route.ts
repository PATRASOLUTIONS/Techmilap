import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import User from "@/models/User"

export async function GET() {
  try {
    await connectToDatabase()

    // Check if users already exist
    const superAdminExists = await User.findOne({ email: "superadmin@gmail.com" })
    const eventPlannerExists = await User.findOne({ email: "eventplanner@gmail.com" })
    const userExists = await User.findOne({ email: "user@gmail.com" })

    const users = []

    // Create super admin if doesn't exist
    if (!superAdminExists) {
      const superAdmin = new User({
        firstName: "Super",
        lastName: "Admin",
        email: "superadmin@gmail.com",
        password: "password123",
        role: "super-admin",
        isVerified: true,
      })
      await superAdmin.save()
      users.push("Super Admin")
    }

    // Create event planner if doesn't exist
    if (!eventPlannerExists) {
      const eventPlanner = new User({
        firstName: "Event",
        lastName: "Planner",
        email: "eventplanner@gmail.com",
        password: "password123",
        role: "event-planner",
        isVerified: true,
      })
      await eventPlanner.save()
      users.push("Event Planner")
    }

    // Create regular user if doesn't exist
    if (!userExists) {
      const regularUser = new User({
        firstName: "Regular",
        lastName: "User",
        email: "user@gmail.com",
        password: "password123",
        role: "user",
        isVerified: true,
      })
      await regularUser.save()
      users.push("Regular User")
    }

    return NextResponse.json({
      success: true,
      message: users.length > 0 ? `Created users: ${users.join(", ")}` : "All demo users already exist",
    })
  } catch (error: any) {
    console.error("Error seeding users:", error)
    return NextResponse.json({ error: error.message || "An error occurred while seeding users" }, { status: 500 })
  }
}
