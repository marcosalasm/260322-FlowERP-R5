"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: '.env.local' });
var express_1 = __importDefault(require("express"));
var cors_1 = __importDefault(require("cors"));
var jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
var index_1 = require("./db/index");
var schema = __importStar(require("./db/schema"));
var drizzle_orm_1 = require("drizzle-orm");
var puppeteer_1 = __importDefault(require("puppeteer"));
var supabase_js_1 = require("@supabase/supabase-js");
var nodemailer_1 = __importDefault(require("nodemailer"));
var supabaseUrl = process.env.VITE_SUPABASE_URL || '';
var supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
var supabase = process.env.VITE_SUPABASE_URL ? (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey) : null;
var app = (0, express_1.default)();
var port = parseInt(process.env.PORT || '3001', 10);
console.log('--- Server Initializing ---');
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Database URL configured:', process.env.DATABASE_URL ? 'Yes (hidden)' : 'No');
console.log('Supabase JWT Secret configured:', process.env.SUPABASE_JWT_SECRET ? 'Yes (hidden)' : 'No');
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ limit: '10mb', extended: true }));
// --- EMAIL TRANSPORTER CONFIG ---
var mailTransporter = null;
var initEmailTransporter = function () { return __awaiter(void 0, void 0, void 0, function () {
    var testAccount, e_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                if (!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)) return [3 /*break*/, 1];
                mailTransporter = nodemailer_1.default.createTransport({
                    host: process.env.SMTP_HOST,
                    port: parseInt(process.env.SMTP_PORT || '587', 10),
                    secure: process.env.SMTP_SECURE === 'true',
                    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
                });
                console.log('--- Email Transporter Initialized (SMTP) ---');
                return [3 /*break*/, 3];
            case 1:
                console.log('--- Email Transporter Initialized (Ethereal Fallback) ---');
                return [4 /*yield*/, nodemailer_1.default.createTestAccount()];
            case 2:
                testAccount = _a.sent();
                mailTransporter = nodemailer_1.default.createTransport({
                    host: "smtp.ethereal.email",
                    port: 587,
                    secure: false,
                    auth: { user: testAccount.user, pass: testAccount.pass },
                });
                _a.label = 3;
            case 3: return [3 /*break*/, 5];
            case 4:
                e_1 = _a.sent();
                console.error("Email setup failed", e_1);
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
initEmailTransporter();
var sendWelcomeEmail = function (email, name, password) { return __awaiter(void 0, void 0, void 0, function () {
    var info, e_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!mailTransporter)
                    return [2 /*return*/];
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, mailTransporter.sendMail({
                        from: '"FlowERP Admin" <admin@flowerp.com>',
                        to: email,
                        subject: "Bienvenido a FlowERP - Credenciales de Acceso",
                        html: "\n                <div style=\"font-family: Arial, sans-serif; padding: 20px;\">\n                    <h2 style=\"color: #3b82f6;\">Bienvenido a FlowERP</h2>\n                    <p>Hola <strong>".concat(name, "</strong>,</p>\n                    <p>Tu cuenta ha sido creada exitosamente. Ahora puedes ingresar al sistema utilizando las siguientes credenciales:</p>\n                    <div style=\"background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;\">\n                        <p><strong>URL de Acceso:</strong> <a href=\"").concat(process.env.VITE_APP_URL || 'http://localhost:5173', "\">Ingresar a la aplicaci\u00F3n</a></p>\n                        <p><strong>Usuario / Correo:</strong> ").concat(email, "</p>\n                        ").concat(password ? "<p><strong>Contrase\u00F1a Temporal:</strong> ".concat(password, "</p>") : '', "\n                    </div>\n                    <p style=\"color: #64748b; font-size: 12px;\">Por razones de seguridad, te recomendamos cambiar tu contrase\u00F1a una vez que hayas ingresado por primera vez o seguir los pasos indicados en la pantalla de inicio de sesi\u00F3n de la aplicaci\u00F3n.</p>\n                    <br />\n                    <p>Saludos,<br />El equipo de FlowERP</p>\n                </div>\n            "),
                    })];
            case 2:
                info = _a.sent();
                console.log("Welcome email sent: %s", info.messageId);
                if (info.messageId && typeof mailTransporter.options === 'object' && mailTransporter.options.host === 'smtp.ethereal.email') {
                    console.log("Email Preview URL: %s", nodemailer_1.default.getTestMessageUrl(info));
                }
                return [3 /*break*/, 4];
            case 3:
                e_2 = _a.sent();
                console.error("Failed to send welcome email:", e_2);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
// --- 1. GLOBAL AUTHENTICATION MIDDLEWARE ---
// Validates Supabase JWT and resolves the app user
var requireAdminOrOwnerRole = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var authHeader, token, decoded, email, appUser, dbError_1, jwtError_1, defaultUser, dbError_2, e_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 11, , 12]);
                authHeader = req.headers['authorization'];
                token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
                if (!(token && process.env.SUPABASE_JWT_SECRET)) return [3 /*break*/, 7];
                _a.label = 1;
            case 1:
                _a.trys.push([1, 6, , 7]);
                decoded = jsonwebtoken_1.default.verify(token, process.env.SUPABASE_JWT_SECRET);
                email = decoded.email;
                if (!email) return [3 /*break*/, 5];
                _a.label = 2;
            case 2:
                _a.trys.push([2, 4, , 5]);
                return [4 /*yield*/, index_1.db.query.users.findFirst({
                        where: (0, drizzle_orm_1.eq)(schema.users.email, email),
                        with: { userRoles: { with: { role: true } } }
                    })];
            case 3:
                appUser = _a.sent();
                if (appUser) {
                    req.user = {
                        id: appUser.id,
                        email: appUser.email,
                        isAdmin: true, // Role-based logic can be added here
                        supabaseId: decoded.sub,
                    };
                    return [2 /*return*/, next()];
                }
                return [3 /*break*/, 5];
            case 4:
                dbError_1 = _a.sent();
                console.warn('DB lookup by email failed:', dbError_1.message);
                return [3 /*break*/, 5];
            case 5: return [3 /*break*/, 7];
            case 6:
                jwtError_1 = _a.sent();
                console.warn('JWT verification failed:', jwtError_1.message);
                return [3 /*break*/, 7];
            case 7:
                _a.trys.push([7, 9, , 10]);
                return [4 /*yield*/, index_1.db.query.users.findFirst({
                        with: { userRoles: { with: { role: true } } }
                    })];
            case 8:
                defaultUser = _a.sent();
                req.user = defaultUser
                    ? { id: defaultUser.id, email: defaultUser.email, isAdmin: true }
                    : { id: 0, isAdmin: false };
                return [3 /*break*/, 10];
            case 9:
                dbError_2 = _a.sent();
                console.warn('DB fallback user lookup failed, using anonymous user:', dbError_2.message);
                req.user = { id: 0, isAdmin: false };
                return [3 /*break*/, 10];
            case 10: return [2 /*return*/, next()];
            case 11:
                e_3 = _a.sent();
                console.error('Security Middleware Error:', e_3);
                return [2 /*return*/, res.status(500).json({ error: 'Error verificando autorización y roles' })];
            case 12: return [2 /*return*/];
        }
    });
}); };
app.use('/api', requireAdminOrOwnerRole);
// Helper for error handling
var handleError = function (res, error) {
    console.error('Error details:', error);
    if (error.stack)
        console.error('Stack trace:', error.stack);
    res.status(500).json({
        error: error.message,
        details: error
    });
};
// --- AUDIT LOGGING HELPER ---
var logAudit = function (userId, userName, action, entityType, entityId, details) { return __awaiter(void 0, void 0, void 0, function () {
    var error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, index_1.db.insert(schema.auditLogs).values({
                        userId: userId,
                        userName: userName,
                        action: action,
                        entityType: entityType,
                        entityId: entityId,
                        details: details ? JSON.stringify(details) : null
                    })];
            case 1:
                _a.sent();
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                console.error('Audit logging failed:', error_1);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
// --- USERS & ROLES ---
app.get('/api/users', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, index_1.db.query.users.findMany({
                        with: { userRoles: true }
                    })];
            case 1:
                data = _a.sent();
                res.json(data);
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                handleError(res, error_2);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.post('/api/users', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, roleIds, password, userData, _b, authData, authError, cleaned, newUser, createdUserId_1, rolesToInsert, error_3;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 7, , 8]);
                _a = req.body, roleIds = _a.roleIds, password = _a.password, userData = __rest(_a, ["roleIds", "password"]);
                if (!(supabase && password)) return [3 /*break*/, 2];
                return [4 /*yield*/, supabase.auth.signUp({
                        email: userData.email,
                        password: password,
                    })];
            case 1:
                _b = _c.sent(), authData = _b.data, authError = _b.error;
                if (authError) {
                    console.error("Supabase Auth Error:", authError);
                    return [2 /*return*/, res.status(400).json({ error: "Supabase Auth failed: ".concat(authError.message) })];
                }
                _c.label = 2;
            case 2:
                cleaned = cleanData(userData);
                return [4 /*yield*/, index_1.db.insert(schema.users).values(cleaned).returning()];
            case 3:
                newUser = _c.sent();
                createdUserId_1 = newUser[0].id;
                if (!(roleIds && roleIds.length > 0)) return [3 /*break*/, 5];
                rolesToInsert = roleIds.map(function (roleId) { return ({
                    userId: createdUserId_1,
                    roleId: roleId
                }); });
                return [4 /*yield*/, index_1.db.insert(schema.userRoles).values(rolesToInsert)];
            case 4:
                _c.sent();
                _c.label = 5;
            case 5: 
            // 4. Send the welcome email with credentials
            return [4 /*yield*/, sendWelcomeEmail(userData.email, userData.name, password)];
            case 6:
                // 4. Send the welcome email with credentials
                _c.sent();
                res.json(newUser[0]);
                return [3 /*break*/, 8];
            case 7:
                error_3 = _c.sent();
                handleError(res, error_3);
                return [3 /*break*/, 8];
            case 8: return [2 /*return*/];
        }
    });
}); });
app.put('/api/users/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, id, createdAt, roleIds, rest, cleaned, updated, rolesToInsert, error_4;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 5, , 6]);
                _a = req.body, id = _a.id, createdAt = _a.createdAt, roleIds = _a.roleIds, rest = __rest(_a, ["id", "createdAt", "roleIds"]);
                cleaned = cleanData(rest);
                return [4 /*yield*/, index_1.db.update(schema.users)
                        .set(cleaned)
                        .where((0, drizzle_orm_1.eq)(schema.users.id, parseInt(req.params.id)))
                        .returning()];
            case 1:
                updated = (_b.sent())[0];
                if (!roleIds) return [3 /*break*/, 4];
                // Update user roles
                return [4 /*yield*/, index_1.db.delete(schema.userRoles).where((0, drizzle_orm_1.eq)(schema.userRoles.userId, parseInt(req.params.id)))];
            case 2:
                // Update user roles
                _b.sent();
                rolesToInsert = roleIds.map(function (roleId) { return ({
                    userId: parseInt(req.params.id),
                    roleId: roleId
                }); });
                return [4 /*yield*/, index_1.db.insert(schema.userRoles).values(rolesToInsert)];
            case 3:
                _b.sent();
                _b.label = 4;
            case 4:
                res.json(updated);
                return [3 /*break*/, 6];
            case 5:
                error_4 = _b.sent();
                handleError(res, error_4);
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); });
app.delete('/api/users/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, index_1.db.delete(schema.users).where((0, drizzle_orm_1.eq)(schema.users.id, parseInt(req.params.id)))];
            case 1:
                _a.sent();
                res.json({ success: true });
                return [3 /*break*/, 3];
            case 2:
                error_5 = _a.sent();
                handleError(res, error_5);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Roles
app.get('/api/roles', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, index_1.db.query.roles.findMany()];
            case 1:
                data = _a.sent();
                res.json(data);
                return [3 /*break*/, 3];
            case 2:
                error_6 = _a.sent();
                handleError(res, error_6);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.post('/api/roles', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var cleaned, newRole, error_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                cleaned = cleanData(req.body);
                return [4 /*yield*/, index_1.db.insert(schema.roles).values(cleaned).returning()];
            case 1:
                newRole = (_a.sent())[0];
                res.json(newRole);
                return [3 /*break*/, 3];
            case 2:
                error_7 = _a.sent();
                handleError(res, error_7);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.put('/api/roles/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, id, rest, cleaned, updated, error_8;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, id = _a.id, rest = __rest(_a, ["id"]);
                cleaned = cleanData(rest);
                return [4 /*yield*/, index_1.db.update(schema.roles)
                        .set(cleaned)
                        .where((0, drizzle_orm_1.eq)(schema.roles.id, parseInt(req.params.id)))
                        .returning()];
            case 1:
                updated = (_b.sent())[0];
                res.json(updated);
                return [3 /*break*/, 3];
            case 2:
                error_8 = _b.sent();
                handleError(res, error_8);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.delete('/api/roles/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var error_9;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, index_1.db.delete(schema.roles).where((0, drizzle_orm_1.eq)(schema.roles.id, parseInt(req.params.id)))];
            case 1:
                _a.sent();
                res.json({ success: true });
                return [3 /*break*/, 3];
            case 2:
                error_9 = _a.sent();
                handleError(res, error_9);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// --- PROJECTS & PROSPECTS ---
app.get('/api/projects', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data, error_10;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, index_1.db.query.projects.findMany({
                        orderBy: [(0, drizzle_orm_1.desc)(schema.projects.createdAt)]
                    })];
            case 1:
                data = _a.sent();
                res.json(data);
                return [3 /*break*/, 3];
            case 2:
                error_10 = _a.sent();
                handleError(res, error_10);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.post('/api/projects', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var cleaned, newProject, error_11;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                cleaned = cleanData(req.body);
                return [4 /*yield*/, index_1.db.insert(schema.projects).values(cleaned).returning()];
            case 1:
                newProject = (_a.sent())[0];
                res.json(newProject);
                return [3 /*break*/, 3];
            case 2:
                error_11 = _a.sent();
                handleError(res, error_11);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.get('/api/accounts-receivable', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data, error_12;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, index_1.db.query.accountsReceivable.findMany()];
            case 1:
                data = _a.sent();
                res.json(data);
                return [3 /*break*/, 3];
            case 2:
                error_12 = _a.sent();
                handleError(res, error_12);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.post('/api/accounts-receivable', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var cleaned, newAR, error_13;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                cleaned = cleanData(req.body);
                return [4 /*yield*/, index_1.db.insert(schema.accountsReceivable).values(cleaned).returning()];
            case 1:
                newAR = (_a.sent())[0];
                res.json(newAR);
                return [3 /*break*/, 3];
            case 2:
                error_13 = _a.sent();
                handleError(res, error_13);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.put('/api/accounts-receivable/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, id, rest, cleaned, updated, error_14;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, id = _a.id, rest = __rest(_a, ["id"]);
                cleaned = cleanData(rest);
                return [4 /*yield*/, index_1.db.update(schema.accountsReceivable)
                        .set(cleaned)
                        .where((0, drizzle_orm_1.eq)(schema.accountsReceivable.id, parseInt(req.params.id)))
                        .returning()];
            case 1:
                updated = (_b.sent())[0];
                res.json(updated);
                return [3 /*break*/, 3];
            case 2:
                error_14 = _b.sent();
                handleError(res, error_14);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
var cleanData = function (data) {
    var cleaned = __assign({}, data);
    Object.keys(cleaned).forEach(function (key) {
        var value = cleaned[key];
        if (value === '' || (typeof value === 'string' && value.trim() === '')) {
            cleaned[key] = null;
        }
    });
    return cleaned;
};
app.get('/api/prospects', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data, error_15;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, index_1.db.query.prospects.findMany({
                        orderBy: [(0, drizzle_orm_1.desc)(schema.prospects.createdAt)]
                    })];
            case 1:
                data = _a.sent();
                res.json(data);
                return [3 /*break*/, 3];
            case 2:
                error_15 = _a.sent();
                handleError(res, error_15);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Check for duplicate prospect by name (for automated creation)
app.get('/api/prospects/check-duplicate', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var name_1, existing, error_16;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                name_1 = req.query.name;
                if (!name_1)
                    return [2 /*return*/, res.json({ exists: false })];
                return [4 /*yield*/, index_1.db.select().from(schema.prospects)
                        .where((0, drizzle_orm_1.eq)(schema.prospects.name, name_1))
                        .limit(1)];
            case 1:
                existing = _a.sent();
                res.json({ exists: existing.length > 0, prospect: existing[0] || null });
                return [3 /*break*/, 3];
            case 2:
                error_16 = _a.sent();
                handleError(res, error_16);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.post('/api/prospects', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, _frontendId, body, safeData, newProspect, error_17;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, _frontendId = _a.id, body = __rest(_a, ["id"]);
                safeData = {
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
                return [4 /*yield*/, index_1.db.insert(schema.prospects).values(cleanData(safeData)).returning()];
            case 1:
                newProspect = (_b.sent())[0];
                res.json(newProspect);
                return [3 /*break*/, 3];
            case 2:
                error_17 = _b.sent();
                handleError(res, error_17);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.put('/api/prospects/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, id, createdAt, rest, cleanedBody, updated, error_18;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, id = _a.id, createdAt = _a.createdAt, rest = __rest(_a, ["id", "createdAt"]);
                cleanedBody = cleanData(rest);
                return [4 /*yield*/, index_1.db.update(schema.prospects)
                        .set(cleanedBody)
                        .where((0, drizzle_orm_1.eq)(schema.prospects.id, parseInt(req.params.id)))
                        .returning()];
            case 1:
                updated = (_b.sent())[0];
                res.json(updated);
                return [3 /*break*/, 3];
            case 2:
                error_18 = _b.sent();
                handleError(res, error_18);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.delete('/api/prospects/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var error_19;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, index_1.db.delete(schema.prospects).where((0, drizzle_orm_1.eq)(schema.prospects.id, parseInt(req.params.id)))];
            case 1:
                _a.sent();
                res.json({ success: true });
                return [3 /*break*/, 3];
            case 2:
                error_19 = _a.sent();
                handleError(res, error_19);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// --- SUPPLIERS ---
app.get('/api/suppliers', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data, error_20;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, index_1.db.query.suppliers.findMany({
                        orderBy: [(0, drizzle_orm_1.desc)(schema.suppliers.id)]
                    })];
            case 1:
                data = _a.sent();
                res.json(data);
                return [3 /*break*/, 3];
            case 2:
                error_20 = _a.sent();
                handleError(res, error_20);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.post('/api/suppliers', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, _frontendId, supplierData, cleaned, newSupplier, error_21;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                console.log('POST /api/suppliers - Received:', req.body);
                _a = req.body, _frontendId = _a.id, supplierData = __rest(_a, ["id"]);
                cleaned = cleanData(supplierData);
                console.log('POST /api/suppliers - Cleaned:', cleaned);
                return [4 /*yield*/, index_1.db.insert(schema.suppliers).values(cleaned).returning()];
            case 1:
                newSupplier = (_b.sent())[0];
                console.log('POST /api/suppliers - Created:', newSupplier);
                res.json(newSupplier);
                return [3 /*break*/, 3];
            case 2:
                error_21 = _b.sent();
                handleError(res, error_21);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.put('/api/suppliers/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, id, rest, cleaned, updated, error_22;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, id = _a.id, rest = __rest(_a, ["id"]);
                cleaned = cleanData(rest);
                return [4 /*yield*/, index_1.db.update(schema.suppliers)
                        .set(cleaned)
                        .where((0, drizzle_orm_1.eq)(schema.suppliers.id, parseInt(req.params.id)))
                        .returning()];
            case 1:
                updated = (_b.sent())[0];
                res.json(updated);
                return [3 /*break*/, 3];
            case 2:
                error_22 = _b.sent();
                handleError(res, error_22);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.delete('/api/suppliers/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var error_23;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, index_1.db.delete(schema.suppliers).where((0, drizzle_orm_1.eq)(schema.suppliers.id, parseInt(req.params.id)))];
            case 1:
                _a.sent();
                res.json({ success: true });
                return [3 /*break*/, 3];
            case 2:
                error_23 = _a.sent();
                handleError(res, error_23);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// --- PURCHASING (Service Requests, Quote Responses & Purchase Orders) ---
app.get('/api/service-requests', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data, error_24;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, index_1.db.query.serviceRequests.findMany({
                        with: { items: true, quoteResponses: { with: { items: true } } },
                        orderBy: [(0, drizzle_orm_1.desc)(schema.serviceRequests.createdAt)]
                    })];
            case 1:
                data = _a.sent();
                res.json(data);
                return [3 /*break*/, 3];
            case 2:
                error_24 = _a.sent();
                handleError(res, error_24);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// --- PDF GENERATION ---
app.post('/api/service-requests/:id/pdf', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var requestId, companyInfo, request, dateStr, project, itemsRows, logoHtml, addressHtml, htmlContent, browser, page, pdfBuffer, pdfBase64, dataUrl, error_25;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 8, , 9]);
                requestId = parseInt(req.params.id);
                companyInfo = req.body.companyInfo;
                return [4 /*yield*/, index_1.db.query.serviceRequests.findFirst({
                        where: (0, drizzle_orm_1.eq)(schema.serviceRequests.id, requestId),
                        with: { items: true }
                    })];
            case 1:
                request = _a.sent();
                if (!request)
                    return [2 /*return*/, res.status(404).json({ error: 'Requisición no encontrada' })];
                if (!supabase) {
                    throw new Error('Supabase Client no inicializado. Faltan variables de entorno.');
                }
                dateStr = request.requestDate ? new Date(request.requestDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A';
                project = request.projectName || 'Sin proyecto';
                itemsRows = request.items && request.items.length > 0 ? request.items.map(function (item, index) { return "\n            <tr>\n                <td>".concat(index + 1, "</td>\n                <td>").concat(item.name || '', "</td>\n                <td>").concat(item.unit || '', "</td>\n                <td>").concat(item.quantity != null ? Number(item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/,/g, '\u202F').replace(/\./g, ',') : 0, "</td>\n            </tr>\n        "); }).join('') : '<tr><td colspan="4" style="text-align: center; color: #666; font-style: italic; padding: 20px;">No hay artículos en esta solicitud</td></tr>';
                logoHtml = (companyInfo === null || companyInfo === void 0 ? void 0 : companyInfo.logoBase64)
                    ? "<img src=\"".concat(companyInfo.logoBase64, "\" class=\"logo\" />")
                    : '<div style="font-size: 24px; font-weight: 800; color: #3b82f6;">FlowERP</div>';
                addressHtml = (companyInfo === null || companyInfo === void 0 ? void 0 : companyInfo.address) ? companyInfo.address.replace(/\\n/g, '<br/>') : '';
                htmlContent = "\n        <!DOCTYPE html>\n        <html>\n        <head>\n            <meta charset=\"UTF-8\">\n            <title>Solicitud de Cotizaci\u00F3n #".concat(request.id, "</title>\n            <style>\n                body { \n                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; \n                    padding: 40px; \n                    color: #1e293b; \n                    background-color: white;\n                    -webkit-font-smoothing: antialiased;\n                }\n                .header { \n                    display: flex; \n                    justify-content: space-between; \n                    align-items: flex-end; \n                    margin-bottom: 20px; \n                    padding-bottom: 20px; \n                    border-bottom: 2px solid #e2e8f0; \n                }\n                .logo { max-width: 240px; max-height: 80px; object-fit: contain; }\n                .title { font-size: 28px; font-weight: 800; text-align: right; color: #0f172a; margin: 0; padding-bottom: 5px; }\n                \n                .info-section { \n                    display: flex; \n                    justify-content: space-between; \n                    margin-top: 30px;\n                    margin-bottom: 40px; \n                    font-size: 14px; \n                    line-height: 1.6;\n                }\n                .info-left, .info-right { width: 48%; }\n                .info-label { font-weight: 700; color: #000; margin-bottom: 4px; font-size: 14px;}\n                \n                table.details { border-collapse: collapse; width: 100%; }\n                table.details td { border: none; padding: 3px 0; text-align: right; }\n                table.details td:first-child { font-weight: 700; color: #000; padding-right: 15px; width: 40%;}\n                table.details td:last-child { color: #334155; }\n                \n                table.items { \n                    width: 100%; \n                    border-collapse: collapse; \n                    margin-bottom: 50px; \n                    font-size: 14px; \n                    box-shadow: 0 1px 3px rgba(0,0,0,0.05);\n                    border: 1px solid #e2e8f0;\n                }\n                table.items th { \n                    background-color: #3b82f6; \n                    color: white; \n                    padding: 12px 16px; \n                    text-align: left; \n                    font-weight: 600;\n                    font-size: 14px;\n                }\n                table.items td { \n                    padding: 12px 16px; \n                    border-bottom: 1px solid #e2e8f0; \n                    color: #475569;\n                }\n                table.items tr:last-child td { border-bottom: none; }\n                table.items tr:nth-child(even) { background-color: #f8fafc; }\n                \n                .notes { \n                    font-size: 11px; \n                    margin-top: auto; \n                    color: #334155;\n                    line-height: 1.5;\n                }\n                .notes-title { \n                    font-weight: 700; \n                    margin-bottom: 15px; \n                    font-size: 14px; \n                    color: #0f172a;\n                }\n                .notes ul { \n                    padding-left: 24px; \n                    margin: 0;\n                }\n                .notes li { \n                    margin-bottom: 8px; \n                    position: relative;\n                    text-transform: uppercase;\n                }\n                .notes li::marker { color: #64748b; }\n            </style>\n        </head>\n        <body>\n            <div class=\"header\">\n                ").concat(logoHtml, "\n                <div class=\"title\">Solicitud de Cotizaci\u00F3n</div>\n            </div>\n\n            <div class=\"info-section\">\n                <div class=\"info-left\">\n                    <div class=\"info-label\">Para:</div>\n                    <div style=\"color: #334155;\">").concat((companyInfo === null || companyInfo === void 0 ? void 0 : companyInfo.name) || 'MS Ingeniería', "</div>\n                    <div style=\"color: #334155; margin-top: 5px;\">").concat(addressHtml, "</div>\n                    <div style=\"color: #334155; margin-top: 5px;\">Email: ").concat((companyInfo === null || companyInfo === void 0 ? void 0 : companyInfo.email) || '', "</div>\n                </div>\n                <div class=\"info-right\">\n                    <table class=\"details\">\n                        <tr><td>ID Solicitud:</td><td>#").concat(request.id, "</td></tr>\n                        <tr><td>Fecha:</td><td>").concat(dateStr, "</td></tr>\n                        <tr><td>Proyecto:</td><td>").concat(project, "</td></tr>\n                    </table>\n                </div>\n            </div>\n\n            <table class=\"items\">\n                <thead>\n                    <tr>\n                        <th style=\"width: 8%\">#</th>\n                        <th style=\"width: 45%\">Nombre del Art\u00EDculo</th>\n                        <th style=\"width: 22%\">Unidad</th>\n                        <th style=\"width: 25%\">Cantidad</th>\n                    </tr>\n                </thead>\n                <tbody>\n                    ").concat(itemsRows, "\n                </tbody>\n            </table>\n\n            <div class=\"notes\">\n                <div class=\"notes-title\">Notas y Consideraciones:</div>\n                <ul style=\"list-style-type: disc;\">\n                    <li>LOS PAGOS CORRESPONDIENTES A LA GESTION DE COMPRAS SE REALIZARAN UNICAMENTE LOS VIERNES.</li>\n                    <li>LOS PRECIOS INDICADOS POR LOS PROVEEDORES SERAN ANALIZADOS Y COMPARADOS CON LAS PROPUESTAS DE POR LO MENOS DOS PROVEEDORES MAS.</li>\n                    <li>SE LE RECUERDA AL PROVEEDOR QUE NO SE DEBE DESPACHAR NINGUN MATERIAL SI NO SE REALIZA EL PAGO O SE ENVIA UNA ORDEN DE COMPRA FIRMADA.</li>\n                </ul>\n            </div>\n        </body>\n        </html>\n        ");
                return [4 /*yield*/, puppeteer_1.default.launch({
                        headless: true,
                        args: [
                            '--no-sandbox',
                            '--disable-setuid-sandbox',
                            '--disable-dev-shm-usage',
                            '--disable-gpu'
                        ]
                    })];
            case 2:
                browser = _a.sent();
                return [4 /*yield*/, browser.newPage()];
            case 3:
                page = _a.sent();
                // Emulate print media type to ensure CSS variables/fonts render correctly for print
                return [4 /*yield*/, page.emulateMediaType('print')];
            case 4:
                // Emulate print media type to ensure CSS variables/fonts render correctly for print
                _a.sent();
                return [4 /*yield*/, page.setContent(htmlContent, { waitUntil: 'domcontentloaded' })];
            case 5:
                _a.sent();
                return [4 /*yield*/, page.pdf({
                        format: 'A4',
                        margin: { top: '0px', bottom: '0px', left: '0px', right: '0px' },
                        printBackground: true
                    })];
            case 6:
                pdfBuffer = _a.sent();
                return [4 /*yield*/, browser.close()];
            case 7:
                _a.sent();
                pdfBase64 = Buffer.from(pdfBuffer).toString('base64');
                dataUrl = "data:application/pdf;base64,".concat(pdfBase64);
                res.json({ url: dataUrl });
                return [3 /*break*/, 9];
            case 8:
                error_25 = _a.sent();
                console.error('Error endpoint generating PDF:', error_25);
                res.status(500).json({ error: 'Error interno generando documento PDF: ' + (error_25 === null || error_25 === void 0 ? void 0 : error_25.message) });
                return [3 /*break*/, 9];
            case 9: return [2 /*return*/];
        }
    });
}); });
app.post('/api/service-requests', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, items_1, _frontendId, requestData_1, fullRequest, error_26;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, items_1 = _a.items, _frontendId = _a.id, requestData_1 = __rest(_a, ["items", "id"]);
                return [4 /*yield*/, index_1.db.transaction(function (tx) { return __awaiter(void 0, void 0, void 0, function () {
                        var safeRequestData, newRequest, safeItems;
                        var _a, _b;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    safeRequestData = {
                                        projectId: requestData_1.projectId || null,
                                        projectName: requestData_1.projectName,
                                        requestDate: requestData_1.requestDate,
                                        requester: requestData_1.requester,
                                        requesterId: requestData_1.requesterId || null,
                                        requiredDate: requestData_1.requiredDate || null,
                                        status: requestData_1.status || 'Pendiente Aprobación Director',
                                        finalJustification: requestData_1.finalJustification || null,
                                        overrunJustification: requestData_1.overrunJustification || null,
                                        isWarranty: (_a = requestData_1.isWarranty) !== null && _a !== void 0 ? _a : false,
                                        isPreOp: (_b = requestData_1.isPreOp) !== null && _b !== void 0 ? _b : false,
                                        prospectId: requestData_1.prospectId || null,
                                        rejectionHistory: requestData_1.rejectionHistory || [],
                                        winnerSelection: requestData_1.winnerSelection || {},
                                    };
                                    return [4 /*yield*/, tx.insert(schema.serviceRequests).values(cleanData(safeRequestData)).returning()];
                                case 1:
                                    newRequest = (_c.sent())[0];
                                    if (!newRequest)
                                        throw new Error("Validation Error: No se pudo crear la requisición.");
                                    if (!(items_1 && items_1.length > 0)) return [3 /*break*/, 3];
                                    safeItems = items_1.map(function (item) {
                                        var _a, _b, _c;
                                        // WHITELIST only valid fields for service_request_items table
                                        return cleanData({
                                            serviceRequestId: newRequest.id,
                                            name: item.name,
                                            quantity: (_a = item.quantity) !== null && _a !== void 0 ? _a : 0,
                                            unit: item.unit || 'unidad',
                                            specifications: item.specifications || null,
                                            isUnforeseen: (_b = item.isUnforeseen) !== null && _b !== void 0 ? _b : false,
                                            unforeseenJustification: item.unforeseenJustification || null,
                                            estimatedUnitCost: (_c = item.estimatedUnitCost) !== null && _c !== void 0 ? _c : null,
                                        });
                                    });
                                    return [4 /*yield*/, tx.insert(schema.serviceRequestItems).values(safeItems)];
                                case 2:
                                    _c.sent();
                                    _c.label = 3;
                                case 3: return [4 /*yield*/, tx.query.serviceRequests.findFirst({
                                        where: (0, drizzle_orm_1.eq)(schema.serviceRequests.id, newRequest.id),
                                        with: { items: true, quoteResponses: { with: { items: true } } }
                                    })];
                                case 4: return [2 /*return*/, _c.sent()];
                            }
                        });
                    }); })];
            case 1:
                fullRequest = _b.sent();
                res.json(fullRequest);
                return [3 /*break*/, 3];
            case 2:
                error_26 = _b.sent();
                console.error('Data Process Aborted (Rollbacked). Error in POST /api/service-requests:', error_26);
                handleError(res, error_26);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.put('/api/service-requests/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var requestId, existingRecord, _a, currentStatus, updateData, cleaned, items, quoteResponses, itemHistory, attachments, id, createdAt, requestDate, projectName, requester, dbUpdateData, updated, fullUpdated, error_27;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 5, , 6]);
                requestId = parseInt(req.params.id);
                if (!(req.user && !req.user.isAdmin)) return [3 /*break*/, 2];
                return [4 /*yield*/, index_1.db.select().from(schema.serviceRequests).where((0, drizzle_orm_1.eq)(schema.serviceRequests.id, requestId))];
            case 1:
                existingRecord = (_b.sent())[0];
                if (!existingRecord)
                    return [2 /*return*/, res.status(404).json({ error: 'Registro no encontrado' })];
                // Verificamos si es el dueño
                if (existingRecord.requesterId !== req.user.id) {
                    return [2 /*return*/, res.status(403).json({ error: 'Violación de Seguridad: No tienes permisos para editar una requisición creada por otro usuario.' })];
                }
                _b.label = 2;
            case 2:
                _a = req.body, currentStatus = _a.currentStatus, updateData = __rest(_a, ["currentStatus"]);
                cleaned = cleanData(updateData);
                items = cleaned.items, quoteResponses = cleaned.quoteResponses, itemHistory = cleaned.itemHistory, attachments = cleaned.attachments, id = cleaned.id, createdAt = cleaned.createdAt, requestDate = cleaned.requestDate, projectName = cleaned.projectName, requester = cleaned.requester, dbUpdateData = __rest(cleaned, ["items", "quoteResponses", "itemHistory", "attachments", "id", "createdAt", "requestDate", "projectName", "requester"]);
                return [4 /*yield*/, index_1.db.update(schema.serviceRequests)
                        .set(dbUpdateData)
                        .where((0, drizzle_orm_1.eq)(schema.serviceRequests.id, requestId))
                        .returning()];
            case 3:
                updated = (_b.sent())[0];
                if (!updated)
                    return [2 /*return*/, res.status(404).json({ error: 'Requisición no encontrada' })];
                return [4 /*yield*/, index_1.db.query.serviceRequests.findFirst({
                        where: (0, drizzle_orm_1.eq)(schema.serviceRequests.id, requestId),
                        with: { items: true, quoteResponses: { with: { items: true } } }
                    })];
            case 4:
                fullUpdated = _b.sent();
                res.json(fullUpdated);
                return [3 /*break*/, 6];
            case 5:
                error_27 = _b.sent();
                console.error('Error in PUT /api/service-requests/:id:', error_27);
                handleError(res, error_27);
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); });
// Quote Responses
app.get('/api/quote-responses', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data, error_28;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, index_1.db.query.quoteResponses.findMany({
                        with: { items: true }
                    })];
            case 1:
                data = _a.sent();
                res.json(data);
                return [3 /*break*/, 3];
            case 2:
                error_28 = _a.sent();
                handleError(res, error_28);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.post('/api/quote-responses', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, items_2, _frontendId, quoteData_1, fullQuote, error_29;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, items_2 = _a.items, _frontendId = _a.id, quoteData_1 = __rest(_a, ["items", "id"]);
                return [4 /*yield*/, index_1.db.transaction(function (tx) { return __awaiter(void 0, void 0, void 0, function () {
                        var safeQuoteData, newQuote, safeItems;
                        var _a, _b;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    safeQuoteData = {
                                        serviceRequestId: quoteData_1.serviceRequestId,
                                        supplierId: quoteData_1.supplierId || null,
                                        supplierName: quoteData_1.supplierName,
                                        quoteNumber: quoteData_1.quoteNumber || null,
                                        deliveryDays: (_a = quoteData_1.deliveryDays) !== null && _a !== void 0 ? _a : 0,
                                        paymentTerms: quoteData_1.paymentTerms || null,
                                        qualityNotes: quoteData_1.qualityNotes || null,
                                        total: (_b = quoteData_1.total) !== null && _b !== void 0 ? _b : 0,
                                        currency: quoteData_1.currency || 'CRC',
                                        pdfAttachmentName: quoteData_1.pdfAttachmentName || null,
                                    };
                                    return [4 /*yield*/, tx.insert(schema.quoteResponses).values(cleanData(safeQuoteData)).returning()];
                                case 1:
                                    newQuote = (_c.sent())[0];
                                    if (!newQuote)
                                        throw new Error("Validation Error: No se pudo crear la respuesta a cotización.");
                                    if (!(items_2 && items_2.length > 0)) return [3 /*break*/, 3];
                                    safeItems = items_2.map(function (item) {
                                        var _a;
                                        // WHITELIST only valid fields for quote_response_items table
                                        return cleanData({
                                            quoteResponseId: newQuote.id,
                                            serviceRequestItemId: item.serviceRequestItemId || null,
                                            unitPrice: (_a = item.unitPrice) !== null && _a !== void 0 ? _a : 0,
                                            quality: item.quality || 'Media',
                                            notes: item.notes || null,
                                        });
                                    });
                                    return [4 /*yield*/, tx.insert(schema.quoteResponseItems).values(safeItems)];
                                case 2:
                                    _c.sent();
                                    _c.label = 3;
                                case 3: return [4 /*yield*/, tx.query.quoteResponses.findFirst({
                                        where: (0, drizzle_orm_1.eq)(schema.quoteResponses.id, newQuote.id),
                                        with: { items: true }
                                    })];
                                case 4: return [2 /*return*/, _c.sent()];
                            }
                        });
                    }); })];
            case 1:
                fullQuote = _b.sent();
                res.json(fullQuote);
                return [3 /*break*/, 3];
            case 2:
                error_29 = _b.sent();
                console.error('Data Process Aborted (Rollbacked). Error in POST /api/quote-responses:', error_29);
                handleError(res, error_29);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Purchase Orders
app.get('/api/purchase-orders', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data, error_30;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, index_1.db.query.purchaseOrders.findMany({
                        with: { items: true },
                        orderBy: [(0, drizzle_orm_1.desc)(schema.purchaseOrders.createdAt)]
                    })];
            case 1:
                data = _a.sent();
                res.json(data);
                return [3 /*break*/, 3];
            case 2:
                error_30 = _a.sent();
                handleError(res, error_30);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.post('/api/purchase-orders', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, items_3, _frontendId, poData, cleaned_1, fullPO, error_31;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, items_3 = _a.items, _frontendId = _a.id, poData = __rest(_a, ["items", "id"]);
                cleaned_1 = cleanData(poData);
                return [4 /*yield*/, index_1.db.transaction(function (tx) { return __awaiter(void 0, void 0, void 0, function () {
                        var newPO, safeItems;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, tx.insert(schema.purchaseOrders).values(cleaned_1).returning()];
                                case 1:
                                    newPO = (_a.sent())[0];
                                    if (!newPO)
                                        throw new Error("Validation Error: No se pudo crear la orden de compra.");
                                    if (!(items_3 && items_3.length > 0)) return [3 /*break*/, 3];
                                    safeItems = items_3.map(function (item) {
                                        var _a, _b;
                                        // WHITELIST only valid fields for purchase_order_items table
                                        return cleanData({
                                            purchaseOrderId: newPO.id,
                                            name: item.name,
                                            quantity: (_a = item.quantity) !== null && _a !== void 0 ? _a : 0,
                                            unit: item.unit || 'unidad',
                                            unitPrice: (_b = item.unitPrice) !== null && _b !== void 0 ? _b : 0,
                                        });
                                    });
                                    return [4 /*yield*/, tx.insert(schema.purchaseOrderItems).values(safeItems)];
                                case 2:
                                    _a.sent();
                                    _a.label = 3;
                                case 3: return [4 /*yield*/, tx.query.purchaseOrders.findFirst({
                                        where: (0, drizzle_orm_1.eq)(schema.purchaseOrders.id, newPO.id),
                                        with: { items: true }
                                    })];
                                case 4: return [2 /*return*/, _a.sent()];
                            }
                        });
                    }); })];
            case 1:
                fullPO = _b.sent();
                res.json(fullPO);
                return [3 /*break*/, 3];
            case 2:
                error_31 = _b.sent();
                console.error('Data Process Aborted (Rollbacked). Error in POST /api/purchase-orders:', error_31);
                handleError(res, error_31);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.put('/api/purchase-orders/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var poId, _a, currentStatus, items, updateData, existing, cleaned, id, createdAt, orderDate, expectedDeliveryDate, projectName, dbUpdateData, updated, fullUpdated, error_32;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 5, , 6]);
                poId = parseInt(req.params.id);
                _a = req.body, currentStatus = _a.currentStatus, items = _a.items, updateData = __rest(_a, ["currentStatus", "items"]);
                if (!(updateData.status === 'Aprobada' || updateData.status === 'Rechazada')) return [3 /*break*/, 2];
                return [4 /*yield*/, index_1.db.select().from(schema.purchaseOrders).where((0, drizzle_orm_1.eq)(schema.purchaseOrders.id, poId))];
            case 1:
                existing = (_b.sent())[0];
                if (existing && existing.status !== 'Pendiente Aprobación Financiera') {
                    return [2 /*return*/, res.status(409).json({ error: 'La orden ya ha sido procesada previamente por otro usuario.' })];
                }
                _b.label = 2;
            case 2:
                cleaned = cleanData(updateData);
                id = cleaned.id, createdAt = cleaned.createdAt, orderDate = cleaned.orderDate, expectedDeliveryDate = cleaned.expectedDeliveryDate, projectName = cleaned.projectName, dbUpdateData = __rest(cleaned, ["id", "createdAt", "orderDate", "expectedDeliveryDate", "projectName"]);
                return [4 /*yield*/, index_1.db.update(schema.purchaseOrders)
                        .set(dbUpdateData)
                        .where((0, drizzle_orm_1.eq)(schema.purchaseOrders.id, poId))
                        .returning()];
            case 3:
                updated = (_b.sent())[0];
                return [4 /*yield*/, index_1.db.query.purchaseOrders.findFirst({
                        where: (0, drizzle_orm_1.eq)(schema.purchaseOrders.id, poId),
                        with: { items: true }
                    })];
            case 4:
                fullUpdated = _b.sent();
                res.json(fullUpdated);
                return [3 /*break*/, 6];
            case 5:
                error_32 = _b.sent();
                console.error('Error in PUT /api/purchase-orders/:id:', error_32);
                handleError(res, error_32);
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); });
// Accounts Payable
app.get('/api/accounts-payable', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data, error_33;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, index_1.db.query.accountsPayable.findMany({
                        orderBy: [(0, drizzle_orm_1.desc)(schema.accountsPayable.invoiceDate)]
                    })];
            case 1:
                data = _a.sent();
                res.json(data);
                return [3 /*break*/, 3];
            case 2:
                error_33 = _a.sent();
                handleError(res, error_33);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.post('/api/accounts-payable', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, payments, apData, cleaned, id, createdAt, dbInsertData, newAP, error_34;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, payments = _a.payments, apData = __rest(_a, ["payments"]);
                cleaned = cleanData(apData);
                id = cleaned.id, createdAt = cleaned.createdAt, dbInsertData = __rest(cleaned, ["id", "createdAt"]);
                return [4 /*yield*/, index_1.db.insert(schema.accountsPayable).values(dbInsertData).returning()];
            case 1:
                newAP = (_b.sent())[0];
                res.json(newAP);
                return [3 /*break*/, 3];
            case 2:
                error_34 = _b.sent();
                console.error('Error in POST /api/accounts-payable:', error_34);
                handleError(res, error_34);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.put('/api/accounts-payable/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var apId, cleaned, id, createdAt, dbUpdateData, updated, error_35;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                apId = parseInt(req.params.id);
                cleaned = cleanData(req.body);
                id = cleaned.id, createdAt = cleaned.createdAt, dbUpdateData = __rest(cleaned, ["id", "createdAt"]);
                return [4 /*yield*/, index_1.db.update(schema.accountsPayable)
                        .set(dbUpdateData)
                        .where((0, drizzle_orm_1.eq)(schema.accountsPayable.id, apId))
                        .returning()];
            case 1:
                updated = (_a.sent())[0];
                res.json(updated);
                return [3 /*break*/, 3];
            case 2:
                error_35 = _a.sent();
                console.error('Error in PUT /api/accounts-payable/:id:', error_35);
                handleError(res, error_35);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.delete('/api/accounts-payable/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var apId, error_36;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                apId = parseInt(req.params.id);
                return [4 /*yield*/, index_1.db.delete(schema.accountsPayable).where((0, drizzle_orm_1.eq)(schema.accountsPayable.id, apId))];
            case 1:
                _a.sent();
                res.json({ success: true });
                return [3 /*break*/, 3];
            case 2:
                error_36 = _a.sent();
                handleError(res, error_36);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Goods Receipts
app.get('/api/goods-receipts', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data, error_37;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, index_1.db.query.goodsReceipts.findMany({
                        with: { items: true },
                        orderBy: [(0, drizzle_orm_1.desc)(schema.goodsReceipts.creationDate)]
                    })];
            case 1:
                data = _a.sent();
                res.json(data);
                return [3 /*break*/, 3];
            case 2:
                error_37 = _a.sent();
                handleError(res, error_37);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.post('/api/goods-receipts', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, items_4, grData, cleaned, id, createdAt, dbInsertData_1, fullGR, error_38;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, items_4 = _a.items, grData = __rest(_a, ["items"]);
                cleaned = cleanData(grData);
                id = cleaned.id, createdAt = cleaned.createdAt, dbInsertData_1 = __rest(cleaned, ["id", "createdAt"]);
                return [4 /*yield*/, index_1.db.transaction(function (tx) { return __awaiter(void 0, void 0, void 0, function () {
                        var newGR, safeItems;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, tx.insert(schema.goodsReceipts).values(dbInsertData_1).returning()];
                                case 1:
                                    newGR = (_a.sent())[0];
                                    if (!newGR)
                                        throw new Error("Validation Error: No se pudo crear la recepción principal.");
                                    if (!(items_4 && items_4.length > 0)) return [3 /*break*/, 3];
                                    safeItems = items_4.map(function (item) {
                                        var _a, _b;
                                        // WHITELIST only valid fields for goods_receipt_items table
                                        return cleanData({
                                            goodsReceiptId: newGR.id,
                                            purchaseOrderItemId: item.purchaseOrderItemId || null,
                                            name: item.name,
                                            quantityOrdered: (_a = item.quantityOrdered) !== null && _a !== void 0 ? _a : 0,
                                            unit: item.unit || 'unidad',
                                            quantityReceived: (_b = item.quantityReceived) !== null && _b !== void 0 ? _b : 0,
                                        });
                                    });
                                    return [4 /*yield*/, tx.insert(schema.goodsReceiptItems).values(safeItems)];
                                case 2:
                                    _a.sent();
                                    _a.label = 3;
                                case 3: return [4 /*yield*/, tx.query.goodsReceipts.findFirst({
                                        where: (0, drizzle_orm_1.eq)(schema.goodsReceipts.id, newGR.id),
                                        with: { items: true }
                                    })];
                                case 4: return [2 /*return*/, _a.sent()];
                            }
                        });
                    }); })];
            case 1:
                fullGR = _b.sent();
                res.json(fullGR);
                return [3 /*break*/, 3];
            case 2:
                error_38 = _b.sent();
                console.error('Data Process Aborted (Rollbacked). Error in POST /api/goods-receipts:', error_38);
                handleError(res, error_38);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.put('/api/goods-receipts/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var grId, _a, items, grData, cleaned, id, createdAt, dbUpdateData, updated, _i, items_5, item, _b, itemId, goodsReceiptId, purchaseOrderItemId, itemUpdateData, fullUpdated, error_39;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 7, , 8]);
                grId = parseInt(req.params.id);
                _a = req.body, items = _a.items, grData = __rest(_a, ["items"]);
                cleaned = cleanData(grData);
                id = cleaned.id, createdAt = cleaned.createdAt, dbUpdateData = __rest(cleaned, ["id", "createdAt"]);
                return [4 /*yield*/, index_1.db.update(schema.goodsReceipts)
                        .set(dbUpdateData)
                        .where((0, drizzle_orm_1.eq)(schema.goodsReceipts.id, grId))
                        .returning()];
            case 1:
                updated = (_c.sent())[0];
                if (!(items && Array.isArray(items))) return [3 /*break*/, 5];
                _i = 0, items_5 = items;
                _c.label = 2;
            case 2:
                if (!(_i < items_5.length)) return [3 /*break*/, 5];
                item = items_5[_i];
                if (!item.id) return [3 /*break*/, 4];
                _b = cleanData(item), itemId = _b.id, goodsReceiptId = _b.goodsReceiptId, purchaseOrderItemId = _b.purchaseOrderItemId, itemUpdateData = __rest(_b, ["id", "goodsReceiptId", "purchaseOrderItemId"]);
                return [4 /*yield*/, index_1.db.update(schema.goodsReceiptItems)
                        .set(itemUpdateData)
                        .where((0, drizzle_orm_1.eq)(schema.goodsReceiptItems.id, itemId))];
            case 3:
                _c.sent();
                _c.label = 4;
            case 4:
                _i++;
                return [3 /*break*/, 2];
            case 5: return [4 /*yield*/, index_1.db.query.goodsReceipts.findFirst({
                    where: (0, drizzle_orm_1.eq)(schema.goodsReceipts.id, grId),
                    with: { items: true }
                })];
            case 6:
                fullUpdated = _c.sent();
                res.json(fullUpdated);
                return [3 /*break*/, 8];
            case 7:
                error_39 = _c.sent();
                console.error('Error in PUT /api/goods-receipts/:id:', error_39);
                handleError(res, error_39);
                return [3 /*break*/, 8];
            case 8: return [2 /*return*/];
        }
    });
}); });
app.delete('/api/goods-receipts/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var grId, error_40;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                grId = parseInt(req.params.id);
                return [4 /*yield*/, index_1.db.delete(schema.goodsReceipts).where((0, drizzle_orm_1.eq)(schema.goodsReceipts.id, grId))];
            case 1:
                _a.sent();
                res.json({ success: true });
                return [3 /*break*/, 3];
            case 2:
                error_40 = _a.sent();
                handleError(res, error_40);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Credit Notes
app.get('/api/credit-notes', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data, error_41;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, index_1.db.query.creditNotes.findMany({
                        with: { items: true },
                        orderBy: [(0, drizzle_orm_1.desc)(schema.creditNotes.creationDate)]
                    })];
            case 1:
                data = _a.sent();
                res.json(data);
                return [3 /*break*/, 3];
            case 2:
                error_41 = _a.sent();
                handleError(res, error_41);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.post('/api/credit-notes', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, items_6, _frontendId, cnData, safeCNData_1, fullCN, error_42;
    var _b, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _d.trys.push([0, 2, , 3]);
                _a = req.body, items_6 = _a.items, _frontendId = _a.id, cnData = __rest(_a, ["items", "id"]);
                safeCNData_1 = {
                    goodsReceiptId: cnData.goodsReceiptId || null,
                    purchaseOrderId: cnData.purchaseOrderId || null,
                    projectId: cnData.projectId || null,
                    supplierId: cnData.supplierId || null,
                    supplierName: cnData.supplierName,
                    creationDate: cnData.creationDate ? new Date(cnData.creationDate) : new Date(),
                    createdBy: cnData.createdBy || null,
                    reason: cnData.reason,
                    totalAmount: (_b = cnData.totalAmount) !== null && _b !== void 0 ? _b : 0,
                    status: cnData.status || 'Pendiente Aprobación',
                    appliedToInvoice: (_c = cnData.appliedToInvoice) !== null && _c !== void 0 ? _c : false,
                    pdfAttachmentName: cnData.pdfAttachmentName || null,
                };
                return [4 /*yield*/, index_1.db.transaction(function (tx) { return __awaiter(void 0, void 0, void 0, function () {
                        var newCN, safeItems;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    console.log('[DEBUG POST /api/credit-notes] safeCNData after cleanData:', JSON.stringify(cleanData(safeCNData_1), null, 2));
                                    return [4 /*yield*/, tx.insert(schema.creditNotes).values(cleanData(safeCNData_1)).returning()];
                                case 1:
                                    newCN = (_a.sent())[0];
                                    if (!newCN)
                                        throw new Error("Validation Error: No se pudo crear la nota de crédito.");
                                    if (!(items_6 && items_6.length > 0)) return [3 /*break*/, 3];
                                    safeItems = items_6.map(function (item) {
                                        var _a, _b, _c;
                                        // WHITELIST only valid fields for credit_note_items table
                                        return cleanData({
                                            creditNoteId: newCN.id,
                                            purchaseOrderItemId: item.purchaseOrderItemId || null,
                                            name: item.name,
                                            quantityToCredit: (_a = item.quantityToCredit) !== null && _a !== void 0 ? _a : 0,
                                            unit: item.unit || 'unidad',
                                            unitPrice: (_b = item.unitPrice) !== null && _b !== void 0 ? _b : 0,
                                            creditAmount: (_c = item.creditAmount) !== null && _c !== void 0 ? _c : 0,
                                        });
                                    });
                                    return [4 /*yield*/, tx.insert(schema.creditNoteItems).values(safeItems)];
                                case 2:
                                    _a.sent();
                                    _a.label = 3;
                                case 3: return [4 /*yield*/, tx.query.creditNotes.findFirst({
                                        where: (0, drizzle_orm_1.eq)(schema.creditNotes.id, newCN.id),
                                        with: { items: true }
                                    })];
                                case 4: return [2 /*return*/, _a.sent()];
                            }
                        });
                    }); })];
            case 1:
                fullCN = _d.sent();
                res.json(fullCN);
                return [3 /*break*/, 3];
            case 2:
                error_42 = _d.sent();
                console.error('Data Process Aborted (Rollbacked). Error in POST /api/credit-notes:', error_42);
                handleError(res, error_42);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.put('/api/credit-notes/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var cnId, _a, items, cnData, cleaned, updated, fullUpdated, error_43;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                cnId = parseInt(req.params.id);
                _a = req.body, items = _a.items, cnData = __rest(_a, ["items"]);
                cleaned = cleanData(cnData);
                return [4 /*yield*/, index_1.db.update(schema.creditNotes)
                        .set(cleaned)
                        .where((0, drizzle_orm_1.eq)(schema.creditNotes.id, cnId))
                        .returning()];
            case 1:
                updated = (_b.sent())[0];
                return [4 /*yield*/, index_1.db.query.creditNotes.findFirst({
                        where: (0, drizzle_orm_1.eq)(schema.creditNotes.id, cnId),
                        with: { items: true }
                    })];
            case 2:
                fullUpdated = _b.sent();
                res.json(fullUpdated);
                return [3 /*break*/, 4];
            case 3:
                error_43 = _b.sent();
                handleError(res, error_43);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// Subcontracts extra endpoints
app.post('/api/subcontracts', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var cleaned, inserted, error_44;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                cleaned = cleanData(req.body);
                return [4 /*yield*/, index_1.db.insert(schema.subcontracts).values(cleaned).returning()];
            case 1:
                inserted = (_a.sent())[0];
                res.json(inserted);
                return [3 /*break*/, 3];
            case 2:
                error_44 = _a.sent();
                handleError(res, error_44);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.put('/api/subcontracts/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, id, rest, cleaned, updated, error_45;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, id = _a.id, rest = __rest(_a, ["id"]);
                cleaned = cleanData(rest);
                return [4 /*yield*/, index_1.db.update(schema.subcontracts)
                        .set(cleaned)
                        .where((0, drizzle_orm_1.eq)(schema.subcontracts.id, parseInt(req.params.id)))
                        .returning()];
            case 1:
                updated = (_b.sent())[0];
                res.json(updated);
                return [3 /*break*/, 3];
            case 2:
                error_45 = _b.sent();
                handleError(res, error_45);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// --- SALES (Offers & Budgets) ---
app.get('/api/offers', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data, mappedData, error_46;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, index_1.db.query.offers.findMany({
                        with: { prospect: true },
                        orderBy: [(0, drizzle_orm_1.desc)(schema.offers.createdAt)]
                    })];
            case 1:
                data = _a.sent();
                mappedData = data.map(function (o) {
                    var _a;
                    return (__assign(__assign({}, o), { budget: o.budgetAmount, prospectName: ((_a = o.prospect) === null || _a === void 0 ? void 0 : _a.name) || 'Prospecto desconocido' }));
                });
                res.json(mappedData);
                return [3 /*break*/, 3];
            case 2:
                error_46 = _a.sent();
                handleError(res, error_46);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.post('/api/offers', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, id, budget, prospectName, prospect, createdAt, rest, dataToInsert, newOffer, mapped, error_47;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, id = _a.id, budget = _a.budget, prospectName = _a.prospectName, prospect = _a.prospect, createdAt = _a.createdAt, rest = __rest(_a, ["id", "budget", "prospectName", "prospect", "createdAt"]);
                dataToInsert = cleanData(__assign(__assign({}, rest), { budgetAmount: budget || rest.budgetAmount }));
                return [4 /*yield*/, index_1.db.insert(schema.offers).values(dataToInsert).returning()];
            case 1:
                newOffer = (_b.sent())[0];
                mapped = __assign(__assign({}, newOffer), { budget: newOffer.budgetAmount, prospectName: prospectName || (prospect === null || prospect === void 0 ? void 0 : prospect.name) || 'N/A' });
                res.json(mapped);
                return [3 /*break*/, 3];
            case 2:
                error_47 = _b.sent();
                handleError(res, error_47);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.put('/api/offers/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, id, budget, prospectName, prospect, createdAt, rest, dataToUpdate, updated, mapped, error_48;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                console.log('PUT /api/offers/' + req.params.id, JSON.stringify(req.body, null, 2));
                _a = req.body, id = _a.id, budget = _a.budget, prospectName = _a.prospectName, prospect = _a.prospect, createdAt = _a.createdAt, rest = __rest(_a, ["id", "budget", "prospectName", "prospect", "createdAt"]);
                dataToUpdate = cleanData(__assign(__assign({}, rest), { budgetAmount: budget !== undefined ? budget : rest.budgetAmount }));
                return [4 /*yield*/, index_1.db.update(schema.offers)
                        .set(dataToUpdate)
                        .where((0, drizzle_orm_1.eq)(schema.offers.id, parseInt(req.params.id)))
                        .returning()];
            case 1:
                updated = (_b.sent())[0];
                if (!updated) {
                    return [2 /*return*/, res.status(404).json({ error: 'Oferta no encontrada' })];
                }
                mapped = __assign(__assign({}, updated), { budget: updated.budgetAmount, prospectName: prospectName || (prospect === null || prospect === void 0 ? void 0 : prospect.name) || 'N/A' });
                res.json(mapped);
                return [3 /*break*/, 3];
            case 2:
                error_48 = _b.sent();
                handleError(res, error_48);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.delete('/api/offers/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var error_49;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, index_1.db.delete(schema.offers).where((0, drizzle_orm_1.eq)(schema.offers.id, parseInt(req.params.id)))];
            case 1:
                _a.sent();
                res.json({ success: true });
                return [3 /*break*/, 3];
            case 2:
                error_49 = _a.sent();
                handleError(res, error_49);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Change Orders
app.get('/api/change-orders', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data, error_50;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, index_1.db.query.changeOrders.findMany({
                        orderBy: [(0, drizzle_orm_1.desc)(schema.changeOrders.createdAt)]
                    })];
            case 1:
                data = _a.sent();
                res.json(data);
                return [3 /*break*/, 3];
            case 2:
                error_50 = _a.sent();
                handleError(res, error_50);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.post('/api/change-orders', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var cleaned, newCO, error_51;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                cleaned = cleanData(req.body);
                return [4 /*yield*/, index_1.db.insert(schema.changeOrders).values(cleaned).returning()];
            case 1:
                newCO = (_a.sent())[0];
                res.json(newCO);
                return [3 /*break*/, 3];
            case 2:
                error_51 = _a.sent();
                handleError(res, error_51);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.put('/api/change-orders/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, id, createdAt, rest, cleaned, updated, error_52;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, id = _a.id, createdAt = _a.createdAt, rest = __rest(_a, ["id", "createdAt"]);
                cleaned = cleanData(rest);
                return [4 /*yield*/, index_1.db.update(schema.changeOrders)
                        .set(cleaned)
                        .where((0, drizzle_orm_1.eq)(schema.changeOrders.id, parseInt(req.params.id)))
                        .returning()];
            case 1:
                updated = (_b.sent())[0];
                res.json(updated);
                return [3 /*break*/, 3];
            case 2:
                error_52 = _b.sent();
                handleError(res, error_52);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Helper to generate consecutive numbers atomically
var generateConsecutive = function (prefix_1) {
    var args_1 = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args_1[_i - 1] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([prefix_1], args_1, true), void 0, function (prefix, txClient) {
        var updated, currentCount;
        if (txClient === void 0) { txClient = index_1.db; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, txClient.insert(schema.systemSequences)
                        .values({ prefix: prefix, lastValue: 1 })
                        .onConflictDoUpdate({
                        target: schema.systemSequences.prefix,
                        set: { lastValue: (0, drizzle_orm_1.sql)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["", " + 1"], ["", " + 1"])), schema.systemSequences.lastValue) }
                    })
                        .returning()];
                case 1:
                    updated = (_a.sent())[0];
                    currentCount = updated.lastValue;
                    return [2 /*return*/, "".concat(prefix, "-").concat(currentCount.toString().padStart(4, '0'))];
            }
        });
    });
};
app.get('/api/budgets', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data, mappedData, error_53;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, index_1.db.query.budgets.findMany({
                        with: {
                            activities: {
                                with: { subActivities: true }
                            },
                            prospect: true
                        },
                        orderBy: [(0, drizzle_orm_1.desc)(schema.budgets.createdAt)]
                    })];
            case 1:
                data = _a.sent();
                mappedData = data.map(function (b) {
                    var _a;
                    return (__assign(__assign({}, b), { prospectName: ((_a = b.prospect) === null || _a === void 0 ? void 0 : _a.name) || 'Prospecto desconocido' }));
                });
                res.json(mappedData);
                return [3 /*break*/, 3];
            case 2:
                error_53 = _a.sent();
                handleError(res, error_53);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.post('/api/budgets', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, activities_1, prospectName, _frontendId, budgetData_1, newBudgetRecord, fullBudget, mapped, error_54;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                _a = req.body, activities_1 = _a.activities, prospectName = _a.prospectName, _frontendId = _a.id, budgetData_1 = __rest(_a, ["activities", "prospectName", "id"]);
                return [4 /*yield*/, index_1.db.transaction(function (tx) { return __awaiter(void 0, void 0, void 0, function () {
                        var consecutiveNumber, _a, _b, _budgetId, safeBudgetData, newBudget, _loop_1, i;
                        var _c;
                        return __generator(this, function (_d) {
                            switch (_d.label) {
                                case 0:
                                    _a = budgetData_1.consecutiveNumber;
                                    if (_a) return [3 /*break*/, 2];
                                    return [4 /*yield*/, generateConsecutive('PRE', tx)];
                                case 1:
                                    _a = (_d.sent());
                                    _d.label = 2;
                                case 2:
                                    consecutiveNumber = _a;
                                    _b = cleanData(__assign(__assign({}, budgetData_1), { consecutiveNumber: consecutiveNumber })), _budgetId = _b.id, safeBudgetData = __rest(_b, ["id"]);
                                    return [4 /*yield*/, tx.insert(schema.budgets).values(safeBudgetData).returning()];
                                case 3:
                                    newBudget = (_d.sent())[0];
                                    if (!newBudget)
                                        throw new Error("Validation Error: No se pudo crear el presupuesto.");
                                    if (!(activities_1 && activities_1.length > 0)) return [3 /*break*/, 7];
                                    _loop_1 = function (i) {
                                        var activityGroup, activityInsertData, newActivity, subActivities, subActivitiesData;
                                        return __generator(this, function (_e) {
                                            switch (_e.label) {
                                                case 0:
                                                    activityGroup = activities_1[i];
                                                    activityInsertData = {
                                                        budgetId: newBudget.id,
                                                        itemNumber: activityGroup.itemNumber || null,
                                                        description: activityGroup.description || 'Sin descripción',
                                                        quantity: (_c = activityGroup.quantity) !== null && _c !== void 0 ? _c : 0,
                                                        unit: activityGroup.unit || 'unidad',
                                                    };
                                                    return [4 /*yield*/, tx.insert(schema.budgetActivities)
                                                            .values(cleanData(activityInsertData))
                                                            .returning()];
                                                case 1:
                                                    newActivity = (_e.sent())[0];
                                                    subActivities = activityGroup.subActivities;
                                                    if (!(subActivities && subActivities.length > 0)) return [3 /*break*/, 3];
                                                    subActivitiesData = subActivities.map(function (sub) {
                                                        var _a, _b, _c, _d;
                                                        // WHITELIST only valid fields for budget_sub_activities table
                                                        return cleanData({
                                                            activityId: newActivity.id,
                                                            itemNumber: sub.itemNumber || null,
                                                            description: sub.description || 'Sin descripción',
                                                            quantity: (_a = sub.quantity) !== null && _a !== void 0 ? _a : 0,
                                                            unit: sub.unit || 'unidad',
                                                            materialUnitCost: (_b = sub.materialUnitCost) !== null && _b !== void 0 ? _b : 0,
                                                            laborUnitCost: (_c = sub.laborUnitCost) !== null && _c !== void 0 ? _c : 0,
                                                            subcontractUnitCost: (_d = sub.subcontractUnitCost) !== null && _d !== void 0 ? _d : 0,
                                                        });
                                                    });
                                                    return [4 /*yield*/, tx.insert(schema.budgetSubActivities).values(subActivitiesData)];
                                                case 2:
                                                    _e.sent();
                                                    _e.label = 3;
                                                case 3: return [2 /*return*/];
                                            }
                                        });
                                    };
                                    i = 0;
                                    _d.label = 4;
                                case 4:
                                    if (!(i < activities_1.length)) return [3 /*break*/, 7];
                                    return [5 /*yield**/, _loop_1(i)];
                                case 5:
                                    _d.sent();
                                    _d.label = 6;
                                case 6:
                                    i++;
                                    return [3 /*break*/, 4];
                                case 7: return [2 /*return*/, newBudget];
                            }
                        });
                    }); })];
            case 1:
                newBudgetRecord = _b.sent();
                return [4 /*yield*/, index_1.db.query.budgets.findFirst({
                        where: (0, drizzle_orm_1.eq)(schema.budgets.id, newBudgetRecord.id),
                        with: {
                            activities: {
                                with: { subActivities: true }
                            }
                        }
                    })];
            case 2:
                fullBudget = _b.sent();
                mapped = __assign(__assign({}, fullBudget), { prospectName: prospectName || 'Prospecto desconocido' });
                res.json(mapped);
                return [3 /*break*/, 4];
            case 3:
                error_54 = _b.sent();
                console.error('Data Process Aborted (Rollbacked). Error in POST /api/budgets:', error_54);
                handleError(res, error_54);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
app.put('/api/budgets/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var budgetId, _a, id, activities, prospect, prospectName, createdAt, budgetData, cleanedBudget, updatedBudget, _loop_2, _i, activities_2, activity, fullUpdatedBudget, error_55;
    var _b, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _d.trys.push([0, 8, , 9]);
                budgetId = parseInt(req.params.id);
                _a = req.body, id = _a.id, activities = _a.activities, prospect = _a.prospect, prospectName = _a.prospectName, createdAt = _a.createdAt, budgetData = __rest(_a, ["id", "activities", "prospect", "prospectName", "createdAt"]);
                cleanedBudget = cleanData(budgetData);
                return [4 /*yield*/, index_1.db.update(schema.budgets)
                        .set(cleanedBudget)
                        .where((0, drizzle_orm_1.eq)(schema.budgets.id, budgetId))
                        .returning()];
            case 1:
                updatedBudget = (_d.sent())[0];
                if (!activities) return [3 /*break*/, 6];
                // Delete all activities for this budget (cascade deletes sub-activities)
                return [4 /*yield*/, index_1.db.delete(schema.budgetActivities).where((0, drizzle_orm_1.eq)(schema.budgetActivities.budgetId, budgetId))];
            case 2:
                // Delete all activities for this budget (cascade deletes sub-activities)
                _d.sent();
                _loop_2 = function (activity) {
                    var activityInsertData, newActivity, subActivities, subsData;
                    return __generator(this, function (_e) {
                        switch (_e.label) {
                            case 0:
                                activityInsertData = {
                                    budgetId: budgetId,
                                    itemNumber: activity.itemNumber || null,
                                    description: activity.description || 'Sin descripción',
                                    quantity: (_b = activity.quantity) !== null && _b !== void 0 ? _b : 0,
                                    unit: activity.unit || 'unidad',
                                };
                                return [4 /*yield*/, index_1.db.insert(schema.budgetActivities)
                                        .values(cleanData(activityInsertData))
                                        .returning()];
                            case 1:
                                newActivity = (_e.sent())[0];
                                subActivities = activity.subActivities;
                                if (!(newActivity && subActivities && subActivities.length > 0)) return [3 /*break*/, 3];
                                subsData = subActivities.map(function (sub) {
                                    var _a, _b, _c, _d;
                                    // WHITELIST only valid fields for budget_sub_activities table
                                    return cleanData({
                                        activityId: newActivity.id,
                                        itemNumber: sub.itemNumber || null,
                                        description: sub.description || 'Sin descripción',
                                        quantity: (_a = sub.quantity) !== null && _a !== void 0 ? _a : 0,
                                        unit: sub.unit || 'unidad',
                                        materialUnitCost: (_b = sub.materialUnitCost) !== null && _b !== void 0 ? _b : 0,
                                        laborUnitCost: (_c = sub.laborUnitCost) !== null && _c !== void 0 ? _c : 0,
                                        subcontractUnitCost: (_d = sub.subcontractUnitCost) !== null && _d !== void 0 ? _d : 0,
                                    });
                                });
                                return [4 /*yield*/, index_1.db.insert(schema.budgetSubActivities).values(subsData)];
                            case 2:
                                _e.sent();
                                _e.label = 3;
                            case 3: return [2 /*return*/];
                        }
                    });
                };
                _i = 0, activities_2 = activities;
                _d.label = 3;
            case 3:
                if (!(_i < activities_2.length)) return [3 /*break*/, 6];
                activity = activities_2[_i];
                return [5 /*yield**/, _loop_2(activity)];
            case 4:
                _d.sent();
                _d.label = 5;
            case 5:
                _i++;
                return [3 /*break*/, 3];
            case 6: return [4 /*yield*/, index_1.db.query.budgets.findFirst({
                    where: (0, drizzle_orm_1.eq)(schema.budgets.id, budgetId),
                    with: {
                        activities: {
                            with: { subActivities: true }
                        },
                        prospect: true
                    }
                })];
            case 7:
                fullUpdatedBudget = _d.sent();
                res.json(__assign(__assign({}, fullUpdatedBudget), { prospectName: ((_c = fullUpdatedBudget === null || fullUpdatedBudget === void 0 ? void 0 : fullUpdatedBudget.prospect) === null || _c === void 0 ? void 0 : _c.name) || prospectName || 'N/A' }));
                return [3 /*break*/, 9];
            case 8:
                error_55 = _d.sent();
                handleError(res, error_55);
                return [3 /*break*/, 9];
            case 9: return [2 /*return*/];
        }
    });
}); });
app.delete('/api/budgets/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var error_56;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, index_1.db.delete(schema.budgets).where((0, drizzle_orm_1.eq)(schema.budgets.id, parseInt(req.params.id)))];
            case 1:
                _a.sent();
                res.json({ success: true });
                return [3 /*break*/, 3];
            case 2:
                error_56 = _a.sent();
                handleError(res, error_56);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// --- INVENTORY & DATABASE ---
app.get('/api/materials', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data, error_57;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, index_1.db.query.materials.findMany()];
            case 1:
                data = _a.sent();
                res.json(data);
                return [3 /*break*/, 3];
            case 2:
                error_57 = _a.sent();
                handleError(res, error_57);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// IMPORTANT: /search route MUST be registered BEFORE /:id to avoid Express
// matching the literal string 'search' as a numeric ID parameter.
app.get('/api/materials/search', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var query_1, data_1, data, error_58;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                query_1 = req.query.q;
                if (!!query_1) return [3 /*break*/, 2];
                return [4 /*yield*/, index_1.db.query.materials.findMany()];
            case 1:
                data_1 = _a.sent();
                return [2 /*return*/, res.json(data_1)];
            case 2: return [4 /*yield*/, index_1.db.query.materials.findMany({
                    where: function (materials, _a) {
                        var ilike = _a.ilike;
                        return ilike(materials.name, "%".concat(query_1, "%"));
                    }
                })];
            case 3:
                data = _a.sent();
                res.json(data);
                return [3 /*break*/, 5];
            case 4:
                error_58 = _a.sent();
                handleError(res, error_58);
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
app.post('/api/materials', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var cleaned, newMaterial, error_59;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                cleaned = cleanData(req.body);
                return [4 /*yield*/, index_1.db.insert(schema.materials).values(cleaned).returning()];
            case 1:
                newMaterial = (_a.sent())[0];
                res.json(newMaterial);
                return [3 /*break*/, 3];
            case 2:
                error_59 = _a.sent();
                handleError(res, error_59);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.put('/api/materials/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, id, lastUpdated, rest, cleaned, updated, error_60;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, id = _a.id, lastUpdated = _a.lastUpdated, rest = __rest(_a, ["id", "lastUpdated"]);
                cleaned = cleanData(rest);
                return [4 /*yield*/, index_1.db.update(schema.materials)
                        .set(__assign(__assign({}, cleaned), { lastUpdated: new Date() }))
                        .where((0, drizzle_orm_1.eq)(schema.materials.id, parseInt(req.params.id)))
                        .returning()];
            case 1:
                updated = (_b.sent())[0];
                res.json(updated);
                return [3 /*break*/, 3];
            case 2:
                error_60 = _b.sent();
                handleError(res, error_60);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.delete('/api/materials/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var error_61;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, index_1.db.delete(schema.materials).where((0, drizzle_orm_1.eq)(schema.materials.id, parseInt(req.params.id)))];
            case 1:
                _a.sent();
                res.json({ success: true });
                return [3 /*break*/, 3];
            case 2:
                error_61 = _a.sent();
                handleError(res, error_61);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.get('/api/service-items', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data, error_62;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, index_1.db.query.serviceItems.findMany()];
            case 1:
                data = _a.sent();
                res.json(data);
                return [3 /*break*/, 3];
            case 2:
                error_62 = _a.sent();
                handleError(res, error_62);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.post('/api/service-items', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var cleaned, newItem, error_63;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                console.log('POST /api/service-items - Received:', req.body);
                cleaned = cleanData(req.body);
                console.log('POST /api/service-items - Cleaned:', cleaned);
                return [4 /*yield*/, index_1.db.insert(schema.serviceItems).values(cleaned).returning()];
            case 1:
                newItem = (_a.sent())[0];
                console.log('POST /api/service-items - Created:', newItem);
                res.json(newItem);
                return [3 /*break*/, 3];
            case 2:
                error_63 = _a.sent();
                handleError(res, error_63);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.put('/api/service-items/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, id, lastUpdated, rest, cleaned, updated, error_64;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, id = _a.id, lastUpdated = _a.lastUpdated, rest = __rest(_a, ["id", "lastUpdated"]);
                cleaned = cleanData(rest);
                return [4 /*yield*/, index_1.db.update(schema.serviceItems)
                        .set(cleaned)
                        .where((0, drizzle_orm_1.eq)(schema.serviceItems.id, parseInt(req.params.id)))
                        .returning()];
            case 1:
                updated = (_b.sent())[0];
                res.json(updated);
                return [3 /*break*/, 3];
            case 2:
                error_64 = _b.sent();
                handleError(res, error_64);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.delete('/api/service-items/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var deleted, error_65;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, index_1.db.delete(schema.serviceItems)
                        .where((0, drizzle_orm_1.eq)(schema.serviceItems.id, parseInt(req.params.id)))
                        .returning()];
            case 1:
                deleted = (_a.sent())[0];
                res.json({ success: true, deleted: deleted });
                return [3 /*break*/, 3];
            case 2:
                error_65 = _a.sent();
                handleError(res, error_65);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.get('/api/labor-items', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data, error_66;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, index_1.db.query.laborItems.findMany()];
            case 1:
                data = _a.sent();
                res.json(data);
                return [3 /*break*/, 3];
            case 2:
                error_66 = _a.sent();
                handleError(res, error_66);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.post('/api/labor-items', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var cleaned, newItem, error_67;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                cleaned = cleanData(req.body);
                return [4 /*yield*/, index_1.db.insert(schema.laborItems).values(cleaned).returning()];
            case 1:
                newItem = (_a.sent())[0];
                res.json(newItem);
                return [3 /*break*/, 3];
            case 2:
                error_67 = _a.sent();
                handleError(res, error_67);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.put('/api/labor-items/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, id, rest, cleaned, updated, error_68;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, id = _a.id, rest = __rest(_a, ["id"]);
                cleaned = cleanData(rest);
                return [4 /*yield*/, index_1.db.update(schema.laborItems)
                        .set(cleaned)
                        .where((0, drizzle_orm_1.eq)(schema.laborItems.id, parseInt(req.params.id)))
                        .returning()];
            case 1:
                updated = (_b.sent())[0];
                res.json(updated);
                return [3 /*break*/, 3];
            case 2:
                error_68 = _b.sent();
                handleError(res, error_68);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.delete('/api/labor-items/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var error_69;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, index_1.db.delete(schema.laborItems).where((0, drizzle_orm_1.eq)(schema.laborItems.id, parseInt(req.params.id)))];
            case 1:
                _a.sent();
                res.json({ success: true });
                return [3 /*break*/, 3];
            case 2:
                error_69 = _a.sent();
                handleError(res, error_69);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.get('/api/recurring-order-templates', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data, error_70;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, index_1.db.query.recurringOrderTemplates.findMany()];
            case 1:
                data = _a.sent();
                res.json(data);
                return [3 /*break*/, 3];
            case 2:
                error_70 = _a.sent();
                handleError(res, error_70);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.post('/api/recurring-order-templates', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var cleaned, newTemplate, error_71;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                cleaned = cleanData(req.body);
                return [4 /*yield*/, index_1.db.insert(schema.recurringOrderTemplates).values(cleaned).returning()];
            case 1:
                newTemplate = (_a.sent())[0];
                res.json(newTemplate);
                return [3 /*break*/, 3];
            case 2:
                error_71 = _a.sent();
                handleError(res, error_71);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.put('/api/recurring-order-templates/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, id, rest, cleaned, updated, error_72;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, id = _a.id, rest = __rest(_a, ["id"]);
                cleaned = cleanData(rest);
                return [4 /*yield*/, index_1.db.update(schema.recurringOrderTemplates)
                        .set(cleaned)
                        .where((0, drizzle_orm_1.eq)(schema.recurringOrderTemplates.id, parseInt(req.params.id)))
                        .returning()];
            case 1:
                updated = (_b.sent())[0];
                res.json(updated);
                return [3 /*break*/, 3];
            case 2:
                error_72 = _b.sent();
                handleError(res, error_72);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.delete('/api/recurring-order-templates/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var error_73;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, index_1.db.delete(schema.recurringOrderTemplates).where((0, drizzle_orm_1.eq)(schema.recurringOrderTemplates.id, parseInt(req.params.id)))];
            case 1:
                _a.sent();
                res.json({ success: true });
                return [3 /*break*/, 3];
            case 2:
                error_73 = _a.sent();
                handleError(res, error_73);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.get('/api/predetermined-activities', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data, error_74;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, index_1.db.query.predeterminedActivities.findMany({
                        with: { subActivities: true }
                    })];
            case 1:
                data = _a.sent();
                res.json(data);
                return [3 /*break*/, 3];
            case 2:
                error_74 = _a.sent();
                handleError(res, error_74);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.post('/api/predetermined-activities', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, subActivities, activityData, cleanedActivity, newActivity_1, subsToInsert, result, error_75;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 5, , 6]);
                console.log('POST /api/predetermined-activities - Received:', JSON.stringify(req.body, null, 2));
                _a = req.body, subActivities = _a.subActivities, activityData = __rest(_a, ["subActivities"]);
                console.log('Activity Data:', activityData);
                console.log('Sub Activities:', subActivities);
                cleanedActivity = cleanData(activityData);
                console.log('Cleaned Activity Data:', cleanedActivity);
                return [4 /*yield*/, index_1.db.insert(schema.predeterminedActivities).values(cleanedActivity).returning()];
            case 1:
                newActivity_1 = (_b.sent())[0];
                console.log('Created Activity:', newActivity_1);
                if (!(newActivity_1 && subActivities && subActivities.length > 0)) return [3 /*break*/, 3];
                subsToInsert = subActivities.map(function (sub) {
                    var id = sub.id, rest = __rest(sub, ["id"]); // Remove existing ID
                    var cleaned = cleanData(__assign(__assign({}, rest), { predeterminedActivityId: newActivity_1.id }));
                    console.log('Sub Activity to Insert:', cleaned);
                    return cleaned;
                });
                console.log('All Sub Activities to Insert:', subsToInsert);
                return [4 /*yield*/, index_1.db.insert(schema.predeterminedSubActivities).values(subsToInsert)];
            case 2:
                _b.sent();
                _b.label = 3;
            case 3: return [4 /*yield*/, index_1.db.query.predeterminedActivities.findFirst({
                    where: (0, drizzle_orm_1.eq)(schema.predeterminedActivities.id, newActivity_1.id),
                    with: { subActivities: true }
                })];
            case 4:
                result = _b.sent();
                console.log('Final Result:', result);
                res.json(result);
                return [3 /*break*/, 6];
            case 5:
                error_75 = _b.sent();
                console.error('ERROR in POST /api/predetermined-activities:', error_75);
                handleError(res, error_75);
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); });
app.put('/api/predetermined-activities/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var activityId_1, _a, id, subActivities, activityData, cleanedActivity, subsToInsert, result, error_76;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 6, , 7]);
                activityId_1 = parseInt(req.params.id);
                _a = req.body, id = _a.id, subActivities = _a.subActivities, activityData = __rest(_a, ["id", "subActivities"]);
                cleanedActivity = cleanData(activityData);
                return [4 /*yield*/, index_1.db.update(schema.predeterminedActivities)
                        .set(cleanedActivity)
                        .where((0, drizzle_orm_1.eq)(schema.predeterminedActivities.id, activityId_1))];
            case 1:
                _b.sent();
                if (!subActivities) return [3 /*break*/, 4];
                // Delete and re-insert sub-activities
                return [4 /*yield*/, index_1.db.delete(schema.predeterminedSubActivities).where((0, drizzle_orm_1.eq)(schema.predeterminedSubActivities.predeterminedActivityId, activityId_1))];
            case 2:
                // Delete and re-insert sub-activities
                _b.sent();
                if (!(subActivities.length > 0)) return [3 /*break*/, 4];
                subsToInsert = subActivities.map(function (sub) {
                    var subId = sub.id, subRest = __rest(sub, ["id"]);
                    return cleanData(__assign(__assign({}, subRest), { predeterminedActivityId: activityId_1 }));
                });
                return [4 /*yield*/, index_1.db.insert(schema.predeterminedSubActivities).values(subsToInsert)];
            case 3:
                _b.sent();
                _b.label = 4;
            case 4: return [4 /*yield*/, index_1.db.query.predeterminedActivities.findFirst({
                    where: (0, drizzle_orm_1.eq)(schema.predeterminedActivities.id, activityId_1),
                    with: { subActivities: true }
                })];
            case 5:
                result = _b.sent();
                res.json(result);
                return [3 /*break*/, 7];
            case 6:
                error_76 = _b.sent();
                handleError(res, error_76);
                return [3 /*break*/, 7];
            case 7: return [2 /*return*/];
        }
    });
}); });
app.delete('/api/predetermined-activities/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var error_77;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, index_1.db.delete(schema.predeterminedActivities).where((0, drizzle_orm_1.eq)(schema.predeterminedActivities.id, parseInt(req.params.id)))];
            case 1:
                _a.sent();
                res.json({ success: true });
                return [3 /*break*/, 3];
            case 2:
                error_77 = _a.sent();
                handleError(res, error_77);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.get('/api/subcontracts', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data, error_78;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, index_1.db.query.subcontracts.findMany({
                        orderBy: [(0, drizzle_orm_1.desc)(schema.subcontracts.creationDate)]
                    })];
            case 1:
                data = _a.sent();
                res.json(data);
                return [3 /*break*/, 3];
            case 2:
                error_78 = _a.sent();
                handleError(res, error_78);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// --- BONOS (Recurring Projects R4) ---
app.get('/api/bonos', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data, error_79;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, index_1.db.query.bonos.findMany({
                        orderBy: [(0, drizzle_orm_1.desc)(schema.bonos.createdAt)]
                    })];
            case 1:
                data = _a.sent();
                res.json(data);
                return [3 /*break*/, 3];
            case 2:
                error_79 = _a.sent();
                handleError(res, error_79);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.post('/api/bonos', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var newBono, error_80;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, index_1.db.insert(schema.bonos).values(req.body).returning()];
            case 1:
                newBono = _a.sent();
                res.json(newBono[0]);
                return [3 /*break*/, 3];
            case 2:
                error_80 = _a.sent();
                handleError(res, error_80);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.post('/api/bonos/transaccion-entregado', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, bonoId, bonoData, prospectData, finalBonoId, _bid, _bca, _bpres, bonoRest, _bid, _bca, _bpres, bonoRest, newBono, bonoError_1, seqErr_1, existingProspects, _pid, _pca, rawProspect, safeProspectData, newProspect, prospectError_1, error_81;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 16, , 17]);
                _a = req.body, bonoId = _a.bonoId, bonoData = _a.bonoData, prospectData = _a.prospectData;
                finalBonoId = bonoId;
                _b.label = 1;
            case 1:
                _b.trys.push([1, 6, , 7]);
                if (!bonoId) return [3 /*break*/, 3];
                _bid = bonoData.id, _bca = bonoData.createdAt, _bpres = bonoData.presupuesto, bonoRest = __rest(bonoData, ["id", "createdAt", "presupuesto"]);
                return [4 /*yield*/, index_1.db.update(schema.bonos)
                        .set(bonoRest)
                        .where((0, drizzle_orm_1.eq)(schema.bonos.id, parseInt(bonoId)))];
            case 2:
                _b.sent();
                return [3 /*break*/, 5];
            case 3:
                _bid = bonoData.id, _bca = bonoData.createdAt, _bpres = bonoData.presupuesto, bonoRest = __rest(bonoData, ["id", "createdAt", "presupuesto"]);
                return [4 /*yield*/, index_1.db.insert(schema.bonos).values(bonoRest).returning()];
            case 4:
                newBono = (_b.sent())[0];
                finalBonoId = newBono.id;
                _b.label = 5;
            case 5: return [3 /*break*/, 7];
            case 6:
                bonoError_1 = _b.sent();
                console.error("Error guardando bono:", bonoError_1);
                return [2 /*return*/, res.status(500).json({ error: "Error al guardar el requisito: ".concat(bonoError_1.message) })];
            case 7:
                _b.trys.push([7, 14, , 15]);
                _b.label = 8;
            case 8:
                _b.trys.push([8, 10, , 11]);
                return [4 /*yield*/, index_1.db.execute((0, drizzle_orm_1.sql)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["SELECT setval(\n                    pg_get_serial_sequence('prospects', 'id'),\n                    COALESCE((SELECT MAX(id) FROM prospects), 0) + 1,\n                    false\n                )"], ["SELECT setval(\n                    pg_get_serial_sequence('prospects', 'id'),\n                    COALESCE((SELECT MAX(id) FROM prospects), 0) + 1,\n                    false\n                )"]))))];
            case 9:
                _b.sent();
                return [3 /*break*/, 11];
            case 10:
                seqErr_1 = _b.sent();
                console.warn('Advertencia al sincronizar secuencia de prospects (no fatal):', seqErr_1.message);
                return [3 /*break*/, 11];
            case 11:
                // 2b. Verificación de duplicados case-insensitive
                console.log('[transaccion-entregado] Verificando duplicados para:', prospectData.name);
                return [4 /*yield*/, index_1.db.execute((0, drizzle_orm_1.sql)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["SELECT id, name FROM prospects WHERE LOWER(name) = LOWER(", ") LIMIT 1"], ["SELECT id, name FROM prospects WHERE LOWER(name) = LOWER(", ") LIMIT 1"])), prospectData.name))];
            case 12:
                existingProspects = _b.sent();
                if (existingProspects.rows && existingProspects.rows.length > 0) {
                    // El prospecto ya existe — no es un error fatal, el bono YA se guardó
                    console.log('[transaccion-entregado] Prospecto ya existe:', existingProspects.rows[0].id);
                    return [2 /*return*/, res.json({
                            success: true,
                            message: "Requisito entregado correctamente. El prospecto \"".concat(prospectData.name, "\" ya exist\u00EDa en el sistema (ID: ").concat(existingProspects.rows[0].id, "), no se cre\u00F3 duplicado."),
                            prospectAlreadyExisted: true
                        })];
                }
                _pid = prospectData.id, _pca = prospectData.createdAt, rawProspect = __rest(prospectData, ["id", "createdAt"]);
                safeProspectData = {
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
                return [4 /*yield*/, index_1.db.insert(schema.prospects).values(cleanData(safeProspectData)).returning()];
            case 13:
                newProspect = (_b.sent())[0];
                console.log('[transaccion-entregado] Prospecto creado exitosamente, ID:', newProspect.id);
                res.json({
                    success: true,
                    message: 'Requisito entregado, prospecto creado y caso iniciado correctamente.',
                    prospectId: newProspect.id
                });
                return [3 /*break*/, 15];
            case 14:
                prospectError_1 = _b.sent();
                console.error("Error creando prospecto (bono YA guardado):", prospectError_1);
                console.error("Detalle del error:", prospectError_1.message);
                if (prospectError_1.cause) {
                    console.error("Causa raíz:", prospectError_1.cause.message || prospectError_1.cause);
                }
                // El bono se guardó exitosamente, pero el prospecto falló
                res.json({
                    success: true,
                    partialError: true,
                    message: "Requisito entregado correctamente (estatus actualizado). Sin embargo, hubo un error al crear el prospecto: ".concat(prospectError_1.message, ". Puede intentar crear el prospecto manualmente desde el m\u00F3dulo de Ventas.")
                });
                return [3 /*break*/, 15];
            case 15: return [3 /*break*/, 17];
            case 16:
                error_81 = _b.sent();
                console.error("Error general en transaccion entregado:", error_81);
                res.status(400).json({ error: error_81.message || 'Error desconocido en transacción.' });
                return [3 /*break*/, 17];
            case 17: return [2 /*return*/];
        }
    });
}); });
// ─── TRANSACCIÓN: En APC (Atómica: Bono + Prospecto + Oferta) ─────────────
app.post('/api/bonos/transaccion-en-apc', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, bonoId_1, bonoData_1, prospectData_1, offerData_1, result, error_82;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, bonoId_1 = _a.bonoId, bonoData_1 = _a.bonoData, prospectData_1 = _a.prospectData, offerData_1 = _a.offerData;
                return [4 /*yield*/, index_1.db.transaction(function (tx) { return __awaiter(void 0, void 0, void 0, function () {
                        var finalBonoId, _bid, _bca, _bpres, bonoRest, _bid, _bca, _bpres, bonoRest, newBono, prospectId, existingProspects, _pid, _pca, rawProspect, safeProspectData, newProspect, createdOffer, safeOfferData, newOffer;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    finalBonoId = bonoId_1;
                                    if (!bonoId_1) return [3 /*break*/, 2];
                                    _bid = bonoData_1.id, _bca = bonoData_1.createdAt, _bpres = bonoData_1.presupuesto, bonoRest = __rest(bonoData_1, ["id", "createdAt", "presupuesto"]);
                                    return [4 /*yield*/, tx.update(schema.bonos)
                                            .set(bonoRest)
                                            .where((0, drizzle_orm_1.eq)(schema.bonos.id, parseInt(bonoId_1)))];
                                case 1:
                                    _a.sent();
                                    return [3 /*break*/, 4];
                                case 2:
                                    _bid = bonoData_1.id, _bca = bonoData_1.createdAt, _bpres = bonoData_1.presupuesto, bonoRest = __rest(bonoData_1, ["id", "createdAt", "presupuesto"]);
                                    return [4 /*yield*/, tx.insert(schema.bonos).values(bonoRest).returning()];
                                case 3:
                                    newBono = (_a.sent())[0];
                                    finalBonoId = newBono.id;
                                    _a.label = 4;
                                case 4: return [4 /*yield*/, tx.execute((0, drizzle_orm_1.sql)(templateObject_4 || (templateObject_4 = __makeTemplateObject(["SELECT id, name FROM prospects WHERE LOWER(name) = LOWER(", ") LIMIT 1"], ["SELECT id, name FROM prospects WHERE LOWER(name) = LOWER(", ") LIMIT 1"])), prospectData_1.name))];
                                case 5:
                                    existingProspects = _a.sent();
                                    if (!(existingProspects.rows && existingProspects.rows.length > 0)) return [3 /*break*/, 6];
                                    prospectId = existingProspects.rows[0].id;
                                    return [3 /*break*/, 8];
                                case 6:
                                    _pid = prospectData_1.id, _pca = prospectData_1.createdAt, rawProspect = __rest(prospectData_1, ["id", "createdAt"]);
                                    safeProspectData = {
                                        name: rawProspect.name,
                                        company: rawProspect.company || null,
                                        phone: rawProspect.phone || null,
                                        email: rawProspect.email || null,
                                        nextFollowUpDate: rawProspect.nextFollowUpDate || null,
                                        followUps: rawProspect.followUps || [],
                                        source: rawProspect.source || 'Conversión automática - En APC',
                                        sourceBonoId: finalBonoId,
                                    };
                                    return [4 /*yield*/, tx.insert(schema.prospects).values(safeProspectData).returning()];
                                case 7:
                                    newProspect = (_a.sent())[0];
                                    prospectId = newProspect.id;
                                    _a.label = 8;
                                case 8:
                                    createdOffer = null;
                                    if (!offerData_1) return [3 /*break*/, 10];
                                    safeOfferData = {
                                        consecutiveNumber: offerData_1.consecutiveNumber,
                                        prospectId: prospectId,
                                        date: offerData_1.date,
                                        description: offerData_1.description || null,
                                        amount: offerData_1.amount || '0',
                                        budgetAmount: offerData_1.budget || offerData_1.budgetAmount || '0',
                                        projectType: offerData_1.projectType,
                                        status: offerData_1.status || 'Revisión',
                                        budgetId: offerData_1.budgetId || null,
                                    };
                                    return [4 /*yield*/, tx.insert(schema.offers).values(safeOfferData).returning()];
                                case 9:
                                    newOffer = (_a.sent())[0];
                                    createdOffer = newOffer;
                                    _a.label = 10;
                                case 10: return [2 /*return*/, { bonoId: finalBonoId, prospectId: prospectId, offer: createdOffer }];
                            }
                        });
                    }); })];
            case 1:
                result = _b.sent();
                res.json(__assign({ success: true, message: 'Transacción En APC completada exitosamente.' }, result));
                return [3 /*break*/, 3];
            case 2:
                error_82 = _b.sent();
                console.error("Error en transaccion-en-apc (ROLLBACK automático):", error_82);
                res.status(500).json({ error: "Error en transacci\u00F3n En APC: ".concat(error_82.message) });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// ─── TRANSACCIÓN: Formalizado/Construcción (Atómica: Oferta→Aprobación + Proyecto + CxC) ──
