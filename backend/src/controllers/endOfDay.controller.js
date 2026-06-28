import {
  generateEOD,
  listEOD,
  getEODById,
  getTodayEOD,
} from '../services/endOfDay.service.js';
import { success, paginated, error } from '../utils/apiResponse.js';

const errorStatusMap = {
  P2002: 409,
  P2025: 404,
};

const errorMessageMap = {
  P2002: 'End of Day summary already exists for this date',
  P2025: 'End of Day summary not found',
};

export const generate = async (req, res) => {
  try {
    const { openingCash, actualClosingCash, date } = req.body;
    const summary = await generateEOD(openingCash, actualClosingCash, req.user.id, date);
    return success(res, summary, 'End of Day summary generated', 201);
  } catch (err) {
    console.error(err);
    const status = errorStatusMap[err.code] || 500;
    const message = errorMessageMap[err.code] || (status === 500 ? 'Failed to generate EOD summary' : err.message);
    return error(res, message, status);
  }
};

export const list = async (req, res) => {
  try {
    const { page, limit, startDate, endDate } = req.query;
    const { data, total } = await listEOD({
      page: Number(page) || 1,
      limit: Math.min(Number(limit) || 20, 100),
      startDate,
      endDate,
    });
    return paginated(
      res,
      data,
      { total, page: Number(page) || 1, limit: Math.min(Number(limit) || 20, 100) },
      'EOD summaries fetched',
    );
  } catch (err) {
    console.error(err);
    return error(res, 'Failed to fetch EOD summaries');
  }
};

export const getById = async (req, res) => {
  try {
    const summary = await getEODById(Number(req.params.id));
    if (!summary) return error(res, 'EOD summary not found', 404);
    return success(res, summary, 'EOD summary fetched');
  } catch (err) {
    console.error(err);
    const status = errorStatusMap[err.code] || 500;
    const message = errorMessageMap[err.code] || (status === 500 ? 'Failed to fetch EOD summary' : err.message);
    return error(res, message, status);
  }
};

export const today = async (req, res) => {
  try {
    const summary = await getTodayEOD();
    return success(res, { exists: !!summary, summary }, 'Today EOD status');
  } catch (err) {
    console.error(err);
    return error(res, 'Failed to check today EOD status');
  }
};
