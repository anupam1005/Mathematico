import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { RefreshToken } from './RefreshToken';
import { PasswordResetToken } from './PasswordResetToken';
import { Enrollment } from './Enrollment';
import { UserProgress } from './UserProgress';
import { Course } from './Course';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  name!: string;

  @Column()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password!: string;

  @Column({ name: 'email_verified', default: false })
  emailVerified!: boolean;

  @Column({ name: 'email_verification_token', nullable: true })
  emailVerificationToken?: string;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl?: string;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ name: 'last_login', nullable: true })
  lastLogin?: Date;

  @Column({ name: 'login_attempts', default: 0 })
  loginAttempts!: number;

  @Column({ name: 'lock_until', nullable: true })
  lockUntil?: Date;

  @Column({ name: 'is_admin', default: false })
  isAdmin!: boolean;

  @Column({ 
    type: 'enum', 
    enum: ['user', 'admin', 'instructor'], 
    default: 'user' 
  })
  role!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => RefreshToken, token => token.user)
  refreshTokens?: RefreshToken[];

  @OneToMany(() => PasswordResetToken, token => token.user)
  passwordResetTokens?: PasswordResetToken[];

  @OneToMany(() => Enrollment, enrollment => enrollment.user)
  enrollments?: Enrollment[];

  @OneToMany(() => UserProgress, progress => progress.user)
  progress?: UserProgress[];

  @OneToMany(() => Course, course => course.instructor)
  courses?: Course[];
}
