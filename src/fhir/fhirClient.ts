import { API_URL, OPENCR_API_URL } from "../constants/api";
import type { FHIRPatient } from '../models/Patient';

export async function testConnection() {
  const response = await fetch(
    `${API_URL}/metadata`,
    {
      headers: {
        Accept: 'application/fhir+json',
        'x-openhim-clientid': 'chris-mobile',
      },
    }
  );

  const data = await response.json();

  console.log('FHIR Server:', data);

  return data;
}

export async function createPatient() {
  const patient = {
    resourceType: 'Patient',
    active: true,
    name: [
      {
        family: 'Dela Cruz',
        given: ['Juan'],
      },
    ],
  };

  const response = await fetch(
    `${API_URL}/Patient`,
    {
      method: 'POST',
      headers: {
        'Content-Type':
          'application/fhir+json',
      },
      body: JSON.stringify(patient),
    }
  );

  return response.json();
}

export async function getPatientById(patientId: string) {
  const response = await fetch(
    `${API_URL}/Patient/${encodeURIComponent(patientId)}`,
    {
      headers: {
        Accept: 'application/fhir+json',
        'x-openhim-clientid': 'chris-mobile',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to load Patient: ${response.status}`);
  }

  return response.json();
}

export async function getOpenCrPatientById(patientId: string) {
  const response = await fetch(
    `${OPENCR_API_URL}/Patient/${encodeURIComponent(patientId)}`,
    {
      headers: {
        Accept: 'application/fhir+json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to load OpenCR Patient: ${response.status}`);
  }

  return response.json();
}

export async function getPatientByInternalId(internalId: string) {
  const searchParams = new URLSearchParams({
    identifier: `http://openclientregistry.org/fhir/internalid|${internalId}`,
  });
  const response = await fetch(`${OPENCR_API_URL}/Patient?${searchParams.toString()}`, {
    headers: {
      Accept: 'application/fhir+json',
      'x-openhim-clientid': 'chris-mobile',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to search Patient: ${response.status}`);
  }

  const bundle = await response.json();
  const patient = bundle.entry?.find(
    (entry: { resource?: FHIRPatient }) => entry.resource?.resourceType === 'Patient'
  )?.resource;

  if (!patient) {
    throw new Error('Patient was not found by internal ID');
  }

  return patient;
}