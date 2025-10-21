// // utils/localStorage.ts

// /**
//  * Helper functions to manage revenue data in localStorage
//  */

// import { RevenueData } from '../types/revenue';

// // Key used for storing data in localStorage
// const STORAGE_KEY = 'revenue_data';

// /**
//  * Save revenue data to localStorage
//  */
// export const saveRevenueData = (data: RevenueData[]): void => {
//   try {
//     localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
//   } catch (error) {
//     console.error('Error saving revenue data to localStorage:', error);
//   }
// };

// /**
//  * Load revenue data from localStorage
//  */
// export const loadRevenueData = (): RevenueData[] => {
//   try {
//     const data = localStorage.getItem(STORAGE_KEY);
//     return data ? JSON.parse(data) : [];
//   } catch (error) {
//     console.error('Error loading revenue data from localStorage:', error);
//     return [];
//   }
// };

// /**
//  * Add a new revenue record and save to localStorage
//  */
// export const addRevenue = (currentData: RevenueData[], newRevenue: RevenueData): RevenueData[] => {
//   const updatedData = [...currentData, newRevenue];
//   saveRevenueData(updatedData);
//   return updatedData;
// };

// /**
//  * Delete a revenue record and update localStorage
//  */
// export const deleteRevenue = (currentData: RevenueData[], id: number): RevenueData[] => {
//   const updatedData = currentData.filter(item => item.id !== id);
//   saveRevenueData(updatedData);
//   return updatedData;
// };

// /**
//  * Update a revenue record and save to localStorage
//  */
// export const updateRevenue = (currentData: RevenueData[], updatedRecord: RevenueData): RevenueData[] => {
//   const updatedData = currentData.map(item => 
//     item.id === updatedRecord.id ? updatedRecord : item
//   );
//   saveRevenueData(updatedData);
//   return updatedData;
// };
