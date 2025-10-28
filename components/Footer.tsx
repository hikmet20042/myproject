import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
  <footer className="bg-primary text-white transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About Section */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="Social Justice Platform Logo"
                  width={32}
                  height={32}
                  className="rounded"
                />
              </div>
              <span className="text-xl font-bold">Social Justice Platform</span>
            </div>
            <p className="text-gray-200 text-sm leading-relaxed mb-4">
              A public service platform dedicated to promoting social justice and combating 
              social inequality in Azerbaijan through education, awareness, and data transparency.
            </p>
            <p className="text-gray-300 text-xs">
              This website is for educational purposes and public awareness. Data is collected 
              from public sources and may contain inaccuracies.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-200 hover:text-white transition-colors text-sm">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-gray-200 hover:text-white transition-colors text-sm">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/submit" className="text-gray-200 hover:text-white transition-colors text-sm">
                  Submit Blog
                </Link>
              </li>
              <li>
                <Link href="/stats" className="text-gray-200 hover:text-white transition-colors text-sm">
                  Statistics
                </Link>
              </li>
              <li>
                <Link href="/resources" className="text-gray-200 hover:text-white transition-colors text-sm">
                  Resources
                </Link>
              </li>
            </ul>
          </div>

          {/* Emergency Resources */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Emergency Help</h3>
            <div className="space-y-2 text-sm">
              <p className="text-gray-200">
                Emergency Hotline: <span className="text-white font-medium">112</span>
              </p>
              <p className="text-gray-200">
                Women Support Center: <span className="text-white font-medium">+994 12 XXX XXXX</span>
              </p>
              <p className="text-gray-200 mt-4">
                <span className="text-white font-medium">24/7 Support Available</span>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar with Copyright and GitHub */}
  <div className="border-t border-gray-600 mt-8 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-center md:text-left">
              <p className="text-gray-200 text-sm">
                © {currentYear} Social Justice Platform. All rights reserved.
              </p>
              <p className="text-gray-300 text-xs mt-1">
                Built with Next.js for public service and awareness.
              </p>
            </div>
            
            <div className="flex items-center space-x-6">
              {/* GitHub Link */}
              <a
                href="https://github.com/yourusername/social-justice-platform"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-gray-200 hover:text-white transition-colors duration-200"
                aria-label="View project on GitHub"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">View on GitHub</span>
              </a>
              
              {/* Project Info */}
              <div className="text-right">
                <p className="text-gray-300 text-xs">
                  Open Source Project
                </p>
                <p className="text-gray-300 text-xs">
                  Public Service Initiative
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
