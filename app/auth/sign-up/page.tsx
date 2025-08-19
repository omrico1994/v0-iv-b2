import { SignUpForm } from "@/components/auth/sign-up-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-semibold text-foreground">Create Account</CardTitle>
            <CardDescription className="text-muted-foreground">
              Sign up to get started with your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignUpForm />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
