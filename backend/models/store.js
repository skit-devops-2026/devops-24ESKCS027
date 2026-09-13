const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Initial seed password hash for demo accounts: "password123"
const DEMO_PASSWORD_HASH = bcrypt.hashSync('password123', 10);
const ORGANIZER_PASSWORD_HASH = bcrypt.hashSync('organizer123', 10);
const ADMIN_PASSWORD_HASH = bcrypt.hashSync('admin123', 10);

/**
 * Configurable Single-College Identity
 */
const COLLEGE_NAME = process.env.COLLEGE_NAME || 'EventHive College of Engineering & Technology';
const COLLEGE_EMAIL_DOMAIN = process.env.COLLEGE_EMAIL_DOMAIN || 'college.edu';

/**
 * Realistic College Departments & Venues
 */
const COLLEGE_DEPARTMENTS = [
  'Computer Science & Engineering',
  'Information Technology',
  'Electronics & Communication',
  'Mechanical Engineering',
  'Civil Engineering',
  'Management Studies',
  'Humanities & Social Sciences'
];

const COLLEGE_VENUES = [
  'Main Auditorium',
  'CS Seminar Hall 1',
  'CS Seminar Hall 2',
  'Innovation Lab A',
  'Innovation Lab B',
  'Indoor Sports Complex',
  'Management Conclave Hall',
  'Open Air Amphitheatre',
  'Conference Room 101'
];

class DataStore {
  constructor() {
    this.collegeName = COLLEGE_NAME;
    this.users = [];
    this.hosts = [];
    this.events = [];
    this.registrations = [];
    this.auditLogs = [];
    this.notifications = [];
    this.initSeedData();
  }

