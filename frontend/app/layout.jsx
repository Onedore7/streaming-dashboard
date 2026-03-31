import './globals.css';

export const metadata = {
  title: 'Streaming Dashboard',
  description: 'A high-performance Netflix-style dashboard powered by Fastify and TMDB',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-black text-white">
        {children}
      </body>
    </html>
  );
}
