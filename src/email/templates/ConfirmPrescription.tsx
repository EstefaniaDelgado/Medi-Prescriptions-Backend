import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface ConfirmPrescriptionEmailProps {
  prescriptionCode: string;
  patientName?: string;
  doctorName?: string;
  doctorSpecialty?: string | null;
  medications?: Array<{
    name: string;
    dosage?: string;
    quantity?: number;
    instructions?: string;
  }>;
  notes?: string | null;
  createdAt?: string;
}

export const ConfirmPrescription = ({
  prescriptionCode,
  patientName = 'Paciente',
  doctorName = 'Dr. Médico',
  doctorSpecialty,
  medications = [],
  notes,
  createdAt,
}: ConfirmPrescriptionEmailProps): React.JSX.Element => {
  return (
    <Html>
      <Head />
      <Preview>
        Confirmación de Prescripción Médica - {prescriptionCode}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header con gradiente */}
          <Section style={header}>
            <div style={logoContainer}>
              <div style={iconContainer}>
                <span style={medicalIcon}>💊</span>
              </div>
            </div>
          </Section>

          {/* Contenido principal */}
          <Section style={content}>
            <Heading style={h1}>Prescripción Médica Confirmada</Heading>

            <Text style={text}>
              Estimado/a <strong>{patientName}</strong>,
            </Text>

            <Text style={text}>
              Su prescripción médica ha sido procesada exitosamente por{' '}
              <strong>{doctorName}</strong>
              {doctorSpecialty && ` - ${doctorSpecialty}`}.
            </Text>

            {/* Información de la prescripción */}
            <Section style={prescriptionBox}>
              <Text style={prescriptionTitle}>Código de Prescripción</Text>
              <Text style={prescriptionCodeStyles}>{prescriptionCode}</Text>

              {createdAt && (
                <>
                  <Text style={prescriptionTitle}>Fecha de Emisión</Text>
                  <Text style={prescriptionDate}>{createdAt}</Text>
                </>
              )}

              {medications.length > 0 && (
                <>
                  <Text style={prescriptionTitle}>Medicamentos Prescritos</Text>
                  {medications.map((med, index) => (
                    <div key={index} style={medicationCard}>
                      <Text style={medicationName}>{med.name}</Text>
                      {med.dosage && (
                        <Text style={medicationDetail}>
                          Dosis: {med.dosage}
                        </Text>
                      )}
                      {med.quantity && (
                        <Text style={medicationDetail}>
                          Cantidad: {med.quantity}
                        </Text>
                      )}
                      {med.instructions && (
                        <Text style={medicationInstructions}>
                          {med.instructions}
                        </Text>
                      )}
                    </div>
                  ))}
                </>
              )}

              {notes && (
                <>
                  <Text style={prescriptionTitle}>Notas Médicas</Text>
                  <Text style={notesText}>{notes}</Text>
                </>
              )}
            </Section>

            <Text style={textSmall}>
              <strong>Importante:</strong> Conserve este código para futuras
              consultas, seguimiento de su tratamiento y para adquirir los
              medicamentos en farmacia.
            </Text>

            {/* Divider */}
            <div style={divider}></div>

            <Text style={textSmall}>
              • Siga las instrucciones de dosificación indicadas
              <br />
              • No suspenda el tratamiento sin consultar a su médico
              <br />• Si presenta efectos adversos, contacte inmediatamente a su
              médico tratante
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>Cuidamos de su salud y bienestar</Text>
            <Text style={footerTextSmall}>
              Este es un correo automático, por favor no respondas a este
              mensaje.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default ConfirmPrescription;

// Estilos inline
const main = {
  backgroundColor: '#f5f5f5',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  padding: '40px 0',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  maxWidth: '600px',
  borderRadius: '24px',
  overflow: 'hidden',
  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
};

const header = {
  background: 'linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%)',
  padding: '40px 0',
  textAlign: 'center' as const,
};

const iconContainer = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '80px',
  height: '80px',
  backgroundColor: '#ffffff',
  borderRadius: '50%',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
};

const medicalIcon = {
  fontSize: '36px',
  display: 'block',
  margin: 'auto',
};

const logoContainer = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '60px',
};

const content = {
  padding: '40px 40px 20px',
};

const h1 = {
  color: '#0369A1',
  fontSize: '28px',
  fontWeight: '700',
  lineHeight: '1.3',
  margin: '0 0 24px',
  textAlign: 'center' as const,
};

const prescriptionBox = {
  backgroundColor: '#F8FAFC',
  border: '2px solid #E2E8F0',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
};

const prescriptionTitle = {
  color: '#475569',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 8px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const prescriptionCodeStyles = {
  color: '#0369A1',
  fontSize: '20px',
  fontWeight: '700',
  margin: '0 0 16px',
  fontFamily: 'monospace',
};

const prescriptionDate = {
  color: '#374151',
  fontSize: '16px',
  fontWeight: '500',
  margin: '0 0 16px',
};

const medicationCard = {
  backgroundColor: '#ffffff',
  border: '1px solid #D1D5DB',
  borderRadius: '8px',
  padding: '12px',
  margin: '0 0 12px',
};

const medicationName = {
  color: '#1F2937',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 6px',
};

const medicationDetail = {
  color: '#6B7280',
  fontSize: '14px',
  margin: '0 0 4px',
};

const medicationInstructions = {
  color: '#374151',
  fontSize: '14px',
  fontStyle: 'italic',
  margin: '6px 0 0',
};

const notesText = {
  color: '#374151',
  fontSize: '15px',
  lineHeight: '1.5',
  margin: '0',
  padding: '12px',
  backgroundColor: '#FEF3C7',
  borderRadius: '6px',
  border: '1px solid #F59E0B',
};

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 16px',
};

const textSmall = {
  color: '#6B7280',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0 0 12px',
};

const divider = {
  borderTop: '1px solid #E5E7EB',
  margin: '32px 0',
};

const footer = {
  backgroundColor: '#F1F5F9',
  padding: '32px 40px',
  textAlign: 'center' as const,
  borderTop: '1px solid #E2E8F0',
};

const footerText = {
  color: '#0369A1',
  fontSize: '15px',
  lineHeight: '1.5',
  margin: '0 0 8px',
  fontWeight: '500',
};

const footerTextSmall = {
  color: '#9CA3AF',
  fontSize: '13px',
  lineHeight: '1.4',
  margin: '0',
};
