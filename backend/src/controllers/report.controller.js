import { getSalesSummary, getTopProducts, getProfitBySeller, getStockValuation } from '../services/report.service.js';
import { success, error } from '../utils/apiResponse.js';

export const salesSummary = async (req, res) => {
  try {
    const summary = await getSalesSummary(req.query);
    return success(res, summary, 'Sales summary fetched');
  } catch (err) {
    console.error('salesSummary error:', err);
    return error(res, 'Failed to fetch sales summary');
  }
};

export const topProducts = async (req, res) => {
  try {
    const products = await getTopProducts(req.query);
    return success(res, products, 'Top products fetched');
  } catch (err) {
    console.error('topProducts error:', err);
    return error(res, 'Failed to fetch top products');
  }
};

export const profitBySeller = async (req, res) => {
  try {
    const sellers = await getProfitBySeller(req.query);
    return success(res, sellers, 'Profit by seller fetched');
  } catch (err) {
    console.error('profitBySeller error:', err);
    return error(res, 'Failed to fetch profit by seller');
  }
};

export const stockValuation = async (req, res) => {
  try {
    const data = await getStockValuation();
    return success(res, data, 'Stock valuation fetched');
  } catch (err) {
    console.error('stockValuation error:', err);
    return error(res, 'Failed to fetch stock valuation');
  }
};