  initSeedData() {
    // 1. Seed Event Hosts / Teachers (Multiple Teachers across departments)
    this.hosts = [
      {
        _id: 'host_101',
        id: 'host_101',
        name: 'Dr. Rajesh Sharma',
        email: 'rajesh.sharma@college.edu',
        department: 'Computer Science & Engineering',
        designation: 'Professor & Head of Innovation Lab',
        phone: '+91 98111 22334',
        status: 'Active',
        specialization: 'AI, Distributed Systems & Hackathons'
      },
      {
        _id: 'host_102',
        id: 'host_102',
        name: 'Prof. Anita Roy',
        email: 'anita.roy@college.edu',
        department: 'Electronics & Communication',
        designation: 'Associate Professor',
        phone: '+91 98222 33445',
        status: 'Active',
        specialization: 'Robotics, IoT & Hardware Systems'
      },
      {
        _id: 'host_103',
        id: 'host_103',
        name: 'Dr. Vikram Mehta',
        email: 'vikram.mehta@college.edu',
        department: 'Mechanical Engineering',
        designation: 'Professor & Sports Dean',
        phone: '+91 98333 44556',
        status: 'Active',
        specialization: 'Combat Robotics & Sports Committee'
      },
      {
        _id: 'host_104',
        id: 'host_104',
        name: 'Prof. Sunita Gupta',
        email: 'sunita.gupta@college.edu',
        department: 'Management Studies',
        designation: 'Assistant Professor & E-Cell Mentor',
        phone: '+91 98444 55667',
        status: 'Active',
        specialization: 'Entrepreneurship & Startup Mentorship'
      }
    ];

    // 2. Seed Users across all 5 roles
    // HOD / Admin
    const hodUser = {
      _id: 'hod_001',
      name: 'Dr. Arthur Pendelton',
      email: 'admin@eventhive.com',
      password: ADMIN_PASSWORD_HASH,
      role: 'admin', // HOD / Admin
      department: 'Computer Science & Engineering',
      designation: 'Head of Department & Dean of Student Affairs',
      organization: 'College Administration',
      phone: '+91 99000 11111',
      bio: 'Head of Department and Chief Event Approval Authority.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop',
      isCollegeVerified: true,
      collegeId: 'FAC-HOD-01'
    };

    // Event Hosts (Teachers as login users)
    const hostUser1 = {
      _id: 'host_101',
      name: 'Dr. Rajesh Sharma',
      email: 'rajesh.sharma@college.edu',
      password: DEMO_PASSWORD_HASH,
      role: 'host', // Teacher / Host
      department: 'Computer Science & Engineering',
      designation: 'Professor',
      organization: 'Faculty of Computer Science',
      phone: '+91 98111 22334',
      bio: 'Faculty mentor for technical symposiums and AI workshops.',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop',
      isCollegeVerified: true,
      collegeId: 'FAC-CS-101'
    };

    const hostUser2 = {
      _id: 'host_102',
      name: 'Prof. Anita Roy',
      email: 'anita.roy@college.edu',
      password: DEMO_PASSWORD_HASH,
      role: 'host',
      department: 'Electronics & Communication',
      designation: 'Associate Professor',
      organization: 'Faculty of ECE',
      phone: '+91 98222 33445',
      bio: 'Robotics advisor and electronics lab director.',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&h=300&fit=crop',
      isCollegeVerified: true,
      collegeId: 'FAC-ECE-102'
    };

    // Coordinators (College Students with organizing roles)
    const coordinator1 = {
      _id: 'org_001',
      name: 'Alex Rivera',
      email: 'alex.organizer@eventhive.com',
      password: ORGANIZER_PASSWORD_HASH,
      role: 'organizer', // Coordinator
      department: 'Computer Science & Engineering',
      organization: 'Tech & Innovation Council',
      phone: '+91 98765 43210',
      bio: 'Lead Student Coordinator for Tech Hackathons and Coding Contests.',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop',
      isCollegeVerified: true,
      collegeId: 'STU-COORD-01'
    };

    const coordinator2 = {
      _id: 'org_002',
      name: 'Sarah Chen',
      email: 'sarah.organizer@eventhive.com',
      password: ORGANIZER_PASSWORD_HASH,
      role: 'organizer',
      department: 'Student Affairs',
      organization: 'Cultural Committee',
      phone: '+91 98765 12345',
      bio: 'Curating dynamic cultural nights and arts exhibitions.',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop',
      isCollegeVerified: true,
      collegeId: 'STU-COORD-02'
    };

    // Verified College Students
    const student1 = {
      _id: 'stu_001',
      name: 'Aashish Kumawat',
      email: 'aashish.student@eventhive.edu',
      password: DEMO_PASSWORD_HASH,
      role: 'student',
      department: 'Computer Science & Engineering',
      rollNumber: '23BCS10142',
      semester: '6th Semester',
      year: '3rd Year',
      phone: '+91 98888 77777',
      bio: 'Competitive programmer and active college hackathon participant.',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop',
      isCollegeVerified: true,
      collegeId: '23BCS10142'
    };

    const student2 = {
      _id: 'stu_002',
      name: 'Rohan Verma',
      email: 'rohan.student@college.edu',
      password: DEMO_PASSWORD_HASH,
      role: 'student',
      department: 'Electronics & Communication',
      rollNumber: '23ECE10055',
      semester: '4th Semester',
      year: '2nd Year',
      phone: '+91 97777 66666',
      bio: 'Robotics enthusiast and IoT developer.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop',
      isCollegeVerified: true,
      collegeId: '23ECE10055'
    };

    // External / Public User (non-college visitor)
    const publicUser = {
      _id: 'pub_001',
      name: 'Guest Visitor',
      email: 'guest@external.com',
      password: DEMO_PASSWORD_HASH,
      role: 'public',
      department: 'General Public',
      organization: 'External Visitor Community',
      phone: '+91 90000 00000',
      bio: 'External tech enthusiast & visitor.',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&h=300&fit=crop',
      isCollegeVerified: false
    };

    this.users = [hodUser, hostUser1, hostUser2, coordinator1, coordinator2, student1, student2, publicUser];

    // 3. Seed Realistic Events across all lifecycle stages
    this.events = [
      {
        _id: 'evt_101',
        id: 'evt_101',
        title: 'HackHive 2026: Annual Campus Hackathon',
        description: '24-hour sprint to build innovative solutions for campus and societal problems.',
        category: 'Technical',
        eventType: 'Hackathon',
        department: 'Computer Science & Engineering',
        date: '2026-09-15',
        startTime: '09:00',
        endTime: '18:00',
        venue: 'Main Auditorium',
        locationType: 'In-Person',
        maxCapacity: 150,
        capacity: 150,
        totalSeats: 150,
        registeredCount: 108,
        availableSeats: 42,
        visibility: 'COLLEGE_ONLY', // Visible only to College Students
        registrationAccess: 'COLLEGE_STUDENTS_ONLY', // Only Verified Students can register
        status: 'PUBLISHED', // Officially Approved & Published by HOD
        purpose: 'Promote student innovation and software development skills.',
        requiredResources: 'High-speed Wi-Fi, Power strips, Projector, Stage audio',
        organizerId: 'org_001',
        organizerName: 'Alex Rivera',
        coordinatorId: 'org_001',
        coordinatorName: 'Alex Rivera',
        hostId: 'host_101',
        hostName: 'Dr. Rajesh Sharma',
        hostDepartment: 'Computer Science & Engineering',
        hostRemarks: 'Approved. Venue and schedule verified. Strong student engagement expected.',
        hodApprovedBy: 'Dr. Arthur Pendelton (HOD)',
        hodApprovedAt: '2026-08-15T10:00:00Z',
        conflictOverride: false,
        approvalHistory: [
          { actor: 'Alex Rivera', role: 'Coordinator', action: 'SUBMITTED', timestamp: '2026-08-10 09:00:00', comment: 'Proposal submitted with Dr. Rajesh Sharma requested as host.' },
          { actor: 'Dr. Rajesh Sharma', role: 'Teacher / Host', action: 'HOST_APPROVED', timestamp: '2026-08-12 14:30:00', comment: 'Schedule verified. Forwarded to HOD.' },
          { actor: 'Dr. Arthur Pendelton', role: 'HOD / Admin', action: 'HOD_APPROVED', timestamp: '2026-08-15 10:00:00', comment: 'Final approval granted. Event published live.' }
        ],
        bannerUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&h=600&fit=crop',
        image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&h=600&fit=crop',
        tags: ['AI', 'Hackathon', 'Coding', 'College Only'],
        price: 0,
        createdAt: '2026-08-10T09:00:00Z'
      },
      {
        _id: 'evt_102',
        id: 'evt_102',
        title: 'AI & Deep Learning Hands-on Workshop',
        description: 'Comprehensive workshop covering Transformers, PyTorch, and neural networks.',
        category: 'Workshop',
        eventType: 'Workshop',
        department: 'Computer Science & Engineering',
        date: '2026-09-02',
        startTime: '14:00',
        endTime: '17:30',
        venue: 'CS Seminar Hall 2',
        locationType: 'In-Person',
        maxCapacity: 80,
        capacity: 80,
        totalSeats: 80,
        registeredCount: 62,
        availableSeats: 18,
        visibility: 'PUBLIC', // Public Discovery
        registrationAccess: 'PUBLIC', // Both Students & External Visitors can register
        status: 'PUBLISHED',
        purpose: 'Hands-on practical training in Deep Learning for engineering students and guests.',
        requiredResources: 'GPU workstations, HDMI display, Whiteboard',
        organizerId: 'org_001',
        organizerName: 'Alex Rivera',
        coordinatorId: 'org_001',
        coordinatorName: 'Alex Rivera',
        hostId: 'host_101',
        hostName: 'Dr. Rajesh Sharma',
        hostDepartment: 'Computer Science & Engineering',
        hostRemarks: 'Lab hardware checked and approved.',
        hodApprovedBy: 'Dr. Arthur Pendelton (HOD)',
        hodApprovedAt: '2026-08-16T11:00:00Z',
        conflictOverride: false,
        approvalHistory: [
          { actor: 'Alex Rivera', role: 'Coordinator', action: 'SUBMITTED', timestamp: '2026-08-11 10:00:00', comment: 'Proposal submitted.' },
          { actor: 'Dr. Rajesh Sharma', role: 'Teacher / Host', action: 'HOST_APPROVED', timestamp: '2026-08-13 11:00:00', comment: 'Lab booked.' },
          { actor: 'Dr. Arthur Pendelton', role: 'HOD / Admin', action: 'HOD_APPROVED', timestamp: '2026-08-16 11:00:00', comment: 'Final HOD approval granted.' }
        ],
        bannerUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200&h=600&fit=crop',
        image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200&h=600&fit=crop',
        tags: ['AI', 'PyTorch', 'DeepLearning', 'Public'],
        price: 0,
        createdAt: '2026-08-11T10:00:00Z'
      },
      {
        _id: 'evt_103',
        id: 'evt_103',
        title: 'Rhythm & Beats: Inter-College Cultural Fest',
        description: 'Annual cultural extravaganza featuring battle of the bands and dance.',
        category: 'Cultural',
        eventType: 'Cultural Fest',
        department: 'Student Affairs',
        date: '2026-09-20',
        startTime: '16:00',
        endTime: '22:00',
        venue: 'Open Air Amphitheatre',
        locationType: 'In-Person',
        maxCapacity: 500,
        capacity: 500,
        totalSeats: 500,
        registeredCount: 380,
        availableSeats: 120,
        visibility: 'PUBLIC',
        registrationAccess: 'PUBLIC',
        status: 'PUBLISHED',
        purpose: 'Annual college cultural celebration.',
        requiredResources: 'Concert sound reinforcement, Stage lighting, Green rooms',
        organizerId: 'org_002',
        organizerName: 'Sarah Chen',
        coordinatorId: 'org_002',
        coordinatorName: 'Sarah Chen',
        hostId: 'host_104',
        hostName: 'Prof. Sunita Gupta',
        hostDepartment: 'Management Studies',
        hostRemarks: 'Approved for open air staging.',
        hodApprovedBy: 'Dr. Arthur Pendelton (HOD)',
        hodApprovedAt: '2026-08-18T15:00:00Z',
        conflictOverride: false,
        approvalHistory: [
          { actor: 'Sarah Chen', role: 'Coordinator', action: 'SUBMITTED', timestamp: '2026-08-12 14:00:00', comment: 'Annual cultural proposal submitted.' },
          { actor: 'Prof. Sunita Gupta', role: 'Teacher / Host', action: 'HOST_APPROVED', timestamp: '2026-08-15 16:00:00', comment: 'Amphitheatre safety verified.' },
          { actor: 'Dr. Arthur Pendelton', role: 'HOD / Admin', action: 'HOD_APPROVED', timestamp: '2026-08-18 15:00:00', comment: 'Approved and published.' }
        ],
        bannerUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&h=600&fit=crop',
        image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&h=600&fit=crop',
        tags: ['Cultural', 'Music', 'Dance', 'Public'],
        price: 0,
        createdAt: '2026-08-12T14:00:00Z'
      },
      {
        // PENDING HOD REVIEW (Host Approved, Waiting for HOD Final Approval)
        _id: 'evt_104',
        id: 'evt_104',
        title: 'Startup Pitch Night & Investor Meet',
        description: 'Platform for student startups to pitch to angel investors and mentors.',
        category: 'Seminar',
        eventType: 'Seminar',
        department: 'Management Studies',
        date: '2026-10-05',
        startTime: '17:00',
        endTime: '20:30',
        venue: 'Management Conclave Hall',
        locationType: 'In-Person',
        maxCapacity: 120,
        capacity: 120,
        totalSeats: 120,
        registeredCount: 0,
        availableSeats: 120,
        visibility: 'COLLEGE_ONLY',
        registrationAccess: 'COLLEGE_STUDENTS_ONLY',
        status: 'HOD_REVIEW', // Host Approved -> Awaiting HOD Final Approval
        purpose: 'Connect student entrepreneurs with early-stage venture capital mentors.',
        requiredResources: 'Podium, Projector, Microphones, VIP seating',
        requestedByStudentId: 'stu_001',
        requestedByStudentName: 'Aashish Kumawat',
        organizerId: 'org_001',
        organizerName: 'Alex Rivera',
        coordinatorId: 'org_001',
        coordinatorName: 'Alex Rivera',
        coordinatorRemarks: 'Verified student proposal. Strong potential for campus incubator.',
        hostId: 'host_104',
        hostName: 'Prof. Sunita Gupta',
        hostDepartment: 'Management Studies',
        hostRemarks: 'Verified budget and venue availability. Approved for HOD final review.',
        hostApprovedAt: '2026-08-21T16:00:00Z',
        conflictOverride: false,
        approvalHistory: [
          { actor: 'Aashish Kumawat', role: 'Student Coordinator', action: 'SUBMITTED', timestamp: '2026-08-19 10:00:00', comment: 'Proposal submitted.' },
          { actor: 'Alex Rivera', role: 'Coordinator', action: 'COORDINATOR_VERIFIED', timestamp: '2026-08-20 11:00:00', comment: 'Assigned Prof. Sunita Gupta.' },
          { actor: 'Prof. Sunita Gupta', role: 'Teacher / Host', action: 'HOST_APPROVED', timestamp: '2026-08-21 16:00:00', comment: 'Verified and approved for HOD review.' }
        ],
        bannerUrl: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1200&h=600&fit=crop',
        image: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1200&h=600&fit=crop',
        tags: ['Startup', 'Pitch', 'Incubator', 'College Only'],
        price: 0,
        createdAt: '2026-08-19T10:00:00Z'
      },
      {
        // SCHEDULE CONFLICT SCENARIO: Same date (2026-09-15) and Overlapping time (10:00 - 13:00) at Main Auditorium (occupied by HackHive)
        _id: 'evt_105',
        id: 'evt_105',
        title: 'RoboWars Combat Arena Demo',
        description: 'Demonstration and battle contest of student built combat robots.',
        category: 'Technical',
        eventType: 'Competition',
        department: 'Electronics & Communication',
        date: '2026-09-15', // Same Date as HackHive (evt_101)
        startTime: '10:00', // Overlaps with HackHive (09:00 - 18:00)
        endTime: '13:00',
        venue: 'Main Auditorium', // Same Venue! -> Conflict!
        locationType: 'In-Person',
        maxCapacity: 100,
        capacity: 100,
        totalSeats: 100,
        registeredCount: 0,
        availableSeats: 100,
        visibility: 'COLLEGE_ONLY',
        registrationAccess: 'COLLEGE_STUDENTS_ONLY',
        status: 'HOST_REVIEW', // Assigned to Prof. Anita Roy, waiting for conflict check & approval
        purpose: 'Robotics club live combat demonstration.',
        requiredResources: 'Safety barricades, Power outlets, First aid',
        requestedByStudentId: 'stu_002',
        requestedByStudentName: 'Rohan Verma',
        organizerId: 'org_001',
        organizerName: 'Alex Rivera',
        coordinatorId: 'org_001',
        coordinatorName: 'Alex Rivera',
        coordinatorRemarks: 'Forwarded to robotics department faculty mentor.',
        hostId: 'host_102',
        hostName: 'Prof. Anita Roy',
        hostDepartment: 'Electronics & Communication',
        conflictOverride: false,
        approvalHistory: [
          { actor: 'Rohan Verma', role: 'Student Coordinator', action: 'SUBMITTED', timestamp: '2026-08-20 11:30:00', comment: 'Proposal submitted.' },
          { actor: 'Alex Rivera', role: 'Coordinator', action: 'HOST_ASSIGNED', timestamp: '2026-08-20 12:00:00', comment: 'Assigned Prof. Anita Roy for schedule check.' }
        ],
        bannerUrl: 'https://images.unsplash.com/photo-1563770660941-20978e870e26?w=1200&h=600&fit=crop',
        image: 'https://images.unsplash.com/photo-1563770660941-20978e870e26?w=1200&h=600&fit=crop',
        tags: ['Robotics', 'Hardware', 'Combat'],
        price: 0,
        createdAt: '2026-08-20T11:30:00Z'
      },
      {
        // NEW STUDENT REQUEST (SUBMITTED, Waiting for Coordinator review)
        _id: 'evt_106',
        id: 'evt_106',
        title: 'Cybersecurity & Ethical Hacking Bootcamp',
        description: 'Hands-on training on network defense, penetration testing, and bug bounty hunting.',
        category: 'Workshop',
        eventType: 'Workshop',
        department: 'Computer Science & Engineering',
        date: '2026-10-12',
        startTime: '10:00',
        endTime: '15:00',
        venue: 'Innovation Lab A',
        locationType: 'In-Person',
        maxCapacity: 60,
        capacity: 60,
        totalSeats: 60,
        registeredCount: 0,
        availableSeats: 60,
        visibility: 'COLLEGE_ONLY',
        registrationAccess: 'COLLEGE_STUDENTS_ONLY',
        status: 'SUBMITTED', // Student Submitted -> Awaiting Coordinator Review
        purpose: 'Train students for national cybersecurity CTF competitions.',
        requiredResources: 'Linux lab computers, Projector, Network isolation switch',
        requestedByStudentId: 'stu_001',
        requestedByStudentName: 'Aashish Kumawat',
        requestedByEmail: 'aashish.student@eventhive.edu',
        requestedByRoll: '23BCS10142',
        conflictOverride: false,
        approvalHistory: [
          { actor: 'Aashish Kumawat', role: 'Student Coordinator', action: 'SUBMITTED', timestamp: '2026-08-22 14:00:00', comment: 'Proposal submitted for Coordinator review.' }
        ],
        bannerUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&h=600&fit=crop',
        image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&h=600&fit=crop',
        tags: ['Cybersecurity', 'CTF', 'Workshop'],
        price: 0,
        createdAt: '2026-08-22T14:00:00Z'
      }
    ];

    // 4. Seed Registrations
    this.registrations = [
      {
        _id: 'reg_001',
        id: 'reg_001',
        eventId: 'evt_101',
        eventTitle: 'HackHive 2026: Annual Campus Hackathon',
        participantName: 'Aashish Kumawat',
        participantEmail: 'aashish.student@eventhive.edu',
        participantPhone: '+91 98888 77777',
        studentId: 'stu_001',
        userId: 'stu_001',
        registrationType: 'CollegeStudent',
        ticketCode: 'TK-HACK-001',
        status: 'Confirmed',
        registeredAt: new Date('2026-08-16T10:30:00Z'),
        attended: false
      },
      {
        _id: 'reg_002',
        id: 'reg_002',
        eventId: 'evt_102',
        eventTitle: 'AI & Deep Learning Hands-on Workshop',
        participantName: 'Aashish Kumawat',
        participantEmail: 'aashish.student@eventhive.edu',
        participantPhone: '+91 98888 77777',
        studentId: 'stu_001',
        userId: 'stu_001',
        registrationType: 'CollegeStudent',
        ticketCode: 'TK-AI-002',
        status: 'Confirmed',
        registeredAt: new Date('2026-08-17T11:00:00Z'),
        attended: false
      }
    ];

    // 5. Seed Audit Logs
    this.auditLogs = [
      {
        id: 'AUD-01',
        actorId: 'stu_001',
        actorName: 'Aashish Kumawat',
        actorRole: 'Student',
        action: 'EVENT_REQUESTED',
        targetId: 'evt_106',
        targetTitle: 'Cybersecurity & Ethical Hacking Bootcamp',
        timestamp: '2026-08-22 14:00:00',
        remarks: 'Student submitted event proposal for 60 participants at Innovation Lab A.'
      },
      {
        id: 'AUD-02',
        actorId: 'org_001',
        actorName: 'Alex Rivera',
        actorRole: 'Coordinator',
        action: 'HOST_ASSIGNED',
        targetId: 'evt_105',
        targetTitle: 'RoboWars Combat Arena Demo',
        timestamp: '2026-08-20 12:00:00',
        remarks: 'Coordinator verified proposal and assigned Event Host Prof. Anita Roy.'
      },
      {
        id: 'AUD-03',
        actorId: 'host_104',
        actorName: 'Prof. Sunita Gupta',
        actorRole: 'Teacher / Host',
        action: 'HOST_APPROVED',
        targetId: 'evt_104',
        targetTitle: 'Startup Pitch Night & Investor Meet',
        timestamp: '2026-08-21 16:00:00',
        remarks: 'Host verified date, time, and venue availability. Approved for HOD final review.'
      },
      {
        id: 'AUD-04',
        actorId: 'hod_001',
        actorName: 'Dr. Arthur Pendelton',
        actorRole: 'HOD / Admin',
        action: 'HOD_APPROVED',
        targetId: 'evt_101',
        targetTitle: 'HackHive 2026: Annual Campus Hackathon',
        timestamp: '2026-08-15 10:00:00',
        remarks: 'Final HOD approval granted. Event published live for college students.'
      }
    ];

    // 6. Seed Notifications
    this.notifications = [
      {
        id: 'NOTIF-HOD-1',
        targetRole: 'admin',
        userId: 'hod_001',
        title: 'New Host-Approved Event Pending Final Review',
        message: 'Prof. Sunita Gupta approved "Startup Pitch Night & Investor Meet". Final HOD approval required.',
        timestamp: '2026-08-21 16:05',
        read: false,
        link: '/admin/events?status=HOD_REVIEW'
      },
      {
        id: 'NOTIF-HOST-1',
        targetRole: 'host',
        userId: 'host_102',
        title: 'Event Assigned for Verification',
        message: 'Coordinator Alex Rivera assigned you to verify "RoboWars Combat Arena Demo".',
        timestamp: '2026-08-20 12:05',
        read: false,
        link: '/api/host/events'
      },
      {
        id: 'NOTIF-COORD-1',
        targetRole: 'organizer',
        userId: 'org_001',
        title: 'New Student Event Request Submitted',
        message: 'Aashish Kumawat submitted proposal for "Cybersecurity Bootcamp".',
        timestamp: '2026-08-22 14:01',
        read: false,
        link: '/api/coordinator/requests'
      }
    ];
  }

