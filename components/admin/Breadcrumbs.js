import Link from 'next/link'
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline'

export default function Breadcrumbs({ items }) {
  if (!items || items.length === 0) return null

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
      <Link
        href="/admin"
        className="flex items-center hover:text-gray-900 transition-colors"
      >
        <HomeIcon className="h-4 w-4 mr-1" />
        Админ панель
      </Link>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          <ChevronRightIcon className="h-4 w-4 text-gray-400" />
          {item.href ? (
            <Link
              href={item.href}
              className="hover:text-gray-900 transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900 font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  )
}

