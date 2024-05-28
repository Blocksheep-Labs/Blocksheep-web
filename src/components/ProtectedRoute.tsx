// import { useAddress } from "@thirdweb-dev/react";
import React from "react";
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // const address = useAddress();
  // if (!address) {
  // user is not authenticated
  return <Navigate to="/" />;
  // }
  // return children;
}

export default ProtectedRoute;
