import type { StatusKey } from '../../types';

/** Map BE ProjectStatus string → badge token for list/detail UI. */
export function projectStatusBadge(status: string): StatusKey {
  switch (status) {
    case 'Closed':
      return 'completed';
    case 'Transferring':
      return 'pending';
    case 'Transferred':
      return 'exported';
    default:
      return 'active';
  }
}
