
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { Project, Offer, ServiceRequestItem, QuoteResponse } from '../types';

// Initialize the Gemini AI client with the API key from environment variables.
// In Vite, we use import.meta.env for frontend environment variables.
// @ts-ignore
const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

const generateProjectSummaryPrompt = (projects: Project[], offers: Offer[], timePeriod: string): string => {
  const projectData = projects.length > 0
    ? projects.map(p =>
      `- Proyecto "${p.name}": Presupuesto: ¢${p.budget.toLocaleString()}, Gastos: ¢${p.expenses.toLocaleString()}. Margen: ¢${(p.budget - p.expenses).toLocaleString()} (${(((p.budget - p.expenses) / p.budget) * 100).toFixed(2)}%).`
    ).join('\n')
    : "No hay proyectos en este período.";

  const offerData = offers.length > 0
    ? offers.map(o =>
      `- Oferta (${o.projectType}): ¢${o.amount.toLocaleString()}, Estado: ${o.status}.`
    ).join('\n')
    : "No hay ofertas en este período.";

  return `
    Eres un analista financiero experto para una empresa de construcción y consultoría. La moneda utilizada es el Colón Costarricense (¢).
    Tu tarea es proporcionar un resumen ejecutivo conciso y perspicaz sobre el estado de los proyectos y ofertas comerciales para el período de tiempo: "${timePeriod}".
    El resumen debe ser fácil de entender para la gerencia. No más de 150 palabras.
    
    Aquí están los datos:

    Proyectos en el período:
    ${projectData}

    Ofertas Comerciales en el período:
    ${offerData}

    Por favor, genera un resumen ejecutivo que destaque:
    1. La salud financiera general de los proyectos (rentabilidad).
    2. Cualquier proyecto en riesgo (gastos cercanos o superiores al presupuesto).
    3. El estado del pipeline de ventas basado en las ofertas.
    4. Una recomendación clave o punto de atención para el período seleccionado.
  `;
};

export const getSmartSummary = async (projects: Project[], offers: Offer[], timePeriod: string): Promise<string> => {
  try {
    if (!apiKey) return "API Key de Gemini no configurada.";

    const prompt = generateProjectSummaryPrompt(projects, offers, timePeriod);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text() || "No se pudo generar el resumen.";
  } catch (error) {
    console.error("Error fetching summary from Gemini:", error);
    return "No se pudo generar el resumen. Hubo un error al conectar con el servicio de IA.";
  }
};

const quoteResponseSchema: any = {
  type: SchemaType.OBJECT,
  properties: {
    quoteNumber: { type: SchemaType.STRING, description: 'El número de cotización o referencia del documento.' },
    deliveryDays: { type: SchemaType.INTEGER, description: 'El número de días para la entrega. Si se especifica una fecha, calcular los días desde hoy.' },
    paymentTerms: { type: SchemaType.STRING, description: 'Los términos de pago (ej: "Contado", "Crédito 30 días").' },
    total: { type: SchemaType.NUMBER, description: 'El monto total final que figura explícitamente en el documento de cotización.' },
    currency: { type: SchemaType.STRING, description: 'La moneda de la cotización, debe ser "CRC" o "USD".' },
    items: {
      type: SchemaType.ARRAY,
      description: 'Lista de los artículos cotizados.',
      items: {
        type: SchemaType.OBJECT,
        properties: {
          serviceRequestItemId: { type: SchemaType.INTEGER, description: 'El ID del artículo de la solicitud original que mejor coincide con este artículo de la cotización.' },
          unitPrice: { type: SchemaType.NUMBER, description: 'El precio por unidad del artículo.' },
          quality: { type: SchemaType.STRING, description: 'Una evaluación de la calidad del producto ofrecido, debe ser "Alta", "Media" o "Baja".' }
        },
        required: ['serviceRequestItemId', 'unitPrice', 'quality']
      }
    },
    aiValidation: {
      type: SchemaType.OBJECT,
      description: 'Resultados de la corroboración automática de datos realizada por la IA.',
      properties: {
        totalMatch: { type: SchemaType.BOOLEAN, description: 'True si la suma de (cantidad solicitada * precio unitario extraído) para todos los ítems coincide con el monto total declarado en el documento.' },
        namesMatch: { type: SchemaType.BOOLEAN, description: 'True si las descripciones de los artículos en la cotización coinciden razonablemente con los nombres de los artículos solicitados originalmente.' },
        discrepancyNote: { type: SchemaType.STRING, description: 'Nota detallada explicando cualquier inconsistencia encontrada en montos o nombres.' }
      },
      required: ['totalMatch', 'namesMatch']
    }
  },
  required: ['deliveryDays', 'paymentTerms', 'total', 'items', 'aiValidation']
};

