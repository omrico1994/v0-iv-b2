import { signOut } from "@/lib/actions"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { LogOut } from "lucide-react"

export function LogoutButton() {
  return (
    <form action={signOut}>
      <DropdownMenuItem asChild>
        <button type="submit" className="w-full flex items-center">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </button>
      </DropdownMenuItem>
    </form>
  )
}
