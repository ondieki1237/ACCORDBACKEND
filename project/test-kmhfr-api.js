#!/usr/bin/env node

/**
 * KMHFR API Test Suite
 * 
 * Usage: node test-kmhfr-api.js
 * 
 * Tests all KMHFR endpoints to verify implementation
 */

import {
  facilitiesService,
  metadataService,
  infrastructureService,
  servicesService,
  geographicService,
  adminService,
  chuService,
  healthCheck,
  cacheService
} from './src/services/kmhfr.service.js';

const BASE_URL = 'http://localhost:4500/api/kmhfr/v2';
let testsPassed = 0;
let testsFailed = 0;

/**
 * Test utilities
 */
function logTest(name, status, detail = '') {
  const icon = status === '✅' ? '✅' : '❌';
  console.log(`${icon} ${name.padEnd(50)} ${status} ${detail}`);
  if (status === '✅') testsPassed++;
  else testsFailed++;
}

async function testApiCall(name, fn) {
  try {
    const result = await fn();
    if (result && (result.data || result.results || result.length > -1)) {
      logTest(name, '✅', `(${result.data?.length || result.results?.length || result.length} items)`);
      return true;
    } else {
      logTest(name, '❌', 'No data returned');
      return false;
    }
  } catch (error) {
    logTest(name, '❌', error.message.substring(0, 40));
    return false;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('\n═══════════════════════════════════════════════════════════━');
  console.log('       KMHFR API Service Layer Tests');
  console.log('═══════════════════════════════════════════════════════════━\n');

  // HEALTH CHECK
  console.log('📋 HEALTH CHECK');
  console.log('───────────────────────────────────────────────────────────\n');
  await testApiCall('Health check', () => healthCheck());

  // FACILITIES
  console.log('\n📋 FACILITIES SERVICE');
  console.log('───────────────────────────────────────────────────────────\n');
  await testApiCall('Get facilities (paginated)', () =>
    facilitiesService.getFacilities({ page_size: 10 })
  );
  await testApiCall('Get all facilities', () =>
    facilitiesService.getAllFacilities({}, 50)
  );
  await testApiCall('Search facilities', () =>
    facilitiesService.searchFacilities('hospital', 20)
  );

  // METADATA
  console.log('\n📋 METADATA SERVICE (Cached)');
  console.log('───────────────────────────────────────────────────────────\n');
  await testApiCall('Get facility types', () => metadataService.getFacilityTypes());
  await testApiCall('Get KEPH levels', () => metadataService.getKEPHLevels());
  await testApiCall('Get owner types', () => metadataService.getOwnerTypes());
  await testApiCall('Get operation statuses', () => metadataService.getOperationStatuses());
  await testApiCall('Get admission statuses', () => metadataService.getAdmissionStatuses());
  await testApiCall('Get regulatory bodies', () => metadataService.getRegulatoryBodies());
  await testApiCall('Get job titles', () => metadataService.getJobTitles());
  await testApiCall('Get owners', () => metadataService.getOwners());

  // INFRASTRUCTURE
  console.log('\n📋 INFRASTRUCTURE SERVICE (Cached)');
  console.log('───────────────────────────────────────────────────────────\n');
  await testApiCall('Get infrastructure', () => infrastructureService.getInfrastructure());
  await testApiCall('Get infrastructure categories', () =>
    infrastructureService.getInfrastructureCategories()
  );

  // SERVICES
  console.log('\n📋 SERVICES SERVICE (Cached)');
  console.log('───────────────────────────────────────────────────────────\n');
  await testApiCall('Get services', () => servicesService.getServices());
  await testApiCall('Get service categories', () => servicesService.getServiceCategories());
  await testApiCall('Get service options', () => servicesService.getServiceOptions());
  await testApiCall('Get specialities', () => servicesService.getSpecialities());
  await testApiCall('Get specialities categories', () =>
    servicesService.getSpecialitiesCategories()
  );

  // GEOGRAPHIC
  console.log('\n📋 GEOGRAPHIC SERVICE (Cached)');
  console.log('───────────────────────────────────────────────────────────\n');
  await testApiCall('Get counties', () => geographicService.getCounties());
  await testApiCall('Get constituencies', () => geographicService.getConstituencies());
  await testApiCall('Get wards', () => geographicService.getWards());
  await testApiCall('Get towns', () => geographicService.getTowns());

  // ADMINISTRATIVE
  console.log('\n📋 ADMINISTRATIVE SERVICE');
  console.log('───────────────────────────────────────────────────────────\n');
  await testApiCall('Get admin offices', () => adminService.getAdminOffices());

  // CHU
  console.log('\n📋 COMMUNITY HEALTH UNITS SERVICE');
  console.log('───────────────────────────────────────────────────────────\n');
  await testApiCall('Get CHUs', () => chuService.getCHUs());
  await testApiCall('Get CHU ratings', () => chuService.getCHURatings());

  // CACHE
  console.log('\n📋 CACHE MANAGEMENT');
  console.log('───────────────────────────────────────────────────────────\n');
  try {
    const stats = cacheService.getStats();
    if (stats.keys !== undefined) {
      logTest('Get cache stats', '✅', `(${stats.keys} items cached)`);
    } else {
      logTest('Get cache stats', '✅', '(no items)');
    }
  } catch (error) {
    logTest('Get cache stats', '❌', error.message);
  }

  // SUMMARY
  console.log('\n═══════════════════════════════════════════════════════════━');
  console.log(`\n📊 TEST RESULTS:`);
  console.log(`   ✅ Passed: ${testsPassed}`);
  console.log(`   ❌ Failed: ${testsFailed}`);
  console.log(`   📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%\n`);

  const allPassed = testsFailed === 0;
  console.log(allPassed ? '✅ All tests passed!\n' : '⚠️  Some tests failed. Check KMHFR API connectivity.\n');

  process.exit(allPassed ? 0 : 1);
}

// Run tests
runTests().catch(error => {
  console.error('\n❌ Test suite error:', error.message);
  process.exit(1);
});
