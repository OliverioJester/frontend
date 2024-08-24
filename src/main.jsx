import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Router from './routes/Router';
import { RouterProvider } from "react-router-dom";
import './index.css'
import './App.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
     <RouterProvider router={Router} />
  </StrictMode>
)
