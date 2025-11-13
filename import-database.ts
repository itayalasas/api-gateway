import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

interface ExportData {
  exportDate: string;
  database: string;
  users: any[];
  tables: {
    apis: any[];
    api_security: any[];
    api_endpoints: any[];
    integrations: any[];
    request_logs: any[];
    health_checks: any[];
  };
  functions: any[];
  triggers: any[];
  policies: any[];
  statistics: {
    totalUsers: number;
    totalRecords: number;
    tablesCount: Record<string, number>;
  };
}

interface ImportStats {
  apis: { success: number; failed: number };
  api_security: { success: number; failed: number };
  api_endpoints: { success: number; failed: number };
  integrations: { success: number; failed: number };
  request_logs: { success: number; failed: number };
  health_checks: { success: number; failed: number };
  errors: string[];
}

async function importDatabase(
  supabaseUrl: string,
  supabaseAnonKey: string,
  exportFilePath: string
) {
  console.log('🚀 Starting database import...\n');

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const stats: ImportStats = {
    apis: { success: 0, failed: 0 },
    api_security: { success: 0, failed: 0 },
    api_endpoints: { success: 0, failed: 0 },
    integrations: { success: 0, failed: 0 },
    request_logs: { success: 0, failed: 0 },
    health_checks: { success: 0, failed: 0 },
    errors: []
  };

  try {
    // Read export file
    console.log('1️⃣  Reading export file...');
    if (!fs.existsSync(exportFilePath)) {
      throw new Error(`Export file not found: ${exportFilePath}`);
    }

    const fileContent = fs.readFileSync(exportFilePath, 'utf-8');
    const exportData: ExportData = JSON.parse(fileContent);

    console.log(`   ✅ Loaded export from: ${exportData.exportDate}`);
    console.log(`   📦 Total records to import: ${exportData.statistics.totalRecords}`);

    if (exportData.statistics.totalRecords === 0) {
      console.log('\n⚠️  No data to import. Export file contains no records.');
      return;
    }

    // Import Tables in correct order (respecting foreign key dependencies)
    console.log('\n2️⃣  Importing Tables Data...\n');

    // Step 1: Import APIs first (no dependencies)
    if (exportData.tables.apis.length > 0) {
      console.log(`   Importing ${exportData.tables.apis.length} APIs...`);
      for (const api of exportData.tables.apis) {
        const { error } = await supabase.from('apis').insert(api);

        if (error) {
          stats.apis.failed++;
          stats.errors.push(`API "${api.name}": ${error.message}`);
          console.log(`      ❌ Failed: ${api.name} - ${error.message}`);
        } else {
          stats.apis.success++;
          console.log(`      ✅ ${api.name}`);
        }
      }
    }

    // Step 2: Import API Security (depends on APIs)
    if (exportData.tables.api_security.length > 0) {
      console.log(`\n   Importing ${exportData.tables.api_security.length} Security configs...`);
      for (const security of exportData.tables.api_security) {
        const { error } = await supabase.from('api_security').insert(security);

        if (error) {
          stats.api_security.failed++;
          stats.errors.push(`Security config: ${error.message}`);
        } else {
          stats.api_security.success++;
        }
      }
      console.log(`      ✅ Imported ${stats.api_security.success} security configs`);
    }

    // Step 3: Import API Endpoints (depends on APIs)
    if (exportData.tables.api_endpoints.length > 0) {
      console.log(`\n   Importing ${exportData.tables.api_endpoints.length} Endpoints...`);
      for (const endpoint of exportData.tables.api_endpoints) {
        const { error } = await supabase.from('api_endpoints').insert(endpoint);

        if (error) {
          stats.api_endpoints.failed++;
          stats.errors.push(`Endpoint "${endpoint.path}": ${error.message}`);
        } else {
          stats.api_endpoints.success++;
        }
      }
      console.log(`      ✅ Imported ${stats.api_endpoints.success} endpoints`);
    }

    // Step 4: Import Integrations (depends on APIs and Endpoints)
    if (exportData.tables.integrations.length > 0) {
      console.log(`\n   Importing ${exportData.tables.integrations.length} Integrations...`);
      for (const integration of exportData.tables.integrations) {
        const { error } = await supabase.from('integrations').insert(integration);

        if (error) {
          stats.integrations.failed++;
          stats.errors.push(`Integration "${integration.name}": ${error.message}`);
          console.log(`      ❌ Failed: ${integration.name} - ${error.message}`);
        } else {
          stats.integrations.success++;
          console.log(`      ✅ ${integration.name}`);
        }
      }
    }

    // Step 5: Import Request Logs (depends on Integrations)
    if (exportData.tables.request_logs.length > 0) {
      console.log(`\n   Importing ${exportData.tables.request_logs.length} Request Logs...`);

      const batchSize = 100;
      let totalSuccess = 0;
      let totalFailed = 0;

      for (let i = 0; i < exportData.tables.request_logs.length; i += batchSize) {
        const batch = exportData.tables.request_logs.slice(i, i + batchSize);
        const { error } = await supabase.from('request_logs').insert(batch);

        if (error) {
          totalFailed += batch.length;
          stats.errors.push(`Request logs batch ${i / batchSize + 1}: ${error.message}`);
        } else {
          totalSuccess += batch.length;
        }
      }

      stats.request_logs.success = totalSuccess;
      stats.request_logs.failed = totalFailed;
      console.log(`      ✅ Imported ${totalSuccess} logs`);
      if (totalFailed > 0) {
        console.log(`      ❌ Failed: ${totalFailed} logs`);
      }
    }

    // Step 6: Import Health Checks (depends on APIs)
    if (exportData.tables.health_checks.length > 0) {
      console.log(`\n   Importing ${exportData.tables.health_checks.length} Health Checks...`);

      const batchSize = 50;
      let totalSuccess = 0;
      let totalFailed = 0;

      for (let i = 0; i < exportData.tables.health_checks.length; i += batchSize) {
        const batch = exportData.tables.health_checks.slice(i, i + batchSize);
        const { error } = await supabase.from('health_checks').insert(batch);

        if (error) {
          totalFailed += batch.length;
          stats.errors.push(`Health checks batch ${i / batchSize + 1}: ${error.message}`);
        } else {
          totalSuccess += batch.length;
        }
      }

      stats.health_checks.success = totalSuccess;
      stats.health_checks.failed = totalFailed;
      console.log(`      ✅ Imported ${totalSuccess} health checks`);
      if (totalFailed > 0) {
        console.log(`      ❌ Failed: ${totalFailed} health checks`);
      }
    }

    // Print Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 IMPORT SUMMARY');
    console.log('='.repeat(60));
    console.log(`📅 Original Export Date: ${exportData.exportDate}`);
    console.log(`📦 Source Database:      ${exportData.database}`);
    console.log(`\n✅ Successfully Imported:`);
    console.log(`   - APIs:              ${stats.apis.success}`);
    console.log(`   - Security configs:  ${stats.api_security.success}`);
    console.log(`   - Endpoints:         ${stats.api_endpoints.success}`);
    console.log(`   - Integrations:      ${stats.integrations.success}`);
    console.log(`   - Request logs:      ${stats.request_logs.success}`);
    console.log(`   - Health checks:     ${stats.health_checks.success}`);

    const totalSuccess = stats.apis.success + stats.api_security.success +
                        stats.api_endpoints.success + stats.integrations.success +
                        stats.request_logs.success + stats.health_checks.success;

    const totalFailed = stats.apis.failed + stats.api_security.failed +
                       stats.api_endpoints.failed + stats.integrations.failed +
                       stats.request_logs.failed + stats.health_checks.failed;

    console.log(`\n🎉 Total Imported:       ${totalSuccess} records`);

    if (totalFailed > 0) {
      console.log(`\n❌ Failed Imports:`);
      console.log(`   - APIs:              ${stats.apis.failed}`);
      console.log(`   - Security configs:  ${stats.api_security.failed}`);
      console.log(`   - Endpoints:         ${stats.api_endpoints.failed}`);
      console.log(`   - Integrations:      ${stats.integrations.failed}`);
      console.log(`   - Request logs:      ${stats.request_logs.failed}`);
      console.log(`   - Health checks:     ${stats.health_checks.failed}`);
      console.log(`\n⚠️  Total Failed:        ${totalFailed} records`);
    }

    if (stats.errors.length > 0) {
      console.log(`\n⚠️  Errors encountered: ${stats.errors.length}`);
      console.log('\nError details:');
      stats.errors.slice(0, 10).forEach((err, idx) => {
        console.log(`   ${idx + 1}. ${err}`);
      });
      if (stats.errors.length > 10) {
        console.log(`   ... and ${stats.errors.length - 10} more errors`);
      }
    } else {
      console.log('\n✨ Import completed successfully with no errors!');
    }

    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Fatal error during import:', error);
    throw error;
  }
}

// Main execution
const args = process.argv.slice(2);

if (args.length < 3) {
  console.log('\n📖 Usage:');
  console.log('   npx tsx import-database.ts <SUPABASE_URL> <SUPABASE_ANON_KEY> <EXPORT_FILE_PATH>\n');
  console.log('📝 Example:');
  console.log('   npx tsx import-database.ts \\');
  console.log('     "https://your-project.supabase.co" \\');
  console.log('     "your-anon-key" \\');
  console.log('     "./exports/database-export-2025-11-13T03-54-33.json"\n');
  process.exit(1);
}

const [supabaseUrl, supabaseAnonKey, exportFilePath] = args;

importDatabase(supabaseUrl, supabaseAnonKey, exportFilePath)
  .then(() => {
    console.log('\n✅ Import script finished\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  });
