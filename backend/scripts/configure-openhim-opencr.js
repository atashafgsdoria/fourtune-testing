/**
 * Configure OpenHIM to route Patient requests through OpenCR
 * 
 * This script creates:
 * 1. A client (chris-mobile) that the mobile app authenticates as
 * 2. A channel that intercepts POST/PUT /Patient and routes to OpenCR
 * 3. A channel that routes all other FHIR requests directly to HAPI FHIR
 * 
 * Usage:
 *   node configure-openhim-opencr.js [openhim-password]
 */

const https = require('https');

const OPENHIM_API = 'https://localhost:8081';
const OPENHIM_USER = 'root@openhim.org';
const OPENHIM_PASS = process.argv[2] || 'apc-open-health';

// Ignore self-signed certs
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

function apiRequest(method, path, data) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, OPENHIM_API);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(`${OPENHIM_USER}:${OPENHIM_PASS}`).toString('base64')
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: body ? JSON.parse(body) : null });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function authenticate() {
  // OpenHIM uses a custom auth flow. First try basic auth with the root password.
  const res = await apiRequest('GET', '/authenticate/root@openhim.org');
  if (res.status === 404) {
    // Older OpenHIM - try direct basic auth
    console.log('Using direct basic auth...');
    return;
  }
  console.log('Auth response:', res.status);
}

async function createClient() {
  const client = {
    clientID: 'chris-mobile',
    name: 'CHRIS Mobile App',
    roles: ['opencr-client', 'fhir-client'],
    passwordAlgorithm: 'sha512',
    passwordHash: '6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b',
    passwordSalt: 'salt'
  };

  const res = await apiRequest('POST', '/clients', client);
  if (res.status === 201) {
    console.log('✓ Client "chris-mobile" created');
  } else if (res.status === 400 && JSON.stringify(res.data).includes('duplicate')) {
    console.log('• Client "chris-mobile" already exists');
  } else {
    console.log('  Client creation response:', res.status, JSON.stringify(res.data).substring(0, 200));
  }
}

/**
 * Create a channel, or update it in place if one with the same name already exists.
 * OpenHIM rejects duplicate channel creation with 400, so on conflict we look up
 * the existing channel by name and PUT the new definition to update it (e.g. to
 * change a route port from 3000 to 3001).
 */
async function upsertChannel(channel) {
  const res = await apiRequest('POST', '/channels', channel);
  if (res.status === 201) {
    console.log(`✓ Channel "${channel.name}" created`);
    return;
  }

  // Conflict (or any non-created status) — try to update the existing channel.
  const listRes = await apiRequest('GET', '/channels');
  const existing = Array.isArray(listRes.data)
    ? listRes.data.find((c) => c.name === channel.name)
    : null;

  if (!existing) {
    console.log(
      `  Channel "${channel.name}" response:`,
      res.status,
      JSON.stringify(res.data).substring(0, 200)
    );
    return;
  }

  const updateRes = await apiRequest('PUT', `/channels/${existing._id}`, channel);
  if (updateRes.status === 200) {
    console.log(`✓ Channel "${channel.name}" updated (id ${existing._id})`);
  } else {
    console.log(
      `  Channel "${channel.name}" update response:`,
      updateRes.status,
      JSON.stringify(updateRes.data).substring(0, 200)
    );
  }
}

async function createChannels() {
  // Channel 1: Route Patient create/update to OpenCR
  const opencrChannel = {
    name: 'Patient MPI (OpenCR)',
    description: 'Routes Patient create/update through OpenCR for deduplication before storing in HAPI FHIR',
    urlPattern: '^/fhir/Patient.*$',
    methods: ['POST', 'PUT'],
    type: 'http',
    status: 'enabled',
    authType: 'public',  // For testing; switch to 'private' in production
    routes: [
      {
        name: 'OpenCR',
        host: 'opencr',
        // OpenCR serves HTTPS on 3000 (standalone mode, mediator.register=false).
        // The entrypoint runs a plain-HTTP proxy on 3001 -> HTTPS 3000 so OpenHIM
        // can connect over HTTP. Pointing at 3000 with secured:false causes a
        // protocol mismatch that surfaces as a 500.
        port: 3001,
        path: '/ocrux/fhir/Patient',
        primary: true,
        type: 'http',
        secured: false
      }
    ],
    matchContentTypes: ['application/fhir+json', 'application/json'],
    priority: 1,
    rewriteUrlsConfig: []
  };

  // Channel 2: Route all other FHIR requests directly to HAPI FHIR
  const fhirChannel = {
    name: 'FHIR Pass-through (HAPI)',
    description: 'Routes all non-Patient FHIR requests directly to HAPI FHIR server',
    urlPattern: '^/fhir.*$',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    type: 'http',
    status: 'enabled',
    authType: 'public',  // For testing; switch to 'private' in production
    routes: [
      {
        name: 'HAPI FHIR',
        host: 'hapi-fhir',
        port: 8080,
        path: '',
        pathTransform: 's/\\/fhir/\\/fhir/',
        primary: true,
        type: 'http'
      }
    ],
    matchContentTypes: [],
    priority: 2,
    rewriteUrlsConfig: []
  };

  const opencrReadChannel = {
    name: 'OpenCR Patient Reads',
    description: 'Routes Patient reads and searches to the OpenCR golden-record FHIR server',
    urlPattern: '^/opencr/fhir/Patient.*$',
    methods: ['GET'],
    type: 'http',
    status: 'enabled',
    authType: 'public',
    routes: [{
      name: 'OpenCR FHIR Read',
      host: 'opencr',
      // Route via the plain-HTTP proxy (3001 -> HTTPS 3000). See entrypoint.sh.
      // Port 3000 with secured:false is an HTTP/HTTPS mismatch that returns 500.
      port: 3001,
      path: '/ocrux/fhir/Patient',
      primary: true,
      type: 'http',
      secured: false
    }],
    matchContentTypes: [],
    priority: 1,
    rewriteUrlsConfig: []
  };

  // Create or update all channels (upsert so route-port changes are applied on re-run)
  await upsertChannel(opencrChannel);
  await upsertChannel(fhirChannel);
  await upsertChannel(opencrReadChannel);
}

async function main() {
  console.log('=== OpenHIM + OpenCR Channel Configuration ===\n');

  try {
    await authenticate();
    await createClient();
    await createChannels();

    console.log('\n=== Done ===');
    console.log('\nChannels configured:');
    console.log('  POST/PUT /fhir/Patient → OpenCR (deduplication) → stored in OpenCR HAPI FHIR');
    console.log('  GET/POST/PUT/DELETE /fhir/* → HAPI FHIR (direct pass-through)');
    console.log('  GET /opencr/fhir/Patient* → OpenCR golden-record FHIR');
    console.log('\nMobile app sync target: http://<server-ip>:5001/fhir/Patient');
    console.log('  (OpenHIM port 5001 receives HTTP transactions, routes internally)\n');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
