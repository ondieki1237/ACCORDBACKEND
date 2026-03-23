import mongoose from 'mongoose';

/**
 * KMHFR Facility Cache - Store synced facility data for fast local queries
 */
const kmhfrFacilitySchema = new mongoose.Schema(
  {
    // Primary identifiers
    kmhfr_id: { type: String, required: true, unique: true, index: true },
    code: { type: String, index: true },
    name: { type: String, required: true, index: true },

    // Location data
    county: String,
    county_code: String,
    constituency: String,
    ward: String,
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: [Number] // [longitude, latitude]
    },

    // Facility information
    facility_type: String,
    facility_type_name: String,
    keph_level: String,
    keph_level_name: String,
    owner: String,
    owner_name: String,
    owner_type: String,
    operation_status: String,
    operation_status_name: String,
    admission_status: String,
    regulation_status: String,
    regulated: Boolean,
    published: Boolean,
    open_whole_day: Boolean,

    // Capacity
    number_of_beds: Number,
    number_of_cots: Number,

    // Contact info
    contacts: [
      {
        type: String,
        value: String,
        contact_type: String
      }
    ],

    // Services offered
    services: [String],
    service_ids: [String],

    // Equipment/Infrastructure
    infrastructure: [
      {
        name: String,
        category: String
      }
    ],

    // Sync metadata
    last_synced: { type: Date, default: Date.now },
    is_active: { type: Boolean, default: true }
  },
  {
    timestamps: true,
    collection: 'kmhfr_facilities'
  }
);

// Indexes for performance
kmhfrFacilitySchema.index({ location: '2dsphere' }); // Geospatial index
kmhfrFacilitySchema.index({ county: 1, keph_level: 1 });
kmhfrFacilitySchema.index({ name: 'text', code: 'text' });
kmhfrFacilitySchema.index({ last_synced: 1 });

/**
 * KMHFR Metadata Cache - Store metadata for faster UI rendering
 */
const kmhfrMetadataSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        'facility_types',
        'keph_levels',
        'owner_types',
        'operation_statuses',
        'admission_statuses',
        'regulatory_bodies',
        'regulation_statuses',
        'job_titles',
        'owners',
        'infrastructure_categories',
        'service_categories',
        'services',
        'specialities',
        'counties',
        'constituencies',
        'wards',
        'towns'
      ],
      required: true,
      index: true
    },
    items: [
      {
        id: String,
        name: String,
        code: String,
        description: String,
        parent: String,
        _raw: mongoose.Schema.Types.Mixed // Store full KMHFR response
      }
    ],
    last_synced: { type: Date, default: Date.now },
    total_count: Number
  },
  {
    timestamps: true,
    collection: 'kmhfr_metadata'
  }
);

/**
 * KMHFR Sync Log - Track sync operations
 */
const kmhfrSyncLogSchema = new mongoose.Schema(
  {
    endpoint: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'failed'],
      default: 'pending'
    },
    total_records: Number,
    synced_records: Number,
    error_message: String,
    started_at: Date,
    completed_at: Date,
    duration_ms: Number
  },
  {
    timestamps: true,
    collection: 'kmhfr_sync_logs'
  }
);

/**
 * Models
 */
const KMHFRFacility = mongoose.model('KMHFRFacility', kmhfrFacilitySchema);
const KMHFRMetadata = mongoose.model('KMHFRMetadata', kmhfrMetadataSchema);
const KMHFRSyncLog = mongoose.model('KMHFRSyncLog', kmhfrSyncLogSchema);

export { KMHFRFacility, KMHFRMetadata, KMHFRSyncLog };
export default KMHFRFacility;