  // --- CONFLICT DETECTION ENGINE (Venue + Date + Time + Host Schedule) ---
  checkConflict(newEventData, excludeEventId = null) {
    const activeEvents = this.events.filter(e => {
      const idMatch = (e._id === excludeEventId || e.id === excludeEventId);
      const isInactive = ['CANCELLED', 'Cancelled', 'REJECTED', 'HOD_REJECTED', 'HOST_REJECTED', 'DRAFT', 'Draft'].includes(e.status);
      return !idMatch && !isInactive;
    });

    const conflicts = [];
    const reqDate = (newEventData.date || '').split('T')[0];
    const reqVenue = (newEventData.venue || '').trim().toLowerCase();
    const reqStart = (newEventData.startTime || '00:00').trim();
    const reqEnd = (newEventData.endTime || '23:59').trim();
    const reqHostId = newEventData.hostId || null;

    for (const existing of activeEvents) {
      const existDate = (existing.date || '').split('T')[0];
      const existVenue = (existing.venue || '').trim().toLowerCase();
      const existStart = (existing.startTime || '00:00').trim();
      const existEnd = (existing.endTime || '23:59').trim();
      const existHostId = existing.hostId || null;

      if (reqDate === existDate) {
        // Time overlap: (reqStart < existEnd && reqEnd > existStart)
        const isTimeOverlapping = (reqStart < existEnd && reqEnd > existStart) ||
                                  (reqStart === existStart && reqEnd === existEnd);

        if (isTimeOverlapping) {
          // Check A: Venue Collision (only physical venues, skip online)
          if (reqVenue === existVenue && reqVenue !== 'online' && !reqVenue.includes('zoom') && reqVenue !== '') {
            conflicts.push({
              conflictType: 'VENUE_COLLISION',
              conflictingEventId: existing._id || existing.id,
              conflictingEventTitle: existing.title,
              venue: existing.venue,
              date: existDate,
              existingTime: `${existStart} - ${existEnd}`,
              requestedTime: `${reqStart} - ${reqEnd}`,
              existingStatus: existing.status,
              organizer: existing.organizerName || existing.coordinatorName || 'College Club',
              host: existing.hostName || 'Not Assigned',
              message: `VENUE CONFLICT DETECTED: '${existing.venue}' is already occupied on ${existDate} from ${existStart} to ${existEnd} by '${existing.title}'.`
            });
          }

          // Check B: Host / Teacher Schedule Collision
          if (reqHostId && existHostId && reqHostId === existHostId) {
            conflicts.push({
              conflictType: 'HOST_SCHEDULE_COLLISION',
              conflictingEventId: existing._id || existing.id,
              conflictingEventTitle: existing.title,
              venue: existing.venue,
              date: existDate,
              existingTime: `${existStart} - ${existEnd}`,
              requestedTime: `${reqStart} - ${reqEnd}`,
              host: existing.hostName,
              message: `EVENT HOST SCHEDULE CONFLICT: Teacher ${existing.hostName} is already presiding over '${existing.title}' on ${existDate} during ${existStart} - ${existEnd}.`
            });
          }
        }
      }
    }

    return {
      hasConflict: conflicts.length > 0,
      conflicts,
      primaryConflict: conflicts[0] || null
    };
  }

