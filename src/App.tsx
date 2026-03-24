import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./services/firebase";
import { useAuthStore } from "./store/authStore";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AppLayout } from "./layout/AppLayout";
import { AuthLayout } from "./layout/AuthLayout";

// Pages
import LoginPage from "./pages/Auth/LoginPage";
import DashboardPage from "./pages/Dashboard/DashboardPage";
import ImageGeneratorPage from "./pages/Dashboard/ImageGeneratorPage";
import CourseCatalogPage from "./pages/Public/CourseCatalogPage";
import MyCoursesPage from "./pages/Course/MyCoursesPage";

export default function App() {
  const { setAuth, clearAuth } = useAuthStore();
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          let userData;
          if (userDoc.exists()) {
            userData = userDoc.data();
          } else {
            // Create user if they don't exist
            userData = {
              name: firebaseUser.displayName || "Student",
              email: firebaseUser.email || "",
              avatar: firebaseUser.photoURL || "",
              role: "student",
              is_active: true,
              locale: "bn",
              theme: "light",
              created_at: serverTimestamp(),
            };
            await setDoc(userDocRef, userData);
          }

          setAuth({
            id: firebaseUser.uid,
            name: userData.name,
            email: userData.email,
            avatar: userData.avatar,
            role: userData.role,
            is_active: userData.is_active,
            locale: userData.locale,
            theme: userData.theme,
            created_at: userData.created_at?.toString() || new Date().toISOString(),
          });
        } catch (error) {
          console.error("Error fetching user data:", error);
          clearAuth();
        }
      } else {
        clearAuth();
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, [setAuth, clearAuth]);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="w-12 h-12 border-4 border-[var(--color-primary-pale)] border-t-[var(--color-primary)] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/courses" replace />} />
          <Route path="/courses" element={<CourseCatalogPage />} />
          
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>

          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/my-courses" element={<MyCoursesPage />} />
            <Route path="/image-generator" element={<ImageGeneratorPage />} />
            {/* Add more protected routes here */}
          </Route>
        </Routes>
        <Toaster position="top-right" />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
