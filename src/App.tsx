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
import TunnelGame from "./components/rabbit/TunnelGame";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<SelectRaceScreen />} />
        <Route
          path="select"
          element={
            <ProtectedRoute>
              <SelectRaceScreen />
            </ProtectedRoute>
          }
        />

        <Route
          path="tunnel"
          element={
            <ProtectedRoute>
              <TunnelGame />
            </ProtectedRoute>
          }
        />

        {/* not implemented  */}
        <Route
          path="countdown/:raceId"
          element={
            <ProtectedRoute>
              <CountDownScreen />
            </ProtectedRoute>
          }
        />

        {/* race id  */}
        <Route
          path="race/:raceId/:gamesCount"
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
      {["/", "select"].includes(pathname) && <Header />}
      <Outlet />
      {pathname === "play" && <BottomTab />}
    </div>
  );
}

export default App;
