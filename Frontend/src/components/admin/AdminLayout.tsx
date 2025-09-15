import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  BookOpen,
  BookText,
  Video,
  Users,
  Menu,
  X,
  Settings,
  LogOut,
  Home,
  Globe,
  ExternalLink,
} from "lucide-react"

import { cn } from "@/lib/utils"

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Courses', href: '/admin/courses', icon: BookOpen },
  { name: 'Books', href: '/admin/books', icon: BookText },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Live Classes', href: '/admin/live-classes', icon: Video },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
]

const mainWebsiteNavigation = [
  { name: 'Home', href: '/', icon: Home, description: 'Main website homepage' },
  { name: 'Course Home', href: '/courses', icon: BookOpen, description: 'Browse all courses' },
  { name: 'Live Classes', href: '/live-classes', icon: Video, description: 'View live class schedule' },
  { name: 'Books', href: '/books', icon: BookText, description: 'Browse study materials' },
  { name: 'About', href: '/about', icon: Globe, description: 'About our platform' },
]

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, user } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className="lg:hidden">
        <div className="fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" 
               onClick={() => setSidebarOpen(false)} 
               aria-hidden="true"
          />
          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6 text-white" aria-hidden="true" />
              </button>
            </div>
            <div className="h-0 flex-1 overflow-y-auto pt-5 pb-4">
              <div className="flex flex-shrink-0 items-center px-4">
                <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
              </div>
              <nav className="mt-5 space-y-1 px-2">
                {/* Admin Navigation */}
                <div className="mb-4">
                  <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Admin Panel
                  </h3>
                  <div className="mt-2 space-y-1">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={cn(
                          location.pathname === item.href
                            ? 'bg-gray-100 text-gray-900'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                          'group flex items-center rounded-md px-2 py-2 text-base font-medium'
                        )}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <item.icon
                          className={cn(
                            location.pathname === item.href ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500',
                            'mr-4 h-6 w-6 flex-shrink-0'
                          )}
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Main Website Navigation */}
                <div className="mb-4">
                  <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Main Website
                  </h3>
                  <div className="mt-2 space-y-1">
                    {mainWebsiteNavigation.map((item) => (
                      <a
                        key={item.name}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center rounded-md px-2 py-2 text-base font-medium text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                        onClick={() => setSidebarOpen(false)}
                      >
                        <item.icon
                          className="mr-4 h-6 w-6 flex-shrink-0 text-blue-500 group-hover:text-blue-600"
                          aria-hidden="true"
                        />
                        <div className="flex-1">
                          <div className="flex items-center">
                            {item.name}
                            <ExternalLink className="ml-2 h-4 w-4 text-blue-400 group-hover:text-blue-500" />
                          </div>
                          <p className="text-xs text-blue-500 group-hover:text-blue-600 mt-1">
                            {item.description}
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </nav>
            </div>
            <div className="flex flex-shrink-0 border-t border-gray-200 p-4">
              <div className="group block w-full flex-shrink-0">
                <div className="flex items-center">
                  <div>
                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-gray-600 font-medium">A</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                      {user?.name || 'Admin User'}
                    </p>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="text-xs font-medium text-gray-500 group-hover:text-gray-700 flex items-center"
                    >
                      <LogOut className="mr-1 h-3 w-3" />
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white">
          <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
            <div className="flex flex-shrink-0 items-center px-4">
              <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
            </div>
            <nav className="mt-5 flex-1 space-y-1 bg-white px-2">
              {/* Admin Navigation */}
              <div className="mb-6">
                <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Admin Panel
                </h3>
                <div className="mt-2 space-y-1">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={cn(
                        location.pathname === item.href
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                        'group flex items-center rounded-md px-2 py-2 text-sm font-medium'
                      )}
                    >
                      <item.icon
                        className={cn(
                          location.pathname === item.href ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500',
                          'mr-3 h-6 w-6 flex-shrink-0'
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Main Website Navigation */}
              <div className="mb-6">
                <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Main Website
                </h3>
                <div className="mt-2 space-y-1">
                  {mainWebsiteNavigation.map((item) => (
                    <a
                      key={item.name}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center rounded-md px-2 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <item.icon
                        className="mr-3 h-6 w-6 flex-shrink-0 text-blue-500 group-hover:text-blue-600"
                        aria-hidden="true"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          <span className="truncate">{item.name}</span>
                          <ExternalLink className="ml-2 h-4 w-4 text-blue-400 group-hover:text-blue-500 flex-shrink-0" />
                        </div>
                        <p className="text-xs text-blue-500 group-hover:text-blue-600 mt-1 truncate">
                          {item.description}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </nav>
          </div>
          <div className="flex flex-shrink-0 border-t border-gray-200 p-4">
            <div className="group block w-full flex-shrink-0">
              <div className="flex items-center">
                <div>
                  <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-gray-600 font-medium">A</span>
                  </div>
                </div>
                                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                      {user?.name || 'Admin User'}
                    </p>
                                      <button
                      type="button"
                      onClick={handleLogout}
                      className="text-xs font-medium text-gray-500 group-hover:text-gray-700 flex items-center"
                    >
                      <LogOut className="mr-3 h-3 w-3" />
                      Sign out
                    </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col lg:pl-64">
        <div className="sticky top-0 z-10 bg-white pl-1 pt-1 sm:pl-3 sm:pt-3 lg:hidden">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 inline-flex h-12 w-12 items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        
        <main className="flex-1">
          {/* Quick Access Bar */}
          <div className="bg-white border-b border-gray-200 px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">Quick Access:</span>
                <div className="flex items-center space-x-2">
                  {mainWebsiteNavigation.slice(0, 3).map((item) => (
                    <a
                      key={item.name}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 hover:text-blue-700 transition-colors"
                    >
                      <item.icon className="mr-1.5 h-3 w-3" />
                      {item.name}
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  ))}
                </div>
              </div>
              <div className="text-xs text-gray-500">
                Admin Panel • {user?.name || 'Admin User'}
              </div>
            </div>
          </div>
          
          <div className="py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
