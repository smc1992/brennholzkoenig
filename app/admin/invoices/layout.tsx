import AdminSidebar from '../AdminSidebar'

export default function InvoicesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 flex min-h-0">
      <AdminSidebar />
      <div className="flex-1 py-8">
        {children}
      </div>
    </div>
  )
}