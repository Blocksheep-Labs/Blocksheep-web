import { Outlet, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { socket } from "./utils/socketio";
import ProtectedRoute from "./components/ProtectedRoute";
import Header from "./components/Header";
import BottomTab from "./components/BottomTab";
import {
  SelectRaceScreen,
  CountDownScreen,
  RabbitHoleGame,
  HomeScreen,
  AdminScreen,
  RabbitHoleRules,
  RabbitHoleCover,
  StatsScreen,
  RateScreen,
  BullrunCover,
  BullrunRules,
  Bullrun,
  StoryScreen,
  RaceUpdateScreen,
  AccountScreen,
  LevelUpdateScreen,
  DriversScreen,
  UnderdogGame,
  UnderdogCover,
  UnderdogRules,
} from "./screens/screens";


function App() {
  import("eruda").then((eruda) => eruda.default.init());

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
              <RaceUpdateScreen />
            </ProtectedRoute>
          }
        />

        <Route
          path="race/:raceId/story/:part"
          element={
            <ProtectedRoute>
              <StoryScreen />
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

        {/* RACE DRIVERS */}
        <Route
          path="race/:raceId/drivers"
          element={
            <ProtectedRoute>
              <DriversScreen />
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
        <Route path="admin" element={<AdminScreen />} />
      </Route>
    </Routes>
  );
}

function Layout() {
  const { pathname } = useLocation();
  return (
    <div
      className={`relative m-auto w-full bg-black sm:max-w-sm`}
      style={{ height: `${window.innerHeight}px` }}
    >
      {["/select"].includes(pathname) && <Header />}
      <Outlet />
      {pathname === "play" && <BottomTab />}
    </div>
  );
}

export default App;
