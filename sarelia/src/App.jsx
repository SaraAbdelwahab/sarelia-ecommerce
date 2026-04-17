import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { CartProvider } from './utils/CartContext';
import { AuthProvider } from './utils/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Contact from './pages/Contact';
import About from './pages/About';

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

// Layout wrapper — hides navbar/footer on login page
function Layout({ children }) {
  const { pathname } = useLocation();
  const isLoginPage = pathname === '/login';

  return (
    <div className="min-h-screen bg-[#0B0B0F] flex flex-col">
      {!isLoginPage && <Navbar />}
      <div className="flex-1">{children}</div>
      {!isLoginPage && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <ScrollToTop />
          <Layout>
            <Routes>
              <Route path="/"               element={<Home />} />
              <Route path="/shop"           element={<Shop />} />
              <Route path="/product/:slug"  element={<ProductDetail />} />
              <Route path="/cart"           element={<Cart />} />
              <Route path="/checkout"       element={<Checkout />} />
              <Route path="/login"          element={<Login />} />
              <Route path="/about"          element={<About />} />
              <Route path="/contact"       element={<Contact />} />
              {/* Catch-all 404 */}
              <Route
                path="*"
                element={
                  <main className="bg-[#0B0B0F] min-h-screen flex items-center justify-center">
                    <div className="text-center">
                      <p className="font-['Playfair_Display'] text-[#C8A96A] text-8xl font-bold mb-4">404</p>
                      <p className="font-['Cormorant_Garamond'] text-white/40 text-2xl mb-8">Page not found</p>
                      <a href="/" className="font-['Cormorant_Garamond'] text-[#C8A96A] text-lg underline">
                        Return Home
                      </a>
                    </div>
                  </main>
                }
              />
            </Routes>
          </Layout>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
