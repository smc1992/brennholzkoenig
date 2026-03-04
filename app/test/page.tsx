export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 p-8 font-sans">
      <h1 className="text-4xl font-bold mb-8">Brennholz König Design Test</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-red-500 text-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-2">Rote Box</h2>
          <p>Standard-Tailwind Hintergrundfarbe und Schatten.</p>
        </div>

        <div className="bg-yellow-400 text-black p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-2">Gelbe Box</h2>
          <p>Nochmal mit einer anderen Tailwind-Farbe.</p>
        </div>
      </div>
    </div>
  );
}