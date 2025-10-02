import React from 'react'
import clsx from 'clsx'

interface CardProps {
  title: string
  subtitle?: string
  children?: React.ReactNode
  className?: string
  variant?: 'default' | 'elevated' | 'outlined'
}

export default function Card({ 
  title, 
  subtitle, 
  children, 
  className = '',
  variant = 'default'
}: CardProps) {
  const variantClasses = {
    default: 'bg-slate-50/95 backdrop-blur-sm shadow-lg hover:shadow-xl',
    elevated: 'bg-slate-50 shadow-2xl',
    outlined: 'bg-slate-50/90 border-2 border-indigo-200 shadow-lg hover:shadow-xl'
  }

  return (
    <div className={clsx(
      'rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1',
      'relative transform',
      variantClasses[variant],
      className
    )}>
      <div className="flex flex-col items-center text-center gap-3 mb-4">
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