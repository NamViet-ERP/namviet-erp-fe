/**
 * BR1: Validate hold quantity does not exceed actual stock
 * @param {number} requestedQty - Số lượng cần giữ
 * @param {number} actualStock - Tồn kho thực tế
 * @returns {{ valid: boolean, message: string }}
 */
export function validateHold(requestedQty, actualStock) {
  if (requestedQty > actualStock) {
    return {
      valid: false,
      message: `Số lượng giữ (${requestedQty}) vượt quá tồn kho thực tế (${actualStock})`,
    };
  }
  return { valid: true, message: '' };
}

/**
 * BR2: Validate conversion/transfer quantity does not exceed source stock
 * @param {number} transferQty - Số lượng chuyển
 * @param {number} sourceStock - Tồn hiện tại kho nguồn
 * @returns {{ valid: boolean, message: string }}
 */
export function validateTransferQty(transferQty, sourceStock) {
  if (transferQty > sourceStock) {
    return {
      valid: false,
      message: `Số lượng chuyển (${transferQty}) vượt quá tồn kho nguồn (${sourceStock})`,
    };
  }
  if (transferQty <= 0) {
    return {
      valid: false,
      message: 'Số lượng chuyển phải lớn hơn 0',
    };
  }
  return { valid: true, message: '' };
}

/**
 * BR3: Process export — deduct from both held and actual stock
 * @param {{ actual: number, held: number, available: number }} stock
 * @param {number} exportQty
 * @returns {{ actual: number, held: number, available: number }}
 */
export function processExport(stock, exportQty) {
  return {
    actual: stock.actual - exportQty,
    held: stock.held - exportQty,
    available: (stock.actual - exportQty) - (stock.held - exportQty),
  };
}

/**
 * BR4: Cancel order — release held stock back to available
 * @param {{ actual: number, held: number, available: number }} stock
 * @param {number} heldQty
 * @returns {{ actual: number, held: number, available: number }}
 */
export function cancelOrder(stock, heldQty) {
  return {
    actual: stock.actual,
    held: stock.held - heldQty,
    available: stock.available + heldQty,
  };
}

/**
 * Validate freeze — check if SKU can be frozen for stocktake
 * @param {boolean} isFrozen
 * @returns {{ valid: boolean, message: string }}
 */
export function validateFreeze(isFrozen) {
  if (isFrozen) {
    return {
      valid: false,
      message: 'SKU đang bị đóng băng kiểm kê. Không thể nhập/xuất/giữ hàng.',
    };
  }
  return { valid: true, message: '' };
}
