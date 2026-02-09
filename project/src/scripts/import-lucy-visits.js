import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const visits = [
  { date: '2026-01-20', clientName: 'Afya star Medical centre', location: 'Kizito', purpose: 'followup', outcome: 'successful', contactName: 'Nurse Mercy', contactRole: 'ceo', contactPhone: '0714695151', clientType: 'clinic' },
  { date: '2026-01-20', clientName: 'Neema Hospital', location: 'kahawa sukari', purpose: 'followup', outcome: 'successful', contactName: 'Patricia', contactRole: 'procurement', contactPhone: '0735677648', clientType: 'hospital' },
  { date: '2026-01-14', clientName: 'Bridging outpatient hospital', location: 'Kahawa west', purpose: 'followup', outcome: 'successful', contactName: 'Dr peter', contactRole: 'ceo', contactPhone: '0721603468', clientType: 'clinic' },
  { date: '2026-01-14', clientName: 'St james milena centre', location: 'kahawa west', purpose: 'followup', outcome: 'successful', contactName: 'Dr Jarvis', contactRole: 'ceo', contactPhone: '0798955370', clientType: 'clinic' },
  { date: '2026-01-14', clientName: 'Kahawa Health Centre', location: 'Kahawa west', purpose: 'followup', outcome: 'successful', contactName: 'kahato', contactRole: 'other', contactPhone: '0724410423', clientType: 'clinic' },
  { date: '2026-01-14', clientName: 'Kahawa west health centre', location: 'Kahawa west', purpose: 'followup', outcome: 'successful', contactName: 'kahato', contactRole: 'other', contactPhone: '0724410423', clientType: 'clinic' },
  { date: '2026-01-14', clientName: 'Plaza medical centre', location: 'Kahawa west', purpose: 'followup', outcome: 'successful', contactName: 'George', contactRole: 'ceo', contactPhone: '0729013852', clientType: 'clinic' },
  { date: '2026-01-14', clientName: 'Pemason Medical centre', location: 'Kahawa west', purpose: 'followup', outcome: 'successful', contactName: 'Amos', contactRole: 'other', contactPhone: '0741762750', clientType: 'clinic' },
  { date: '2026-01-14', clientName: 'st Joseph Mukasa catholic hospital', location: 'Kahawa west', purpose: 'followup', outcome: 'successful', contactName: 'Sister Judy', contactRole: 'admin', contactPhone: '0790449964', clientType: 'hospital' },
  { date: '2026-01-13', clientName: 'Crestview child and wellness hospital', location: 'Kasarani', purpose: 'followup', outcome: 'successful', contactName: 'All Directors', contactRole: 'ceo', contactPhone: '0722480452', clientType: 'clinic' },
  { date: '2026-01-13', clientName: 'Mwatate hospital', location: 'Tassia', purpose: 'followup', outcome: 'successful', contactName: 'Margaret', contactRole: 'ceo', contactPhone: '0721865802', clientType: 'clinic' },
  { date: '2026-01-13', clientName: 'Queenspark hospital', location: 'Tassia', purpose: 'followup', outcome: 'successful', contactName: 'Derrick', contactRole: 'other', contactPhone: '0721102722', clientType: 'clinic' },
  { date: '2026-01-13', clientName: 'Rheemah hospital', location: 'Tassia', purpose: 'followup', outcome: 'successful', contactName: 'Dr Mochama', contactRole: 'ceo', contactPhone: '0726104143', clientType: 'clinic' },
  { date: '2026-01-13', clientName: 'Haven Healthcare', location: 'Tassia', purpose: 'installation', outcome: 'successful', contactName: 'Babra', contactRole: 'nurse', contactPhone: '0725122596', clientType: 'hospital' },
  { date: '2026-01-13', clientName: 'Afyacare hospital', location: 'Tassia', purpose: 'followup', outcome: 'successful', contactName: 'Dr Obadiah', contactRole: 'ceo', contactPhone: '0726218069', clientType: 'clinic' },
  { date: '2026-01-13', clientName: 'Summit othopeadic hospital', location: 'Tassia', purpose: 'followup', outcome: 'successful', contactName: 'Dr Mohamed', contactRole: 'ceo', contactPhone: '0726916792', clientType: 'hospital' },
  { date: '2026-01-13', clientName: 'Tassia Hill hospital', location: 'Tassia', purpose: 'followup', outcome: 'successful', contactName: 'Dr Sam', contactRole: 'ceo', contactPhone: '0727304860', clientType: 'clinic' },
  { date: '2026-01-13', clientName: 'Tassia Hospital', location: 'Tassia', purpose: 'followup', outcome: 'successful', contactName: 'Dr Ali', contactRole: 'ceo', contactPhone: '0721203185', clientType: 'clinic' },
  { date: '2026-01-12', clientName: 'Haven Healthcare', location: 'Ruai', purpose: 'demo', outcome: 'successful', contactName: 'Nurse Maureen', contactRole: 'nurse', contactPhone: '0706298941', clientType: 'hospital' },
  { date: '2026-01-23', clientName: 'Lifeline hospitals ltd', location: 'k.sukari', purpose: 'other', outcome: 'successful', contactName: '', contactRole: '', contactPhone: '', clientType: 'clinic' },
  { date: '2026-01-23', clientName: 'st francis medical centre', location: 'k.wendani', purpose: 'followup', outcome: 'successful', contactName: 'Susan', contactRole: 'ceo', contactPhone: '0722876957', clientType: 'clinic' },
  { date: '2026-01-23', clientName: 'st joseph catholic health centre', location: 'k.wendani', purpose: 'followup', outcome: 'successful', contactName: 'Rebecca', contactRole: 'procurement', contactPhone: '0727651734', clientType: 'clinic' },
  { date: '2026-01-23', clientName: 'The hale Surgical and medical', location: 'K.sukari', purpose: 'followup', outcome: 'successful', contactName: 'Dr Omondi', contactRole: 'doctor', contactPhone: '0725602422', clientType: 'clinic' },
  { date: '2026-01-22', clientName: 'Shiny star medical centre', location: 'k.wendani', purpose: 'followup', outcome: 'successful', contactName: 'John', contactRole: 'admin', contactPhone: '0708853702', clientType: 'clinic' },
  { date: '2026-01-22', clientName: 'St Robert medical centre', location: 'Utawala', purpose: 'followup', outcome: 'successful', contactName: 'Dr Robert', contactRole: 'ceo', contactPhone: '0712700276', clientType: 'clinic' },
  { date: '2026-01-22', clientName: 'Haven Healthcare', location: 'Ruai', purpose: 'followup', outcome: 'successful', contactName: 'Elvin', contactRole: 'ceo', contactPhone: '0711884783', clientType: 'hospital' },
  { date: '2026-01-22', clientName: 'josepic cottage hospital', location: 'Utawala', purpose: 'followup', outcome: 'successful', contactName: '', contactRole: '', contactPhone: '', clientType: 'clinic' },
  { date: '2026-01-22', clientName: 'the A icon medical centre', location: 'utawala', purpose: 'followup', outcome: 'successful', contactName: 'Cosmas', contactRole: 'doctor', contactPhone: '0728536704', clientType: 'clinic' },
  { date: '2026-01-22', clientName: 'Medverse Community Hospital', location: 'utawala', purpose: 'followup', outcome: 'successful', contactName: 'Dennis', contactRole: 'ceo', contactPhone: '0711168682', clientType: 'clinic' },
  { date: '2026-01-22', clientName: 'Reinha Rosary Mission Hospital', location: 'utawala', purpose: 'followup', outcome: 'successful', contactName: 'Elsie', contactRole: 'other', contactPhone: '0724748066', clientType: 'hospital' },
  { date: '2026-01-21', clientName: 'Maven pharmacy', location: 'Kayole', purpose: 'demo', outcome: 'successful', contactName: 'Evans', contactRole: 'doctor', contactPhone: '0703919076', clientType: 'clinic' },
  { date: '2026-01-21', clientName: 'Fairview Medical Centre', location: 'Kayole', purpose: 'followup', outcome: 'successful', contactName: 'Dr waweru', contactRole: 'ceo', contactPhone: '0720327286', clientType: 'clinic' },
  { date: '2026-01-21', clientName: 'Bless to Bless hospital', location: 'Masimba', purpose: 'followup', outcome: 'successful', contactName: 'Dr Jafeth', contactRole: 'ceo', contactPhone: '0720930215', clientType: 'clinic' },
  { date: '2026-01-21', clientName: 'Pataheal medical centre', location: 'kayole', purpose: 'other', outcome: 'pending', contactName: '', contactRole: '', contactPhone: '', clientType: 'clinic' },
  { date: '2026-01-21', clientName: 'Aster point medical centre', location: 'Nasra', purpose: 'followup', outcome: 'pending', contactName: 'Njoroge', contactRole: 'ceo', contactPhone: '0710411257', clientType: 'clinic' },
  { date: '2026-01-21', clientName: 'Washington medical centre', location: 'Nasra', purpose: 'other', outcome: 'successful', contactName: 'Deka', contactRole: 'admin', contactPhone: '0727124898', clientType: 'clinic' },
  { date: '2026-01-21', clientName: 'Spineroad laboratory', location: 'Kayole', purpose: 'followup', outcome: 'successful', contactName: 'Jennifer', contactRole: 'ceo', contactPhone: '0725863762', clientType: 'clinic' },
  { date: '2026-01-21', clientName: 'Malkia wings medical centre', location: 'Kayole', purpose: 'followup', outcome: 'successful', contactName: 'Jackson', contactRole: 'ceo', contactPhone: '0708533950', clientType: 'clinic' },
  { date: '2026-01-21', clientName: 'Patanisho Nursing home', location: 'Kayole', purpose: 'followup', outcome: 'successful', contactName: 'Stephen', contactRole: 'ceo', contactPhone: '0721625172', clientType: 'hospital' },
  { date: '2026-01-20', clientName: 'Ranac Healthcare', location: 'kizito', purpose: 'followup', outcome: 'successful', contactName: 'Dr Mberia', contactRole: 'admin', contactPhone: '0713009678', clientType: 'clinic' },
  { date: '2026-01-20', clientName: 'Warazo medical', location: 'Mwihoko', purpose: 'followup', outcome: 'successful', contactName: 'Grace', contactRole: 'doctor', contactPhone: '0722422508', clientType: 'clinic' },
  { date: '2026-01-20', clientName: 'Hopeheal medical centre', location: 'Mwihoko', purpose: 'followup', outcome: 'successful', contactName: 'Dr Muturi', contactRole: 'ceo', contactPhone: '0700516145', clientType: 'clinic' },
  { date: '2026-01-20', clientName: 'Curepark Modern Hospital', location: 'Mwihoko', purpose: 'followup', outcome: 'successful', contactName: 'Dr Frank', contactRole: 'ceo', contactPhone: '0724986915', clientType: 'clinic' },
  { date: '2026-01-20', clientName: 'Sinai Medical centre', location: 'Mwihoko', purpose: 'followup', outcome: 'successful', contactName: 'Dr Mutegi', contactRole: 'ceo', contactPhone: '0725399474', clientType: 'clinic' },
  { date: '2026-01-20', clientName: 'Cosmas Medical centre', location: 'Kizito', purpose: 'followup', outcome: 'successful', contactName: 'Dr Sarah', contactRole: 'ceo', contactPhone: '0724437816', clientType: 'clinic' }
];

