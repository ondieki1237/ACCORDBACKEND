import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AppUpdate from '../models/AppUpdate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

/**
 * Automatically sync package.json version to AppUpdate collection
 * Call this script during deployment to auto-trigger app updates
 * 
 * Usage:
 * node src/scripts/sync-version-update.js           # Creates for all roles/platforms
 * node src/scripts/sync-version-update.js android   # Creates for all roles on android
 * node src/scripts/sync-version-update.js android sales   # Single role/platform
 */

async function syncVersionUpdate() {
  try {
    // Get command line arguments
    const args = process.argv.slice(2);
    let platform = args[0] || null;
    let role = args[1] || null;
    const force = args.includes('--force'); // Force flag

    // Default: if no arguments, create for all roles and platforms
    let configs = [];
    
    if (!platform && !role) {
      // Default: create for all roles on all platforms
      configs = [
        { platform: 'android', role: 'sales' },
        { platform: 'android', role: 'engineer' },
        { platform: 'ios', role: 'sales' },
        { platform: 'ios', role: 'engineer' }
      ];
    } else if (platform && !role) {
      // Platform specified, create for all roles on that platform
      configs = [
        { platform, role: 'sales' },
        { platform, role: 'engineer' }
      ];
    } else if (platform && role) {
      // Both specified
      configs = [{ platform, role }];
    }

    console.log('\n📦 Version Sync Script');
    console.log('='.repeat(60));
    console.log(`📄 Creating updates for ${configs.length} configuration(s)\n`);

    // Read package.json
    const packagePath = path.join(__dirname, '../../package.json');
    const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const newVersion = packageData.version;

    console.log(`📄 Backend Version: ${newVersion}`);
    console.log('='.repeat(60));

    // Connect to MongoDB once
    if (!mongoose.connection.readyState) {
      console.log('\n🔗 Connecting to MongoDB...');
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ Connected to MongoDB\n');
    }

    let successCount = 0;
    let skipCount = 0;

    // Process each configuration
    for (const config of configs) {
      const { platform, role } = config;

      // Check if update already exists for this version
      let existingUpdate = await AppUpdate.findOne({
        version: newVersion,
        platform: platform,
        targetRoles: { $in: [role] }
      });

      if (existingUpdate && !force) {
        console.log(`⏭️  [${platform}/${role}] Update v${newVersion} already exists - skipping`);
        skipCount++;
        continue;
      }

      // Create new AppUpdate record
      const releaseNotes = `
Automatic deployment update

Version: ${newVersion}
Platform: ${platform}
Role: ${role}
Timestamp: ${new Date().toISOString()}
`.trim();

      const newUpdate = new AppUpdate({
        version: newVersion,
        platform: platform,
        targetRoles: [role],
        releaseNotes: releaseNotes,
        updateMethod: 'internal',
        updateInstructions: `Please restart the app to apply version ${newVersion} updates`,
        forced: false,
        isActive: true,
        requiresRestart: true,
        changeLog: `Backend updated to ${newVersion}`,
        compatibleVersions: []
      });

      const savedUpdate = await newUpdate.save();
      console.log(`✅ [${platform}/${role}] Created v${newVersion} (ID: ${savedUpdate._id})`);
      successCount++;
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✨ Summary: ${successCount} created, ${skipCount} skipped`);
    console.log('='.repeat(60));
    console.log('\n📢 Apps will be notified on next update check\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error syncing version update:');
    console.error(error.message);
    console.error(error);
    process.exit(1);
  }
}

syncVersionUpdate();
