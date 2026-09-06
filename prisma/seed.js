import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const seedData = async () => {
  console.log('🌱 Starting minimal database seeding for DentPulse Clinic...');

  // 1. Clean existing records in correct relation order
  await prisma.appointment.deleteMany({});
  await prisma.doctor.deleteMany({});

  console.log('🧹 Cleaned existing doctors and appointments.');

  // 2. Create 2 Specialist Doctors (Simple Test Data)
  const doctorsData = [
    {
      name: 'Dr. John Doe, DDS',
      email: 'john.doe@dentpulse.com',
      phone: '+1 (555) 123-4567',
      specialization: 'General Dentistry',
      experienceYears: 8,
      availabilityDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      availableHoursStart: '09:00',
      availableHoursEnd: '17:00',
      isActive: true,
      rating: 4.9,
      avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300',
      bio: 'General dental practitioner specializing in preventive care and patient consultations.',
      roomNumber: 'Room 101',
    },
    {
      name: 'Dr. Jane Smith, DMD',
      email: 'jane.smith@dentpulse.com',
      phone: '+1 (555) 987-6543',
      specialization: 'Orthodontics',
      experienceYears: 10,
      availabilityDays: ['Monday', 'Wednesday', 'Friday'],
      availableHoursStart: '08:30',
      availableHoursEnd: '16:30',
      isActive: true,
      rating: 5.0,
      avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
      bio: 'Specialist orthodontist focusing on dental alignment and smile makeovers.',
      roomNumber: 'Room 202',
    },
  ];

  const createdDoctors = [];
  for (const doc of doctorsData) {
    const created = await prisma.doctor.create({ data: doc });
    createdDoctors.push(created);
    console.log(`  ✓ Created Doctor: ${created.name} (${created.specialization})`);
  }

  // 3. Create 2 Sample Appointments (Simple Test Data)
  const today = new Date();
  const getOffsetDate = (dayOffset) => {
    const d = new Date();
    d.setDate(today.getDate() + dayOffset);
    return d;
  };

  const appointmentsData = [
    {
      patientName: 'John Doe',
      patientPhone: '+1 (555) 111-2222',
      patientEmail: 'johndoe.patient@example.com',
      doctorId: createdDoctors[0].id, // Dr. John Doe
      appointmentDate: getOffsetDate(0), // Today
      appointmentTime: '10:00',
      durationMinutes: 30,
      reason: 'Routine Dental Checkup & Cleaning',
      notes: 'First time visitor checkup.',
      status: 'CONFIRMED',
    },
    {
      patientName: 'Jane Roe',
      patientPhone: '+1 (555) 333-4444',
      patientEmail: 'janeroe.patient@example.com',
      doctorId: createdDoctors[1].id, // Dr. Jane Smith
      appointmentDate: getOffsetDate(1), // Tomorrow
      appointmentTime: '11:00',
      durationMinutes: 45,
      reason: 'Orthodontic Consultation',
      notes: 'Initial braces evaluation.',
      status: 'SCHEDULED',
    },
  ];

  for (const apt of appointmentsData) {
    const created = await prisma.appointment.create({ data: apt });
    console.log(`  ✓ Created Appointment: ${created.patientName} on ${created.appointmentDate.toISOString().split('T')[0]} at ${created.appointmentTime} (${created.status})`);
  }

  console.log(`\n🎉 Seed finished! Populated ${createdDoctors.length} doctors and ${appointmentsData.length} appointments.`);

};

// Execute if run directly
if (process.argv[1]?.endsWith('seed.js')) {
  seedData()
    .catch((e) => {
      console.error('❌ Error during seeding:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
