import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { db } from './db/index';
import * as schema from './db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = process.env.VITE_SUPABASE_URL ? createClient(supabaseUrl, supabaseKey) : null;

const app = express();
const port = parseInt(process.env.PORT || '3001', 10);

console.log('--- Server Initializing ---');
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Database URL configured:', process.env.DATABASE_URL ? 'Yes (hidden)' : 'No');
console.log('Supabase JWT Secret configured:', process.env.SUPABASE_JWT_SECRET ? 'Yes (hidden)' : 'No');

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// --- 1. GLOBAL AUTHENTICATION MIDDLEWARE ---
// Validates Supabase JWT and resolves the app user
const requireAdminOrOwnerRole = async (req: any, res: any, next: any) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

        if (token && process.env.SUPABASE_JWT_SECRET) {
            try {
                // Verify and decode the Supabase JWT
                const decoded: any = jwt.verify(token, process.env.SUPABASE_JWT_SECRET);
                const email = decoded.email;

                if (email) {
                    try {
                        // Find the app user by email (with timeout protection)
                        const appUser = await db.query.users.findFirst({
                            where: eq(schema.users.email, email),
                            with: { userRoles: { with: { role: true } } }
                        });

                        if (appUser) {
                            req.user = {
                                id: appUser.id,
                                email: appUser.email,
                                isAdmin: true, // Role-based logic can be added here
                                supabaseId: decoded.sub,
                            };
                            return next();
                        }
                    } catch (dbError) {
                        console.warn('DB lookup by email failed:', (dbError as Error).message);
                        // Fall through to default user
                    }
                }
            } catch (jwtError) {
                console.warn('JWT verification failed:', (jwtError as Error).message);
                // Fall through to default user
            }
        }

        // Fallback: use the first available user (development/migration mode)
        try {
            const defaultUser = await db.query.users.findFirst({
                with: { userRoles: { with: { role: true } } }
            });
            req.user = defaultUser
                ? { id: defaultUser.id, email: defaultUser.email, isAdmin: true }
                : { id: 0, isAdmin: false };
        } catch (dbError) {
            console.warn('DB fallback user lookup failed, using anonymous user:', (dbError as Error).message);
            req.user = { id: 0, isAdmin: false };
        }
        return next();

    } catch (e) {
        console.error('Security Middleware Error:', e);
        return res.status(500).json({ error: 'Error verificando autorización y roles' });
    }
};


app.use('/api', requireAdminOrOwnerRole);

// Helper for error handling
const handleError = (res: any, error: any) => {
    console.error('Error details:', error);
    if (error.stack) console.error('Stack trace:', error.stack);
    res.status(500).json({
        error: (error as Error).message,
        details: error
    });
};

// --- AUDIT LOGGING HELPER ---
const logAudit = async (userId: number | null, userName: string | null, action: string, entityType: string, entityId: number, details?: any) => {
    try {
        await db.insert(schema.auditLogs).values({
            userId,
            userName,
            action,
            entityType,
            entityId,
            details: details ? JSON.stringify(details) : null
        });
    } catch (error) {
        console.error('Audit logging failed:', error);
    }
};

// --- USERS & ROLES ---
app.get('/api/users', async (req, res) => {
    try {
        const data = await db.query.users.findMany({
            with: { userRoles: true }
        });
        res.json(data);
    } catch (error) { handleError(res, error); }
});

app.post('/api/users', async (req, res) => {
    try {
        const newUser = await db.insert(schema.users).values(req.body).returning();
        res.json(newUser[0]);
    } catch (error) { handleError(res, error); }
});

app.put('/api/users/:id', async (req, res) => {
    try {
        const { id, createdAt, roleIds, ...rest } = req.body;
        const cleaned = cleanData(rest);
        const [updated] = await db.update(schema.users)
            .set(cleaned)
            .where(eq(schema.users.id, parseInt(req.params.id)))
            .returning();

        if (roleIds) {
            // Update user roles
            await db.delete(schema.userRoles).where(eq(schema.userRoles.userId, parseInt(req.params.id)));
            const rolesToInsert = roleIds.map((roleId: number) => ({
                userId: parseInt(req.params.id),
                roleId: roleId
            }));
            await db.insert(schema.userRoles).values(rolesToInsert);
        }

        res.json(updated);
    } catch (error) { handleError(res, error); }
});

app.delete('/api/users/:id', async (req, res) => {
    try {
        await db.delete(schema.users).where(eq(schema.users.id, parseInt(req.params.id)));
        res.json({ success: true });
    } catch (error) { handleError(res, error); }
});

// Roles
app.get('/api/roles', async (req, res) => {
    try {
        const data = await db.query.roles.findMany();
        res.json(data);
    } catch (error) { handleError(res, error); }
});

app.post('/api/roles', async (req, res) => {
    try {
        const cleaned = cleanData(req.body);
        const [newRole] = await db.insert(schema.roles).values(cleaned).returning();
        res.json(newRole);
    } catch (error) { handleError(res, error); }
});

app.put('/api/roles/:id', async (req, res) => {
    try {
        const { id, ...rest } = req.body;
        const cleaned = cleanData(rest);
        const [updated] = await db.update(schema.roles)
            .set(cleaned)
            .where(eq(schema.roles.id, parseInt(req.params.id)))
            .returning();
        res.json(updated);
    } catch (error) { handleError(res, error); }
});

app.delete('/api/roles/:id', async (req, res) => {
    try {
        await db.delete(schema.roles).where(eq(schema.roles.id, parseInt(req.params.id)));
        res.json({ success: true });
    } catch (error) { handleError(res, error); }
});

// --- PROJECTS & PROSPECTS ---
app.get('/api/projects', async (req, res) => {
    try {
        const data = await db.query.projects.findMany({
            orderBy: [desc(schema.projects.createdAt)]
        });
        res.json(data);
    } catch (error) { handleError(res, error); }
});

app.post('/api/projects', async (req, res) => {
    try {
        const cleaned = cleanData(req.body);
        const [newProject] = await db.insert(schema.projects).values(cleaned).returning();
        res.json(newProject);
    } catch (error) { handleError(res, error); }
});

app.get('/api/accounts-receivable', async (req, res) => {
    try {
        const data = await db.query.accountsReceivable.findMany();
        res.json(data);
    } catch (error) { handleError(res, error); }
});

app.post('/api/accounts-receivable', async (req, res) => {
    try {
        const cleaned = cleanData(req.body);
        const [newAR] = await db.insert(schema.accountsReceivable).values(cleaned).returning();
        res.json(newAR);
    } catch (error) { handleError(res, error); }
});

app.put('/api/accounts-receivable/:id', async (req, res) => {
    try {
        const { id, ...rest } = req.body;
        const cleaned = cleanData(rest);
        const [updated] = await db.update(schema.accountsReceivable)
            .set(cleaned)
            .where(eq(schema.accountsReceivable.id, parseInt(req.params.id)))
            .returning();
        res.json(updated);
    } catch (error) { handleError(res, error); }
});



const cleanData = (data: any) => {
    const cleaned = { ...data };
    Object.keys(cleaned).forEach(key => {
        const value = cleaned[key];
        if (value === '' || (typeof value === 'string' && value.trim() === '')) {
            cleaned[key] = null;
        }
    });
    return cleaned;
};

app.get('/api/prospects', async (req, res) => {
    try {
        const data = await db.query.prospects.findMany({
            orderBy: [desc(schema.prospects.createdAt)]
        });
        res.json(data);
    } catch (error) { handleError(res, error); }
});

// Check for duplicate prospect by name (for automated creation)
app.get('/api/prospects/check-duplicate', async (req, res) => {
    try {
        const name = req.query.name as string;
        if (!name) return res.json({ exists: false });
        const existing = await db.select().from(schema.prospects)
            .where(eq(schema.prospects.name, name))
            .limit(1);
        res.json({ exists: existing.length > 0, prospect: existing[0] || null });
    } catch (error) { handleError(res, error); }
});

app.post('/api/prospects', async (req, res) => {
    try {
        const { id: _frontendId, ...body } = req.body;
        // WHITELIST valid fields for prospects table
        const safeData: any = {
            name: body.name,
            company: body.company || null,
            phone: body.phone || null,
            email: body.email || null,
            nextFollowUpDate: body.nextFollowUpDate || null,
            birthday: body.birthday || null,
            spouseName: body.spouseName || null,
            children: body.children || null,
            hobbies: body.hobbies || null,
            followUps: body.followUps || [],
            source: body.source || 'Manual',
            sourceBonoId: body.sourceBonoId || null,
        };
        const [newProspect] = await db.insert(schema.prospects).values(cleanData(safeData)).returning();
        res.json(newProspect);
    } catch (error) {
        handleError(res, error);
    }
});

app.put('/api/prospects/:id', async (req, res) => {
    try {
        const { id, createdAt, ...rest } = req.body;
        const cleanedBody = cleanData(rest);
        const [updated] = await db.update(schema.prospects)
            .set(cleanedBody)
            .where(eq(schema.prospects.id, parseInt(req.params.id)))
            .returning();
        res.json(updated);
    } catch (error) { handleError(res, error); }
});

app.delete('/api/prospects/:id', async (req, res) => {
    try {
        await db.delete(schema.prospects).where(eq(schema.prospects.id, parseInt(req.params.id)));
        res.json({ success: true });
    } catch (error) { handleError(res, error); }
});

