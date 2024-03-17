import React from "react";
import SelectRaceScreen from "./screens/SelectRaceScreen";
import BottomTab from "./components/BottomTab";
import { Outlet, Route, Routes, useLocation } from "react-router-dom";
import PlayScreen from "./screens/PlayScreen";
import CountDownScreen from "./screens/CountDownScreen";
import HomeScreen from "./screens/HomeScreen";
import ProtectedRoute from "./components/ProtectedRoute";
import Header from "./components/Header";
import AccountScreen from "./screens/AccountScreen";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomeScreen />} />
        <Route
          path="select"
          element={
            <ProtectedRoute>
              <SelectRaceScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="countdown"
          element={
            <ProtectedRoute>
              <CountDownScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="race/:id"
          element={
            <ProtectedRoute>
              <PlayScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="account"
          element={
            <ProtectedRoute>
              <AccountScreen />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}

function Layout() {
  const { pathname } = useLocation();
  return (
    <div className="relative m-auto h-screen w-full overflow-hidden bg-black sm:max-w-sm">
      {pathname !== "/" && <Header />}
      <Outlet />
      {pathname === "play" && <BottomTab />}
    </div>
  );
}

export default App;
