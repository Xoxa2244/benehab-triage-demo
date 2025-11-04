import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function BackButton({ href, label }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
      title={label || 'Назад'}
    >
      <ArrowLeftIcon className="h-5 w-5 mr-1" />
      {label && <span className="text-sm font-medium">{label}</span>}
    </Link>
  )
}