const generateQuoteAnalysisPrompt = (requestItems: ServiceRequestItem[]): string => {
  const itemsList = requestItems.map(item => `- ID: ${item.id}, Nombre: "${item.name}", Cantidad: ${item.quantity}, Unidad: ${item.unit}`).join('\n');

  return `
    Eres un asistente de compras experto para una empresa constructora.
    Tu tarea es analizar el documento de una cotización de proveedor y extraer la información clave en formato JSON.
    Debes ser extremadamente preciso. 

    Aquí están los artículos que se solicitaron originalmente:
    ${itemsList}

    INSTRUCCIONES DE EXTRACCIÓN Y CORROBORACIÓN:
    1. **Mapeo de Artículos**: Haz coincidir cada artículo del documento con uno de la lista de "Artículos Solicitados Originalmente". Usa el ID correspondiente.
    2. **Validación de Montos**: Calcula la suma de (Precio Unitario extraído * Cantidad solicitada) para cada ítem. Compara este resultado con el "Total" declarado en el documento. Si no coinciden, marca aiValidation.totalMatch como false y explica el porqué en discrepancyNote.
    3. **Validación de Nombres**: Compara el nombre/descripción del artículo en la cotización con el nombre solicitado originalmente. Si hay diferencias significativas (ej. se cotiza otro material o marca no especificada), marca aiValidation.namesMatch como false y detállalo en discrepancyNote.
    4. **Extracción**:
       - **quoteNumber**: El número o código de referencia de la cotización.
       - **deliveryDays**: Plazo de entrega en días. Si dice "entrega inmediata", usa 0.
       - **paymentTerms**: Las condiciones de pago. Ej: "Crédito 30 días", "Contado".
       - **total**: El monto total final que figura en el documento.
       - **currency**: "CRC" para colones o "USD" para dólares.
       - **items**: Arreglo de objetos con serviceRequestItemId, unitPrice y quality.

    Devuelve únicamente el objeto JSON siguiendo el esquema proporcionado.
  `;
}

export const analyzeQuotePDF = async (pdfBase64: string, requestItems: ServiceRequestItem[]): Promise<Partial<Omit<QuoteResponse, 'id'>>> => {
  try {
    if (!apiKey) throw new Error("API Key de Gemini no configurada.");
    const prompt = generateQuoteAnalysisPrompt(requestItems);

    const pdfPart = {
      inlineData: {
        mimeType: 'application/pdf',
        data: pdfBase64,
      },
    };

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: quoteResponseSchema,
      }
    });

    const result = await model.generateContent([pdfPart, prompt]);
    const response = await result.response;
    const textResponse = response.text();

    if (!textResponse) {
      throw new Error("La respuesta de la IA estaba vacía.");
    }

    const parsedJson = JSON.parse(textResponse);
    return parsedJson as Partial<Omit<QuoteResponse, 'id'>>;

  } catch (error) {
    console.error("Error analyzing PDF with Gemini:", error);
    throw new Error("No se pudo analizar la cotización. Hubo un error al conectar con el servicio de IA.");
  }
}

const materialListSchema: any = {
  type: SchemaType.ARRAY,
  description: 'Lista de materiales y servicios extraídos del documento.',
  items: {
    type: SchemaType.OBJECT,
    properties: {
      name: { type: SchemaType.STRING, description: 'Nombre o descripción del producto/servicio.' },
      quantity: { type: SchemaType.NUMBER, description: 'La cantidad de cada ítem.' },
      unit: { type: SchemaType.STRING, description: 'La unidad de medida (ej. m, kg, unidad, servicio).' },
      specifications: { type: SchemaType.STRING, description: 'Notas o especificaciones adicionales para el ítem.' }
    },
    required: ['name', 'quantity', 'unit']
  }
};

