import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { VehicleProvider } from "./components/VehicleContext";
import { UserProvider } from "./components/UserContext";
import { QueueProvider } from "./components/QueueContext";
import Form from "./pages/Form";
import Admin from "./pages/Admin";

import "./styles/App.css";

const App: React.FC = () => {
  return (
    <Router>
      <VehicleProvider>
        <UserProvider>
          <QueueProvider>
          <Routes>
            <Route path="/" element={<Form />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
          </QueueProvider>
        </UserProvider>
      </VehicleProvider>
    </Router>
  )
};

export default App;
