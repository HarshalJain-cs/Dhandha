import MetalRate from '../database/models/MetalRate';
import { Op } from 'sequelize';

export class MetalRateService {
  static async updateMetalRates(rates: any, source: string, userId: number): Promise<any> {
    try {
      const metalRate = await MetalRate.create({
        rate_date: new Date(),
        gold_24k: rates.gold_24k,
        gold_22k: rates.gold_22k,
        gold_18k: rates.gold_18k,
        silver: rates.silver,
        platinum: rates.platinum,
        source: source || 'manual',
        created_by: userId,
      });

      return { success: true, data: metalRate, message: 'Metal rates updated successfully' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  static async getLatestRates(): Promise<any> {
    try {
      const latestRate = await MetalRate.findOne({
        order: [['rate_date', 'DESC']],
      });

      if (!latestRate) {
        return {
          success: true,
          data: {
            gold_24k: 6500,
            gold_22k: 6000,
            gold_18k: 4900,
            silver: 75,
            platinum: 3000,
            rate_date: new Date(),
          },
        };
      }

      return { success: true, data: latestRate };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  static async getHistoricalRates(startDate: string, endDate: string): Promise<any> {
    try {
      const rates = await MetalRate.findAll({
        where: {
          rate_date: {
            [Op.between]: [startDate, endDate],
          },
        },
        order: [['rate_date', 'ASC']],
      });

      return { success: true, data: rates };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  static async getRateChart(metalType: string, days: number = 30): Promise<any> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const rates = await MetalRate.findAll({
        where: {
          rate_date: {
            [Op.gte]: startDate,
          },
        },
        order: [['rate_date', 'ASC']],
      });

      const chartData = rates.map((rate: any) => ({
        date: rate.rate_date,
        rate: rate[metalType],
      }));

      return { success: true, data: chartData };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
}
