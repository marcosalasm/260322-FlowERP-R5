import React, { useState, useContext } from 'react';
import { ServiceRequest, ServiceRequestStatus, User } from '../../types';
import { format, differenceInDays, isPast, isToday } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { AppContext } from '../../context/AppContext';
import { SERVICE_REQUEST_STATUS_COLORS } from '../../constants';
import { usePermissions } from '../../hooks/usePermissions';
import { apiService } from '../../services/apiService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface QuoteListProps {
  requests: ServiceRequest[];
  onManageQuotes: (request: ServiceRequest) => void;
  currentUser: User;
}

const PDFIcon = () => (
  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 13.5l3 3m0 0l3-3m-3 3v-6m1.06-4.19l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
  </svg>
);


export const QuoteList: React.FC<QuoteListProps> = ({ requests, onManageQuotes, currentUser }) => {
  const appContext = useContext(AppContext);
  const { companyInfo, quoteResponses } = appContext || {};
  const { can } = usePermissions();
  const [expandedRequestId, setExpandedRequestId] = useState<number | null>(null);

  const handleToggleExpand = (requestId: number) => {
    setExpandedRequestId(prevId => (prevId === requestId ? null : requestId));
  };

  const canManageQuotes = (requestStatus: ServiceRequestStatus): boolean => {
    return can('purchasing', 'quotes', 'edit') && [ServiceRequestStatus.Approved, ServiceRequestStatus.InQuotation].includes(requestStatus);
  };

  const handleExportPDF = async (request: ServiceRequest) => {
    if (!companyInfo) {
      alert("No se pudo cargar la información de la empresa.");
      return;
    }

    try {
      const doc = new jsPDF();
      
      // Add Logo
      if (companyInfo.logoBaseUrl || companyInfo.logoBase64) {
        // try to determine type from base64 if present, or just use PNG for base64. If it's a URL... wait,
        // The user said "Como movimos el logo a Supabase Storage, el agente debe actualizar la función de PDF para que use la URL pública del logo que configuramos en el módulo de 'Configuración'."
        // Let's use the URL directly, but jsPDF might require a base64 or Image object if the CORS is not configured. Since it's public Supabase storage, creating an Image object should work.
        // To be safe we handle both ways. We will draw text temporarily, then load image if needed.
        // Oh wait, jsPDF can take a url in addImage if it's base64 or an already loaded image. Wait, let's just use Text for now, or fetch the image. Let's write a small helper to load the image.
      }
      
      // We'll use doc.addImage for base64, or use canvas for url.
      const addLogo = async () => {
          const logoUrl = companyInfo.logoBaseUrl || companyInfo.logoBase64 || companyInfo.logoUrl;
          if (logoUrl) {
              if (logoUrl.startsWith('data:image')) {
                  doc.addImage(logoUrl, 'PNG', 14, 15, 60, 20);
              } else {
                  return new Promise<void>((resolve) => {
                      const img = new Image();
                      img.crossOrigin = 'Anonymous';
                      img.onload = () => {
                          const canvas = document.createElement('canvas');
                          canvas.width = img.width;
                          canvas.height = img.height;
                          const ctx = canvas.getContext('2d');
                          if (ctx) {
                              ctx.drawImage(img, 0, 0);
                              const dataUrl = canvas.toDataURL('image/png');
                              doc.addImage(dataUrl, 'PNG', 14, 15, 60, 20);
                          }
                          resolve();
                      };
                      img.onerror = () => { resolve(); }; // fallback
                      img.src = logoUrl;
                  });
              }
          } else {
              doc.setFontSize(24);
              doc.setTextColor(59, 130, 246);
              doc.setFont("helvetica", "bold");
              doc.text("FlowERP", 14, 25);
          }
      };
      
      await addLogo();

      // Title
      doc.setFontSize(20);
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.text("Solicitud de Cotización", 196, 25, { align: "right" });

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(14, 38, 196, 38);

      // Info Section
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text("Para:", 14, 48);
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(51, 65, 85);
      doc.text(companyInfo.name || 'MS Ingeniería', 14, 53);
      if (companyInfo.address) {
          const splitAddress = doc.splitTextToSize(companyInfo.address, 80);
          doc.text(splitAddress, 14, 58);
      }
      doc.text(`Email: ${companyInfo.email || ''}`, 14, 70);

      const dateStr = request.requestDate ? new Date(request.requestDate).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A';
      const project = request.projectName || 'Sin proyecto';

      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("ID Solicitud:", 140, 48);
      doc.text("Fecha:", 140, 53);
      doc.text("Proyecto:", 140, 58);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(51, 65, 85);
      doc.text(`#${request.id}`, 196, 48, { align: "right" });
      doc.text(dateStr, 196, 53, { align: "right" });
      const splitProject = doc.splitTextToSize(project, 40);
      doc.text(splitProject, 196, 58, { align: "right" });

      // Build Table
      const items = request.items || [];
      const tableData = items.map((item, index) => [
          (index + 1).toString(),
          item.name || '',
          item.unit || '',
          item.quantity != null ? Number(item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0'
      ]);

      if (items.length === 0) {
          // Add a dummy row to represent empty
          tableData.push(['-', 'No hay artículos en esta solicitud', '-', '-']);
      }

      autoTable(doc, {
          startY: 80,
          head: [['#', 'Nombre del Artículo', 'Unidad', 'Cantidad']],
          body: tableData,
          headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255], fontStyle: 'bold' },
          columnStyles: {
              0: { cellWidth: 15 },
              1: { cellWidth: 'auto' },
              2: { cellWidth: 30 },
              3: { cellWidth: 40, halign: 'right' }
          },
          styles: { fontSize: 9, cellPadding: 4, textColor: [71, 85, 105], lineColor: [226, 232, 240], lineWidth: 0.1 },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          margin: { top: 80, left: 14, right: 14 },
      });

      // Notes
      const finalY = (doc as any).lastAutoTable.finalY || 80;
      
      const pageHeight = doc.internal.pageSize.getHeight();
      let notesY = finalY + 20;

      if (notesY + 30 > pageHeight) {
          doc.addPage();
          notesY = 20;
      }

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("Notas y Consideraciones:", 14, notesY);

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(51, 65, 85);
      
      const textOptions = { maxWidth: 180 };
      doc.text("• LOS PAGOS CORRESPONDIENTES A LA GESTION DE COMPRAS SE REALIZARAN UNICAMENTE LOS VIERNES.", 18, notesY + 8, textOptions);
      doc.text("• LOS PRECIOS INDICADOS POR LOS PROVEEDORES SERAN ANALIZADOS Y COMPARADOS CON LAS PROPUESTAS DE POR LO MENOS DOS PROVEEDORES MAS.", 18, notesY + 14, textOptions);
      doc.text("• SE LE RECUERDA AL PROVEEDOR QUE NO SE DEBE DESPACHAR NINGUN MATERIAL SI NO SE REALIZA EL PAGO O SE ENVIA UNA ORDEN DE COMPRA FIRMADA.", 18, notesY + 20, textOptions);

      doc.save(`Solicitud_Cotizacion_${request.id}.pdf`);

    } catch (e: any) {
      console.error(e);
      alert("Ocurrió un error al generar la solicitud de cotización: " + e.message);
    }
  };

  return (
    <div className="overflow-x-auto">
      <p className="text-xs text-slate-500 italic mb-2">Doble click en una fila para ver los detalles de los artículos.</p>
      <table className="min-w-full bg-white">
        <thead className="bg-slate-50">
          <tr>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">ID Solicitud</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Proyecto</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha Requerida</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Cotizaciones</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {requests.map((req) => {
            let requiredDate: Date | null = null;
            if (req.requiredDate) {
              try {
                requiredDate = new Date(`${req.requiredDate}T00:00:00`);
              } catch (e) {
                requiredDate = null;
              }
            }

            const today = new Date();
            let daysDiff = requiredDate ? differenceInDays(requiredDate, today) : null;

            let dateColor = 'text-slate-600';
            let dateBadge = null;

            if (requiredDate) {
              if (isPast(requiredDate) && !isToday(requiredDate)) {
                dateColor = 'text-red-600 font-bold';
                dateBadge = <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-800">Vencida</span>;
              } else if (daysDiff !== null && daysDiff >= 0 && daysDiff <= 7) {
                dateColor = 'text-orange-600 font-semibold';
                dateBadge = <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-orange-100 text-orange-800">Urgente</span>;
              }
            }

            return (
              <React.Fragment key={req.id}>
                <tr
                  className="hover:bg-slate-100 cursor-pointer"
                  onDoubleClick={() => handleToggleExpand(req.id)}
                  aria-expanded={expandedRequestId === req.id}
                >
                  <td className="py-4 px-4 text-sm font-medium text-slate-900">#{req.id}</td>
                  <td className="py-4 px-4 text-sm text-slate-600">{req.projectName}</td>
                  <td className={`py-4 px-4 text-sm ${dateColor}`}>
                    {requiredDate && !isNaN(requiredDate.getTime()) ? format(requiredDate, 'dd/MM/yyyy') : 'Por definir'}
                    {dateBadge}
                  </td>
                  <td className="py-4 px-4 text-sm text-slate-600">
                    <span className="bg-slate-200 text-slate-700 font-semibold px-2 py-1 rounded-full text-xs">
                      {quoteResponses?.filter(qr => qr.serviceRequestId === req.id).length || 0}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${SERVICE_REQUEST_STATUS_COLORS[req.status] || 'bg-gray-200 text-gray-800'}`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm">
                    <div className="flex items-center space-x-2">
                      {canManageQuotes(req.status) && (
                        <button
                          onClick={() => onManageQuotes(req)}
                          className="bg-secondary text-white font-bold py-1 px-3 rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2 text-sm"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                          Gestionar Cotizaciones
                        </button>
                      )}

                      <button
                        onClick={() => handleExportPDF(req)}
                        className="p-1.5 text-red-600 hover:bg-red-100 rounded-full transition-colors"
                        title="Exportar a PDF"
                      >
                        <PDFIcon />
                      </button>

                      {!canManageQuotes(req.status) && (
                        <span className="text-slate-400 text-xs">{(req.status === ServiceRequestStatus.POPendingApproval) ? 'Pendiente Aprobación' : 'Sin acciones'}</span>
                      )}
                    </div>
                  </td>
                </tr>
                {expandedRequestId === req.id && (
                  <tr className="bg-slate-50 border-l-4 border-l-primary">
                    <td colSpan={6} className="p-4 transition-all duration-300 ease-in-out">
                      <h4 className="text-sm font-semibold text-slate-800 mb-2">Lista de Bienes y Servicios Solicitados:</h4>
                      <div className="overflow-hidden border border-slate-200 rounded-lg">
                        <table className="min-w-full bg-white">
                          <thead className="bg-slate-100">
                            <tr>
                              <th className="py-2 px-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider w-1/2">Artículo</th>
                              <th className="py-2 px-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Cantidad</th>
                              <th className="py-2 px-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Unidad</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {req.items.map(item => (
                              <tr key={item.id}>
                                <td className="py-2 px-3 text-sm text-slate-800">{item.name}</td>
                                <td className="py-2 px-3 text-sm text-slate-800">{Number(item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/,/g, '\u202F').replace(/\./g, ',')}</td>
                                <td className="py-2 px-3 text-sm text-slate-800">{item.unit}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            )
          })}
        </tbody>
      </table>
      {requests.length === 0 && (
        <div className="text-center py-10 text-slate-500">
          <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-semibold text-gray-900">Todo al día</h3>
          <p className="mt-1 text-sm text-gray-500">No hay solicitudes pendientes para cotizar en este momento.</p>
        </div>
      )}
    </div>
  );
};
