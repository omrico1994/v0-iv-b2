export async function getSimpleUser() {
  try {
    console.log("[v0] Starting simple user check")

    // Just return a mock user for now to test if the page loads
    const mockUser = {
      id: "test-user-id",
      email: "admin@iv-relife.com",
      role: "admin" as const,
      first_name: "Admin",
      last_name: "User",
      phone: null,
      profile_photo_url: null,
      locations: [],
    }

    console.log("[v0] Returning mock user:", mockUser)
    return mockUser
  } catch (error) {
    console.error("[v0] Error in getSimpleUser:", error)
    throw error
  }
}