async function importVisits() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const user = await db.collection('users').findOne({ email: 'lucythiongo20@gmail.com' });

    if (!user) {
      console.log('❌ User not found!');
      process.exit(1);
    }

    console.log('👤 Found user:', user.firstName, user.lastName, '- ID:', user._id.toString());
    console.log('📊 Importing', visits.length, 'visits...\n');

    const visitDocs = visits.map((v, i) => {
      const startTime = new Date(v.date + 'T09:00:00.000Z');
      const endTime = new Date(v.date + 'T10:00:00.000Z');

      const contacts = [];
      if (v.contactName) {
        contacts.push({
          name: v.contactName,
          role: v.contactRole || 'other',
          phone: v.contactPhone || undefined
        });
      }

      return {
        userId: user._id,
        visitId: 'VISIT' + Date.now() + i,
        date: new Date(v.date),
        startTime: startTime,
        endTime: endTime,
        duration: 60,
        client: {
          name: v.clientName,
          type: v.clientType,
          location: v.location
        },
        contacts: contacts,
        visitPurpose: v.purpose,
        visitOutcome: v.outcome,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });

    const result = await db.collection('visits').insertMany(visitDocs);
    console.log('✅ Successfully inserted', result.insertedCount, 'visits for Lucy Thiongo');
    
    // Summary
    const purposes = {};
    const outcomes = {};
    visits.forEach(v => {
      purposes[v.purpose] = (purposes[v.purpose] || 0) + 1;
      outcomes[v.outcome] = (outcomes[v.outcome] || 0) + 1;
    });
    
    console.log('\n📈 Summary:');
    console.log('   By Purpose:', purposes);
    console.log('   By Outcome:', outcomes);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

importVisits();
