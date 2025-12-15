import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '../generated/prisma/client';
import { Logger } from '@nestjs/common';

// Enums
const Role = {
  admin: 'admin',
  doctor: 'doctor',
  patient: 'patient',
} as const;

const PrescriptionStatus = {
  pending: 'pending',
  consumed: 'consumed',
} as const;

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  }),
});
// ---------- utils ----------

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

function fakeCuid() {
  const rand = (len: number) =>
    Array.from(
      { length: len },
      () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)],
    ).join('');
  return `cmj${rand(4)}${rand(4)}${rand(4)}${rand(4)}`;
}

function daysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

async function hash(password: string) {
  return bcrypt.hash(password, 10);
}

// Nombres y apellidos latinos (40 cada uno) para asignar aleatoriamente
const FIRST_NAMES = [
  'María',
  'José',
  'Juan',
  'Ana',
  'Luis',
  'Carlos',
  'Jorge',
  'Lucía',
  'Miguel',
  'Sofía',
  'Diego',
  'Isabel',
  'Pedro',
  'Fernanda',
  'Andrés',
  'Valentina',
  'Ricardo',
  'Paula',
  'Alejandro',
  'Camila',
  'Roberto',
  'Mariana',
  'Rafael',
  'Gabriela',
  'Alberto',
  'Elena',
  'Manuel',
  'Adriana',
  'Nicolás',
  'Daniela',
  'Sergio',
  'Lorena',
  'Fernando',
  'Claudia',
  'Víctor',
  'Rosa',
  'Hugo',
  'Mónica',
  'Mateo',
  'Emilia',
];

const LAST_NAMES = [
  'García',
  'Rodríguez',
  'Martínez',
  'López',
  'Hernández',
  'González',
  'Pérez',
  'Sánchez',
  'Ramírez',
  'Torres',
  'Flores',
  'Rivera',
  'Gómez',
  'Díaz',
  'Morales',
  'Romero',
  'Ruiz',
  'Vargas',
  'Ortega',
  'Castro',
  'Rojas',
  'Mendoza',
  'Aguilar',
  'Jiménez',
  'Salazar',
  'Navarro',
  'Paredes',
  'Herrera',
  'Castillo',
  'Molina',
  'Cruz',
  'Vega',
  'Domínguez',
  'León',
  'Cabrera',
  'Silva',
  'Santana',
  'Ibáñez',
  'Delgado',
  'Márquez',
];

function randomFullName() {
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return `${first} ${last}`;
}

function normalizeNameForEmail(name: string) {
  return name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '.');
}

function makeUniqueEmail(base: string, used: Set<string>, domain = 'demo.com') {
  let candidate = `${base}@${domain}`;
  let i = 1;
  while (used.has(candidate)) {
    i++;
    candidate = `${base}${i}@${domain}`;
  }
  used.add(candidate);
  return candidate;
}
// ---------- seed ----------

