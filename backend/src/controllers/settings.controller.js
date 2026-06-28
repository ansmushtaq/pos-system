import {
  getSettings,
  updateSettings,
  verifyPasscode,
  setPasscode,
  disablePasscode,
  getPasscodesStatus,
} from '../services/settings.service.js';
import { success, error } from '../utils/apiResponse.js';

const errorStatusMap = {
  VALIDATION_ERROR: 400,
};

export const get = async (req, res) => {
  try {
    const settings = await getSettings();
    return success(res, settings, 'Settings fetched');
  } catch (err) {
    console.error(err);
    return error(res, 'Failed to fetch settings');
  }
};

export const update = async (req, res) => {
  try {
    const settings = await updateSettings(req.body);
    return success(res, settings, 'Settings updated');
  } catch (err) {
    console.error(err);
    return error(res, 'Failed to update settings');
  }
};

export const verify = async (req, res) => {
  try {
    const result = await verifyPasscode(req.body.module, req.body.pin, req.user.id);
    return success(res, result, 'Passcode verified');
  } catch (err) {
    console.error(err);
    return error(res, 'Failed to verify passcode');
  }
};

export const set = async (req, res) => {
  try {
    const result = await setPasscode(req.body.module, req.body.pin, req.user.id);
    return success(res, result, 'Passcode set');
  } catch (err) {
    console.error(err);
    const status = errorStatusMap[err.code] || 500;
    const message = status === 500 ? 'Failed to set passcode' : err.message;
    return error(res, message, status);
  }
};

export const disable = async (req, res) => {
  try {
    const result = await disablePasscode(req.params.module, req.user.id);
    return success(res, result, 'Passcode disabled');
  } catch (err) {
    console.error(err);
    const status = errorStatusMap[err.code] || 500;
    const message = status === 500 ? 'Failed to disable passcode' : err.message;
    return error(res, message, status);
  }
};

export const passcodesStatus = async (req, res) => {
  try {
    const passcodes = await getPasscodesStatus();
    return success(res, passcodes, 'Passcodes status fetched');
  } catch (err) {
    console.error(err);
    return error(res, 'Failed to fetch passcodes status');
  }
};
