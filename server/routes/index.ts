import { Router } from 'express';
import { getBootstrapData } from '../controllers/bootstrap.controller.js';
import { authRouter } from './auth.routes.js';
import { leadsRouter } from './leads.routes.js';
import { surveysRouter } from './surveys.routes.js';
import { quotationsRouter } from './quotations.routes.js';
import { customersRouter } from './customers.routes.js';
import { projectsRouter } from './projects.routes.js';
import { financeRouter } from './finance.routes.js';
import { serviceRouter } from './service.routes.js';
import { inventoryRouter } from './inventory.routes.js';
import { usersRouter } from './users.routes.js';
import { auditRouter } from './audit.routes.js';
import { authenticateToken } from '../middleware/auth.js';

import { documentsRouter } from './documents.routes.js';
import { bomRouter } from './bom.routes.js';

export const apiRouter = Router();

// 1. Authentication Endpoints (Public login, authenticated me/logout)
apiRouter.use('/auth', authRouter);

// 2. Initial CRM Bootstrap (Requires Authenticated Session & Returns Scoped Data)
apiRouter.get('/bootstrap', authenticateToken, getBootstrapData);

// 3. Leads Module
apiRouter.use('/leads', leadsRouter);

// 4. Site Surveys Module (Supports both /surveys and /site-surveys)
apiRouter.use('/surveys', surveysRouter);
apiRouter.use('/site-surveys', surveysRouter);

// 5. Quotations & Techno-Commercial Proposals
apiRouter.use('/quotations', quotationsRouter);

// 6. Customer Accounts
apiRouter.use('/customers', customersRouter);

// 7. EPC Solar Projects
apiRouter.use('/projects', projectsRouter);

// 8. Finance & Invoicing
apiRouter.use('/', financeRouter);

// 9. Service & Warranties
apiRouter.use('/', serviceRouter);

// 10. Inventory Warehouse
apiRouter.use('/inventory', inventoryRouter);

// 11. Centralized User Management & Access Control
apiRouter.use('/users', usersRouter);

// 12. Security & Compliance Audit Logs
apiRouter.use('/audit-logs', auditRouter);

// 13. Secure Customer Documents
apiRouter.use('/documents', documentsRouter);

// 14. Project & Survey Bill of Materials (BOM)
apiRouter.use('/boms', bomRouter);

// 15. Procurement & Material Indents
import procurementRouter from './procurement.routes.js';
apiRouter.use('/procurement', procurementRouter);

// 16. Installation Team & Field Workflows
import installationRouter from './installation.routes.js';
apiRouter.use('/installation', installationRouter);

// 17. Persistent Role Notifications
import { notificationsRouter } from './notifications.routes.js';
apiRouter.use('/notifications', notificationsRouter);

// 18. SIM Telephony & Live Call Tracker
import { telephonyRouter } from './telephony.routes.js';
apiRouter.use('/telephony', telephonyRouter);

// 19. PM Surya Ghar & DISCOM Subsidies
import { subsidiesRouter } from './subsidies.routes.js';
apiRouter.use('/subsidies', subsidiesRouter);