// --- SUPPLIERS ---
app.get('/api/suppliers', async (req, res) => {
    try {
        const data = await db.query.suppliers.findMany({
            orderBy: [desc(schema.suppliers.id)]
        });
        res.json(data);
    } catch (error) { handleError(res, error); }
});

app.post('/api/suppliers', async (req, res) => {
    try {
        console.log('POST /api/suppliers - Received:', req.body);
        const { id: _frontendId, ...supplierData } = req.body;
        const cleaned = cleanData(supplierData);
        console.log('POST /api/suppliers - Cleaned:', cleaned);
        const [newSupplier] = await db.insert(schema.suppliers).values(cleaned).returning();
        console.log('POST /api/suppliers - Created:', newSupplier);
        res.json(newSupplier);
    } catch (error) { handleError(res, error); }
});

app.put('/api/suppliers/:id', async (req, res) => {
    try {
        const { id, ...rest } = req.body;
        const cleaned = cleanData(rest);
        const [updated] = await db.update(schema.suppliers)
            .set(cleaned)
            .where(eq(schema.suppliers.id, parseInt(req.params.id)))
            .returning();
        res.json(updated);
    } catch (error) { handleError(res, error); }
});

app.delete('/api/suppliers/:id', async (req, res) => {
    try {
        await db.delete(schema.suppliers).where(eq(schema.suppliers.id, parseInt(req.params.id)));
        res.json({ success: true });
    } catch (error) { handleError(res, error); }
});

// --- PURCHASING (Service Requests, Quote Responses & Purchase Orders) ---
app.get('/api/service-requests', async (req, res) => {
    try {
        const data = await db.query.serviceRequests.findMany({
            with: { items: true, quoteResponses: { with: { items: true } } },
            orderBy: [desc(schema.serviceRequests.createdAt)]
        });
        res.json(data);
    } catch (error) { handleError(res, error); }
});

