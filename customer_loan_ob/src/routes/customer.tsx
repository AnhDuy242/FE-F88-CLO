import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/customer')({
  component: Customer,
})

function Customer(){ 
    return (
        <div className="text-2xl font-bold text-blue-600">
            <p>đay là trang khách hàng</p>
        </div>
    )
}