app.post('/api/bonos/transaccion-formalizado', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, bonoId, offerId_1, prospectData, projectData_1, arData_1, result, error_83;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, bonoId = _a.bonoId, offerId_1 = _a.offerId, prospectData = _a.prospectData, projectData_1 = _a.projectData, arData_1 = _a.arData;
                return [4 /*yield*/, index_1.db.transaction(function (tx) { return __awaiter(void 0, void 0, void 0, function () {
                        var updatedOffer, offer, createdProject, _pid, _pca, safeProject, newProject, createdAR, _arid, safeAR, newAR;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    updatedOffer = null;
                                    if (!offerId_1) return [3 /*break*/, 2];
                                    return [4 /*yield*/, tx.update(schema.offers)
                                            .set({ status: 'Aprobación' })
                                            .where((0, drizzle_orm_1.eq)(schema.offers.id, parseInt(offerId_1)))
                                            .returning()];
                                case 1:
                                    offer = (_a.sent())[0];
                                    updatedOffer = offer;
                                    _a.label = 2;
                                case 2:
                                    createdProject = null;
                                    if (!projectData_1) return [3 /*break*/, 4];
                                    _pid = projectData_1.id, _pca = projectData_1.createdAt, safeProject = __rest(projectData_1, ["id", "createdAt"]);
                                    return [4 /*yield*/, tx.insert(schema.projects).values(safeProject).returning()];
                                case 3:
                                    newProject = (_a.sent())[0];
                                    createdProject = newProject;
                                    _a.label = 4;
                                case 4:
                                    createdAR = null;
                                    if (!arData_1) return [3 /*break*/, 6];
                                    _arid = arData_1.id, safeAR = __rest(arData_1, ["id"]);
                                    return [4 /*yield*/, tx.insert(schema.accountsReceivable).values(safeAR).returning()];
                                case 5:
                                    newAR = (_a.sent())[0];
                                    createdAR = newAR;
                                    _a.label = 6;
                                case 6: return [2 /*return*/, { offer: updatedOffer, project: createdProject, accountReceivable: createdAR }];
                            }
                        });
                    }); })];
            case 1:
                result = _b.sent();
                res.json(__assign({ success: true, message: 'Transacción Formalizado/Construcción completada exitosamente.' }, result));
                return [3 /*break*/, 3];
            case 2:
                error_83 = _b.sent();
                console.error("Error en transaccion-formalizado (ROLLBACK automático):", error_83);
                res.status(500).json({ error: "Error en transacci\u00F3n Formalizado: ".concat(error_83.message) });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.put('/api/bonos/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, id, createdAt, rest, updatedBono, error_84;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, id = _a.id, createdAt = _a.createdAt, rest = __rest(_a, ["id", "createdAt"]);
                return [4 /*yield*/, index_1.db.update(schema.bonos)
                        .set(rest)
                        .where((0, drizzle_orm_1.eq)(schema.bonos.id, parseInt(req.params.id)))
                        .returning()];
            case 1:
                updatedBono = (_b.sent())[0];
                res.json(updatedBono);
                return [3 /*break*/, 3];
            case 2:
                error_84 = _b.sent();
                handleError(res, error_84);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.delete('/api/bonos/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var error_85;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, index_1.db.delete(schema.bonos).where((0, drizzle_orm_1.eq)(schema.bonos.id, parseInt(req.params.id)))];
            case 1:
                _a.sent();
                res.json({ success: true });
                return [3 /*break*/, 3];
            case 2:
                error_85 = _a.sent();
                handleError(res, error_85);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// --- ADMINISTRATIVE EXPENSES ---
app.get('/api/administrative-budgets', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data, error_86;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, index_1.db.query.administrativeBudgets.findMany({
                        orderBy: [(0, drizzle_orm_1.desc)(schema.administrativeBudgets.year)]
                    })];
            case 1:
                data = _a.sent();
                res.json(data);
                return [3 /*break*/, 3];
            case 2:
                error_86 = _a.sent();
                handleError(res, error_86);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.post('/api/administrative-budgets', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var cleaned, newBudget, error_87;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                cleaned = cleanData(req.body);
                return [4 /*yield*/, index_1.db.insert(schema.administrativeBudgets).values(cleaned).returning()];
            case 1:
                newBudget = (_a.sent())[0];
                res.json(newBudget);
                return [3 /*break*/, 3];
            case 2:
                error_87 = _a.sent();
                handleError(res, error_87);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.put('/api/administrative-budgets/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, id, createdAt, rest, cleaned, updated, error_88;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, id = _a.id, createdAt = _a.createdAt, rest = __rest(_a, ["id", "createdAt"]);
                cleaned = cleanData(rest);
                return [4 /*yield*/, index_1.db.update(schema.administrativeBudgets)
                        .set(cleaned)
                        .where((0, drizzle_orm_1.eq)(schema.administrativeBudgets.id, parseInt(req.params.id)))
                        .returning()];
            case 1:
                updated = (_b.sent())[0];
                res.json(updated);
                return [3 /*break*/, 3];
            case 2:
                error_88 = _b.sent();
                handleError(res, error_88);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.get('/api/administrative-expenses', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data, error_89;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, index_1.db.query.administrativeExpenses.findMany({
                        orderBy: [(0, drizzle_orm_1.desc)(schema.administrativeExpenses.date)]
                    })];
            case 1:
                data = _a.sent();
                res.json(data);
                return [3 /*break*/, 3];
            case 2:
                error_89 = _a.sent();
                handleError(res, error_89);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.post('/api/administrative-expenses', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var cleaned, newExpense, error_90;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                cleaned = cleanData(req.body);
                return [4 /*yield*/, index_1.db.insert(schema.administrativeExpenses).values(cleaned).returning()];
            case 1:
                newExpense = (_a.sent())[0];
                res.json(newExpense);
                return [3 /*break*/, 3];
            case 2:
                error_90 = _a.sent();
                handleError(res, error_90);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// --- COMPANY INFO ---
app.get('/api/company-info', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data, error_91;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, index_1.db.query.companyInfo.findFirst()];
            case 1:
                data = _a.sent();
                res.json(data || {});
                return [3 /*break*/, 3];
            case 2:
                error_91 = _a.sent();
                handleError(res, error_91);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.post('/api/company-info', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var cleaned, id, createdAt, dbData, existing, updated, inserted, error_92;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 6, , 7]);
                cleaned = cleanData(req.body);
                id = cleaned.id, createdAt = cleaned.createdAt, dbData = __rest(cleaned, ["id", "createdAt"]);
                return [4 /*yield*/, index_1.db.query.companyInfo.findFirst()];
            case 1:
                existing = _a.sent();
                if (!existing) return [3 /*break*/, 3];
                return [4 /*yield*/, index_1.db.update(schema.companyInfo)
                        .set(dbData)
                        .where((0, drizzle_orm_1.eq)(schema.companyInfo.id, existing.id))
                        .returning()];
            case 2:
                updated = (_a.sent())[0];
                res.json(updated || existing);
                return [3 /*break*/, 5];
            case 3: return [4 /*yield*/, index_1.db.insert(schema.companyInfo).values(dbData).returning()];
            case 4:
                inserted = (_a.sent())[0];
                res.json(inserted);
                _a.label = 5;
            case 5: return [3 /*break*/, 7];
            case 6:
                error_92 = _a.sent();
                console.error('Error in POST /api/company-info:', error_92);
                handleError(res, error_92);
                return [3 /*break*/, 7];
            case 7: return [2 /*return*/];
        }
    });
}); });
// --- PRE-OPERATIVE EXPENSES ---
app.get('/api/pre-op-rubros', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data, error_93;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, index_1.db.query.preOpRubros.findMany()];
            case 1:
                data = _a.sent();
                res.json(data);
                return [3 /*break*/, 3];
            case 2:
                error_93 = _a.sent();
                handleError(res, error_93);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.post('/api/pre-op-rubros', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var cleaned, inserted, error_94;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                cleaned = cleanData(req.body);
                return [4 /*yield*/, index_1.db.insert(schema.preOpRubros).values(cleaned).returning()];
            case 1:
                inserted = (_a.sent())[0];
                res.json(inserted);
                return [3 /*break*/, 3];
            case 2:
                error_94 = _a.sent();
                handleError(res, error_94);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.put('/api/pre-op-rubros/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, id, rest, cleaned, updated, error_95;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, id = _a.id, rest = __rest(_a, ["id"]);
                cleaned = cleanData(rest);
                return [4 /*yield*/, index_1.db.update(schema.preOpRubros)
                        .set(cleaned)
                        .where((0, drizzle_orm_1.eq)(schema.preOpRubros.id, parseInt(req.params.id)))
                        .returning()];
            case 1:
                updated = (_b.sent())[0];
                res.json(updated);
                return [3 /*break*/, 3];
            case 2:
                error_95 = _b.sent();
                handleError(res, error_95);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.get('/api/pre-op-expenses', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data, error_96;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, index_1.db.query.preOpExpenses.findMany({
                        orderBy: [(0, drizzle_orm_1.desc)(schema.preOpExpenses.fecha)]
                    })];
            case 1:
                data = _a.sent();
                res.json(data);
                return [3 /*break*/, 3];
            case 2:
                error_96 = _a.sent();
                handleError(res, error_96);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.post('/api/pre-op-expenses', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var cleaned, inserted, error_97;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                cleaned = cleanData(req.body);
                return [4 /*yield*/, index_1.db.insert(schema.preOpExpenses).values(cleaned).returning()];
            case 1:
                inserted = (_a.sent())[0];
                res.json(inserted);
                return [3 /*break*/, 3];
            case 2:
                error_97 = _a.sent();
                handleError(res, error_97);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.put('/api/pre-op-expenses/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, id, fecha, createdAt, rest, cleaned, updated, error_98;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, id = _a.id, fecha = _a.fecha, createdAt = _a.createdAt, rest = __rest(_a, ["id", "fecha", "createdAt"]);
                cleaned = cleanData(rest);
                return [4 /*yield*/, index_1.db.update(schema.preOpExpenses)
                        .set(__assign(__assign({}, cleaned), { fecha: fecha })) // preserve fecha
                        .where((0, drizzle_orm_1.eq)(schema.preOpExpenses.id, parseInt(req.params.id)))
                        .returning()];
            case 1:
                updated = (_b.sent())[0];
                res.json(updated);
                return [3 /*break*/, 3];
            case 2:
                error_98 = _b.sent();
                handleError(res, error_98);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// --- AUDIT LOGS ---
app.get('/api/audit-logs', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data, error_99;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, index_1.db.query.auditLogs.findMany({
                        orderBy: [(0, drizzle_orm_1.desc)(schema.auditLogs.timestamp)],
                        limit: 100
                    })];
            case 1:
                data = _a.sent();
                res.json(data);
                return [3 /*break*/, 3];
            case 2:
                error_99 = _a.sent();
                handleError(res, error_99);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// --- ADMIN: Sync all sequences (dev only) ---
// --- ADMIN: Run migration to add source tracking to prospects ---
app.post('/api/admin/migrate-prospect-source', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var e_4, error_100;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 7, , 8]);
                // Add source and source_bono_id columns (idempotent)
                return [4 /*yield*/, index_1.db.execute((0, drizzle_orm_1.sql)(templateObject_5 || (templateObject_5 = __makeTemplateObject(["\n            ALTER TABLE prospects ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'Manual';\n        "], ["\n            ALTER TABLE prospects ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'Manual';\n        "]))))];
            case 1:
                // Add source and source_bono_id columns (idempotent)
                _a.sent();
                return [4 /*yield*/, index_1.db.execute((0, drizzle_orm_1.sql)(templateObject_6 || (templateObject_6 = __makeTemplateObject(["\n            ALTER TABLE prospects ADD COLUMN IF NOT EXISTS source_bono_id INTEGER;\n        "], ["\n            ALTER TABLE prospects ADD COLUMN IF NOT EXISTS source_bono_id INTEGER;\n        "]))))];
            case 2:
                _a.sent();
                _a.label = 3;
            case 3:
                _a.trys.push([3, 5, , 6]);
                return [4 /*yield*/, index_1.db.execute((0, drizzle_orm_1.sql)(templateObject_7 || (templateObject_7 = __makeTemplateObject(["\n                ALTER PUBLICATION supabase_realtime ADD TABLE prospects;\n            "], ["\n                ALTER PUBLICATION supabase_realtime ADD TABLE prospects;\n            "]))))];
            case 4:
                _a.sent();
                return [3 /*break*/, 6];
            case 5:
                e_4 = _a.sent();
                // Ignore if already added or publication doesn't exist
                console.log('Realtime publication note:', e_4.message);
                return [3 /*break*/, 6];
            case 6:
                res.json({ message: 'Migration successful: source + source_bono_id columns added to prospects. Realtime enabled.' });
                return [3 /*break*/, 8];
            case 7:
                error_100 = _a.sent();
                console.error('Migration error:', error_100);
                handleError(res, error_100);
                return [3 /*break*/, 8];
            case 8: return [2 /*return*/];
        }
    });
}); });
app.post('/api/admin/sync-sequences', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var result, rows, results, fixedCount, _i, rows_1, row, maxRes, maxVal, seqRes, currentSeqVal, newVal, error_101;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 9, , 10]);
                return [4 /*yield*/, index_1.db.execute((0, drizzle_orm_1.sql)(templateObject_8 || (templateObject_8 = __makeTemplateObject(["\n            SELECT \n                t.table_name,\n                c.column_name,\n                pg_get_serial_sequence(t.table_name::text, c.column_name::text) AS seq_name\n            FROM information_schema.tables t\n            JOIN information_schema.columns c ON c.table_name = t.table_name AND c.table_schema = t.table_schema\n            WHERE t.table_schema = 'public'\n              AND t.table_type = 'BASE TABLE'\n              AND c.column_default LIKE 'nextval%'\n            ORDER BY t.table_name\n        "], ["\n            SELECT \n                t.table_name,\n                c.column_name,\n                pg_get_serial_sequence(t.table_name::text, c.column_name::text) AS seq_name\n            FROM information_schema.tables t\n            JOIN information_schema.columns c ON c.table_name = t.table_name AND c.table_schema = t.table_schema\n            WHERE t.table_schema = 'public'\n              AND t.table_type = 'BASE TABLE'\n              AND c.column_default LIKE 'nextval%'\n            ORDER BY t.table_name\n        "]))))];
            case 1:
                result = _c.sent();
                rows = result.rows;
                results = [];
                fixedCount = 0;
                _i = 0, rows_1 = rows;
                _c.label = 2;
            case 2:
                if (!(_i < rows_1.length)) return [3 /*break*/, 8];
                row = rows_1[_i];
                if (!row.seq_name)
                    return [3 /*break*/, 7];
                return [4 /*yield*/, index_1.db.execute(drizzle_orm_1.sql.raw("SELECT COALESCE(MAX(".concat(row.column_name, "), 0) AS max_val FROM ").concat(row.table_name)))];
            case 3:
                maxRes = _c.sent();
                maxVal = parseInt(((_a = maxRes.rows[0]) === null || _a === void 0 ? void 0 : _a.max_val) || '0');
                return [4 /*yield*/, index_1.db.execute(drizzle_orm_1.sql.raw("SELECT last_value FROM ".concat(row.seq_name)))];
            case 4:
                seqRes = _c.sent();
                currentSeqVal = parseInt(((_b = seqRes.rows[0]) === null || _b === void 0 ? void 0 : _b.last_value) || '0');
                if (!(currentSeqVal <= maxVal)) return [3 /*break*/, 6];
                newVal = maxVal + 1;
                return [4 /*yield*/, index_1.db.execute(drizzle_orm_1.sql.raw("SELECT setval('".concat(row.seq_name, "', ").concat(newVal, ", false)")))];
            case 5:
                _c.sent();
                results.push({ table: row.table_name, column: row.column_name, status: 'FIXED', from: currentSeqVal, to: newVal, maxId: maxVal });
                fixedCount++;
                return [3 /*break*/, 7];
            case 6:
                results.push({ table: row.table_name, column: row.column_name, status: 'OK', seq: currentSeqVal, maxId: maxVal });
                _c.label = 7;
            case 7:
                _i++;
                return [3 /*break*/, 2];
            case 8:
                res.json({ message: "Sync complete. ".concat(fixedCount, " sequences fixed of ").concat(rows.length, " total."), results: results });
                return [3 /*break*/, 10];
            case 9:
                error_101 = _c.sent();
                console.error('Error syncing sequences:', error_101);
                handleError(res, error_101);
                return [3 /*break*/, 10];
            case 10: return [2 /*return*/];
        }
    });
}); });
// --- ADMIN: Seed base data (roles + admin user) ---
app.post('/api/admin/seed', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var existingRoles, rolesToInsert, insertedRoles, existingUsers, adminUser, gerenteRole, error_102;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 9, , 10]);
                return [4 /*yield*/, index_1.db.select().from(schema.roles)];
            case 1:
                existingRoles = _a.sent();
                if (existingRoles.length > 0) {
                    return [2 /*return*/, res.json({ message: 'Seed skipped — roles already exist.', rolesCount: existingRoles.length })];
                }
                rolesToInsert = [
                    { name: 'Gerente General', description: 'Acceso total y todas las aprobaciones.', isDefault: true, permissions: {} },
                    { name: 'Director de proyectos', description: 'Gestiona proyectos y aprueba solicitudes iniciales.', permissions: {}, maxItemOveragePercentage: '10', maxProjectOveragePercentage: '5' },
                    { name: 'Encargado de proyectos', description: 'Crea solicitudes y gestiona el día a día de los proyectos.', permissions: {} },
                    { name: 'Director financiero', description: 'Gestiona finanzas, aprueba órdenes de compra y pagos.', permissions: {}, maxItemOveragePercentage: '15', maxProjectOveragePercentage: '8' },
                    { name: 'Proveeduria', description: 'Gestiona cotizaciones y órdenes de compra.', permissions: {} },
                    { name: 'Director de Ventas', description: 'Gestiona el equipo de ventas, prospectos y ofertas.', permissions: {} },
                ];
                return [4 /*yield*/, index_1.db.insert(schema.roles).values(rolesToInsert).returning()];
            case 2:
                insertedRoles = _a.sent();
                console.log('Seeded roles:', insertedRoles.map(function (r) { return "".concat(r.id, ": ").concat(r.name); }));
                return [4 /*yield*/, index_1.db.select().from(schema.users)];
            case 3:
                existingUsers = _a.sent();
                if (existingUsers.length > 0) {
                    return [2 /*return*/, res.json({ message: 'Roles seeded, users already exist.', roles: insertedRoles.length, users: existingUsers.length })];
                }
                return [4 /*yield*/, index_1.db.insert(schema.users).values({
                        name: 'Usuario Administrador',
                        email: 'admin@flowerp.com',
                        avatar: 'https://picsum.photos/seed/flowerp/100',
                        status: 'Active',
                    }).returning()];
            case 4:
                adminUser = (_a.sent())[0];
                gerenteRole = insertedRoles.find(function (r) { return r.name === 'Gerente General'; });
                if (!(gerenteRole && adminUser)) return [3 /*break*/, 6];
                return [4 /*yield*/, index_1.db.insert(schema.userRoles).values({ userId: adminUser.id, roleId: gerenteRole.id })];
            case 5:
                _a.sent();
                _a.label = 6;
            case 6: 
            // Sync sequences after seed
            return [4 /*yield*/, index_1.db.execute(drizzle_orm_1.sql.raw("SELECT setval(pg_get_serial_sequence('roles', 'id'), COALESCE(MAX(id), 0) + 1, false) FROM roles"))];
            case 7:
                // Sync sequences after seed
                _a.sent();
                return [4 /*yield*/, index_1.db.execute(drizzle_orm_1.sql.raw("SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE(MAX(id), 0) + 1, false) FROM users"))];
            case 8:
                _a.sent();
                res.json({
                    message: 'Seed complete!',
                    roles: insertedRoles.map(function (r) { return ({ id: r.id, name: r.name }); }),
                    adminUser: { id: adminUser.id, name: adminUser.name, email: adminUser.email }
                });
                return [3 /*break*/, 10];
            case 9:
                error_102 = _a.sent();
                console.error('Error seeding data:', error_102);
                handleError(res, error_102);
                return [3 /*break*/, 10];
            case 10: return [2 /*return*/];
        }
    });
}); });
app.listen(port, '0.0.0.0', function () {
    console.log("Backend server successfully started and running at http://localhost:".concat(port));
});
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8;
