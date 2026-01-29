/**
 * AnimatedBackground Component
 * Provides animated gradient blobs background for pages
 * Used across: Home, Resources, Blogs, Profile, Dashboard, Submit Blog, etc.
 */

interface AnimatedBackgroundProps {
  colors?: {
    blob1: string
    blob2: string
    blob3: string
  }
  opacity?: number
}

export default function AnimatedBackground({ 
  colors = {
    blob1: 'bg-purple-300',
    blob2: 'bg-indigo-300',
    blob3: 'bg-pink-300'
  },
  opacity = 20
}: AnimatedBackgroundProps) {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className={`absolute top-0 left-0 w-96 h-96 ${colors.blob1} rounded-full mix-blend-multiply filter blur-3xl opacity-${opacity} animate-blob`}></div>
      <div className={`absolute top-0 right-0 w-96 h-96 ${colors.blob2} rounded-full mix-blend-multiply filter blur-3xl opacity-${opacity} animate-blob animation-delay-2000`}></div>
      <div className={`absolute bottom-0 left-1/2 w-96 h-96 ${colors.blob3} rounded-full mix-blend-multiply filter blur-3xl opacity-${opacity} animate-blob animation-delay-4000`}></div>
    </div>
  )
}
