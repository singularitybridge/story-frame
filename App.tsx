/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { BrowserRouter, Routes, Route, useParams, useNavigate } from 'react-router-dom';
import SceneManager from './components/SceneManager';
import CharacterReferenceGenerator from './components/CharacterReferenceGenerator';
import ProjectList from './components/ProjectList';

// Wrapper component for SceneManager to extract projectId from URL
const ProjectPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  if (!projectId) {
    return <div className="h-screen bg-gray-950 flex items-center justify-center text-white">
      Invalid project ID
    </div>;
  }

  return (
    <SceneManager
      projectId={projectId}
      onNavigateToCharacterRefs={() => navigate(`/projects/${projectId}/characters`)}
    />
  );
};

// Wrapper component for CharacterReferenceGenerator per project
const CharacterReferencePage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();

  if (!projectId) {
    return <div className="h-screen bg-gray-950 flex items-center justify-center text-white">
      Invalid project ID
    </div>;
  }

  return <CharacterReferenceGenerator projectId={projectId} />;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProjectList />} />
        <Route path="/projects/:projectId" element={<ProjectPage />} />
        <Route path="/projects/:projectId/characters" element={<CharacterReferencePage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
