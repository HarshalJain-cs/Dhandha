import { ipcMain } from 'electron';
import { MetalRateService } from '../services/metalRateService';

export function setupMetalRateHandlers(): void {
  ipcMain.handle('metalRate:update', async (event, rates, source, userId) => {
    return await MetalRateService.updateMetalRates(rates, source, userId);
  });

  ipcMain.handle('metalRate:getLatest', async () => {
    return await MetalRateService.getLatestRates();
  });

  ipcMain.handle('metalRate:getHistorical', async (event, startDate, endDate) => {
    return await MetalRateService.getHistoricalRates(startDate, endDate);
  });

  ipcMain.handle('metalRate:getChart', async (event, metalType, days) => {
    return await MetalRateService.getRateChart(metalType, days);
  });
}
