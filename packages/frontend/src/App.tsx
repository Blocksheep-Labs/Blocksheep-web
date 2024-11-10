import SelectRaceScreen from "./screens/basic/SelectRaceScreen";
import BottomTab from "./components/BottomTab";
import { Outlet, Route, Routes, useLocation } from "react-router-dom";
import UnderdogGame from "./screens/underdog/Underdog";
import CountDownScreen from "./screens/addons/CountDownScreen";
import ProtectedRoute from "./components/ProtectedRoute";
import Header from "./components/Header";
import AccountScreen from "./screens/basic/AccountScreen";
import RabbitHoleGame from "./screens/rabbit-hole/RabbitHole";
import { useEffect } from "react";
import { socket } from "./utils/socketio";
import HomeScreen from "./screens/basic/HomeScreen";
import AdminScreen from "./screens/basic/AdminScreen";
import UnderdogCover from "./screens/underdog/UnderdogCover";
import UnderdogRules from "./screens/underdog/UnderdogRules";
import RabbitHoleRules from "./screens/rabbit-hole/RabbitHoleRules";
import RabbitHoleCover from "./screens/rabbit-hole/RabbitHoleCover";
import StatsScreen from "./screens/addons/StatsScreen";
import RateScreen from "./screens/addons/RateScreen";
import BullrunCover from "./screens/bullrun/BullrunCover";
import BullrunRules from "./screens/bullrun/BullrunRules";
import Bullrun from "./screens/bullrun/Bullrun";
import StoryScreen from "./screens/addons/StoryScreen";
import SetNicknameScreen from "./screens/addons/SetNicknameScreen";
import RaceUpdateScreen from "./screens/addons/RaceUpdateScreen";


function App() {
  import('eruda').then(eruda => eruda.default.init());

  
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
          path="race/:raceId/countdown"
          element={
            <ProtectedRoute>
              <CountDownScreen />
            </ProtectedRoute>
          }
        />

        <Route 
          path="race/:raceId/race-update/:board"
          element={
            <ProtectedRoute>
              <RaceUpdateScreen/>
            </ProtectedRoute>
          }
        />

        <Route 
          path="race/:raceId/story/:part"
          element={
            <ProtectedRoute>
              <StoryScreen/>
            </ProtectedRoute>
          }
        />

        <Route 
          path="race/:raceId/set-nickname"
          element={
            <ProtectedRoute>
              <SetNicknameScreen/>
            </ProtectedRoute>
          }
        />

        {/* UNDERDOG COVER */}
        <Route
          path="race/:raceId/underdog/preview"
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
              <UnderdogGame />
            </ProtectedRoute>
          }
        />

        {/* RABBIT HOLE COVER */}
        <Route
          path="race/:raceId/rabbit-hole/:version/preview"
          element={
            <ProtectedRoute>
              <RabbitHoleCover />
            </ProtectedRoute>
          }
        />

        {/* RABBIT HOLE RULES */}
        <Route
          path="race/:raceId/rabbit-hole/:version/rules"
          element={
            <ProtectedRoute>
              <RabbitHoleRules />
            </ProtectedRoute>
          }
        />
        
        {/* RABBIT HOLE GAME */}
        <Route
          path="race/:raceId/rabbit-hole/:version"
          element={
            <ProtectedRoute>
              <RabbitHoleGame />
            </ProtectedRoute>
          }
        />

        {/* BULL RUN COVER */}
        <Route
          path="race/:raceId/bullrun/preview"
          element={
            <ProtectedRoute>
              <BullrunCover />
            </ProtectedRoute>
          }
        />

        {/* BULL RUN RULES */}
        <Route
          path="race/:raceId/bullrun/rules"
          element={
            <ProtectedRoute>
              <BullrunRules />
            </ProtectedRoute>
          }
        />

        {/* BULL RUN */}
        <Route
          path="race/:raceId/bullrun"
          element={
            <ProtectedRoute>
              <Bullrun />
            </ProtectedRoute>
          }
        />

        {/* RACE RATE */}
        <Route
          path="race/:raceId/rate"
          element={
            <ProtectedRoute>
              <RateScreen />
            </ProtectedRoute>
          }
        />

        {/* RACE STATS */}
        <Route
          path="race/:raceId/stats"
          element={
            <ProtectedRoute>
              <StatsScreen />
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
