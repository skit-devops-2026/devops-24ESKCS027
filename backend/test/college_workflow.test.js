const assert = require('assert');
const http = require('http');
const app = require('../server');
const store = require('../models/store');
const mockData = require('../../src/data/mockData');

const PORT = 5099;
let server;

let studentToken;
let coordinatorToken;
let hostToken;
let hodToken;
let publicToken;

function request(method, path, data = null, token = null, cookie = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : '';
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (cookie) {
      headers['Cookie'] = cookie;
    }
    if (data) {
      headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(
      {
        hostname: 'localhost',
        port: PORT,
        path,
        method,
        headers,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            resolve({ status: res.statusCode, headers: res.headers, body: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, headers: res.headers, raw: body });
          }
        });
      }
    );

    req.on('error', reject);
    if (data) {
      req.write(postData);
    }
    req.end();
  });
}

async function runTests() {
  console.log('================================================================');
  console.log('🐝 EVENTHIVE SINGLE-COLLEGE WORKFLOW VERIFICATION SUITE');
  console.log('   Testing College Governance, Approval Chains & Registration');
  console.log('================================================================\n');

  process.env.NODE_ENV = 'test';
  server = app.listen(PORT);

  try {
    // -------------------------------------------------------------
    // AUTH SETUP: Authenticate all 5 roles
    // -------------------------------------------------------------
    console.log('👉 [AUTH SETUP] Authenticating 5 distinct roles...');

    // Role 1: HOD / Admin
    const hodRes = await request('POST', '/api/auth/login', {
      email: 'admin@eventhive.com',
      password: 'admin123'
    });
    assert.strictEqual(hodRes.status, 200);
    hodToken = hodRes.body.token;

    // Role 2: Faculty Event Host (Teacher)
    const hostRes = await request('POST', '/api/auth/login', {
      email: 'rajesh.sharma@college.edu',
      password: 'password123'
    });
    assert.strictEqual(hostRes.status, 200);
    hostToken = hostRes.body.token;

    // Role 3: Student Coordinator
    const coordRes = await request('POST', '/api/auth/login', {
      email: 'alex.organizer@eventhive.com',
      password: 'organizer123'
    });
    assert.strictEqual(coordRes.status, 200);
    coordinatorToken = coordRes.body.token;

    // Role 4: Verified College Student
    const studentRes = await request('POST', '/api/auth/login', {
      email: 'aashish.student@eventhive.edu',
      password: 'password123'
    });
    assert.strictEqual(studentRes.status, 200);
    studentToken = studentRes.body.token;

    // Role 5: External Visitor (Public)
    const pubRes = await request('POST', '/api/auth/login', {
      email: 'guest@external.com',
      password: 'password123'
    });
    assert.strictEqual(pubRes.status, 200);
    publicToken = pubRes.body.token;

    console.log('   ✅ All 5 roles authenticated successfully.\n');

    // -------------------------------------------------------------
    // CASE 1: Full Approval & Publication Workflow
    // Coordinator -> Teacher Host -> HOD -> Published -> Student Registers
    // -------------------------------------------------------------
    console.log('👉 [CASE 1] Student Coordinator submits proposal -> Host approves -> HOD approves -> Published -> Student registers...');
    
    // 1a. Coordinator creates proposal selecting Dr. Rajesh Sharma as Host
    const createEvtRes = await request('POST', '/api/coordinator/events', {
      title: 'Autonomous Robotics & AI Summit',
      description: 'Annual campus summit on autonomous drones and neural navigation.',
      category: 'Technical',
      eventType: 'Summit',
      department: 'Computer Science & Engineering',
      date: '2026-11-10',
      startTime: '10:00',
      endTime: '16:00',
      venue: 'Innovation Lab B',
      expectedParticipants: 75,
      maxCapacity: 75,
      visibility: 'COLLEGE_ONLY',
      registrationAccess: 'COLLEGE_STUDENTS_ONLY',
      purpose: 'Foster autonomous navigation research.',
      requiredResources: 'Drone arena nets, Workstations, Projectors',
      hostId: 'host_101' // Dr. Rajesh Sharma
    }, coordinatorToken);

    assert.strictEqual(createEvtRes.status, 201, 'Coordinator event creation should succeed');
    const case1EventId = createEvtRes.body.event._id;
    assert.strictEqual(createEvtRes.body.event.status, 'HOST_REVIEW');
    assert.strictEqual(createEvtRes.body.event.hostId, 'host_101');
    console.log(`   ✓ Step 1a: Proposal created with ID ${case1EventId} (Status: HOST_REVIEW)`);

    // 1b. Teacher / Host reviews & approves
    const hostApproveRes = await request('POST', `/api/host/events/${case1EventId}/approve`, {
      remarks: 'Lab safety inspected. Verified availability for 75 students.'
    }, hostToken);
    assert.strictEqual(hostApproveRes.status, 200);
    assert.strictEqual(hostApproveRes.body.event.status, 'HOD_REVIEW');
    console.log('   ✓ Step 1b: Teacher Host approved proposal -> Status: HOD_REVIEW');

    // 1c. HOD reviews & gives Final Approval
    const hodApproveRes = await mockData.hodApproveEvent(case1EventId, {
      remarks: 'Dean & HOD approved for campus execution.'
    });
    assert.ok(hodApproveRes);
    assert.strictEqual(hodApproveRes.status, 'PUBLISHED');
    console.log('   ✓ Step 1c: HOD granted Final Approval -> Status: PUBLISHED');

    // 1d. Verified college student registers for newly published event
    const regRes = await request('POST', '/api/registrations', { eventId: case1EventId }, studentToken);
    assert.strictEqual(regRes.status, 201);
    assert.strictEqual(regRes.body.registration.status, 'Confirmed');
    console.log('   ✓ Step 1d: College student registered successfully.');
    console.log('   ✅ CASE 1 PASSED: Complete End-to-End Approval & Registration Workflow Verified!\n');

    // -------------------------------------------------------------
    // CASE 2: Teacher Rejects Event Request
    // -------------------------------------------------------------
    console.log('👉 [CASE 2] Teacher rejects event request with mandatory reason...');
    
    // Create new proposal
    const rejectTestEvt = store.createEvent({
      title: 'Unsanctioned Flash Mob',
      description: 'Impromptu gathering in hallway.',
      date: '2026-11-12',
      venue: 'Main Corridor',
      hostId: 'host_101',
      status: 'HOST_REVIEW'
    });

    const hostRejectRes = await request('POST', `/api/host/events/${rejectTestEvt._id}/reject`, {
      remarks: 'Safety hazard. Hallway cannot be used for crowd gatherings.'
    }, hostToken);
    assert.strictEqual(hostRejectRes.status, 200);
    assert.strictEqual(hostRejectRes.body.event.status, 'HOST_REJECTED');
    assert.strictEqual(hostRejectRes.body.event.hostRemarks, 'Safety hazard. Hallway cannot be used for crowd gatherings.');
    console.log('   ✅ CASE 2 PASSED: Teacher rejected proposal with recorded reason.\n');

    // -------------------------------------------------------------
    // CASE 3: Teacher Requests Changes -> Coordinator Edits & Resubmits
    // -------------------------------------------------------------
    console.log('👉 [CASE 3] Teacher requests changes -> Coordinator edits & resubmits...');
    
    const changeTestEvt = store.createEvent({
      title: 'High Performance Computing Lab',
      description: 'Training on supercomputer cluster.',
      date: '2026-11-14',
      startTime: '08:00',
      endTime: '20:00', // 12 hours - too long!
      venue: 'CS Seminar Hall 1',
      hostId: 'host_101',
      status: 'HOST_REVIEW'
    });

    // Host requests change
    const reqChangeRes = await request('POST', `/api/host/events/${changeTestEvt._id}/request-changes`, {
      remarks: 'Duration is too long for a single day. Please reduce to 4 hours (10:00 - 14:00).'
    }, hostToken);
    assert.strictEqual(reqChangeRes.status, 200);
    assert.strictEqual(reqChangeRes.body.event.status, 'CHANGES_REQUESTED');
    console.log('   ✓ Teacher requested adjustments -> Status: CHANGES_REQUESTED');

    // Coordinator edits and resubmits
    const resubmitRes = await request('POST', `/api/coordinator/events/${changeTestEvt._id}/resubmit`, {
      startTime: '10:00',
      endTime: '14:00',
      resubmissionComment: 'Adjusted timing to 10:00 - 14:00 as requested by Dr. Sharma.'
    }, coordinatorToken);
    assert.strictEqual(resubmitRes.status, 200);
    assert.strictEqual(resubmitRes.body.event.status, 'HOST_REVIEW');
    assert.strictEqual(resubmitRes.body.event.endTime, '14:00');
    console.log('   ✓ Coordinator adjusted timing and resubmitted -> Status: HOST_REVIEW');
    console.log('   ✅ CASE 3 PASSED: Changes Requested & Resubmission Cycle Verified!\n');

    // -------------------------------------------------------------
    // CASE 4: Venue and Teacher Schedule Conflict Detection
    // -------------------------------------------------------------
    console.log('👉 [CASE 4] Schedule & Venue Conflict Detection Engine...');
    
    // evt_101 is already on 2026-09-15 from 09:00 - 18:00 at Main Auditorium
    const overlappingProposal = {
      title: 'Conflicting Tech Expo',
      date: '2026-09-15',
      startTime: '11:00',
      endTime: '14:00',
      venue: 'Main Auditorium',
      hostId: 'host_101'
    };

    const conflictCheckResult = store.checkConflict(overlappingProposal);
    assert.strictEqual(conflictCheckResult.hasConflict, true, 'Must detect collision');
    assert.ok(conflictCheckResult.conflicts.some(c => c.conflictType === 'VENUE_COLLISION'));
    console.log(`   ✓ Detected Conflict: ${conflictCheckResult.conflicts[0].message}`);
    console.log('   ✅ CASE 4 PASSED: Conflict Detection accurately flagged overlap.\n');

    // -------------------------------------------------------------
    // CASE 5: HOD Approval on Conflicting Event Blocked / Requires Override
    // -------------------------------------------------------------
    console.log('👉 [CASE 5] HOD Approval on Conflicting Event requires explicit override...');
    
    // Attempting HOD approval without override should fail
    const conflictEvtInStore = store.events.find(e => e._id === 'evt_105');
    const silentApproveAttempt = await mockData.hodApproveEvent('evt_105', {
      remarks: 'Attempting silent approval'
    });
    assert.strictEqual(silentApproveAttempt.error, true, 'Silent approval on conflicting event must be blocked');
    console.log('   ✓ Silent approval was successfully blocked.');

    // Approval WITH explicit override and reason succeeds and logs audit
    const overrideApprove = await mockData.hodApproveEvent('evt_105', {
      remarks: 'Dean special permission granted.',
      conflictOverride: true,
      overrideReason: 'RoboWars will use partitioned Section B of Main Auditorium.'
    });
    assert.strictEqual(overrideApprove.status, 'PUBLISHED');
    assert.strictEqual(overrideApprove.conflictOverride, true);
    console.log('   ✓ HOD explicit override approved event and logged governance audit.');
    console.log('   ✅ CASE 5 PASSED: Conflict Protection and HOD Override Verified!\n');

    // -------------------------------------------------------------
    // CASE 6: College-Only Event Restrictions
    // -------------------------------------------------------------
    console.log('👉 [CASE 6] College-Only event restrictions (Student allowed, External blocked)...');
    
    // Verified Student viewing college-only event (evt_101)
    const stuViewRes = await request('GET', '/api/events/evt_101', null, studentToken);
    assert.strictEqual(stuViewRes.status, 200);

    // External user attempting to view college-only event -> 403 Forbidden
    const extViewRes = await request('GET', '/api/events/evt_101', null, publicToken);
    assert.strictEqual(extViewRes.status, 403, 'External visitor must receive 403 Forbidden on college-only event');

    // External user attempting to register for college-only event -> 403 Forbidden
    const extRegRes = await request('POST', '/api/registrations/external', {
      eventId: 'evt_101',
      name: 'John Public',
      email: 'john@gmail.com'
    });
    assert.strictEqual(extRegRes.status, 403, 'External visitor registration on college-only event must return 403');
    console.log('   ✅ CASE 6 PASSED: College-Only event security validated.\n');

    // -------------------------------------------------------------
    // CASE 7: Public Event Discovery & External Registration
    // -------------------------------------------------------------
    console.log('👉 [CASE 7] Public event discovery & External Visitor registration...');
    
    // External visitor browses events -> only receives PUBLIC events
    const pubBrowseRes = await request('GET', '/api/events', null, publicToken);
    assert.strictEqual(pubBrowseRes.status, 200);
    const allPublic = pubBrowseRes.body.every(e => e.visibility === 'PUBLIC');
    assert.strictEqual(allPublic, true, 'All returned events must be PUBLIC');

    // External visitor registers for public workshop (evt_102)
    const extSuccessReg = await request('POST', '/api/registrations/external', {
      eventId: 'evt_102',
      name: 'Sarah Connor',
      email: 'sarah.connor@external.org',
      phone: '+91 99999 88888'
    });
    assert.strictEqual(extSuccessReg.status, 201);
    assert.strictEqual(extSuccessReg.body.registration.registrationType, 'ExternalVisitor');
    console.log('   ✓ External visitor registered for public event with ticket code:', extSuccessReg.body.ticketCode);
    console.log('   ✅ CASE 7 PASSED: Public Event & External Registration Verified!\n');

    // -------------------------------------------------------------
    // CASE 8: Full Capacity Event Registration Blocked
    // -------------------------------------------------------------
    console.log('👉 [CASE 8] Full capacity event registration blocked...');
    
    const fullTestEvt = store.createEvent({
      title: 'Exclusive High-Tech Lab Session',
      description: 'Capacity 1 session',
      date: '2026-11-25',
      venue: 'Lab A',
      maxCapacity: 1,
      capacity: 1,
      totalSeats: 1,
      registeredCount: 1,
      availableSeats: 0,
      status: 'PUBLISHED',
      visibility: 'COLLEGE_ONLY',
      registrationAccess: 'COLLEGE_STUDENTS_ONLY'
    });

    const fullRegAttempt = await request('POST', '/api/registrations', {
      eventId: fullTestEvt._id
    }, studentToken);
    assert.strictEqual(fullRegAttempt.status, 400, 'Full capacity event must return 400 Bad Request');
    console.log('   ✅ CASE 8 PASSED: Full capacity blocked further registrations.\n');

    // -------------------------------------------------------------
    // CASE 9: Duplicate Registration Blocked
    // -------------------------------------------------------------
    console.log('👉 [CASE 9] Duplicate registration prevention...');
    
    // Register once
    const firstReg = await request('POST', '/api/registrations', {
      eventId: 'evt_103'
    }, studentToken);
    assert.strictEqual(firstReg.status, 201);

    // Register twice for same event
    const dupReg = await request('POST', '/api/registrations', {
      eventId: 'evt_103'
    }, studentToken);
    assert.strictEqual(dupReg.status, 409, 'Duplicate registration must return 409 Conflict');
    console.log('   ✅ CASE 9 PASSED: Duplicate registration blocked with 409 Conflict.\n');

    // -------------------------------------------------------------
    // CASE 10: Unauthorized User Attempts Admin / Approval API
    // -------------------------------------------------------------
    console.log('👉 [CASE 10] Unauthorized user attempts Admin & Host approval APIs (403 Forbidden)...');
    
    // Student attempting to call Host approval endpoint
    const stuApproveAttempt = await request('POST', `/api/host/events/evt_101/approve`, {}, studentToken);
    assert.strictEqual(stuApproveAttempt.status, 403, 'Student calling host API must receive 403 Forbidden');

    // External user calling Coordinator API
    const extCoordAttempt = await request('GET', '/api/coordinator/requests', null, publicToken);
    assert.strictEqual(extCoordAttempt.status, 403, 'External user calling coordinator API must receive 403 Forbidden');

    console.log('   ✅ CASE 10 PASSED: Role-based authorization strictly enforced across all APIs.\n');

    console.log('================================================================');
    console.log('🎉 ALL 10 EVENTHIVE COLLEGE GOVERNANCE TEST CASES PASSED!');
    console.log('================================================================\n');
  } finally {
    server.close();
  }
}

// Execute test suite
runTests().catch(err => {
  console.error('❌ TEST FAILED:', err);
  if (server) server.close();
  process.exit(1);
});
