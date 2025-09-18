import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { IsNotEmpty, Length, IsIn } from 'class-validator';

type DataType = 'string' | 'number' | 'boolean' | 'json';

@Entity('settings')
export class Setting {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'setting_key', type: 'varchar', length: 100, unique: true })
  @IsNotEmpty()
  @Length(1, 100)
  key!: string;

  @Column({ name: 'setting_value', type: 'text', nullable: true })
  value!: string | number | boolean | object | null;

  @Column({ name: 'setting_group', type: 'varchar', length: 50 })
  @IsNotEmpty()
  @Length(1, 50)
  group!: string;

  @Column({
    name: 'data_type',
    type: 'enum',
    enum: ['string', 'number', 'boolean', 'json'],
    default: 'string'
  })
  @IsIn(['string', 'number', 'boolean', 'json'])
  dataType!: DataType;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Helper methods to get typed values
  getValue(): string | number | boolean | object | null {
    if (this.value === null) return null;
    
    try {
      switch (this.dataType) {
        case 'number':
          return parseFloat(this.value as string) || 0;
        case 'boolean':
          return this.value === 'true' || this.value === true;
        case 'json':
          return JSON.parse(this.value as string);
        default:
          return this.value;
      }
    } catch (error) {
      console.error(`Error parsing setting ${this.key}:`, error);
      return this.value;
    }
  }

  // Static methods for default settings
  static getDefaultSettings(): Partial<Setting>[] {
    return [
      { key: 'site_name', value: 'Mathematico', group: 'general', dataType: 'string' },
      { key: 'site_description', value: 'Learn mathematics the easy way', group: 'general', dataType: 'string' },
      { key: 'contact_email', value: 'support@mathematico.com', group: 'general', dataType: 'string' },
      { key: 'maintenance_mode', value: 'false', group: 'general', dataType: 'boolean' },
      { key: 'user_registration', value: 'true', group: 'user', dataType: 'boolean' },
      { key: 'email_notifications', value: 'true', group: 'email', dataType: 'boolean' },
      { key: 'default_currency', value: 'USD', group: 'payment', dataType: 'string' },
      { key: 'timezone', value: 'UTC', group: 'general', dataType: 'string' }
    ];
  }
}
