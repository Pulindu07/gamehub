import React from 'react'
import clsx from 'clsx'

interface CardProps {
  title: string
  subtitle?: string
  children?: React.ReactNode
  className?: string
  variant?: 'default' | 'elevated' | 'outlined'
  icon?: React.ReactNode
}

export default function Card({ 
  title, 
  subtitle, 
  children, 
  className = '',
  variant = 'default',
  icon
}: CardProps) {
  const variantClasses = {
    default: 'bg-white/90 backdrop-blur-sm border border-white/20',
    elevated: 'bg-white shadow-2xl border-0',
    outlined: 'bg-transparent border-2 border-indigo-200'
  }

  return (
    <div className={clsx(
      'rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl',
      variantClasses[variant],
      className
    )}>
      <div className="flex items-start gap-3 mb-4">
        {icon && (
          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-white">
            {icon}
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-1">{title}</h3>
          {subtitle && (
            <p className="text-sm text-gray-600 leading-relaxed">{subtitle}</p>
          )}
        </div>
      </div>
      {children && (
        <div className="mt-4">
          {children}
        </div>
      )}
    </div>
  )
}