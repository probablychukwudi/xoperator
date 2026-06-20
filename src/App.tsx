import { Navigate, Route, Routes } from 'react-router-dom'
import { Shell } from './components/layout/Shell'
import { Home } from './pages/Home'
import { Projects } from './pages/Projects'
import { ProjectDetail } from './pages/ProjectDetail'
import { Pipeline } from './pages/Pipeline'
import { OpportunityDetail } from './pages/OpportunityDetail'
import { Network } from './pages/Network'
import { PersonDetail } from './pages/PersonDetail'
import { Docs } from './pages/Docs'
import { DocDetail } from './pages/DocDetail'
import { Calendar } from './pages/Calendar'
import { Capital } from './pages/Capital'
import { Customize } from './pages/Customize'
import { HowItWorks } from './pages/HowItWorks'
import { ErrorBoundary } from './components/ui/ErrorBoundary'

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<Shell />}>
          <Route index element={<Home />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:projectId" element={<ProjectDetail />} />
          <Route path="pipeline" element={<Pipeline />} />
          <Route path="pipeline/:opportunityId" element={<OpportunityDetail />} />
          <Route path="network" element={<Network />} />
          <Route path="network/:personId" element={<PersonDetail />} />
          <Route path="docs" element={<Docs />} />
          <Route path="docs/:docId" element={<DocDetail />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="capital" element={<Capital />} />
          <Route path="customize" element={<Customize />} />
          <Route path="how-it-works" element={<HowItWorks />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  )
}
