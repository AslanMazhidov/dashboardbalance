"use client"

import { motion } from "framer-motion"

interface PageHeaderProps {
  title: string
  description?: string
  children?: React.ReactNode
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-stone-500">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </motion.div>
  )
}
