import React from 'react'
import clsx from 'clsx'

interface ButtonProps {
  children: React.ReactNode
  variant?: 'solid' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  disabled?: boolean
}

export default function Button({ 
  children, 
  variant = 'solid', 
  size = 'md',
  className = '', 
  disabled = false,
  ...props 
}: ButtonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm rounded-md',
    md: 'px-4 py-2 text-sm rounded-lg',
    lg: 'px-6 py-3 text-base rounded-lg'
  }
  
  const variantClasses = {
    solid: 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 focus:ring-indigo-500 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5',
    outline: 'border-2 border-indigo-200 text-indigo-700 bg-white hover:bg-indigo-50 hover:border-indigo-300 focus:ring-indigo-500',
    ghost: 'text-indigo-700 bg-transparent hover:bg-indigo-50 focus:ring-indigo-500',
    danger: 'bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600 focus:ring-red-500 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
  }

  return (
    <button 
      {...props} 
      disabled={disabled}
      className={clsx(
        baseClasses,
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      {children}
    </button>
  )
}