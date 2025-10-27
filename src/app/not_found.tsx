import { Suspense } from 'react';

function NotFoundContent() {
  return (
    <div className="p-8 text-center">
      <h1 className="text-2xl font-bold mb-2">404 – Page Not Found</h1>
      <p className="text-gray-500">Sorry, the page you are looking for does not exist.</p>
    </div>
  );
}

export default function NotFoundPage() {
  return (
    <Suspense fallback={null}>
      <NotFoundContent />
    </Suspense>
  );
} 