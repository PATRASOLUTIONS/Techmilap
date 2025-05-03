import { connectToDatabase } from "@/lib/mongodb"
import User from "@/models/User"
import mongoose from "mongoose"

/**
 * Debug utility to check if a user's email design preference is properly saved
 * @param userId The ID of the user to check
 * @returns The user's email design preference or null if not found
 */
export async function checkUserEmailDesignPreference(userId: string): Promise<{
  success: boolean
  preference?: string
  error?: string
}> {
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return {
        success: false,
        error: "Invalid user ID format",
      }
    }

    await connectToDatabase()

    const user = await User.findById(userId).select("emailDesignPreference firstName lastName")

    if (!user) {
      return {
        success: false,
        error: "User not found",
      }
    }

    return {
      success: true,
      preference: user.emailDesignPreference || "modern",
    }
  } catch (error: any) {
    console.error("Error in checkUserEmailDesignPreference:", error)
    return {
      success: false,
      error: error.message || "An unknown error occurred",
    }
  }
}

/**
 * Debug utility to set a user's email design preference directly
 * @param userId The ID of the user to update
 * @param preference The design preference to set
 * @returns Success status and message
 */
export async function setUserEmailDesignPreference(
  userId: string,
  preference: string,
): Promise<{
  success: boolean
  message?: string
  error?: string
}> {
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return {
        success: false,
        error: "Invalid user ID format",
      }
    }

    // Validate design preference
    const validDesigns = ["modern", "elegant", "colorful", "minimal", "corporate"]
    if (!validDesigns.includes(preference)) {
      return {
        success: false,
        error: `Invalid design preference. Must be one of: ${validDesigns.join(", ")}`,
      }
    }

    await connectToDatabase()

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { emailDesignPreference: preference } },
      { new: true },
    )

    if (!updatedUser) {
      return {
        success: false,
        error: "User not found",
      }
    }

    return {
      success: true,
      message: `Email design preference updated to "${preference}" for user ${updatedUser.firstName} ${updatedUser.lastName}`,
    }
  } catch (error: any) {
    console.error("Error in setUserEmailDesignPreference:", error)
    return {
      success: false,
      error: error.message || "An unknown error occurred",
    }
  }
}
