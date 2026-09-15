import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { MotionConfig } from 'framer-motion'
import './index.css'
import App from './App'

const Page = new URLSearchParams(location.search).has('showroom')
  ? lazy(() => import('./components/VehicleShowroom')) : App

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user"><Suspense fallback={<div className="scene-loading">正在准备车辆…</div>}><Page /></Suspense></MotionConfig>
  </StrictMode>,
)
