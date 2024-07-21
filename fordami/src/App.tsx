import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { VehicleProvider } from "./components/VehicleContext";
import Form from "./pages/Form";
import Admin from "./pages/Admin";

import "./styles/App.css";
import { UserProvider } from "./components/UserContext";

const App: React.FC = () => {
  return (
    <Router>
      <VehicleProvider>
        <UserProvider>
          <Routes>
            <Route path="/" element={<Form />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </UserProvider>
      </VehicleProvider>
    </Router>
  );
};

export default App;
