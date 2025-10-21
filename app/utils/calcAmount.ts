// This module exports a function to calculate the total amount of items in a list.

export type Item = {
  name: string;
  quantity: string;
  unitPrice: string;
};

export const calcAmount = (items: Item[]): number => {
  return items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    return sum + qty * price;
  }, 0);
};