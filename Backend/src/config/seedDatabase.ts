import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { AppDataSource } from './data-source';
import { User } from '../entities/User';
import { Setting } from '../entities/Setting';
import { hash } from 'bcrypt';

// Load environment variables
config();

async function seedDatabase() {
  try {
    // Initialize the data source
    const dataSource = new DataSource({
      ...AppDataSource.options,
      synchronize: false,
      logging: true,
    });
    
    await dataSource.initialize();
    
    console.log('Starting database seeding...');
    
    // Get repositories
    const userRepository = dataSource.getRepository(User);
    const settingRepository = dataSource.getRepository(Setting);
    
    // Create admin user (from env or defaults)
    console.log('Creating admin user...');
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (!adminEmail || !adminPassword) {
      console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in environment variables');
      process.exit(1);
    }
    
    // Check if admin user already exists
    const existingAdmin = await userRepository.findOne({ where: { email: adminEmail.toLowerCase() } });
    if (existingAdmin) {
      console.log('Admin user already exists, updating password...');
      existingAdmin.password = await hash(adminPassword, 10);
      existingAdmin.isAdmin = true;
      await userRepository.save(existingAdmin);
      console.log('Admin user updated successfully');
    } else {
      const adminUser = new User();
      adminUser.name = 'Admin User';
      adminUser.email = adminEmail.toLowerCase();
      adminUser.password = await hash(adminPassword, 10);
      adminUser.isAdmin = true;
      adminUser.emailVerified = true;
      adminUser.isActive = true;
      await userRepository.save(adminUser);
      console.log('Admin user created successfully');
    }
    
    // Create sample regular user (optional)
    console.log('Creating regular user...');
    const regularUserEmail = 'user@example.com';
    const existingUser = await userRepository.findOne({ where: { email: regularUserEmail } });
    if (!existingUser) {
      const regularUser = new User();
      regularUser.name = 'Regular User';
      regularUser.email = regularUserEmail;
      regularUser.password = await hash('user123', 10);
      regularUser.emailVerified = true;
      regularUser.isActive = true;
      await userRepository.save(regularUser);
      console.log('Regular user created successfully');
    } else {
      console.log('Regular user already exists');
    }
    
    // Create settings
    console.log('Creating settings...');
    const settings = [
      { setting_key: 'site_name', setting_value: 'Mathematico', setting_group: 'general', data_type: 'string' },
      { setting_key: 'site_description', setting_value: 'Learn mathematics the easy way', setting_group: 'general', data_type: 'string' },
      { setting_key: 'contact_email', setting_value: 'support@mathematico.com', setting_group: 'general', data_type: 'string' },
      { setting_key: 'maintenance_mode', setting_value: 'false', setting_group: 'general', data_type: 'boolean' },
      { setting_key: 'user_registration', setting_value: 'true', setting_group: 'user', data_type: 'boolean' },
      { setting_key: 'email_notifications', setting_value: 'true', setting_group: 'email', data_type: 'boolean' },
      { setting_key: 'default_currency', setting_value: 'USD', setting_group: 'payment', data_type: 'string' },
      { setting_key: 'timezone', setting_value: 'UTC', setting_group: 'general', data_type: 'string' }
    ];
    
    for (const setting of settings) {
      const existingSetting = await settingRepository.findOne({ where: { key: setting.setting_key } });
      if (!existingSetting) {
        const newSetting = new Setting();
        newSetting.key = setting.setting_key;
        newSetting.value = setting.setting_value;
        newSetting.group = setting.setting_group;
        newSetting.dataType = setting.data_type as 'string' | 'number' | 'boolean' | 'json';
        await settingRepository.save(newSetting);
      }
    }
    
    console.log('Database seeded successfully!');
    console.log(`Admin Email: ${adminEmail}`);
    console.log(`Admin Password: ${adminPassword}`);
    await dataSource.destroy();
    process.exit(0);
    
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
