import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Fair Wheel Studio',
}

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
