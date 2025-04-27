// components/Footer.tsx
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-100 py-4 mt-12">
      <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-600">
        © 2025 Jena Alsup and Jonathan Lin.{' '}
        <Link
          href="https://github.com/jenaalsup/hacktech"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-gray-800"
        >
          Source Code
        </Link>
      </div>
    </footer>
  );
}
