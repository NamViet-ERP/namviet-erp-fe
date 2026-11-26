import { describe, it, expect } from 'vitest';
import type { ProjectPurchasingProgressApiDto } from '../../../types/wms';
import {
  buildOrderNode,
  buildTree,
  collectDates,
  dayTicks,
  daysBetween,
  flattenVisible,
  isOpen,
  kindLabel,
  monthTicks,
  parseYmd,
  PX_PER_DAY,
  titleHasKindPrefix,
} from './purchasingGanttModel';

const sampleProgressGroups: ProjectPurchasingProgressApiDto[] = [
  {
    projectCode: 'DA-RM2-01',
    projectName: 'Trạm trộn bê tông Cầu Rạch Miễu 2',
    plannedStart: '2026-10-01',
    plannedEnd: '2026-12-30',
    actualEnd: null,
    status: 'in_progress',
    percentComplete: 60,
    plans: [
      {
        planCode: 'KHMH-2026-001',
        kind: 'plan',
        planStatus: 'approved',
        plannedStart: '2026-10-02',
        plannedEnd: '2026-11-20',
        actualEnd: null,
        status: 'in_progress',
        percentComplete: 60,
        ordered: 100,
        received: 60,
        orders: [
          {
            poCode: 'PO-2026-015',
            planCode: 'KHMH-2026-001',
            supplierName: 'Công ty CP Thép Hòa Phát Dung Quất',
            plannedStart: '2026-10-05',
            plannedEnd: '2026-11-18',
            actualEnd: '2026-10-28',
            deliveryStatus: 'partial',
            status: 'in_progress',
            percentComplete: 60,
            ordered: 100,
            received: 60,
            lines: [
              {
                id: 1,
                sku: 'VT-THEP-D16',
                name: 'Thép thanh vằn D16 CB400-V',
                plannedStart: '2026-10-05',
                plannedEnd: '2026-11-18',
                actualEnd: '2026-10-28',
                status: 'completed',
                percentComplete: 100,
                ordered: 60,
                received: 60,
              },
              {
                id: 2,
                sku: 'VT-XIMANG-PCB40',
                name: 'Xi măng Hà Tiên PCB40',
                plannedStart: '2026-10-05',
                plannedEnd: '2026-11-18',
                actualEnd: null,
                status: 'planned',
                percentComplete: 0,
                ordered: 40,
                received: 0,
              },
            ],
            receipts: [
              {
                ticketCode: 'NK-2026-042',
                status: 'approved',
                date: '2026-10-28',
                quantity: 60,
                lines: [
                  {
                    sku: 'VT-THEP-D16',
                    name: 'Thép thanh vằn D16 CB400-V',
                    quantity: 60,
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        planCode: 'MHPS-2026-002',
        kind: 'adhoc',
        planStatus: 'approved',
        plannedStart: '2026-10-10',
        plannedEnd: '2026-11-10',
        actualEnd: null,
        status: 'planned',
        percentComplete: 0,
        ordered: 10,
        received: 0,
        orders: [],
      },
    ],
    orders: [
      {
        poCode: 'PO-2026-015',
        planCode: 'KHMH-2026-001',
        supplierName: 'Công ty CP Thép Hòa Phát Dung Quất',
        plannedStart: '2026-10-05',
        plannedEnd: '2026-11-18',
        actualEnd: '2026-10-28',
        deliveryStatus: 'partial',
        status: 'in_progress',
        percentComplete: 60,
        ordered: 100,
        received: 60,
        lines: [],
        receipts: [],
      },
      {
        poCode: 'PO-2026-099',
        planCode: '',
        supplierName: 'Công ty TNHH Thiết bị Công nghiệp Nam Việt',
        plannedStart: '2026-10-15',
        plannedEnd: '2026-11-25',
        actualEnd: null,
        deliveryStatus: 'none',
        status: 'planned',
        percentComplete: 0,
        ordered: 20,
        received: 0,
        lines: [],
        receipts: [],
      },
    ],
  },
];

describe('purchasingGanttModel', () => {
  it('parses ISO and dd/MM/yyyy dates and computes day deltas accurately', () => {
    const iso = parseYmd('2026-10-28');
    expect(iso.getFullYear()).toBe(2026);
    expect(iso.getMonth()).toBe(9);
    expect(iso.getDate()).toBe(28);

    const vi = parseYmd('05/11/2026');
    expect(vi.getFullYear()).toBe(2026);
    expect(vi.getMonth()).toBe(10);
    expect(vi.getDate()).toBe(5);

    expect(daysBetween('2026-10-01', '2026-10-11')).toBe(10);
    expect(daysBetween('2026-10-11', '2026-10-01')).toBe(-10);
  });

  it('derives kind labels and detects existing code prefixes cleanly', () => {
    expect(kindLabel('project')).toBe('Dự án');
    expect(kindLabel('plan', 'KHMH-2026-001')).toBe('KHMH');
    expect(kindLabel('plan', 'MHPS-2026-002')).toBe('MHPS');
    expect(kindLabel('po')).toBe('PO');
    expect(kindLabel('nk')).toBe('NK');
    expect(kindLabel('line')).toBe('VT');

    expect(titleHasKindPrefix('po', 'PO-2026-015')).toBe(true);
    expect(titleHasKindPrefix('nk', 'NK-2026-042')).toBe(true);
    expect(titleHasKindPrefix('plan', 'MHPS-2026-002')).toBe(true);
    expect(titleHasKindPrefix('line', 'Thép thanh vằn D16 CB400-V')).toBe(false);
  });

  it('builds PO nodes separating receipt-covered SKUs from leftover PO lines', () => {
    const order = sampleProgressGroups[0].plans![0].orders[0];
    const poNode = buildOrderNode('DA-RM2-01', order, {});

    expect(poNode.expandable).toBe(true);
    expect(poNode.defaultOpen).toBe(true);
    expect(poNode.children).toHaveLength(2);

    const nkNode = poNode.children[0];
    expect(nkNode.kind).toBe('nk');
    expect(nkNode.title).toBe('NK-2026-042');
    expect(nkNode.children).toHaveLength(1);
    expect(nkNode.children[0].subtitle).toBe('VT-THEP-D16');

    const leftoverNode = poNode.children[1];
    expect(leftoverNode.kind).toBe('line');
    expect(leftoverNode.subtitle).toBe('VT-XIMANG-PCB40');
  });

  it('builds hierarchical tree with plans, orphan orders, toggle states, and flattens visible rows', () => {
    const tree = buildTree(sampleProgressGroups, {});
    expect(tree).toHaveLength(1);

    const projectNode = tree[0];
    expect(projectNode.id).toBe('DA-RM2-01');
    expect(projectNode.ordered).toBe(120);
    expect(projectNode.received).toBe(60);
    // 2 plans + 1 orphan PO
    expect(projectNode.children).toHaveLength(3);
    expect(projectNode.children[0].title).toBe('KHMH-2026-001');
    expect(projectNode.children[1].title).toBe('MHPS-2026-002');
    expect(projectNode.children[1].subtitle).toBe('Mua hàng phát sinh');
    expect(projectNode.children[2].title).toBe('PO-2026-099');

    const flatDefault = flattenVisible(tree);
    expect(flatDefault.map(n => n.id)).toContain('DA-RM2-01:PO-2026-015:nk:NK-2026-042');

    expect(isOpen({ 'DA-RM2-01': false }, 'DA-RM2-01', true)).toBe(false);
    const collapsedTree = buildTree(sampleProgressGroups, { 'DA-RM2-01': false });
    expect(collapsedTree[0].children).toEqual([]);
    expect(flattenVisible(collapsedTree)).toHaveLength(1);
  });

  it('collects all relevant timeline dates and generates month/day ticks', () => {
    const dates = collectDates(sampleProgressGroups, '2026-11-01');
    expect(dates).toContain('2026-11-01');
    expect(dates).toContain('2026-10-01');
    expect(dates).toContain('2026-12-30');
    expect(dates).toContain('2026-10-28');

    const months = monthTicks('2026-10-29', 6);
    expect(months).toEqual([
      { x: 0, label: 'T10/26' },
      { x: 3 * PX_PER_DAY, label: 'T11/26' },
    ]);

    const days = dayTicks('2026-10-30', 4);
    expect(days).toEqual([
      { x: 0, label: '30' },
      { x: PX_PER_DAY, label: '31' },
      { x: 2 * PX_PER_DAY, label: '1' },
      { x: 3 * PX_PER_DAY, label: '2' },
    ]);
  });
});
