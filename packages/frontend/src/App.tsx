import { Outlet, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { socket } from "./utils/socketio";
import SelectRaceScreen from "./screens/SelectRace";
import BottomTab from "./components/BottomTab";
import UnderdogGame from "./screens/Underdog/Game";
import CountDownScreen from "./screens/Countdown";
import ProtectedRoute from "./components/ProtectedRoute";
import Header from "./components/Header";
import RabbitHoleGame from "./screens/RabbitHole/Game";
import HomeScreen from "./screens/Home";
import AdminScreen from "./screens/Admin";
import UnderdogCover from "./screens/Underdog/Intro";
import UnderdogRules from "./screens/Underdog/Rules";
import RabbitHoleRules from "./screens/RabbitHole/Rules";
import RabbitHoleCover from "./screens/RabbitHole/Intro";
import StatsScreen from "./screens/Stats";
import RateScreen from "./screens/Rate";
import BullrunCover from "./screens/Bullrun/Intro";
import BullrunRules from "./screens/Bullrun/Rules";
import Bullrun from "./screens/Bullrun/Game";
import StoryScreen from "./screens/Story";
import RaceUpdateScreen from "./screens/RaceUpdate";
import AccountScreen from "./screens/Account";
import LevelUpdateScreen from "./screens/LevelUpdate";

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

        {/* RACE LEVEL UPDATE */}
        <Route
          path="race/:raceId/level-update"
          element={
            <ProtectedRoute>
              <LevelUpdateScreen />
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
    <div className={`relative m-auto w-full bg-black sm:max-w-sm`} style={{ height: `${window.innerHeight}px` }}>
      {["/select"].includes(pathname) && <Header />}
      <Outlet />
      {pathname === "play" && <BottomTab />}
    </div>
  );
}

export default App;
