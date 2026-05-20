import { Button } from "@/components/ui/button"
import { createFileRoute, Link } from "@tanstack/react-router"

export const Route = createFileRoute("/")({
  component: DashboardPage,
})

function DashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Customer & Loan Onboarding</h1>

      <p className="mt-2 text-muted-foreground">
        Source base FE đã chạy với TanStack Router.
      </p>
      
       <Link to="/customer">
      <Button className="bg-blue-600 rounded-lg">Click me</Button>
      </Link>
    </div>
  )
}