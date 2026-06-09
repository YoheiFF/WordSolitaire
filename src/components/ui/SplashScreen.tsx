'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

export function SplashScreen() {
  return (
    <motion.div
      className="fixed inset-0 z-50"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <Image
        src="/images/loading.png"
        alt="Loading"
        fill
        className="object-cover"
        priority
      />
    </motion.div>
  )
}