async function main() {
  Logger.log('🌱 Iniciando seed...');

  await prisma.prescriptionItem.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();

  const usedEmails = new Set<string>();

  // ---------- ADMIN ----------

  await prisma.user.create({
    data: {
      id: fakeCuid(),
      email: 'admin@test.com',
      password: await hash('admin123'),
      name: 'Admin Principal',
      role: Role.admin,
    },
  });
  usedEmails.add('admin@test.com');

  // ---------- DOCTORES ----------

  // Credencial de médico fijo requerida
  const doctors = [] as { userId: string; doctorId: string }[];

  // Crear médico fijo: dr@test.com / dr123
  const fixedDoctorUser = await prisma.user.create({
    data: {
      id: fakeCuid(),
      email: 'dr@test.com',
      password: await hash('dr123'),
      name: 'Manuel Rojas',
      role: Role.doctor,
    },
  });

  usedEmails.add('dr@test.com');

  const fixedDoctor = await prisma.doctor.create({
    data: {
      id: fakeCuid(),
      userId: fixedDoctorUser.id,
      specialty: 'Medicina General',
    },
  });

  doctors.push({ userId: fixedDoctorUser.id, doctorId: fixedDoctor.id });

  for (let i = 1; i <= 10; i++) {
    const fullName = randomFullName();
    const baseEmail = normalizeNameForEmail(fullName);
    const email = makeUniqueEmail(baseEmail, usedEmails, 'demo.com');

    const user = await prisma.user.create({
      data: {
        id: fakeCuid(),
        email,
        password: await hash('dr123'),
        name: fullName,
        role: Role.doctor,
      },
    });

    const doctor = await prisma.doctor.create({
      data: {
        id: fakeCuid(),
        userId: user.id,
        specialty: ['Pediatría', 'Clínica', 'Cirugía', 'Traumatología'][i % 4],
      },
    });

    doctors.push({ userId: user.id, doctorId: doctor.id });
  }

  // ---------- PACIENTES ----------

  const patients = [] as { userId: string; patientId: string }[];

  // Crear paciente fijo: patient@test.com / patient123
  const fixedPatientName = randomFullName();
  const fixedPatientUser = await prisma.user.create({
    data: {
      id: fakeCuid(),
      email: 'patient@test.com',
      password: await hash('patient123'),
      name: fixedPatientName,
      role: Role.patient,
    },
  });

  usedEmails.add('patient@test.com');

  const fixedPatient = await prisma.patient.create({
    data: {
      id: fakeCuid(),
      userId: fixedPatientUser.id,
      birthDate: new Date(1990, 0, 1),
    },
  });

  patients.push({ userId: fixedPatientUser.id, patientId: fixedPatient.id });

  for (let i = 1; i <= 15; i++) {
    const fullName = randomFullName();
    const baseEmail = normalizeNameForEmail(fullName);
    const email = makeUniqueEmail(baseEmail, usedEmails, 'demo.com');

    const user = await prisma.user.create({
      data: {
        id: fakeCuid(),
        email,
        password: await hash('patient123'),
        name: fullName,
        role: Role.patient,
      },
    });

    const patient = await prisma.patient.create({
      data: {
        id: fakeCuid(),
        userId: user.id,
        birthDate: new Date(1990 + (i % 10), i % 12, i),
      },
    });

    patients.push({ userId: user.id, patientId: patient.id });
  }

  // ---------- PRESCRIPCIONES ----------

  let rxCounter = 1;

  for (const doctor of doctors) {
    const rxCount = Math.floor(Math.random() * 8) + 2; // cada doctor entre 2 y 9

    for (let i = 0; i < rxCount; i++) {
      const patient = patients[Math.floor(Math.random() * patients.length)];
      const consumed = Math.random() > 0.5;

      const prescription = await prisma.prescription.create({
        data: {
          id: fakeCuid(),
          code: `RX-2025-${String(rxCounter++).padStart(6, '0')}`,
          status: consumed
            ? PrescriptionStatus.consumed
            : PrescriptionStatus.pending,
          notes: null,
          createdAt: daysAgo(Math.floor(Math.random() * 30)),
          consumedAt: consumed
            ? daysAgo(Math.floor(Math.random() * 20) + 1)
            : null,
          patientId: patient.patientId,
          authorId: doctor.doctorId,
        },
      });

      const itemsCount = Math.floor(Math.random() * 3) + 1;

      for (let j = 0; j < itemsCount; j++) {
        await prisma.prescriptionItem.create({
          data: {
            id: fakeCuid(),
            prescriptionId: prescription.id,
            name: ['Amoxicilina', 'Ibuprofeno', 'Paracetamol'][j % 3],
            dosage: ['500mg', '250mg', '1g'][j % 3],
            quantity: Math.floor(Math.random() * 20) + 1,
            instructions: 'Tomar según indicación médica',
          },
        });
      }
    }
  }

  Logger.log('✅ Seed finalizado correctamente');
}

main()
  .catch((e) => {
    Logger.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
