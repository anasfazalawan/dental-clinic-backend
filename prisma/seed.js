import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const seedData = async () => {
  console.log('🌱 Starting database seeding for DentPulse Clinic...');

  // 1. Clean existing records in correct order
  await prisma.appointment.deleteMany({});
  await prisma.doctor.deleteMany({});

  console.log('🧹 Cleaned existing doctors and appointments.');

  // 2. Create Doctors
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
      bio: 'Board-certified orthodontist specializing in clear aligners, adolescent braces, and surgical orthodontics with over 12 years of clinical excellence.',
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
      bio: 'Specialist in complex dental implantology, impacted wisdom tooth extractions, and reconstructive jaw surgery.',
      roomNumber: 'OR-1 / Surgical Suite',
    },
    {
      name: 'Dr. Elena Rostova, DDS',
      email: 'elena.rostova@dentpulse.com',
      phone: '+1 (555) 456-7890',
      specialization: 'Pediatric Dentistry',
      experienceYears: 8,
      availabilityDays: ['Tuesday', 'Wednesday', 'Thursday', 'Saturday'],
      availableHoursStart: '09:00',
      availableHoursEnd: '17:00',
      isActive: true,
      rating: 4.98,
      avatarUrl: 'https://images.unsplash.com/photo-1594824813515-d9fe7b8782a5?auto=format&fit=crop&q=80&w=300',
      bio: 'Dedicated to gentle, fear-free dental care for children and teens, early interceptive orthodontics, and preventive pediatric health.',
      roomNumber: 'Suite 204 - Kids Zone',
    },
    {
      name: 'Dr. David Kim, DDS',
      email: 'david.kim@dentpulse.com',
      phone: '+1 (555) 567-8901',
      specialization: 'Endodontics',
      experienceYears: 10,
      availabilityDays: ['Monday', 'Tuesday', 'Thursday', 'Friday'],
      availableHoursStart: '09:00',
      availableHoursEnd: '17:30',
      isActive: true,
      rating: 4.88,
      avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300',
      bio: 'Microscope-assisted endodontist focused on pain-free root canal therapy, tooth preservation, and dental trauma management.',
      roomNumber: 'Suite 103 - Micro Endodontics',
    },
    {
      name: 'Dr. Priya Patel, BDS, MS',
      email: 'priya.patel@dentpulse.com',
      phone: '+1 (555) 678-9012',
      specialization: 'Periodontics',
      experienceYears: 9,
      availabilityDays: ['Monday', 'Tuesday', 'Wednesday', 'Friday'],
      availableHoursStart: '09:00',
      availableHoursEnd: '16:00',
      isActive: true,
      rating: 4.92,
      avatarUrl: 'https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?auto=format&fit=crop&q=80&w=300',
      bio: 'Expert in regenerative gum therapies, cosmetic crown lengthening, and prevention and treatment of periodontal diseases.',
      roomNumber: 'Suite 105 - Perio Care',
    },
    {
      name: 'Dr. Michael Chang, DDS',
      email: 'michael.chang@dentpulse.com',
      phone: '+1 (555) 789-0123',
      specialization: 'Cosmetic Dentistry',
      experienceYears: 14,
      availabilityDays: ['Monday', 'Tuesday', 'Thursday', 'Friday', 'Saturday'],
      availableHoursStart: '10:00',
      availableHoursEnd: '18:00',
      isActive: false, // Inactive example to demonstrate active/inactive toggle
      rating: 4.85,
      avatarUrl: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=300',
      bio: 'Smile makeover specialist crafting custom porcelain veneers, teeth whitening, and aesthetic composite bonding (Currently on sabbatical).',
      roomNumber: 'Suite 201 - Aesthetics Lab',
    },
  ];

  const createdDoctors = [];
  for (const doc of doctorsData) {
    const created = await prisma.doctor.create({ data: doc });
    createdDoctors.push(created);
    console.log(`  ✓ Created Doctor: ${created.name} (${created.specialization})`);
  }

  // Helper date generators for realistic timestamps
  const today = new Date();
  const getOffsetDate = (dayOffset) => {
    const d = new Date();
    d.setDate(today.getDate() + dayOffset);
    return d;
  };

  // 3. Create Diverse Appointments
  const appointmentsData = [
    // Today's appointments
    {
      patientName: 'Emma Watson',
      patientPhone: '+1 (555) 111-2233',
      patientEmail: 'emma.watson@gmail.com',
      doctorId: createdDoctors[0].id, // Sarah Jenkins (Ortho)
      appointmentDate: getOffsetDate(0),
      appointmentTime: '09:00',
      durationMinutes: 45,
      reason: 'Invisalign Progress Check & Tray 14 Fitting',
      notes: 'Patient reported slight soreness in lower left quadrant. Check molar tracking.',
      status: 'IN_PROGRESS',
    },
    {
      patientName: 'Robert Langdon',
      patientPhone: '+1 (555) 222-3344',
      patientEmail: 'robert.langdon@harvard.edu',
      doctorId: createdDoctors[1].id, // Marcus Vance (Surgery)
      appointmentDate: getOffsetDate(0),
      appointmentTime: '10:30',
      durationMinutes: 60,
      reason: 'Impacted Wisdom Tooth Surgical Consultation',
      notes: 'CBCT 3D Scan requested. Evaluate proximity to inferior alveolar nerve.',
      status: 'CONFIRMED',
    },
    {
      patientName: 'Sophia Martinez',
      patientPhone: '+1 (555) 333-4455',
      patientEmail: 'sophia.martinez@outlook.com',
      doctorId: createdDoctors[2].id, // Elena Rostova (Pediatric)
      appointmentDate: getOffsetDate(0),
      appointmentTime: '13:00',
      durationMinutes: 30,
      reason: 'Routine Pediatric Checkup & Fluoride Varnish',
      notes: 'Age 7. Patient is anxious about dental tools; use gentle approach.',
      status: 'SCHEDULED',
    },
    {
      patientName: 'James Carter',
      patientPhone: '+1 (555) 444-5566',
      patientEmail: 'jcarter99@gmail.com',
      doctorId: createdDoctors[3].id, // David Kim (Endodontics)
      appointmentDate: getOffsetDate(0),
      appointmentTime: '14:30',
      durationMinutes: 60,
      reason: 'Root Canal Treatment (Tooth #19 Stage 2)',
      notes: 'Canals were shaped in previous session. Proceed with warm vertical obturation.',
      status: 'CONFIRMED',
    },

    // Tomorrow & Future Appointments
    {
      patientName: 'Olivia Sterling',
      patientPhone: '+1 (555) 555-6677',
      patientEmail: 'olivia.sterling@yahoo.com',
      doctorId: createdDoctors[0].id, // Sarah Jenkins
      appointmentDate: getOffsetDate(1),
      appointmentTime: '10:00',
      durationMinutes: 30,
      reason: 'Braces Wire Tightening & Elastics Replacement',
      notes: 'Replace upper archwire to 0.019x0.025 SS.',
      status: 'CONFIRMED',
    },
    {
      patientName: 'Daniel Hayes',
      patientPhone: '+1 (555) 666-7788',
      patientEmail: 'daniel.hayes@techcorp.io',
      doctorId: createdDoctors[4].id, // Priya Patel (Periodontics)
      appointmentDate: getOffsetDate(1),
      appointmentTime: '11:15',
      durationMinutes: 45,
      reason: 'Deep Scaling and Root Planing (Upper Right Quad)',
      notes: 'Local anesthesia required (Articaine 4% with 1:100k epi).',
      status: 'SCHEDULED',
    },
    {
      patientName: 'Amara Chen',
      patientPhone: '+1 (555) 777-8899',
      patientEmail: 'amara.chen@gmail.com',
      doctorId: createdDoctors[2].id, // Elena Rostova
      appointmentDate: getOffsetDate(2),
      appointmentTime: '09:30',
      durationMinutes: 30,
      reason: 'Molar Sealant Application & Oral Hygiene Instruction',
      notes: 'First adult molars fully erupted.',
      status: 'SCHEDULED',
    },
    {
      patientName: 'Lucas Bennett',
      patientPhone: '+1 (555) 888-9900',
      patientEmail: 'lucas.bennett@consultant.com',
      doctorId: createdDoctors[1].id, // Marcus Vance
      appointmentDate: getOffsetDate(2),
      appointmentTime: '13:00',
      durationMinutes: 60,
      reason: 'Titanium Dental Implant Placement (Tooth #30)',
      notes: 'Pre-op antibiotics prescribed. Bone graft ready.',
      status: 'CONFIRMED',
    },
    {
      patientName: 'Grace Hopper',
      patientPhone: '+1 (555) 999-0011',
      patientEmail: 'grace.h@computing.org',
      doctorId: createdDoctors[3].id, // David Kim
      appointmentDate: getOffsetDate(3),
      appointmentTime: '11:00',
      durationMinutes: 45,
      reason: 'Acute Pulpitis Diagnosis & Emergency Pulpotomy',
      notes: 'Severe nocturnal throbbing pain reported.',
      status: 'SCHEDULED',
    },
    {
      patientName: 'Liam Gallagher',
      patientPhone: '+1 (555) 123-9876',
      patientEmail: 'liam.g@oasis.co.uk',
      doctorId: createdDoctors[4].id, // Priya Patel
      appointmentDate: getOffsetDate(4),
      appointmentTime: '14:00',
      durationMinutes: 30,
      reason: 'Periodontal Maintenance & Pocket Depth Probing',
      notes: 'Review 3-month periodontal chart comparison.',
      status: 'SCHEDULED',
    },

    // Past Completed Appointments
    {
      patientName: 'Chloe Henderson',
      patientPhone: '+1 (555) 321-6549',
      patientEmail: 'chloe.h@designstudio.com',
      doctorId: createdDoctors[0].id, // Sarah Jenkins
      appointmentDate: getOffsetDate(-1),
      appointmentTime: '09:30',
      durationMinutes: 45,
      reason: 'Initial Orthodontic Assessment & Digital iTero Scan',
      notes: 'Scanned for Invisalign plan. Delivered treatment simulation.',
      status: 'COMPLETED',
    },
    {
      patientName: 'Alexander Wright',
      patientPhone: '+1 (555) 654-9870',
      patientEmail: 'alex.wright@university.edu',
      doctorId: createdDoctors[1].id, // Marcus Vance
      appointmentDate: getOffsetDate(-2),
      appointmentTime: '11:00',
      durationMinutes: 45,
      reason: 'Post-Extraction Suture Removal & Healing Check',
      notes: 'Socket healing well with healthy granulation tissue.',
      status: 'COMPLETED',
    },
    {
      patientName: 'Benjamin Franklin',
      patientPhone: '+1 (555) 741-8520',
      patientEmail: 'ben.franklin@press.org',
      doctorId: createdDoctors[3].id, // David Kim
      appointmentDate: getOffsetDate(-3),
      appointmentTime: '15:00',
      durationMinutes: 60,
      reason: 'Endodontic Retreatment (Tooth #14)',
      notes: 'Successfully bypassed calcified MB2 canal.',
      status: 'COMPLETED',
    },
    {
      patientName: 'Hannah Abbott',
      patientPhone: '+1 (555) 852-9630',
      patientEmail: 'hannah.abbott@botany.org',
      doctorId: createdDoctors[2].id, // Elena Rostova
      appointmentDate: getOffsetDate(-1),
      appointmentTime: '16:00',
      durationMinutes: 30,
      reason: 'Emergency Chipped Incisor Repair',
      notes: 'Restored with Estelite composite shade A1.',
      status: 'COMPLETED',
    },
    {
      patientName: 'Thomas Anderson',
      patientPhone: '+1 (555) 963-7410',
      patientEmail: 'neo@matrix.net',
      doctorId: createdDoctors[4].id, // Priya Patel
      appointmentDate: getOffsetDate(-4),
      appointmentTime: '10:00',
      durationMinutes: 30,
      reason: 'Bleeding Gums Evaluation & Antimicrobial Rinse Rx',
      notes: 'Patient did not attend appointment.',
      status: 'NO_SHOW',
    },
    {
      patientName: 'Victoria Secret',
      patientPhone: '+1 (555) 159-7530',
      patientEmail: 'victoria.s@fashion.com',
      doctorId: createdDoctors[0].id, // Sarah Jenkins
      appointmentDate: getOffsetDate(-2),
      appointmentTime: '14:00',
      durationMinutes: 30,
      reason: 'Retainer Replacement (Upper Hawley)',
      notes: 'Patient cancelled due to overseas travel. Rescheduling next month.',
      status: 'CANCELLED',
    },
  ];

  for (const apt of appointmentsData) {
    const created = await prisma.appointment.create({ data: apt });
    console.log(`  ✓ Created Appointment: ${created.patientName} on ${created.appointmentDate.toISOString().split('T')[0]} at ${created.appointmentTime} (${created.status})`);
  }

  console.log(`\n🎉 Seed finished successfully! Inserted ${createdDoctors.length} doctors and ${appointmentsData.length} appointments.`);
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