// --- PDF GENERATION ---
app.post('/api/service-requests/:id/pdf', async (req, res) => {
    try {
        const requestId = parseInt(req.params.id);
        const { companyInfo } = req.body;

        const request = await db.query.serviceRequests.findFirst({
            where: eq(schema.serviceRequests.id, requestId),
            with: { items: true }
        });

        if (!request) return res.status(404).json({ error: 'Requisición no encontrada' });

        if (!supabase) {
             throw new Error('Supabase Client no inicializado. Faltan variables de entorno.');
        }

        const dateStr = request.requestDate ? new Date(request.requestDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A';
        const project = request.projectName || 'Sin proyecto';
        const itemsRows = request.items && request.items.length > 0 ? request.items.map((item, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${item.name || ''}</td>
                <td>${item.unit || ''}</td>
                <td>${item.quantity != null ? Number(item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/,/g, '\u202F').replace(/\./g, ',') : 0}</td>
            </tr>
        `).join('') : '<tr><td colspan="4" style="text-align: center; color: #666; font-style: italic; padding: 20px;">No hay artículos en esta solicitud</td></tr>';

        const logoHtml = companyInfo?.logoBase64 
             ? `<img src="${companyInfo.logoBase64}" class="logo" />` 
             : '<div style="font-size: 24px; font-weight: 800; color: #3b82f6;">FlowERP</div>';
        
        const addressHtml = companyInfo?.address ? companyInfo.address.replace(/\\n/g, '<br/>') : '';

        // HTML Content faithful to MS Ingenieria design
        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Solicitud de Cotización #${request.id}</title>
            <style>
                body { 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; 
                    padding: 40px; 
                    color: #1e293b; 
                    background-color: white;
                    -webkit-font-smoothing: antialiased;
                }
                .header { 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: flex-end; 
                    margin-bottom: 20px; 
                    padding-bottom: 20px; 
                    border-bottom: 2px solid #e2e8f0; 
                }
                .logo { max-width: 240px; max-height: 80px; object-fit: contain; }
                .title { font-size: 28px; font-weight: 800; text-align: right; color: #0f172a; margin: 0; padding-bottom: 5px; }
                
                .info-section { 
                    display: flex; 
                    justify-content: space-between; 
                    margin-top: 30px;
                    margin-bottom: 40px; 
                    font-size: 14px; 
                    line-height: 1.6;
                }
                .info-left, .info-right { width: 48%; }
                .info-label { font-weight: 700; color: #000; margin-bottom: 4px; font-size: 14px;}
                
                table.details { border-collapse: collapse; width: 100%; }
                table.details td { border: none; padding: 3px 0; text-align: right; }
                table.details td:first-child { font-weight: 700; color: #000; padding-right: 15px; width: 40%;}
                table.details td:last-child { color: #334155; }
                
                table.items { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin-bottom: 50px; 
                    font-size: 14px; 
                    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                    border: 1px solid #e2e8f0;
                }
                table.items th { 
                    background-color: #3b82f6; 
                    color: white; 
                    padding: 12px 16px; 
                    text-align: left; 
                    font-weight: 600;
                    font-size: 14px;
                }
                table.items td { 
                    padding: 12px 16px; 
                    border-bottom: 1px solid #e2e8f0; 
                    color: #475569;
                }
                table.items tr:last-child td { border-bottom: none; }
                table.items tr:nth-child(even) { background-color: #f8fafc; }
                
                .notes { 
                    font-size: 11px; 
                    margin-top: auto; 
                    color: #334155;
                    line-height: 1.5;
                }
                .notes-title { 
                    font-weight: 700; 
                    margin-bottom: 15px; 
                    font-size: 14px; 
                    color: #0f172a;
                }
                .notes ul { 
                    padding-left: 24px; 
                    margin: 0;
                }
                .notes li { 
                    margin-bottom: 8px; 
                    position: relative;
                    text-transform: uppercase;
                }
                .notes li::marker { color: #64748b; }
            </style>
        </head>
        <body>
            <div class="header">
                ${logoHtml}
                <div class="title">Solicitud de Cotización</div>
            </div>

            <div class="info-section">
                <div class="info-left">
                    <div class="info-label">Para:</div>
                    <div style="color: #334155;">${companyInfo?.name || 'MS Ingeniería'}</div>
                    <div style="color: #334155; margin-top: 5px;">${addressHtml}</div>
                    <div style="color: #334155; margin-top: 5px;">Email: ${companyInfo?.email || ''}</div>
                </div>
                <div class="info-right">
                    <table class="details">
                        <tr><td>ID Solicitud:</td><td>#${request.id}</td></tr>
                        <tr><td>Fecha:</td><td>${dateStr}</td></tr>
                        <tr><td>Proyecto:</td><td>${project}</td></tr>
                    </table>
                </div>
            </div>

            <table class="items">
                <thead>
                    <tr>
                        <th style="width: 8%">#</th>
                        <th style="width: 45%">Nombre del Artículo</th>
                        <th style="width: 22%">Unidad</th>
                        <th style="width: 25%">Cantidad</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsRows}
                </tbody>
            </table>

            <div class="notes">
                <div class="notes-title">Notas y Consideraciones:</div>
                <ul style="list-style-type: disc;">
                    <li>LOS PAGOS CORRESPONDIENTES A LA GESTION DE COMPRAS SE REALIZARAN UNICAMENTE LOS VIERNES.</li>
                    <li>LOS PRECIOS INDICADOS POR LOS PROVEEDORES SERAN ANALIZADOS Y COMPARADOS CON LAS PROPUESTAS DE POR LO MENOS DOS PROVEEDORES MAS.</li>
                    <li>SE LE RECUERDA AL PROVEEDOR QUE NO SE DEBE DESPACHAR NINGUN MATERIAL SI NO SE REALIZA EL PAGO O SE ENVIA UNA ORDEN DE COMPRA FIRMADA.</li>
                </ul>
            </div>
        </body>
        </html>
        `;

        // Generate PDF using Puppeteer
        const browser = await puppeteer.launch({ 
            headless: true, 
             args: [
                 '--no-sandbox', 
                 '--disable-setuid-sandbox',
                 '--disable-dev-shm-usage',
                 '--disable-gpu'
             ] 
        });
        const page = await browser.newPage();
        
        // Emulate print media type to ensure CSS variables/fonts render correctly for print
        await page.emulateMediaType('print');
        await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });
        
        const pdfBuffer = await page.pdf({ 
            format: 'A4', 
            margin: { top: '0px', bottom: '0px', left: '0px', right: '0px' }, 
            printBackground: true 
        });
        await browser.close();

        // Devolver PDF como base64 data URL (sin depender de Supabase Storage)
        const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');
        const dataUrl = `data:application/pdf;base64,${pdfBase64}`;
        
        res.json({ url: dataUrl });

    } catch (error: any) {
        console.error('Error endpoint generating PDF:', error);
        res.status(500).json({ error: 'Error interno generando documento PDF: ' + error?.message });
    }
});

app.post('/api/service-requests', async (req, res) => {
    try {
        const { items, id: _frontendId, ...requestData } = req.body;

        const fullRequest = await db.transaction(async (tx) => {
            // WHITELIST only valid fields for service_requests table
            const safeRequestData: any = {
                projectId: requestData.projectId || null,
                projectName: requestData.projectName,
                requestDate: requestData.requestDate,
                requester: requestData.requester,
                requesterId: requestData.requesterId || null,
                requiredDate: requestData.requiredDate || null,
                status: requestData.status || 'Pendiente Aprobación Director',
                finalJustification: requestData.finalJustification || null,
                overrunJustification: requestData.overrunJustification || null,
                isWarranty: requestData.isWarranty ?? false,
                isPreOp: requestData.isPreOp ?? false,
                prospectId: requestData.prospectId || null,
                rejectionHistory: requestData.rejectionHistory || [],
                winnerSelection: requestData.winnerSelection || {},
            };

            const [newRequest] = await tx.insert(schema.serviceRequests).values(cleanData(safeRequestData)).returning();

            if (!newRequest) throw new Error("Validation Error: No se pudo crear la requisición.");

            if (items && items.length > 0) {
                const safeItems = items.map((item: any) => {
                    // WHITELIST only valid fields for service_request_items table
                    return cleanData({
                        serviceRequestId: newRequest.id,
                        name: item.name,
                        quantity: item.quantity ?? 0,
                        unit: item.unit || 'unidad',
                        specifications: item.specifications || null,
                        isUnforeseen: item.isUnforeseen ?? false,
                        unforeseenJustification: item.unforeseenJustification || null,
                        estimatedUnitCost: item.estimatedUnitCost ?? null,
                    });
                });
                await tx.insert(schema.serviceRequestItems).values(safeItems);
            }

            return await tx.query.serviceRequests.findFirst({
                where: eq(schema.serviceRequests.id, newRequest.id),
                with: { items: true, quoteResponses: { with: { items: true } } }
            });
        });

        res.json(fullRequest);
    } catch (error) {
        console.error('Data Process Aborted (Rollbacked). Error in POST /api/service-requests:', error);
        handleError(res, error);
    }
});

app.put('/api/service-requests/:id', async (req, res) => {
    try {
        const requestId = parseInt(req.params.id);

        // --- VALIDACIÓN DE CONTEXTO (Propiedad y Seguridad) ---
        if ((req as any).user && !(req as any).user.isAdmin) {
            const [existingRecord] = await db.select().from(schema.serviceRequests).where(eq(schema.serviceRequests.id, requestId));
            if (!existingRecord) return res.status(404).json({ error: 'Registro no encontrado' });

            // Verificamos si es el dueño
            if (existingRecord.requesterId !== (req as any).user.id) {
                return res.status(403).json({ error: 'Violación de Seguridad: No tienes permisos para editar una requisición creada por otro usuario.' });
            }
        }
        // -----------------------------------------------------

        const { currentStatus, ...updateData } = req.body;
        const cleaned = cleanData(updateData);

        // Exclude internal/nested/read-only fields that are not columns in the service_requests table
        // or cause conversion errors.
        const {
            items,
            quoteResponses,
            itemHistory,
            attachments,
            id,
            createdAt,
            requestDate,
            projectName,
            requester,
            ...dbUpdateData
        } = cleaned;

        const [updated] = await db.update(schema.serviceRequests)
            .set(dbUpdateData)
            .where(eq(schema.serviceRequests.id, requestId))
            .returning();

        if (!updated) return res.status(404).json({ error: 'Requisición no encontrada' });

        const fullUpdated = await db.query.serviceRequests.findFirst({
            where: eq(schema.serviceRequests.id, requestId),
            with: { items: true, quoteResponses: { with: { items: true } } }
        });

        res.json(fullUpdated);
    } catch (error) {
        console.error('Error in PUT /api/service-requests/:id:', error);
        handleError(res, error);
    }
});

// Quote Responses
app.get('/api/quote-responses', async (req, res) => {
    try {
        const data = await db.query.quoteResponses.findMany({
            with: { items: true }
        });
        res.json(data);
    } catch (error) { handleError(res, error); }
});

app.post('/api/quote-responses', async (req, res) => {
    try {
        const { items, id: _frontendId, ...quoteData } = req.body;

        const fullQuote = await db.transaction(async (tx) => {
            // WHITELIST only valid fields for quote_responses table
            const safeQuoteData: any = {
                serviceRequestId: quoteData.serviceRequestId,
                supplierId: quoteData.supplierId || null,
                supplierName: quoteData.supplierName,
                quoteNumber: quoteData.quoteNumber || null,
                deliveryDays: quoteData.deliveryDays ?? 0,
                paymentTerms: quoteData.paymentTerms || null,
                qualityNotes: quoteData.qualityNotes || null,
                total: quoteData.total ?? 0,
                currency: quoteData.currency || 'CRC',
                pdfAttachmentName: quoteData.pdfAttachmentName || null,
            };

            const [newQuote] = await tx.insert(schema.quoteResponses).values(cleanData(safeQuoteData)).returning();

            if (!newQuote) throw new Error("Validation Error: No se pudo crear la respuesta a cotización.");

            if (items && items.length > 0) {
                const safeItems = items.map((item: any) => {
                    // WHITELIST only valid fields for quote_response_items table
                    return cleanData({
                        quoteResponseId: newQuote.id,
                        serviceRequestItemId: item.serviceRequestItemId || null,
                        unitPrice: item.unitPrice ?? 0,
                        quality: item.quality || 'Media',
                        notes: item.notes || null,
                    });
                });
                await tx.insert(schema.quoteResponseItems).values(safeItems);
            }

            return await tx.query.quoteResponses.findFirst({
                where: eq(schema.quoteResponses.id, newQuote.id),
                with: { items: true }
            });
        });

        res.json(fullQuote);
    } catch (error) {
        console.error('Data Process Aborted (Rollbacked). Error in POST /api/quote-responses:', error);
        handleError(res, error);
    }
});

// Purchase Orders
app.get('/api/purchase-orders', async (req, res) => {
    try {
        const data = await db.query.purchaseOrders.findMany({
            with: { items: true },
            orderBy: [desc(schema.purchaseOrders.createdAt)]
        });
        res.json(data);
    } catch (error) { handleError(res, error); }
});

app.post('/api/purchase-orders', async (req, res) => {
    try {
        const { items, id: _frontendId, ...poData } = req.body;
        const cleaned = cleanData(poData);

        const fullPO = await db.transaction(async (tx) => {
            const [newPO] = await tx.insert(schema.purchaseOrders).values(cleaned).returning();

            if (!newPO) throw new Error("Validation Error: No se pudo crear la orden de compra.");

            if (items && items.length > 0) {
                const safeItems = items.map((item: any) => {
                    // WHITELIST only valid fields for purchase_order_items table
                    return cleanData({
                        purchaseOrderId: newPO.id,
                        name: item.name,
                        quantity: item.quantity ?? 0,
                        unit: item.unit || 'unidad',
                        unitPrice: item.unitPrice ?? 0,
                    });
                });
                await tx.insert(schema.purchaseOrderItems).values(safeItems);
            }

            return await tx.query.purchaseOrders.findFirst({
                where: eq(schema.purchaseOrders.id, newPO.id),
                with: { items: true }
            });
        });

        res.json(fullPO);
    } catch (error) {
        console.error('Data Process Aborted (Rollbacked). Error in POST /api/purchase-orders:', error);
        handleError(res, error);
    }
});

app.put('/api/purchase-orders/:id', async (req, res) => {
    try {
        const poId = parseInt(req.params.id);
        const { currentStatus, items, ...updateData } = req.body;

        // RACE CONDITION GUARD for Approvals
        if (updateData.status === 'Aprobada' || updateData.status === 'Rechazada') {
            const [existing] = await db.select().from(schema.purchaseOrders).where(eq(schema.purchaseOrders.id, poId));
            if (existing && existing.status !== 'Pendiente Aprobación Financiera') {
                return res.status(409).json({ error: 'La orden ya ha sido procesada previamente por otro usuario.' });
            }
        }

        const cleaned = cleanData(updateData);

        // Exclude virtual/read-only and problematic date-string fields
        const {
            id,
            createdAt,
            orderDate,
            expectedDeliveryDate,
            projectName,
            ...dbUpdateData
        } = cleaned;

        const [updated] = await db.update(schema.purchaseOrders)
            .set(dbUpdateData)
            .where(eq(schema.purchaseOrders.id, poId))
            .returning();

        const fullUpdated = await db.query.purchaseOrders.findFirst({
            where: eq(schema.purchaseOrders.id, poId),
            with: { items: true }
        });

        res.json(fullUpdated);
    } catch (error) {
        console.error('Error in PUT /api/purchase-orders/:id:', error);
        handleError(res, error);
    }
});

// Accounts Payable
app.get('/api/accounts-payable', async (req, res) => {
    try {
        const data = await db.query.accountsPayable.findMany({
            orderBy: [desc(schema.accountsPayable.invoiceDate)]
        });
        res.json(data);
    } catch (error) { handleError(res, error); }
});

app.post('/api/accounts-payable', async (req, res) => {
    try {
        const { payments, ...apData } = req.body;
        const cleaned = cleanData(apData);
        const { id, createdAt, ...dbInsertData } = cleaned;
        const [newAP] = await db.insert(schema.accountsPayable).values(dbInsertData).returning();
        res.json(newAP);
    } catch (error) {
        console.error('Error in POST /api/accounts-payable:', error);
        handleError(res, error);
    }
});

app.put('/api/accounts-payable/:id', async (req, res) => {
    try {
        const apId = parseInt(req.params.id);
        const cleaned = cleanData(req.body);
        const { id, createdAt, ...dbUpdateData } = cleaned;

        const [updated] = await db.update(schema.accountsPayable)
            .set(dbUpdateData)
            .where(eq(schema.accountsPayable.id, apId))
            .returning();
        res.json(updated);
    } catch (error) {
        console.error('Error in PUT /api/accounts-payable/:id:', error);
        handleError(res, error);
    }
});

app.delete('/api/accounts-payable/:id', async (req, res) => {
    try {
        const apId = parseInt(req.params.id);
        await db.delete(schema.accountsPayable).where(eq(schema.accountsPayable.id, apId));
        res.json({ success: true });
    } catch (error) { handleError(res, error); }
});

// Goods Receipts
app.get('/api/goods-receipts', async (req, res) => {
    try {
        const data = await db.query.goodsReceipts.findMany({
            with: { items: true },
            orderBy: [desc(schema.goodsReceipts.creationDate)]
        });
        res.json(data);
    } catch (error) { handleError(res, error); }
});

app.post('/api/goods-receipts', async (req, res) => {
    try {
        const { items, ...grData } = req.body;
        const cleaned = cleanData(grData);

        // Exclude id and createdAt if present to avoid Drizzle insert errors
        const { id, createdAt, ...dbInsertData } = cleaned;

        const fullGR = await db.transaction(async (tx) => {
            const [newGR] = await tx.insert(schema.goodsReceipts).values(dbInsertData).returning();

            if (!newGR) throw new Error("Validation Error: No se pudo crear la recepción principal.");

            if (items && items.length > 0) {
                const safeItems = items.map((item: any) => {
                    // WHITELIST only valid fields for goods_receipt_items table
                    return cleanData({
                        goodsReceiptId: newGR.id,
                        purchaseOrderItemId: item.purchaseOrderItemId || null,
                        name: item.name,
                        quantityOrdered: item.quantityOrdered ?? 0,
                        unit: item.unit || 'unidad',
                        quantityReceived: item.quantityReceived ?? 0,
                    });
                });
                await tx.insert(schema.goodsReceiptItems).values(safeItems);
            }

            return await tx.query.goodsReceipts.findFirst({
                where: eq(schema.goodsReceipts.id, newGR.id),
                with: { items: true }
            });
        });

        res.json(fullGR);
    } catch (error) {
        console.error('Data Process Aborted (Rollbacked). Error in POST /api/goods-receipts:', error);
        handleError(res, error);
    }
});

app.put('/api/goods-receipts/:id', async (req, res) => {
    try {
        const grId = parseInt(req.params.id);
        const { items, ...grData } = req.body;
        const cleaned = cleanData(grData);
        const { id, createdAt, ...dbUpdateData } = cleaned;

        const [updated] = await db.update(schema.goodsReceipts)
            .set(dbUpdateData)
            .where(eq(schema.goodsReceipts.id, grId))
            .returning();

        if (items && Array.isArray(items)) {
            for (const item of items) {
                if (item.id) {
                    const { id: itemId, goodsReceiptId, purchaseOrderItemId, ...itemUpdateData } = cleanData(item);
                    await db.update(schema.goodsReceiptItems)
                        .set(itemUpdateData)
                        .where(eq(schema.goodsReceiptItems.id, itemId));
                }
            }
        }

        const fullUpdated = await db.query.goodsReceipts.findFirst({
            where: eq(schema.goodsReceipts.id, grId),
            with: { items: true }
        });

        res.json(fullUpdated);
    } catch (error) {
        console.error('Error in PUT /api/goods-receipts/:id:', error);
        handleError(res, error);
    }
});

app.delete('/api/goods-receipts/:id', async (req, res) => {
    try {
        const grId = parseInt(req.params.id);
        await db.delete(schema.goodsReceipts).where(eq(schema.goodsReceipts.id, grId));
        res.json({ success: true });
    } catch (error) { handleError(res, error); }
});

// Credit Notes
app.get('/api/credit-notes', async (req, res) => {
    try {
        const data = await db.query.creditNotes.findMany({
            with: { items: true },
            orderBy: [desc(schema.creditNotes.creationDate)]
        });
        res.json(data);
    } catch (error) { handleError(res, error); }
});

app.post('/api/credit-notes', async (req, res) => {
    try {
        const { items, id: _frontendId, ...cnData } = req.body;

        // WHITELIST only valid fields for credit_notes table
        const safeCNData: any = {
            goodsReceiptId: cnData.goodsReceiptId || null,
            purchaseOrderId: cnData.purchaseOrderId || null,
            projectId: cnData.projectId || null,
            supplierId: cnData.supplierId || null,
            supplierName: cnData.supplierName,
            creationDate: cnData.creationDate ? new Date(cnData.creationDate) : new Date(),
            createdBy: cnData.createdBy || null,
            reason: cnData.reason,
            totalAmount: cnData.totalAmount ?? 0,
            status: cnData.status || 'Pendiente Aprobación',
            appliedToInvoice: cnData.appliedToInvoice ?? false,
            pdfAttachmentName: cnData.pdfAttachmentName || null,
        };

        const fullCN = await db.transaction(async (tx) => {
            console.log('[DEBUG POST /api/credit-notes] safeCNData after cleanData:', JSON.stringify(cleanData(safeCNData), null, 2));
            const [newCN] = await tx.insert(schema.creditNotes).values(cleanData(safeCNData)).returning();

            if (!newCN) throw new Error("Validation Error: No se pudo crear la nota de crédito.");

            if (items && items.length > 0) {
                const safeItems = items.map((item: any) => {
                    // WHITELIST only valid fields for credit_note_items table
                    return cleanData({
                        creditNoteId: newCN.id,
                        purchaseOrderItemId: item.purchaseOrderItemId || null,
                        name: item.name,
                        quantityToCredit: item.quantityToCredit ?? 0,
                        unit: item.unit || 'unidad',
                        unitPrice: item.unitPrice ?? 0,
                        creditAmount: item.creditAmount ?? 0,
                    });
                });
                await tx.insert(schema.creditNoteItems).values(safeItems);
            }

            return await tx.query.creditNotes.findFirst({
                where: eq(schema.creditNotes.id, newCN.id),
                with: { items: true }
            });
        });

        res.json(fullCN);
    } catch (error) {
        console.error('Data Process Aborted (Rollbacked). Error in POST /api/credit-notes:', error);
        handleError(res, error);
    }
});

app.put('/api/credit-notes/:id', async (req, res) => {
    try {
        const cnId = parseInt(req.params.id);
        const { items, ...cnData } = req.body;
        const cleaned = cleanData(cnData);
        const [updated] = await db.update(schema.creditNotes)
            .set(cleaned)
            .where(eq(schema.creditNotes.id, cnId))
            .returning();

        const fullUpdated = await db.query.creditNotes.findFirst({
            where: eq(schema.creditNotes.id, cnId),
            with: { items: true }
        });

        res.json(fullUpdated);
    } catch (error) { handleError(res, error); }
});

// Subcontracts extra endpoints
app.post('/api/subcontracts', async (req, res) => {
    try {
        const cleaned = cleanData(req.body);
        const [inserted] = await db.insert(schema.subcontracts).values(cleaned).returning();
        res.json(inserted);
    } catch (error) { handleError(res, error); }
});

app.put('/api/subcontracts/:id', async (req, res) => {
    try {
        const { id, ...rest } = req.body;
        const cleaned = cleanData(rest);
        const [updated] = await db.update(schema.subcontracts)
            .set(cleaned)
            .where(eq(schema.subcontracts.id, parseInt(req.params.id)))
            .returning();
        res.json(updated);
    } catch (error) { handleError(res, error); }
});

// --- SALES (Offers & Budgets) ---
app.get('/api/offers', async (req, res) => {
    try {
        const data = await db.query.offers.findMany({
            with: { prospect: true },
            orderBy: [desc(schema.offers.createdAt)]
        });
        const mappedData = data.map(o => ({
            ...o,
            budget: o.budgetAmount,
            prospectName: o.prospect?.name || 'Prospecto desconocido'
        }));
        res.json(mappedData);
    } catch (error) { handleError(res, error); }
});

app.post('/api/offers', async (req, res) => {
    try {
        const { id, budget, prospectName, prospect, createdAt, ...rest } = req.body;
        const dataToInsert = cleanData({
            ...rest,
            budgetAmount: budget || rest.budgetAmount
        });
        const [newOffer] = await db.insert(schema.offers).values(dataToInsert).returning();

        // Return mapped version for the frontend
        const mapped = {
            ...newOffer,
            budget: newOffer.budgetAmount,
            prospectName: prospectName || (prospect?.name) || 'N/A'
        };
        res.json(mapped);
    } catch (error) { handleError(res, error); }
});

app.put('/api/offers/:id', async (req, res) => {
    try {
        console.log('PUT /api/offers/' + req.params.id, JSON.stringify(req.body, null, 2));
        const { id, budget, prospectName, prospect, createdAt, ...rest } = req.body;
        const dataToUpdate = cleanData({
            ...rest,
            budgetAmount: budget !== undefined ? budget : rest.budgetAmount
        });
        const [updated] = await db.update(schema.offers)
            .set(dataToUpdate)
            .where(eq(schema.offers.id, parseInt(req.params.id)))
            .returning();

        if (!updated) {
            return res.status(404).json({ error: 'Oferta no encontrada' });
        }

        // Return mapped version
        const mapped = {
            ...updated,
            budget: updated.budgetAmount,
            prospectName: prospectName || (prospect?.name) || 'N/A'
        };
        res.json(mapped);
    } catch (error) { handleError(res, error); }
});

app.delete('/api/offers/:id', async (req, res) => {
    try {
        await db.delete(schema.offers).where(eq(schema.offers.id, parseInt(req.params.id)));
        res.json({ success: true });
    } catch (error) { handleError(res, error); }
});

// Change Orders
app.get('/api/change-orders', async (req, res) => {
    try {
        const data = await db.query.changeOrders.findMany({
            orderBy: [desc(schema.changeOrders.createdAt)]
        });
        res.json(data);
    } catch (error) { handleError(res, error); }
});

app.post('/api/change-orders', async (req, res) => {
    try {
        const cleaned = cleanData(req.body);
        const [newCO] = await db.insert(schema.changeOrders).values(cleaned).returning();
        res.json(newCO);
    } catch (error) { handleError(res, error); }
});

app.put('/api/change-orders/:id', async (req, res) => {
    try {
        const { id, createdAt, ...rest } = req.body;
        const cleaned = cleanData(rest);
        const [updated] = await db.update(schema.changeOrders)
            .set(cleaned)
            .where(eq(schema.changeOrders.id, parseInt(req.params.id)))
            .returning();
        res.json(updated);
    } catch (error) { handleError(res, error); }
});


// Helper to generate consecutive numbers atomically
const generateConsecutive = async (prefix: string, txClient: any = db) => {
    // Upsert (Insert on conflict do update) nativo de postgres 
    // Garantiza atomicidad y Row-Level Locking automáticamente
    const [updated] = await txClient.insert(schema.systemSequences)
        .values({ prefix, lastValue: 1 })
        .onConflictDoUpdate({
            target: schema.systemSequences.prefix,
            set: { lastValue: sql`${schema.systemSequences.lastValue} + 1` }
        })
        .returning();

    const currentCount = updated.lastValue;
    return `${prefix}-${currentCount.toString().padStart(4, '0')}`;
};

app.get('/api/budgets', async (req, res) => {
    try {
        const data = await db.query.budgets.findMany({
            with: {
                activities: {
                    with: { subActivities: true }
                },
                prospect: true
            },
            orderBy: [desc(schema.budgets.createdAt)]
        });

        const mappedData = data.map(b => ({
            ...b,
            prospectName: b.prospect?.name || 'Prospecto desconocido'
        }));

        res.json(mappedData);
    } catch (error) { handleError(res, error); }
});

app.post('/api/budgets', async (req, res) => {
    try {
        const { activities, prospectName, id: _frontendId, ...budgetData } = req.body;

        const newBudgetRecord = await db.transaction(async (tx) => {
            // 1. Generate Consecutive Number si no viene, AHORA DENTRO DE LA TRANSACCIÓN
            const consecutiveNumber = budgetData.consecutiveNumber || await generateConsecutive('PRE', tx);

            // 2. Clean Data — remove frontend 'id' if present
            const { id: _budgetId, ...safeBudgetData } = cleanData({ ...budgetData, consecutiveNumber });

            // 3. Insert Budget
            const [newBudget] = await tx.insert(schema.budgets).values(safeBudgetData).returning();

            if (!newBudget) throw new Error("Validation Error: No se pudo crear el presupuesto.");

            // 4. Insert Activities and SubActivities
            if (activities && activities.length > 0) {
                for (let i = 0; i < activities.length; i++) {
                    const activityGroup = activities[i];

                    // WHITELIST only valid fields for budget_activities table
                    const activityInsertData: any = {
                        budgetId: newBudget.id,
                        itemNumber: activityGroup.itemNumber || null,
                        description: activityGroup.description || 'Sin descripción',
                        quantity: activityGroup.quantity ?? 0,
                        unit: activityGroup.unit || 'unidad',
                    };

                    const [newActivity] = await tx.insert(schema.budgetActivities)
                        .values(cleanData(activityInsertData))
                        .returning();

                    const subActivities = activityGroup.subActivities;
                    if (subActivities && subActivities.length > 0) {
                        const subActivitiesData = subActivities.map((sub: any) => {
                            // WHITELIST only valid fields for budget_sub_activities table
                            return cleanData({
                                activityId: newActivity.id,
                                itemNumber: sub.itemNumber || null,
                                description: sub.description || 'Sin descripción',
                                quantity: sub.quantity ?? 0,
                                unit: sub.unit || 'unidad',
                                materialUnitCost: sub.materialUnitCost ?? 0,
                                laborUnitCost: sub.laborUnitCost ?? 0,
                                subcontractUnitCost: sub.subcontractUnitCost ?? 0,
                            });
                        });
                        await tx.insert(schema.budgetSubActivities).values(subActivitiesData);
                    }
                }
            }

            return newBudget;
        });

        const fullBudget = await db.query.budgets.findFirst({
            where: eq(schema.budgets.id, newBudgetRecord.id),
            with: {
                activities: {
                    with: { subActivities: true }
                }
            }
        });

        // Return mapped version para el front
        const mapped = {
            ...fullBudget,
            prospectName: prospectName || 'Prospecto desconocido'
        };
        res.json(mapped);
    } catch (error) {
        console.error('Data Process Aborted (Rollbacked). Error in POST /api/budgets:', error);
        handleError(res, error);
    }
});

app.put('/api/budgets/:id', async (req, res) => {
    try {
        const budgetId = parseInt(req.params.id);
        const { id, activities, prospect, prospectName, createdAt, ...budgetData } = req.body;
        const cleanedBudget = cleanData(budgetData);

        // Update Budget
        const [updatedBudget] = await db.update(schema.budgets)
            .set(cleanedBudget)
            .where(eq(schema.budgets.id, budgetId))
            .returning();

        if (activities) {
            // Delete all activities for this budget (cascade deletes sub-activities)
            await db.delete(schema.budgetActivities).where(eq(schema.budgetActivities.budgetId, budgetId));

            // Re-insert with WHITELISTED fields only
            for (const activity of activities) {
                // WHITELIST only valid fields for budget_activities table
                const activityInsertData: any = {
                    budgetId: budgetId,
                    itemNumber: activity.itemNumber || null,
                    description: activity.description || 'Sin descripción',
                    quantity: activity.quantity ?? 0,
                    unit: activity.unit || 'unidad',
                };

                const [newActivity] = await db.insert(schema.budgetActivities)
                    .values(cleanData(activityInsertData))
                    .returning();

                const subActivities = activity.subActivities;
                if (newActivity && subActivities && subActivities.length > 0) {
                    const subsData = subActivities.map((sub: any) => {
                        // WHITELIST only valid fields for budget_sub_activities table
                        return cleanData({
                            activityId: newActivity.id,
                            itemNumber: sub.itemNumber || null,
                            description: sub.description || 'Sin descripción',
                            quantity: sub.quantity ?? 0,
                            unit: sub.unit || 'unidad',
                            materialUnitCost: sub.materialUnitCost ?? 0,
                            laborUnitCost: sub.laborUnitCost ?? 0,
                            subcontractUnitCost: sub.subcontractUnitCost ?? 0,
                        });
                    });
                    await db.insert(schema.budgetSubActivities).values(subsData);
                }
            }
        }

        const fullUpdatedBudget = await db.query.budgets.findFirst({
            where: eq(schema.budgets.id, budgetId),
            with: {
                activities: {
                    with: { subActivities: true }
                },
                prospect: true
            }
        });

        res.json({ ...fullUpdatedBudget, prospectName: fullUpdatedBudget?.prospect?.name || prospectName || 'N/A' });

    } catch (error) { handleError(res, error); }
});

app.delete('/api/budgets/:id', async (req, res) => {
    try {
        await db.delete(schema.budgets).where(eq(schema.budgets.id, parseInt(req.params.id)));
        res.json({ success: true });
    } catch (error) { handleError(res, error); }
});

// --- INVENTORY & DATABASE ---
app.get('/api/materials', async (req, res) => {
    try {
        const data = await db.query.materials.findMany();
        res.json(data);
    } catch (error) { handleError(res, error); }
});

// IMPORTANT: /search route MUST be registered BEFORE /:id to avoid Express
// matching the literal string 'search' as a numeric ID parameter.
app.get('/api/materials/search', async (req, res) => {
    try {
        const query = req.query.q as string;
        if (!query) {
            const data = await db.query.materials.findMany();
            return res.json(data);
        }

        // Use ILIKE for case-insensitive partial match
        const data = await db.query.materials.findMany({
            where: (materials, { ilike }) => ilike(materials.name, `%${query}%`)
        });
        res.json(data);
    } catch (error) { handleError(res, error); }
});

app.post('/api/materials', async (req, res) => {
    try {
        const cleaned = cleanData(req.body);
        const [newMaterial] = await db.insert(schema.materials).values(cleaned).returning();
        res.json(newMaterial);
    } catch (error) { handleError(res, error); }
});

app.put('/api/materials/:id', async (req, res) => {
    try {
        const { id, lastUpdated, ...rest } = req.body;
        const cleaned = cleanData(rest);
        const [updated] = await db.update(schema.materials)
            .set({ ...cleaned, lastUpdated: new Date() })
            .where(eq(schema.materials.id, parseInt(req.params.id)))
            .returning();
        res.json(updated);
    } catch (error) { handleError(res, error); }
});

app.delete('/api/materials/:id', async (req, res) => {
    try {
        await db.delete(schema.materials).where(eq(schema.materials.id, parseInt(req.params.id)));
        res.json({ success: true });
    } catch (error) { handleError(res, error); }
});

app.get('/api/service-items', async (req, res) => {
    try {
        const data = await db.query.serviceItems.findMany();
        res.json(data);
    } catch (error) { handleError(res, error); }
});

app.post('/api/service-items', async (req, res) => {
    try {
        console.log('POST /api/service-items - Received:', req.body);
        const cleaned = cleanData(req.body);
        console.log('POST /api/service-items - Cleaned:', cleaned);
        const [newItem] = await db.insert(schema.serviceItems).values(cleaned).returning();
        console.log('POST /api/service-items - Created:', newItem);
        res.json(newItem);
    } catch (error) { handleError(res, error); }
});

app.put('/api/service-items/:id', async (req, res) => {
    try {
        const { id, lastUpdated, ...rest } = req.body;
        const cleaned = cleanData(rest);
        const [updated] = await db.update(schema.serviceItems)
            .set(cleaned)
            .where(eq(schema.serviceItems.id, parseInt(req.params.id)))
            .returning();
        res.json(updated);
    } catch (error) { handleError(res, error); }
});

app.delete('/api/service-items/:id', async (req, res) => {
    try {
        const [deleted] = await db.delete(schema.serviceItems)
            .where(eq(schema.serviceItems.id, parseInt(req.params.id)))
            .returning();
        res.json({ success: true, deleted });
    } catch (error) { handleError(res, error); }
});

app.get('/api/labor-items', async (req, res) => {
    try {
        const data = await db.query.laborItems.findMany();
        res.json(data);
    } catch (error) { handleError(res, error); }
});

app.post('/api/labor-items', async (req, res) => {
    try {
        const cleaned = cleanData(req.body);
        const [newItem] = await db.insert(schema.laborItems).values(cleaned).returning();
        res.json(newItem);
    } catch (error) { handleError(res, error); }
});

app.put('/api/labor-items/:id', async (req, res) => {
    try {
        const { id, ...rest } = req.body;
        const cleaned = cleanData(rest);
        const [updated] = await db.update(schema.laborItems)
            .set(cleaned)
            .where(eq(schema.laborItems.id, parseInt(req.params.id)))
            .returning();
        res.json(updated);
    } catch (error) { handleError(res, error); }
});

app.delete('/api/labor-items/:id', async (req, res) => {
    try {
        await db.delete(schema.laborItems).where(eq(schema.laborItems.id, parseInt(req.params.id)));
        res.json({ success: true });
    } catch (error) { handleError(res, error); }
});

app.get('/api/recurring-order-templates', async (req, res) => {
    try {
        const data = await db.query.recurringOrderTemplates.findMany();
        res.json(data);
    } catch (error) { handleError(res, error); }
});

app.post('/api/recurring-order-templates', async (req, res) => {
    try {
        const cleaned = cleanData(req.body);
        const [newTemplate] = await db.insert(schema.recurringOrderTemplates).values(cleaned).returning();
        res.json(newTemplate);
    } catch (error) { handleError(res, error); }
});

app.put('/api/recurring-order-templates/:id', async (req, res) => {
    try {
        const { id, ...rest } = req.body;
        const cleaned = cleanData(rest);
        const [updated] = await db.update(schema.recurringOrderTemplates)
            .set(cleaned)
            .where(eq(schema.recurringOrderTemplates.id, parseInt(req.params.id)))
            .returning();
        res.json(updated);
    } catch (error) { handleError(res, error); }
});

app.delete('/api/recurring-order-templates/:id', async (req, res) => {
    try {
        await db.delete(schema.recurringOrderTemplates).where(eq(schema.recurringOrderTemplates.id, parseInt(req.params.id)));
        res.json({ success: true });
    } catch (error) { handleError(res, error); }
});

app.get('/api/predetermined-activities', async (req, res) => {
    try {
        const data = await db.query.predeterminedActivities.findMany({
            with: { subActivities: true }
        });
        res.json(data);
    } catch (error) { handleError(res, error); }
});

app.post('/api/predetermined-activities', async (req, res) => {
    try {
        console.log('POST /api/predetermined-activities - Received:', JSON.stringify(req.body, null, 2));
        const { subActivities, ...activityData } = req.body;
        console.log('Activity Data:', activityData);
        console.log('Sub Activities:', subActivities);

        const cleanedActivity = cleanData(activityData);
        console.log('Cleaned Activity Data:', cleanedActivity);

        const [newActivity] = await db.insert(schema.predeterminedActivities).values(cleanedActivity).returning();
        console.log('Created Activity:', newActivity);

        if (newActivity && subActivities && subActivities.length > 0) {
            const subsToInsert = subActivities.map((sub: any) => {
                const { id, ...rest } = sub; // Remove existing ID
                const cleaned = cleanData({
                    ...rest,
                    predeterminedActivityId: newActivity.id
                });
                console.log('Sub Activity to Insert:', cleaned);
                return cleaned;
            });
            console.log('All Sub Activities to Insert:', subsToInsert);
            await db.insert(schema.predeterminedSubActivities).values(subsToInsert);
        }

        // Return with sub-activities
        const result = await db.query.predeterminedActivities.findFirst({
            where: eq(schema.predeterminedActivities.id, newActivity.id),
            with: { subActivities: true }
        });
        console.log('Final Result:', result);
        res.json(result);
    } catch (error) {
        console.error('ERROR in POST /api/predetermined-activities:', error);
        handleError(res, error);
    }
});

app.put('/api/predetermined-activities/:id', async (req, res) => {
    try {
        const activityId = parseInt(req.params.id);
        const { id, subActivities, ...activityData } = req.body;
        const cleanedActivity = cleanData(activityData);

        await db.update(schema.predeterminedActivities)
            .set(cleanedActivity)
            .where(eq(schema.predeterminedActivities.id, activityId));

        if (subActivities) {
            // Delete and re-insert sub-activities
            await db.delete(schema.predeterminedSubActivities).where(eq(schema.predeterminedSubActivities.predeterminedActivityId, activityId));

            if (subActivities.length > 0) {
                const subsToInsert = subActivities.map((sub: any) => {
                    const { id: subId, ...subRest } = sub;
                    return cleanData({
                        ...subRest,
                        predeterminedActivityId: activityId
                    });
                });
                await db.insert(schema.predeterminedSubActivities).values(subsToInsert);
            }
        }

        const result = await db.query.predeterminedActivities.findFirst({
            where: eq(schema.predeterminedActivities.id, activityId),
            with: { subActivities: true }
        });
        res.json(result);
    } catch (error) { handleError(res, error); }
});

app.delete('/api/predetermined-activities/:id', async (req, res) => {
    try {
        await db.delete(schema.predeterminedActivities).where(eq(schema.predeterminedActivities.id, parseInt(req.params.id)));
        res.json({ success: true });
    } catch (error) { handleError(res, error); }
});

app.get('/api/subcontracts', async (req, res) => {
    try {
        const data = await db.query.subcontracts.findMany({
            orderBy: [desc(schema.subcontracts.creationDate)]
        });
        res.json(data);
    } catch (error) { handleError(res, error); }
});


// --- BONOS (Recurring Projects R4) ---
app.get('/api/bonos', async (req, res) => {
    try {
        const data = await db.query.bonos.findMany({
            orderBy: [desc(schema.bonos.createdAt)]
        });
        res.json(data);
    } catch (error) { handleError(res, error); }
});

app.post('/api/bonos', async (req, res) => {
    try {
        const newBono = await db.insert(schema.bonos).values(req.body).returning();
        res.json(newBono[0]);
    } catch (error) { handleError(res, error); }
});

app.post('/api/bonos/transaccion-entregado', async (req, res) => {
    try {
        const { bonoId, bonoData, prospectData } = req.body;
        
        // --- FASE 1: Guardar o Actualizar el Bono (SIEMPRE se persiste) ---
        let finalBonoId = bonoId;
        try {
            if (bonoId) {
                const { id: _bid, createdAt: _bca, presupuesto: _bpres, ...bonoRest } = bonoData;
                await db.update(schema.bonos)
                    .set(bonoRest)
                    .where(eq(schema.bonos.id, parseInt(bonoId)));
            } else {
                const { id: _bid, createdAt: _bca, presupuesto: _bpres, ...bonoRest } = bonoData;
                const [newBono] = await db.insert(schema.bonos).values(bonoRest).returning();
                finalBonoId = newBono.id;
            }
        } catch (bonoError: any) {
            console.error("Error guardando bono:", bonoError);
            return res.status(500).json({ error: `Error al guardar el requisito: ${bonoError.message}` });
        }

        // --- FASE 2: Crear Prospecto (con protecciones anti-duplicado y anti-sequence-clash) ---
        try {
            // 2a. Sincronizar secuencia de prospects ANTES de insertar
            // NOTA: NO usar currval() ya que falla si la secuencia no fue usada en esta sesión
            try {
                await db.execute(sql`SELECT setval(
                    pg_get_serial_sequence('prospects', 'id'),
                    COALESCE((SELECT MAX(id) FROM prospects), 0) + 1,
                    false
                )`);
            } catch (seqErr: any) {
                console.warn('Advertencia al sincronizar secuencia de prospects (no fatal):', seqErr.message);
                // No es fatal — la secuencia podría ya estar correcta
            }

            // 2b. Verificación de duplicados case-insensitive
            console.log('[transaccion-entregado] Verificando duplicados para:', prospectData.name);
            const existingProspects = await db.execute(
                sql`SELECT id, name FROM prospects WHERE LOWER(name) = LOWER(${prospectData.name}) LIMIT 1`
            );
            
            if (existingProspects.rows && existingProspects.rows.length > 0) {
                // El prospecto ya existe — no es un error fatal, el bono YA se guardó
                console.log('[transaccion-entregado] Prospecto ya existe:', (existingProspects.rows[0] as any).id);
                return res.json({ 
                    success: true, 
                    message: `Requisito entregado correctamente. El prospecto "${prospectData.name}" ya existía en el sistema (ID: ${(existingProspects.rows[0] as any).id}), no se creó duplicado.`,
                    prospectAlreadyExisted: true 
                });
            }

            // 2c. WHITELIST estricta de campos para prospects (NUNCA pasar id del frontend)
            const { id: _pid, createdAt: _pca, ...rawProspect } = prospectData;
            const safeProspectData: any = {
                name: rawProspect.name,
                company: rawProspect.company || null,
                phone: rawProspect.phone || null,
                email: rawProspect.email || null,
                nextFollowUpDate: rawProspect.nextFollowUpDate || null,
                birthday: rawProspect.birthday || null,
                spouseName: rawProspect.spouseName || null,
                children: rawProspect.children || null,
                hobbies: rawProspect.hobbies || null,
                followUps: rawProspect.followUps || [],
                source: rawProspect.source || 'Conversión de Requisito Recurrente',
                sourceBonoId: finalBonoId,
            };

            console.log('[transaccion-entregado] Insertando prospecto con datos:', JSON.stringify(safeProspectData, null, 2));
            const [newProspect] = await db.insert(schema.prospects).values(cleanData(safeProspectData)).returning();
            console.log('[transaccion-entregado] Prospecto creado exitosamente, ID:', newProspect.id);

            res.json({ 
                success: true, 
                message: 'Requisito entregado, prospecto creado y caso iniciado correctamente.',
                prospectId: newProspect.id
            });
        } catch (prospectError: any) {
            console.error("Error creando prospecto (bono YA guardado):", prospectError);
            console.error("Detalle del error:", prospectError.message);
            if (prospectError.cause) {
                console.error("Causa raíz:", prospectError.cause.message || prospectError.cause);
            }
            // El bono se guardó exitosamente, pero el prospecto falló
            res.json({ 
                success: true, 
                partialError: true,
                message: `Requisito entregado correctamente (estatus actualizado). Sin embargo, hubo un error al crear el prospecto: ${prospectError.message}. Puede intentar crear el prospecto manualmente desde el módulo de Ventas.` 
            });
        }
    } catch (error: any) {
        console.error("Error general en transaccion entregado:", error);
        res.status(400).json({ error: error.message || 'Error desconocido en transacción.' });
    }
});

// ─── TRANSACCIÓN: En APC (Atómica: Bono + Prospecto + Oferta) ─────────────
app.post('/api/bonos/transaccion-en-apc', async (req, res) => {
    try {
        const { bonoId, bonoData, prospectData, offerData } = req.body;

        const result = await db.transaction(async (tx) => {
            // FASE 1: Actualizar Bono
            let finalBonoId = bonoId;
            if (bonoId) {
                const { id: _bid, createdAt: _bca, presupuesto: _bpres, ...bonoRest } = bonoData;
                await tx.update(schema.bonos)
                    .set(bonoRest)
                    .where(eq(schema.bonos.id, parseInt(bonoId)));
            } else {
                const { id: _bid, createdAt: _bca, presupuesto: _bpres, ...bonoRest } = bonoData;
                const [newBono] = await tx.insert(schema.bonos).values(bonoRest).returning();
                finalBonoId = newBono.id;
            }

            // FASE 2: Buscar o crear Prospecto (anti-duplicado)
            let prospectId: number;
            const existingProspects = await tx.execute(
                sql`SELECT id, name FROM prospects WHERE LOWER(name) = LOWER(${prospectData.name}) LIMIT 1`
            );

            if (existingProspects.rows && existingProspects.rows.length > 0) {
                prospectId = (existingProspects.rows[0] as any).id;
            } else {
                const { id: _pid, createdAt: _pca, ...rawProspect } = prospectData;
                const safeProspectData: any = {
                    name: rawProspect.name,
                    company: rawProspect.company || null,
                    phone: rawProspect.phone || null,
                    email: rawProspect.email || null,
                    nextFollowUpDate: rawProspect.nextFollowUpDate || null,
                    followUps: rawProspect.followUps || [],
                    source: rawProspect.source || 'Conversión automática - En APC',
                    sourceBonoId: finalBonoId,
                };
                const [newProspect] = await tx.insert(schema.prospects).values(safeProspectData).returning();
                prospectId = newProspect.id;
            }

            // FASE 3: Crear Oferta vinculada (si se proporcionó offerData)
            let createdOffer = null;
            if (offerData) {
                const safeOfferData: any = {
                    consecutiveNumber: offerData.consecutiveNumber,
                    prospectId: prospectId,
                    date: offerData.date,
                    description: offerData.description || null,
                    amount: offerData.amount || '0',
                    budgetAmount: offerData.budget || offerData.budgetAmount || '0',
                    projectType: offerData.projectType,
                    status: offerData.status || 'Revisión',
                    budgetId: offerData.budgetId || null,
                };
                const [newOffer] = await tx.insert(schema.offers).values(safeOfferData).returning();
                createdOffer = newOffer;
            }

            return { bonoId: finalBonoId, prospectId, offer: createdOffer };
        });

        res.json({
            success: true,
            message: 'Transacción En APC completada exitosamente.',
            ...result
        });
    } catch (error: any) {
        console.error("Error en transaccion-en-apc (ROLLBACK automático):", error);
        res.status(500).json({ error: `Error en transacción En APC: ${error.message}` });
    }
});

// ─── TRANSACCIÓN: Formalizado/Construcción (Atómica: Oferta→Aprobación + Proyecto + CxC) ──
app.post('/api/bonos/transaccion-formalizado', async (req, res) => {
    try {
        const { bonoId, offerId, prospectData, projectData, arData } = req.body;

        const result = await db.transaction(async (tx) => {
            // FASE 1: Actualizar Oferta → Aprobación
            let updatedOffer = null;
            if (offerId) {
                const [offer] = await tx.update(schema.offers)
                    .set({ status: 'Aprobación' })
                    .where(eq(schema.offers.id, parseInt(offerId)))
                    .returning();
                updatedOffer = offer;
            }

            // FASE 2: Crear Proyecto (si se proporcionó)
            let createdProject = null;
            if (projectData) {
                const { id: _pid, createdAt: _pca, ...safeProject } = projectData;
                const [newProject] = await tx.insert(schema.projects).values(safeProject).returning();
                createdProject = newProject;
            }

            // FASE 3: Crear CxC (si se proporcionó)
            let createdAR = null;
            if (arData) {
                const { id: _arid, ...safeAR } = arData;
                const [newAR] = await tx.insert(schema.accountsReceivable).values(safeAR).returning();
                createdAR = newAR;
            }

            return { offer: updatedOffer, project: createdProject, accountReceivable: createdAR };
        });

        res.json({
            success: true,
            message: 'Transacción Formalizado/Construcción completada exitosamente.',
            ...result
        });
    } catch (error: any) {
        console.error("Error en transaccion-formalizado (ROLLBACK automático):", error);
        res.status(500).json({ error: `Error en transacción Formalizado: ${error.message}` });
    }
});

app.put('/api/bonos/:id', async (req, res) => {
    try {
        const { id, createdAt, ...rest } = req.body;
        const [updatedBono] = await db.update(schema.bonos)
            .set(rest)
            .where(eq(schema.bonos.id, parseInt(req.params.id)))
            .returning();
        res.json(updatedBono);
    } catch (error) { handleError(res, error); }
});

app.delete('/api/bonos/:id', async (req, res) => {
    try {
        await db.delete(schema.bonos).where(eq(schema.bonos.id, parseInt(req.params.id)));
        res.json({ success: true });
    } catch (error) { handleError(res, error); }
});

// --- ADMINISTRATIVE EXPENSES ---
app.get('/api/administrative-budgets', async (req, res) => {
    try {
        const data = await db.query.administrativeBudgets.findMany({
            orderBy: [desc(schema.administrativeBudgets.year)]
        });
        res.json(data);
    } catch (error) { handleError(res, error); }
});

app.post('/api/administrative-budgets', async (req, res) => {
    try {
        const cleaned = cleanData(req.body);
        const [newBudget] = await db.insert(schema.administrativeBudgets).values(cleaned).returning();
        res.json(newBudget);
    } catch (error) { handleError(res, error); }
});

app.put('/api/administrative-budgets/:id', async (req, res) => {
    try {
        const { id, createdAt, ...rest } = req.body;
        const cleaned = cleanData(rest);
        const [updated] = await db.update(schema.administrativeBudgets)
            .set(cleaned)
            .where(eq(schema.administrativeBudgets.id, parseInt(req.params.id)))
            .returning();
        res.json(updated);
    } catch (error) { handleError(res, error); }
});

app.get('/api/administrative-expenses', async (req, res) => {
    try {
        const data = await db.query.administrativeExpenses.findMany({
            orderBy: [desc(schema.administrativeExpenses.date)]
        });
        res.json(data);
    } catch (error) { handleError(res, error); }
});

app.post('/api/administrative-expenses', async (req, res) => {
    try {
        const cleaned = cleanData(req.body);
        const [newExpense] = await db.insert(schema.administrativeExpenses).values(cleaned).returning();
        res.json(newExpense);
    } catch (error) { handleError(res, error); }
});

// --- COMPANY INFO ---
app.get('/api/company-info', async (req, res) => {
    try {
        const data = await db.query.companyInfo.findFirst();
        res.json(data || {});
    } catch (error) { handleError(res, error); }
});

app.post('/api/company-info', async (req, res) => {
    try {
        const cleaned = cleanData(req.body);
        const { id, createdAt, ...dbData } = cleaned;
        const existing = await db.query.companyInfo.findFirst();

        if (existing) {
            const [updated] = await db.update(schema.companyInfo)
                .set(dbData)
                .where(eq(schema.companyInfo.id, (existing as any).id as number))
                .returning();
            res.json(updated || existing);
        } else {
            const [inserted] = await db.insert(schema.companyInfo).values(dbData).returning();
            res.json(inserted);
        }
    } catch (error) {
        console.error('Error in POST /api/company-info:', error);
        handleError(res, error);
    }
});

// --- PRE-OPERATIVE EXPENSES ---
app.get('/api/pre-op-rubros', async (req, res) => {
    try {
        const data = await db.query.preOpRubros.findMany();
        res.json(data);
    } catch (error) { handleError(res, error); }
});

app.post('/api/pre-op-rubros', async (req, res) => {
    try {
        const cleaned = cleanData(req.body);
        const [inserted] = await db.insert(schema.preOpRubros).values(cleaned).returning();
        res.json(inserted);
    } catch (error) { handleError(res, error); }
});

app.put('/api/pre-op-rubros/:id', async (req, res) => {
    try {
        const { id, ...rest } = req.body;
        const cleaned = cleanData(rest);
        const [updated] = await db.update(schema.preOpRubros)
            .set(cleaned)
            .where(eq(schema.preOpRubros.id, parseInt(req.params.id)))
            .returning();
        res.json(updated);
    } catch (error) { handleError(res, error); }
});

app.get('/api/pre-op-expenses', async (req, res) => {
    try {
        const data = await db.query.preOpExpenses.findMany({
            orderBy: [desc(schema.preOpExpenses.fecha)]
        });
        res.json(data);
    } catch (error) { handleError(res, error); }
});

app.post('/api/pre-op-expenses', async (req, res) => {
    try {
        const cleaned = cleanData(req.body);
        const [inserted] = await db.insert(schema.preOpExpenses).values(cleaned).returning();
        res.json(inserted);
    } catch (error) { handleError(res, error); }
});

// --- AUDIT LOGS ---
app.get('/api/audit-logs', async (req, res) => {
    try {
        const data = await db.query.auditLogs.findMany({
            orderBy: [desc(schema.auditLogs.timestamp)],
            limit: 100
        });
        res.json(data);
    } catch (error) { handleError(res, error); }
});
// --- ADMIN: Sync all sequences (dev only) ---
// --- ADMIN: Run migration to add source tracking to prospects ---
app.post('/api/admin/migrate-prospect-source', async (req, res) => {
    try {
        // Add source and source_bono_id columns (idempotent)
        await db.execute(sql`
            ALTER TABLE prospects ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'Manual';
        `);
        await db.execute(sql`
            ALTER TABLE prospects ADD COLUMN IF NOT EXISTS source_bono_id INTEGER;
        `);

        // Enable Realtime for the prospects table (if supported)
        try {
            await db.execute(sql`
                ALTER PUBLICATION supabase_realtime ADD TABLE prospects;
            `);
        } catch (e: any) {
            // Ignore if already added or publication doesn't exist
            console.log('Realtime publication note:', e.message);
        }

        res.json({ message: 'Migration successful: source + source_bono_id columns added to prospects. Realtime enabled.' });
    } catch (error) {
        console.error('Migration error:', error);
        handleError(res, error);
    }
});

app.post('/api/admin/sync-sequences', async (req, res) => {
    try {
        const result = await db.execute(sql`
            SELECT 
                t.table_name,
                c.column_name,
                pg_get_serial_sequence(t.table_name::text, c.column_name::text) AS seq_name
            FROM information_schema.tables t
            JOIN information_schema.columns c ON c.table_name = t.table_name AND c.table_schema = t.table_schema
            WHERE t.table_schema = 'public'
              AND t.table_type = 'BASE TABLE'
              AND c.column_default LIKE 'nextval%'
            ORDER BY t.table_name
        `);

        const rows = result.rows as any[];
        const results: any[] = [];
        let fixedCount = 0;

        for (const row of rows) {
            if (!row.seq_name) continue;
            
            const maxRes = await db.execute(sql.raw(`SELECT COALESCE(MAX(${row.column_name}), 0) AS max_val FROM ${row.table_name}`));
            const maxVal = parseInt((maxRes.rows[0] as any)?.max_val || '0');
            
            const seqRes = await db.execute(sql.raw(`SELECT last_value FROM ${row.seq_name}`));
            const currentSeqVal = parseInt((seqRes.rows[0] as any)?.last_value || '0');

            if (currentSeqVal <= maxVal) {
                const newVal = maxVal + 1;
                await db.execute(sql.raw(`SELECT setval('${row.seq_name}', ${newVal}, false)`));
                results.push({ table: row.table_name, column: row.column_name, status: 'FIXED', from: currentSeqVal, to: newVal, maxId: maxVal });
                fixedCount++;
            } else {
                results.push({ table: row.table_name, column: row.column_name, status: 'OK', seq: currentSeqVal, maxId: maxVal });
            }
        }

        res.json({ message: `Sync complete. ${fixedCount} sequences fixed of ${rows.length} total.`, results });
    } catch (error) {
        console.error('Error syncing sequences:', error);
        handleError(res, error);
    }
});
// --- ADMIN: Seed base data (roles + admin user) ---
app.post('/api/admin/seed', async (req, res) => {
    try {
        // Check if roles exist
        const existingRoles = await db.select().from(schema.roles);
        if (existingRoles.length > 0) {
            return res.json({ message: 'Seed skipped — roles already exist.', rolesCount: existingRoles.length });
        }

        // Insert all 6 base roles matching MOCK_ROLES
        const rolesToInsert = [
            { name: 'Gerente General', description: 'Acceso total y todas las aprobaciones.', isDefault: true, permissions: {} },
            { name: 'Director de proyectos', description: 'Gestiona proyectos y aprueba solicitudes iniciales.', permissions: {}, maxItemOveragePercentage: '10', maxProjectOveragePercentage: '5' },
            { name: 'Encargado de proyectos', description: 'Crea solicitudes y gestiona el día a día de los proyectos.', permissions: {} },
            { name: 'Director financiero', description: 'Gestiona finanzas, aprueba órdenes de compra y pagos.', permissions: {}, maxItemOveragePercentage: '15', maxProjectOveragePercentage: '8' },
            { name: 'Proveeduria', description: 'Gestiona cotizaciones y órdenes de compra.', permissions: {} },
            { name: 'Director de Ventas', description: 'Gestiona el equipo de ventas, prospectos y ofertas.', permissions: {} },
        ];

        const insertedRoles = await db.insert(schema.roles).values(rolesToInsert).returning();
        console.log('Seeded roles:', insertedRoles.map(r => `${r.id}: ${r.name}`));

        // Check if admin user exists
        const existingUsers = await db.select().from(schema.users);
        if (existingUsers.length > 0) {
            return res.json({ message: 'Roles seeded, users already exist.', roles: insertedRoles.length, users: existingUsers.length });
        }

        // Insert admin user
        const [adminUser] = await db.insert(schema.users).values({
            name: 'Usuario Administrador',
            email: 'admin@flowerp.com',
            avatar: 'https://picsum.photos/seed/flowerp/100',
            status: 'Active',
        }).returning();

        // Assign Gerente General role (first role inserted)
        const gerenteRole = insertedRoles.find(r => r.name === 'Gerente General');
        if (gerenteRole && adminUser) {
            await db.insert(schema.userRoles).values({ userId: adminUser.id, roleId: gerenteRole.id });
        }

        // Sync sequences after seed
        await db.execute(sql.raw(`SELECT setval(pg_get_serial_sequence('roles', 'id'), COALESCE(MAX(id), 0) + 1, false) FROM roles`));
        await db.execute(sql.raw(`SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE(MAX(id), 0) + 1, false) FROM users`));

        res.json({
            message: 'Seed complete!',
            roles: insertedRoles.map(r => ({ id: r.id, name: r.name })),
            adminUser: { id: adminUser.id, name: adminUser.name, email: adminUser.email }
        });
    } catch (error) {
        console.error('Error seeding data:', error);
        handleError(res, error);
    }
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Backend server successfully started and running at http://localhost:${port}`);
});
