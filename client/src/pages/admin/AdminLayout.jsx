import { Suspense } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { ListSkeleton } from '../../components/Skeleton'
import { toast } from 'sonner'
import { LogOut, Package, ShoppingBag, Plus, BarChart3, Tags, Users } from 'lucide-react'
import { useAuth } from '../../store/auth'

const NAV = [
  { to: '/admin/dashboard', label: 'Statistics', icon: BarChart3, end: true },
  { to: '/admin/dashboard/products', label: 'Products', icon: Package, end: true },
  { to: '/admin/dashboard/products/new', label: 'Add product', icon: Plus },
  { to: '/admin/dashboard/categories', label: 'Categories', icon: Tags },
  { to: '/admin/dashboard/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/dashboard/customers', label: 'Customers', icon: Users },
]

export default function AdminLayout() {
  const signOut = useAuth((s) => s.signOut)
  const email = useAuth((s) => s.user?.email)
  const navigate = useNavigate()

  async function logout() {
    await signOut()
    toast.success('Logged out')
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="container-x py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-3xl">Rana Admin</h1>
          <p className="text-xs text-[var(--color-mute)]">{email}</p>
        </div>
        <button className="btn btn-outline" onClick={logout}><LogOut size={14} /> Logout</button>
      </div>
      <nav className="flex gap-2 mb-6 flex-wrap">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `chip inline-flex items-center gap-1 ${isActive ? 'active' : ''}`}>
            <Icon size={12} /> {label}
          </NavLink>
        ))}
      </nav>
      <Suspense fallback={<ListSkeleton rows={4} />}>
        <Outlet />
      </Suspense>
    </div>
  )
}