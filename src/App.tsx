import React from "react";
import SelectRaceScreen from "./screens/SelectRaceScreen";
import BottomTab from "./components/BottomTab";
import { Outlet, Route, Routes } from "react-router-dom";
import PlayScreen from "./screens/PlayScreen";
import HomeScreen from "./screens/HomeScreen";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomeScreen />} />
        <Route path="select" element={<SelectRaceScreen />} />
        <Route path="race/:id" element={<PlayScreen />} />
      </Route>
    </Routes>
  );
}

function Layout() {
  return (
    <div className="relative m-auto h-[100vh] w-full overflow-hidden bg-black sm:max-w-sm">
      <Outlet />
      <BottomTab />
    </div>
  );
}

export default App;
