import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const seedData = async () => {
  console.log('🌱 Starting minimal database seeding for DentPulse Clinic...');

  // 1. Clean existing records in correct relation order
  await prisma.appointment.deleteMany({});
  await prisma.doctor.deleteMany({});

  console.log('🧹 Cleaned existing doctors and appointments.');

  // 2. Create 2 Specialist Doctors
  const doctorsData = [
    {
      name: 'Dr. Sarah Jenkins, DDS',
      email: 'sarah.jenkins@dentpulse.com',
      phone: '+1 (555) 234-5678',
      specialization: 'Orthodontics',
      experienceYears: 12,
      availabilityDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      availableHoursStart: '08:30',
      availableHoursEnd: '16:30',
      isActive: true,
      rating: 4.95,
      avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
      bio: 'Board-certified orthodontist specializing in clear aligners, adolescent braces, and surgical orthodontics.',
      roomNumber: 'Suite 101 - Ortho Wing',
    },
    {
      name: 'Dr. Marcus Vance, DMD',
      email: 'marcus.vance@dentpulse.com',
      phone: '+1 (555) 345-6789',
      specialization: 'Oral & Maxillofacial Surgery',
      experienceYears: 15,
      availabilityDays: ['Monday', 'Wednesday', 'Friday'],
      availableHoursStart: '08:00',
      availableHoursEnd: '15:00',
      isActive: true,
      rating: 4.9,
      avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300',
      bio: 'Specialist in complex dental implantology, wisdom tooth extractions, and reconstructive jaw surgery.',
      roomNumber: 'OR-1 / Surgical Suite',
    },
  ];

  const createdDoctors = [];
  for (const doc of doctorsData) {
    const created = await prisma.doctor.create({ data: doc });
    createdDoctors.push(created);
    console.log(`  ✓ Created Doctor: ${created.name} (${created.specialization})`);
  }

  // 3. Create 2 Sample Appointments
  const today = new Date();
  const getOffsetDate = (dayOffset) => {
    const d = new Date();
    d.setDate(today.getDate() + dayOffset);
    return d;
  };

  const appointmentsData = [
    {
      patientName: 'Emma Watson',
      patientPhone: '+1 (555) 111-2233',
      patientEmail: 'emma.watson@gmail.com',
      doctorId: createdDoctors[0].id, // Dr. Sarah Jenkins
      appointmentDate: getOffsetDate(0), // Today
      appointmentTime: '09:00',
      durationMinutes: 45,
      reason: 'Invisalign Progress Check & Tray Fitting',
      notes: 'Check lower quadrant molar tracking.',
      status: 'CONFIRMED',
    },
    {
      patientName: 'Robert Langdon',
      patientPhone: '+1 (555) 222-3344',
      patientEmail: 'robert.langdon@harvard.edu',
      doctorId: createdDoctors[1].id, // Dr. Marcus Vance
      appointmentDate: getOffsetDate(1), // Tomorrow
      appointmentTime: '10:30',
      durationMinutes: 60,
      reason: 'Impacted Wisdom Tooth Surgical Consultation',
      notes: 'Evaluate panoramic x-ray scan.',
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
