"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, User, Building, MapPin, Shield, AlertCircle, Loader2 } from "lucide-react"
import { createUserFromAdmin } from "@/lib/actions/user-management"

type UserRole = "admin" | "office" | "retailer" | "location_user"
type Step = "role" | "details" | "business" | "review"

interface FormData {
  role: UserRole | null
  email: string
  firstName: string
  lastName: string
  phone: string
  businessType: "new" | "existing" | null
  existingRetailerId: string
  businessName: string
  businessAddress: string
  businessPhone: string
  businessEmail: string
  website: string
  invitationMessage: string
}

const roleConfig = {
  admin: {
    title: "Admin User",
    description: "Full system access with user management capabilities",
    icon: Shield,
    color: "bg-primary text-primary-foreground",
  },
  office: {
    title: "Office User",
    description: "Management access to all locations and reporting",
    icon: Building,
    color: "bg-secondary text-secondary-foreground",
  },
  retailer: {
    title: "Retailer",
    description: "Manage assigned locations and location users",
    icon: User,
    color: "bg-accent text-accent-foreground",
  },
  location_user: {
    title: "Location User",
    description: "Access to specific location operations only",
    icon: MapPin,
    color: "bg-muted text-muted-foreground",
  },
}

export function UserCreationForm() {
  const [currentStep, setCurrentStep] = useState<Step>("role")
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ success?: string; error?: string } | null>(null)

  const [formData, setFormData] = useState<FormData>({
    role: null,
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    businessType: null,
    existingRetailerId: "",
    businessName: "",
    businessAddress: "",
    businessPhone: "",
    businessEmail: "",
    website: "",
    invitationMessage:
      "Welcome to our business management system. Please complete your account setup using the link below.",
  })

  const steps = [
    { id: "role", title: "Select Role", completed: !!formData.role },
    { id: "details", title: "User Details", completed: formData.email && formData.firstName && formData.lastName },
    {
      id: "business",
      title: "Business Assignment",
      completed: formData.role === "admin" || formData.role === "office" || formData.businessType,
    },
    { id: "review", title: "Review & Send", completed: false },
  ]

  const handleRoleSelect = (role: UserRole) => {
    setFormData((prev) => ({ ...prev, role }))
    setCurrentStep("details")
  }

  const handleNext = () => {
    console.log("[v0] Next button clicked, current step:", currentStep)
    console.log("[v0] Form data:", formData)
    console.log("[v0] Can proceed:", canProceed())

    const stepOrder: Step[] = ["role", "details", "business", "review"]
    const currentIndex = stepOrder.indexOf(currentStep)
    if (currentIndex < stepOrder.length - 1) {
      console.log("[v0] Moving to next step:", stepOrder[currentIndex + 1])
      setCurrentStep(stepOrder[currentIndex + 1])
    }
  }

  const handleBack = () => {
    const stepOrder: Step[] = ["role", "details", "business", "review"]
    const currentIndex = stepOrder.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1])
    }
  }

  const canProceed = () => {
    console.log("[v0] Checking canProceed for step:", currentStep)
    console.log("[v0] Current form data:", {
      role: formData.role,
      email: formData.email,
      firstName: formData.firstName,
      lastName: formData.lastName,
      businessType: formData.businessType,
      existingRetailerId: formData.existingRetailerId,
      businessName: formData.businessName,
    })

    switch (currentStep) {
      case "role":
        const roleResult = !!formData.role
        console.log("[v0] Role step canProceed:", roleResult)
        return roleResult
      case "details":
        const detailsResult = formData.email && formData.firstName && formData.lastName
        console.log("[v0] Details step canProceed:", detailsResult, {
          email: !!formData.email,
          firstName: !!formData.firstName,
          lastName: !!formData.lastName,
        })
        return detailsResult
      case "business":
        if (formData.role === "admin" || formData.role === "office") {
          console.log("[v0] Business step canProceed (admin/office):", true)
          return true
        }
        const businessResult =
          formData.businessType === "existing"
            ? !!formData.existingRetailerId
            : formData.businessType === "new"
              ? !!formData.businessName
              : false
        console.log("[v0] Business step canProceed:", businessResult)
        return businessResult
      default:
        console.log("[v0] Default canProceed:", true)
        return true
    }
  }

  const handleSubmit = () => {
    if (!formData.role) return

    console.log("[v0] Form submission started with data:", formData)

    startTransition(async () => {
      try {
        console.log("[v0] Calling createUserFromAdmin server action...")
        const result = await createUserFromAdmin({
          role: formData.role!,
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone || undefined,
          businessType: formData.businessType || undefined,
          existingRetailerId: formData.existingRetailerId || undefined,
          businessName: formData.businessName || undefined,
          businessAddress: formData.businessAddress || undefined,
          businessPhone: formData.businessPhone || undefined,
          businessEmail: formData.businessEmail || undefined,
          website: formData.website || undefined,
          invitationMessage: formData.invitationMessage,
        })

        console.log("[v0] Server action result:", result)
        setResult(result)

        if (result.success) {
          // Reset form after successful creation
          setTimeout(() => {
            setFormData({
              role: null,
              email: "",
              firstName: "",
              lastName: "",
              phone: "",
              businessType: null,
              existingRetailerId: "",
              businessName: "",
              businessAddress: "",
              businessPhone: "",
              businessEmail: "",
              website: "",
              invitationMessage:
                "Welcome to our business management system. Please complete your account setup using the link below.",
            })
            setCurrentStep("role")
            setResult(null)
          }, 3000)
        }
      } catch (error) {
        console.error("[v0] Client-side error in handleSubmit:", error)
        setResult({ error: `Error: ${error instanceof Error ? error.message : "An unexpected error occurred"}` })
      }
    })
  }

  return (
    <div className="space-y-8">
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                step.completed
                  ? "bg-primary border-primary text-primary-foreground"
                  : currentStep === step.id
                    ? "border-primary text-primary"
                    : "border-muted text-muted-foreground"
              }`}
            >
              {step.completed ? <CheckCircle className="w-5 h-5" /> : index + 1}
            </div>
            <div className="ml-3">
              <p
                className={`text-sm font-medium ${
                  step.completed || currentStep === step.id ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {step.title}
              </p>
            </div>
            {index < steps.length - 1 && (
              <div className={`w-16 h-0.5 mx-4 ${step.completed ? "bg-primary" : "bg-border"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Result Alert */}
      {result && (
        <Alert className={result.success ? "border-green-200 bg-green-50" : "border-destructive bg-destructive/10"}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className={result.success ? "text-green-800" : "text-destructive"}>
            {result.success || result.error}
          </AlertDescription>
        </Alert>
      )}

      {/* Step Content */}
      <Card>
        <CardContent className="p-8">
          {currentStep === "role" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-2">Select User Role</h2>
                <p className="text-muted-foreground">Choose the appropriate role for the new user.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(roleConfig).map(([role, config]) => {
                  const Icon = config.icon
                  return (
                    <Card
                      key={role}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        formData.role === role ? "ring-2 ring-primary" : ""
                      }`}
                      onClick={() => handleRoleSelect(role as UserRole)}
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${config.color}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{config.title}</CardTitle>
                            <CardDescription className="text-sm">{config.description}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {currentStep === "details" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-2">User Details</h2>
                <p className="text-muted-foreground">Enter the basic information for the new user.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === "business" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-2">Business Assignment</h2>
                <p className="text-muted-foreground">
                  {formData.role === "admin" || formData.role === "office"
                    ? "Admin and Office users have access to all businesses."
                    : "Assign the user to a retailer business."}
                </p>
              </div>

              {(formData.role === "retailer" || formData.role === "location_user") && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        formData.businessType === "existing" ? "ring-2 ring-primary" : ""
                      }`}
                      onClick={() => setFormData((prev) => ({ ...prev, businessType: "existing" }))}
                    >
                      <CardHeader>
                        <CardTitle className="text-lg">Existing Retailer</CardTitle>
                        <CardDescription>Assign to an existing retailer business</CardDescription>
                      </CardHeader>
                    </Card>

                    <Card
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        formData.businessType === "new" ? "ring-2 ring-primary" : ""
                      }`}
                      onClick={() => setFormData((prev) => ({ ...prev, businessType: "new" }))}
                    >
                      <CardHeader>
                        <CardTitle className="text-lg">New Retailer</CardTitle>
                        <CardDescription>Create a new retailer business</CardDescription>
                      </CardHeader>
                    </Card>
                  </div>

                  {formData.businessType === "existing" && (
                    <div className="space-y-2">
                      <Label htmlFor="retailer">Select Retailer</Label>
                      <Select
                        value={formData.existingRetailerId}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, existingRetailerId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose an existing retailer" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="techstore">TechStore Solutions</SelectItem>
                          <SelectItem value="mobileworld">Mobile World</SelectItem>
                          <SelectItem value="gadgetparadise">Gadget Paradise</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {formData.businessType === "new" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="businessName">Business Name *</Label>
                        <Input
                          id="businessName"
                          placeholder="Acme Electronics"
                          value={formData.businessName}
                          onChange={(e) => setFormData((prev) => ({ ...prev, businessName: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="businessPhone">Business Phone</Label>
                        <Input
                          id="businessPhone"
                          type="tel"
                          placeholder="+1 (555) 987-6543"
                          value={formData.businessPhone}
                          onChange={(e) => setFormData((prev) => ({ ...prev, businessPhone: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="businessAddress">Business Address</Label>
                        <Input
                          id="businessAddress"
                          placeholder="123 Business St, City, State 12345"
                          value={formData.businessAddress}
                          onChange={(e) => setFormData((prev) => ({ ...prev, businessAddress: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="businessEmail">Business Email</Label>
                        <Input
                          id="businessEmail"
                          type="email"
                          placeholder="contact@business.com"
                          value={formData.businessEmail}
                          onChange={(e) => setFormData((prev) => ({ ...prev, businessEmail: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          type="url"
                          placeholder="https://business.com"
                          value={formData.website}
                          onChange={(e) => setFormData((prev) => ({ ...prev, website: e.target.value }))}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {(formData.role === "admin" || formData.role === "office") && (
                <div className="text-center py-8">
                  <Badge variant="secondary" className="text-lg px-4 py-2">
                    No business assignment required for {roleConfig[formData.role!].title}
                  </Badge>
                </div>
              )}
            </div>
          )}

          {currentStep === "review" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-2">Review & Send Invitation</h2>
                <p className="text-muted-foreground">Review the user details and send the invitation email.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">User Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm text-muted-foreground">Role</Label>
                      <p className="font-medium">{roleConfig[formData.role!].title}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Name</Label>
                      <p className="font-medium">
                        {formData.firstName} {formData.lastName}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Email</Label>
                      <p className="font-medium">{formData.email}</p>
                    </div>
                    {formData.phone && (
                      <div>
                        <Label className="text-sm text-muted-foreground">Phone</Label>
                        <p className="font-medium">{formData.phone}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {(formData.role === "retailer" || formData.role === "location_user") && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Business Assignment</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {formData.businessType === "existing" ? (
                        <div>
                          <Label className="text-sm text-muted-foreground">Assigned Retailer</Label>
                          <p className="font-medium">{formData.existingRetailerId}</p>
                        </div>
                      ) : (
                        <>
                          <div>
                            <Label className="text-sm text-muted-foreground">New Business</Label>
                            <p className="font-medium">{formData.businessName}</p>
                          </div>
                          {formData.businessAddress && (
                            <div>
                              <Label className="text-sm text-muted-foreground">Address</Label>
                              <p className="font-medium">{formData.businessAddress}</p>
                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="invitationMessage">Invitation Message</Label>
                <Textarea
                  id="invitationMessage"
                  rows={4}
                  value={formData.invitationMessage}
                  onChange={(e) => setFormData((prev) => ({ ...prev, invitationMessage: e.target.value }))}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={handleBack} disabled={currentStep === "role" || isPending}>
          Back
        </Button>

        <Button onClick={currentStep === "review" ? handleSubmit : handleNext} disabled={!canProceed() || isPending}>
          {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {currentStep === "review" ? "Create User & Send Invitation" : "Next"}
        </Button>
      </div>
    </div>
  )
}
