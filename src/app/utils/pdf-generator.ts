import jsPDF from 'jspdf';
import type { Reservation, CompanyInfo } from '../App';

// Logo placeholder - reemplazar con la ruta real del logo cuando esté disponible
// Ejemplo: import logoImage from '/logo.png';
const logoImage: string | null = null;

export function generatePDF(reservation: Reservation, companyInfo: CompanyInfo) {
  // Debug: verificar que la configuración se está recibiendo
  console.log('Generando PDF con configuración:', companyInfo);
  
  const doc = new jsPDF();
  
  // Configuración de colores
  const primaryColor: [number, number, number] = [79, 70, 229]; // Indigo
  const textColor: [number, number, number] = [0, 0, 0]; // Negro
  const lightGray: [number, number, number] = [243, 244, 246]; // Gray-100
  
  // Logo y encabezado
  const logoSize = 25;
  const logoX = 15;
  const logoY = 10;
  
  // Agregar logo si está disponible
  if (logoImage) {
    doc.addImage(logoImage, 'PNG', logoX, logoY, logoSize, logoSize);
  }
  
  // Información de la empresa (derecha del logo)
  doc.setTextColor(...textColor);
  doc.setFontSize(9);
  const companyInfoX = logoImage ? logoX + logoSize + 5 : logoX;
  
  // Agregar razón social si existe
  let currentInfoY = logoY + 8;
  if (companyInfo.razonSocial && companyInfo.razonSocial.trim() !== '') {
    doc.setFont('helvetica', 'bold');
    doc.text(companyInfo.razonSocial, companyInfoX, currentInfoY);
    currentInfoY += 5;
    doc.setFont('helvetica', 'normal');
  }
  
  doc.text('Villas del Mar E -101 Solidaridad, Q.Roo 77706', companyInfoX, currentInfoY);
  doc.text('www: servanstravel.com móvil: 998 2409196', companyInfoX, currentInfoY + 5);
  
  // Títulos centrados
  const titleY = logoY + logoSize + 8;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('VOUCHER DE TRANSPORTACION', 105, titleY, { align: 'center' });
  
  doc.setFontSize(13);
  doc.text('ORDEN DE SERVICIO', 105, titleY + 6, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text('BITACORA DE SERVICIOS', 105, titleY + 12, { align: 'center' });
  
  // Línea divisoria debajo del header
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(15, titleY + 18, 195, titleY + 18);
  
  // Información del documento
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const currentDate = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const infoY = titleY + 24;
  doc.text(`Generado: ${currentDate}`, 15, infoY);
  doc.text(`No. Orden: ${reservation.id.substring(0, 8).toUpperCase()}`, 15, infoY + 5);
  
  // Línea divisoria
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(15, infoY + 10, 195, infoY + 10);
  
  let yPos = infoY + 20;
  
  // Función helper para crear secciones
  const addSection = (title: string, value: string) => {
    // Fondo de la sección
    doc.setFillColor(...lightGray);
    doc.rect(15, yPos - 5, 180, 12, 'F');
    
    // Título
    doc.setTextColor(...primaryColor);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 20, yPos);
    
    // Valor
    doc.setTextColor(...textColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 20, yPos + 6);
    
    yPos += 18;
  };
  
  // Secciones de información
  addSection('AGENCIA', reservation.agencyName);
  addSection('SERVICIO', reservation.service);
  
  // Fecha y Hora en la misma línea
  doc.setFillColor(...lightGray);
  doc.rect(15, yPos - 5, 87, 12, 'F');
  doc.rect(108, yPos - 5, 87, 12, 'F');
  
  doc.setTextColor(...primaryColor);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('FECHA', 20, yPos);
  doc.text('HORA', 113, yPos);
  
  doc.setTextColor(...textColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(reservation.date, 20, yPos + 6);
  doc.text(reservation.time, 113, yPos + 6);
  
  yPos += 18;
  
  addSection('HOTEL', reservation.hotel);
  
  // Pasajeros y Habitación en la misma línea
  doc.setFillColor(...lightGray);
  doc.rect(15, yPos - 5, 87, 12, 'F');
  doc.rect(108, yPos - 5, 87, 12, 'F');
  
  doc.setTextColor(...primaryColor);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('PASAJEROS', 20, yPos);
  doc.text('HABITACIÓN', 113, yPos);
  
  doc.setTextColor(...textColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(reservation.passengers.toString(), 20, yPos + 6);
  doc.text(reservation.roomNumber, 113, yPos + 6);
  
  yPos += 18;
  
  addSection('VUELO', reservation.flight);
  
  // Notas adicionales
  yPos += 10;
  doc.setFillColor(...primaryColor);
  doc.rect(15, yPos - 5, 180, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('NOTAS IMPORTANTES', 20, yPos);
  
  yPos += 10;
  doc.setTextColor(...textColor);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('• Presentarse 15 minutos antes de la hora programada', 20, yPos);
  doc.text('• Llevar documentación de viaje necesaria', 20, yPos + 5);
  doc.text('• En caso de cambios, contactar con anticipación', 20, yPos + 10);
  
  // Pie de página
  doc.setDrawColor(200, 200, 200);
  doc.line(15, 270, 195, 270);
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(8);
  doc.text('Este documento es una orden de servicio generada electrónicamente', 105, 280, { align: 'center' });
  doc.text(`ID: ${reservation.id}`, 105, 285, { align: 'center' });
  
  // Descargar PDF
  const fileName = `Orden_${reservation.agencyName.replace(/\s+/g, '_')}_${reservation.date}.pdf`;
  doc.save(fileName);
}