  // --- AUDIT LOGGING ---
  addAuditLog({ actorId, actorName, actorRole, action, targetId, targetTitle, remarks }) {
    const log = {
      id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      actorId: actorId || 'system',
      actorName: actorName || 'System',
      actorRole: actorRole || 'System',
      action,
      targetId: targetId || '',
      targetTitle: targetTitle || '',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      remarks: remarks || ''
    };
    this.auditLogs.unshift(log);
    return log;
  }

  // --- NOTIFICATIONS ---
  addNotification({ targetRole, userId, title, message, link }) {
    const notif = {
      id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      targetRole: targetRole || 'all',
      userId: userId || null,
      title,
      message,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      read: false,
      link: link || '#'
    };
    this.notifications.unshift(notif);
    return notif;
  }

  // --- USER HELPERS ---
  findUserById(id) {
    return this.users.find(u => u._id === id || u.id === id);
  }

  findUserByEmail(email) {
    if (!email) return null;
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  createUser(userData) {
    const isCollegeVerified = userData.isCollegeVerified !== undefined
      ? userData.isCollegeVerified
      : (userData.email.endsWith(`@${COLLEGE_EMAIL_DOMAIN}`) || userData.email.endsWith('@eventhive.edu') || Boolean(userData.rollNumber));

    const newUser = {
      _id: userData._id || `usr_${uuidv4().substring(0, 8)}`,
      id: userData._id || `usr_${uuidv4().substring(0, 8)}`,
      name: userData.name,
      email: userData.email.toLowerCase(),
      password: userData.password,
      role: userData.role || 'student',
      department: userData.department || 'Computer Science & Engineering',
      rollNumber: userData.rollNumber || '',
      semester: userData.semester || '',
      year: userData.year || '',
      organization: userData.organization || '',
      phone: userData.phone || '',
      bio: userData.bio || '',
      avatar: userData.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop',
      isCollegeVerified,
      collegeId: userData.collegeId || userData.rollNumber || (isCollegeVerified ? `COL-${Math.floor(Math.random()*10000)}` : ''),
      status: 'Active',
      createdAt: new Date().toISOString(),
    };
    this.users.push(newUser);
    return newUser;
  }

  // --- EVENT HELPERS ---
  findEventById(id) {
    return this.events.find(e => e._id === id || e.id === id);
  }

  createEvent(eventData) {
    const eventId = eventData._id || `evt_${Date.now()}`;
    const capacity = parseInt(eventData.maxCapacity || eventData.capacity || eventData.totalSeats || 100);

    const newEvent = {
      _id: eventId,
      id: eventId,
      title: eventData.title,
      description: eventData.description,
      category: eventData.category || 'Technical',
      eventType: eventData.eventType || eventData.category || 'Workshop',
      department: eventData.department || 'Computer Science & Engineering',
      date: eventData.date,
      startTime: eventData.startTime || '09:00',
      endTime: eventData.endTime || '17:00',
      venue: eventData.venue || 'Main Auditorium',
      locationType: eventData.locationType || 'In-Person',
      maxCapacity: capacity,
      capacity,
      totalSeats: capacity,
      registeredCount: 0,
      availableSeats: capacity,
      visibility: eventData.visibility === 'PUBLIC' ? 'PUBLIC' : 'COLLEGE_ONLY',
      registrationAccess: eventData.registrationAccess === 'PUBLIC' ? 'PUBLIC' : 'COLLEGE_STUDENTS_ONLY',
      status: eventData.status || 'SUBMITTED',
      purpose: eventData.purpose || eventData.description,
      requiredResources: eventData.requiredResources || 'Standard college hall equipment',
      requestedByStudentId: eventData.requestedByStudentId || null,
      requestedByStudentName: eventData.requestedByStudentName || null,
      requestedByEmail: eventData.requestedByEmail || null,
      requestedByRoll: eventData.requestedByRoll || null,
      organizerId: eventData.organizerId || 'org_001',
      organizerName: eventData.organizerName || 'Student Coordinator',
      coordinatorId: eventData.coordinatorId || null,
      coordinatorName: eventData.coordinatorName || null,
      coordinatorRemarks: eventData.coordinatorRemarks || null,
      hostId: eventData.hostId || null,
      hostName: eventData.hostName || null,
      hostDepartment: eventData.hostDepartment || null,
      hostRemarks: eventData.hostRemarks || null,
      hostApprovedAt: eventData.hostApprovedAt || null,
      hodApprovedBy: eventData.hodApprovedBy || null,
      hodApprovedAt: eventData.hodApprovedAt || null,
      hodRemarks: eventData.hodRemarks || null,
      conflictOverride: eventData.conflictOverride || false,
      overrideReason: eventData.overrideReason || null,
      approvalHistory: eventData.approvalHistory || [
        {
          actor: eventData.requestedByStudentName || eventData.organizerName || 'Student Coordinator',
          role: 'Coordinator',
          action: 'SUBMITTED',
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          comment: eventData.purpose || 'Event proposal submitted for faculty review.'
        }
      ],
      bannerUrl: eventData.bannerUrl || 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&h=600&fit=crop',
      image: eventData.bannerUrl || 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&h=600&fit=crop',
      registrationDeadline: eventData.registrationDeadline || eventData.date,
      contactEmail: eventData.contactEmail || 'events@college.edu',
      contactPhone: eventData.contactPhone || '',
      tags: eventData.tags || ['CampusEvent'],
      price: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.events.unshift(newEvent);
    return newEvent;
  }

  updateEvent(id, updateData) {
    const idx = this.events.findIndex(e => e._id === id || e.id === id);
    if (idx === -1) return null;

    const existing = this.events[idx];
    const updatedHistory = updateData.approvalHistory
      ? updateData.approvalHistory
      : (existing.approvalHistory || []);

    if (updateData.historyEntry) {
      updatedHistory.push({
        actor: updateData.historyEntry.actor || 'System',
        role: updateData.historyEntry.role || 'System',
        action: updateData.historyEntry.action || 'UPDATED',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        comment: updateData.historyEntry.comment || ''
      });
    }

    this.events[idx] = {
      ...existing,
      ...updateData,
      approvalHistory: updatedHistory,
      updatedAt: new Date().toISOString()
    };
    return this.events[idx];
  }

  deleteEvent(id) {
    const idx = this.events.findIndex(e => e._id === id || e.id === id);
    if (idx === -1) return null;
    return this.events.splice(idx, 1)[0];
  }

  // --- REGISTRATION HELPERS ---
  createRegistration(regData) {
    const regId = regData._id || `reg_${Date.now()}`;
    const newReg = {
      _id: regId,
      id: regId,
      eventId: regData.eventId,
      eventTitle: regData.eventTitle,
      participantName: regData.participantName,
      participantEmail: regData.participantEmail.toLowerCase(),
      participantPhone: regData.participantPhone || '',
      studentId: regData.studentId || '',
      userId: regData.userId || regData.studentId || '',
      registrationType: regData.registrationType || (regData.studentId ? 'CollegeStudent' : 'ExternalVisitor'),
      ticketCode: regData.ticketCode || `TK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      status: 'Confirmed',
      registeredAt: new Date(),
      attended: false,
      notes: regData.notes || ''
    };
    this.registrations.push(newReg);
    return newReg;
  }

  cancelRegistration(eventId, studentId) {
    const idx = this.registrations.findIndex(r =>
      (r.eventId === eventId) &&
      (r.studentId === studentId || r.userId === studentId || r.participantEmail === studentId) &&
      r.status === 'Confirmed'
    );

    if (idx === -1) return null;
    this.registrations[idx].status = 'Cancelled';
    return this.registrations[idx];
  }
}

// Export singleton instance
const store = new DataStore();

module.exports = store;
module.exports.COLLEGE_NAME = COLLEGE_NAME;
module.exports.COLLEGE_DEPARTMENTS = COLLEGE_DEPARTMENTS;
module.exports.COLLEGE_VENUES = COLLEGE_VENUES;
module.exports.COLLEGE_EMAIL_DOMAIN = COLLEGE_EMAIL_DOMAIN;
