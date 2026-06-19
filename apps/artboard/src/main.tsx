import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { LivePreview } from './app/LivePreview';
import { RenderRoute } from './app/RenderRoute';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);

root.render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Live preview iframe — host posts `doc:update` with { html, pageSize }. */}
        <Route path="/" element={<LivePreview />} />
        {/* Headless render target — navigated to by a Puppeteer worker. */}
        <Route path="/render" element={<RenderRoute />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
