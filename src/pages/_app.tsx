import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { AuthProvider } from "@/contexts/AuthContext";
import { UploadManagerProvider } from "@/contexts/UploadManagerContext";
import { GoogleOAuthProvider } from "@react-oauth/google";

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <UploadManagerProvider>
          <Component {...pageProps} />
        </UploadManagerProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
