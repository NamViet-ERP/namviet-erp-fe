import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from './Sidebar';

const DummyIcon = () => null;

describe('Sidebar menu items', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('renders all provided menu items including warehouse and stocktake', async () => {
    const menuItems = [
      { id: 'wh', label: 'Kho hang', icon: DummyIcon, path: '/warehouse/projects' },
      { id: 'st', label: 'Kiem ke', icon: DummyIcon, path: '/stocktake/list' },
      { id: 'mb', label: 'Nhan vien', icon: DummyIcon, path: '/members/list' },
    ];

    const element = React.createElement(
      MemoryRouter,
      {},
      React.createElement(Sidebar, {
        collapsed: false,
        onToggle: () => {},
        menuItems,
        permissions: ['wms.projects.view:all'],
        currentModule: 'warehouse',
      }),
    );

    const root = createRoot(container);
    root.render(element);

    await new Promise((resolve) => setTimeout(resolve, 50));

    const textContent = container.textContent || '';
    expect(textContent).toContain('Kho hang');
    expect(textContent).toContain('Kiem ke');
    expect(textContent).toContain('Nhan vien');
  });
});
