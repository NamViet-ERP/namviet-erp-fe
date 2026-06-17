import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';

const DummyIcon = () => null;

describe('Sidebar Menu Item Filtering', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('should include warehouse and stocktake items when VITE_ENABLE_WMS is true', async () => {
    vi.stubEnv('VITE_ENABLE_WMS', 'true');
    // Import Sidebar dynamically after stubbing the environment
    const SidebarModule = await import('./Sidebar');
    const Sidebar = SidebarModule.default;

    const menuItems = [
      { id: 'wh', label: 'Kho hang', icon: DummyIcon, path: '/warehouse/list' },
      { id: 'st', label: 'Kiem ke', icon: DummyIcon, path: '/stocktake/list' },
      { id: 'mb', label: 'Nhan vien', icon: DummyIcon, path: '/members/list' }
    ];

    const element = React.createElement(
      MemoryRouter,
      {},
      React.createElement(Sidebar, {
        collapsed: false,
        onToggle: () => {},
        menuItems,
        currentModule: 'warehouse'
      })
    );

    const root = createRoot(container);
    root.render(element);

    // Wait a brief moment for render
    await new Promise((resolve) => setTimeout(resolve, 50));

    const textContent = container.textContent || '';
    expect(textContent).toContain('Kho hang');
    expect(textContent).toContain('Kiem ke');
    expect(textContent).toContain('Nhan vien');
  });

  it('should filter out warehouse and stocktake items when VITE_ENABLE_WMS is false', async () => {
    vi.stubEnv('VITE_ENABLE_WMS', 'false');
    // Import Sidebar dynamically after stubbing the environment
    const SidebarModule = await import('./Sidebar');
    const Sidebar = SidebarModule.default;

    const menuItems = [
      { id: 'wh', label: 'Kho hang', icon: DummyIcon, path: '/warehouse/list' },
      { id: 'st', label: 'Kiem ke', icon: DummyIcon, path: '/stocktake/list' },
      { id: 'mb', label: 'Nhan vien', icon: DummyIcon, path: '/members/list' }
    ];

    const element = React.createElement(
      MemoryRouter,
      {},
      React.createElement(Sidebar, {
        collapsed: false,
        onToggle: () => {},
        menuItems,
        currentModule: 'warehouse'
      })
    );

    const root = createRoot(container);
    root.render(element);

    // Wait a brief moment for render
    await new Promise((resolve) => setTimeout(resolve, 50));

    const textContent = container.textContent || '';
    expect(textContent).not.toContain('Kho hang');
    expect(textContent).not.toContain('Kiem ke');
    expect(textContent).toContain('Nhan vien');
  });
});
