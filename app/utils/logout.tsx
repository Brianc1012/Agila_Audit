//import Router from "next/router";

export async function logout() {
  // Call HR's logout endpoint (adjust URL as needed)
  await fetch(`${process.env.NEXT_PUBLIC_HR_API_URL}/auth/logout`, {
    method: "POST",
    credentials: "include", // send cookies
  });

  // Remove any local tokens (if stored)
  if (typeof window !== "undefined") {
    localStorage.removeItem("jwt");
    sessionStorage.removeItem("jwt");
    // Optionally, clear cookies if not HTTP-only
    document.cookie = "jwt=; Max-Age=0; path=/;";
  }

  // Redirect to HR login page (or shared landing)
  window.location.href = `${process.env.NEXT_PUBLIC_HR_LOGIN_URL || "/authentication/login"}`;
}