const generateMaterialListAnalysisPrompt = (): string => {
  return `
    Eres un asistente experto en la gestión de compras para una empresa de construcción.
    Tu tarea es analizar el documento o imagen adjunta, que contiene una lista de materiales, y extraer la información clave en formato JSON.
    Debes ser muy preciso. Identifica cada ítem, su cantidad y su unidad de medida. Si un ítem tiene especificaciones adicionales, extráelas también.
    Si no puedes determinar una unidad o una cantidad para un ítem, omítelo de la lista final para que el usuario lo ingrese manualmente.

    Información a extraer para cada ítem:
    1.  **name**: La descripción del bien o servicio.
    2.  **quantity**: La cantidad numérica.
    3.  **unit**: La unidad de medida (ej. 'unidad', 'saco', 'm³', 'kg', 'galón', etc.).
    4.  **specifications**: Cualquier nota o detalle adicional sobre el ítem (opcional).

    Analiza el archivo adjunto y devuelve únicamente el arreglo de objetos JSON.
  `;
};

export const analyzeMaterialList = async (fileBase64: string, mimeType: string): Promise<Omit<ServiceRequestItem, 'id'>[]> => {
  try {
    if (!apiKey) throw new Error("API Key de Gemini no configurada.");
    const prompt = generateMaterialListAnalysisPrompt();

    const filePart = {
      inlineData: {
        mimeType,
        data: fileBase64,
      },
    };

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: materialListSchema,
      }
    });

    const result = await model.generateContent([filePart, prompt]);
    const response = await result.response;
    const textResponse = response.text();

    if (!textResponse) {
      throw new Error("La respuesta de la IA estaba vacía o no se pudo procesar el archivo.");
    }

    const parsedJson = JSON.parse(textResponse);
    return parsedJson as Omit<ServiceRequestItem, 'id'>[];

  } catch (error) {
    console.error("Error analyzing material list with Gemini:", error);
    throw new Error("No se pudo analizar la lista de materiales. Verique el formato del archivo e intente de nuevo.");
  }
};

const paymentProofSchema: any = {
  type: SchemaType.OBJECT,
  properties: {
    amount: { type: SchemaType.NUMBER, description: 'El monto numérico del pago. Extraer solo el número.' },
    date: { type: SchemaType.STRING, description: 'La fecha del pago en formato YYYY-MM-DD.' },
    details: { type: SchemaType.STRING, description: 'Un resumen de los detalles del pago, incluyendo el banco emisor, número de referencia o transacción, y cualquier otra nota relevante.' },
  },
  required: ['amount', 'date', 'details']
};

const generatePaymentProofAnalysisPrompt = (): string => {
  return `
    Eres un asistente contable experto. Tu tarea es analizar el documento adjunto (imagen o PDF de un comprobante de pago) y extraer la información clave en formato JSON.
    Debes ser muy preciso.

    Información a extraer del documento:
    1.  **amount**: El monto total del pago. Debe ser un número, sin comas ni símbolos de moneda.
    2.  **date**: La fecha en que se realizó la transacción. Debe estar en formato YYYY-MM-DD.
    3.  **details**: Un texto corto que resuma el pago. Debe incluir el banco de origen si está disponible y el número de referencia o transacción. Por ejemplo: "Pago desde BAC, Ref: 123456789".

    Analiza el archivo adjunto y devuelve únicamente el objeto JSON.
  `;
};

export const analyzePaymentProof = async (fileBase64: string, mimeType: string): Promise<{ amount: number; date: string; details: string; }> => {
  try {
    if (!apiKey) throw new Error("API Key de Gemini no configurada.");
    const prompt = generatePaymentProofAnalysisPrompt();

    const filePart = {
      inlineData: {
        mimeType,
        data: fileBase64,
      },
    };

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: paymentProofSchema,
      }
    });

    const result = await model.generateContent([filePart, prompt]);
    const response = await result.response;
    const textResponse = response.text();

    if (!textResponse) {
      throw new Error("La respuesta de la IA estaba vacía o no se pudo procesar el archivo.");
    }

    const parsedJson = JSON.parse(textResponse);
    return parsedJson as { amount: number; date: string; details: string; };

  } catch (error) {
    console.error("Error analyzing payment proof with Gemini:", error);
    throw new Error("No se pudo analizar el comprobante. Verifique el formato del archivo e intente de nuevo.");
  }
};
