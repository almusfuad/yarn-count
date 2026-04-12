/**
 * Version Discovery Routes
 * Endpoints for querying available API versions and their endpoints
 * 
 * GET /api/versions - Get all versions
 * GET /api/versions?module=machines - Get versions for specific module
 * GET /api/versions?module=machines&version=1 - Get details for module@version
 * GET /api/versions?version=1 - Get all endpoints in specific version
 * GET /api/v1/version - Versioned endpoint (same as /api/versions)
 */

import express from 'express';
import * as versionController from './versionController.js';

const router = express.Router();

// Version discovery endpoints
router.get('/', versionController.getVersions);
router.get('/metadata', versionController.getVersionMetadata);

export default router;
