// Debug component to test if the app is loading
import { useEffect } from 'react';

export function DebugInfo() {
  useEffect(() => {
    console.log('🔍 DebugInfo component mounted');
    console.log('🔍 Window location:', window.location.href);
    console.log('🔍 User agent:', navigator.userAgent);
  }, []);

  return (
    <div className="fixed top-0 left-0 bg-red-500 text-white p-4 z-50">
      <h2>Debug Info</h2>
      <p>App is loading...</p>
      <p>URL: {window.location.href}</p>
    </div>
  );
}
