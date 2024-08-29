import SelectRaceScreen from "./screens/SelectRaceScreen";
import BottomTab from "./components/BottomTab";
import { Outlet, Route, Routes, useLocation } from "react-router-dom";
import QuestionsGame from "./screens/QuestionsGame";
import CountDownScreen from "./screens/CountDownScreen";
import ProtectedRoute from "./components/ProtectedRoute";
import Header from "./components/Header";
import AccountScreen from "./screens/AccountScreen";
import TunnelGame from "./screens/TunnelGame";
import { useEffect } from "react";
import { socket } from "./utils/socketio";
import HomeScreen from "./screens/HomeScreen";
import AdminScreen from "./screens/AdminScreen";
import UnderdogCover from "./screens/UnderdogCover";
import UnderdogRules from "./screens/UnderdogRules";
import RabbitHoleRules from "./screens/RabbitHoleRules";
import RabbitHoleCover from "./screens/RabbitHoleCover";


function App() {
  useEffect(() => {
    socket.connect();
  }, [socket]);

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
          path="countdown/:raceId"
          element={
            <ProtectedRoute>
              <CountDownScreen />
            </ProtectedRoute>
          }
        />

        {/* UNDERDOG COVER */}
        <Route
          path="race/:raceId/underdog/cover"
          element={
            <ProtectedRoute>
              <UnderdogCover />
            </ProtectedRoute>
          }
        />

        {/* UNDERDOG RULES */}
        <Route
          path="race/:raceId/underdog/rules"
          element={
            <ProtectedRoute>
              <UnderdogRules />
            </ProtectedRoute>
          }
        />

        {/* UNDERDOG GAME */}
        <Route
          path="race/:raceId/underdog"
          element={
            <ProtectedRoute>
              <QuestionsGame />
            </ProtectedRoute>
          }
        />

        {/* RABBIT HOLE COVER */}
        <Route
          path="race/:raceId/tunnel/cover"
          element={
            <ProtectedRoute>
              <RabbitHoleCover />
            </ProtectedRoute>
          }
        />

        {/* RABBIT HOLE RULES */}
        <Route
          path="race/:raceId/tunnel/rules"
          element={
            <ProtectedRoute>
              <RabbitHoleRules />
            </ProtectedRoute>
          }
        />
        
        {/* RABBIT HOLE GAME */}
        <Route
          path="race/:raceId/tunnel"
          element={
            <ProtectedRoute>
              <TunnelGame />
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

        {/* admin panel */}
        <Route 
          path="admin"
          element={
            <AdminScreen/>
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
      {["/select"].includes(pathname) && <Header />}
      <Outlet />
      {pathname === "play" && <BottomTab />}
    </div>
  );
}

export default App;
